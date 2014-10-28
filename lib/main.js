var sergis = {
    /**
     * Report an error to the console and possibly alert the user.
     * Commonly used as the handler for rejected Promises.
     *
     * This function is so special; it's the only one that's not in a sergis sub-object.
     */
    error: function () {
        // No matter what, we better not throw anything
        try {
            if (typeof console == "undefined") window.console = {};
            if (typeof console.error != "function") {
                console.error = console.log || function () {};
            }
            console.error.apply(console, arguments);
            if (arguments.length > 0) {
                if (typeof arguments[0] == "string") {
                    // It's a string; alert the user.
                    alert("Error: " + arguments[0]);
                } else if (arguments[0] instanceof Error) {
                    // We have an Error; alert the user.
                    var err = arguments[0];
                    alert("SerGIS Error: " + err.name + ":\n" + err.message +
                        (err.stack ? "\n\n" + err.stack : ""));
                }
            }
        } catch (err) {}
    }
};

sergis.main = {
    /**
     * The current question.
     */
    questionIndex: null,
    
    /**
     * The total number of questions.
     */
    questionCount: null,
    
    /**
     * Whether jumping around is allowed.
     */
    jumpingAllowed: null,
    
    /**
     * Current map info.
     */
    map: {
        latitude: null,
        longitude: null,
        zoom: null
    },
    
    /**
     * Adjust the height of the sidebar content.
     */
    adjustContent: function () {
        document.getElementById("sidebar-content").style.top = 
            document.getElementById("sidebar-title").offsetHeight + "px";
        document.getElementById("sidebar-content").style.bottom = 
            document.getElementById("sidebar-footer").offsetHeight + "px";
    },
    
    /**
     * Show or hide the loading sign.
     *
     * @param isLoading {boolean} Whether the loading sign should be visible.
     */
    loading: function (isLoading) {
        document.getElementById("loading").style.display = isLoading ? "block" : "none";
    },
    
    /**
     * Render a SerGIS Content Object.
     *
     * @param content {Content} The SerGIS Content object.
     * @param wrapElem {boolean} Whether to wrap the element in a <div>.
     *
     * @returns {DOM Element} The rendered content.
     */
    renderContent: function (content, wrapElem) {
        // Whether to center the content (only if wrapElem == true)
        var centerContent;
        // If center is specified in content, override the centerContent default
        if (typeof content.center == "boolean") {
            centerContent = content.center;
        } else {
            // By default, images and YouTube videos are centered.
            centerContent = ["image", "youtube"].indexOf(content.type) != -1;
        }
        
        var elem;
        switch (content.type) {
            case "html":
                elem = document.createElement("span")
                elem.innerHTML = content.value;
                break
            case "image":
                elem = document.createElement("img");
                elem.setAttribute("src", content.value);
                break
            case "youtube":
                var width = content.width || 400;
                var height = content.height || (width * 3 / 4);
                elem = document.createElement("div");
                var vid = document.createElement("div");  // replaced in YT.Player
                elem.appendChild(vid);
                new YT.Player(vid, {
                    width: width,
                    height: height,
                    videoId: content.value,
                    playerVars: content.playerVars || {autohide: 1}
                });
                break
        }
        // If we don't have anything to return yet
        // (i.e., content.type is "text" or something we don't know)
        if (!elem) {
            elem = document.createTextNode(content.value || JSON.stringify(content));
        }
        
        // Should we wrap it in a block-level element?
        if (wrapElem) {
            // Make the container
            var div = document.createElement("div");
            if (centerContent) div.style.textAlign = "center";
            div.appendChild(elem);
            return div;
        } else {
            return elem;
        }
    },
    
    /**
     * Initialize SerGIS (onload stuff).
     */
    init: function () {
        // Set up resizing
        window.addEventListener("resize", function (event) {
            sergis.main.adjustContent();
        }, false);
        
        // Set up logout button
        document.getElementById("main-logout").addEventListener("click", function (event) {
            event.preventDefault();
            sergis.main.logOut();
        }, false);
        
        // Set up previous/next buttons ("Back"/"Skip")
        document.getElementById("navigation-previous").addEventListener("click", function (event) {
            sergis.main.goPrevious();
        }, false);
        document.getElementById("navigation-next").addEventListener("click", function (event) {
            sergis.main.goNext();
        }, false);
        
        // Check if anyone is logged in
        sergis.backend.account.getUser().then(function (displayName) {
            sergis.main.initAfterLogin(displayName);
        }, function (errmsg) {
            // Probably not logged in; initialize login form
            document.getElementById("login-form").addEventListener("submit", function (event) {
                event.preventDefault();
                // Show loading sign
                sergis.main.loading(true);
                // Check login
                var username = document.getElementById("login-username").value,
                    password = document.getElementById("login-password").value;
                sergis.backend.account.logIn(username, password).then(function (displayName) {
                    // Successful login
                    document.getElementById("login-wrapper").style.display = "none";
                    sergis.main.initAfterLogin(displayName);
                }, function (errmsg) {
                    // Unsuccessful login
                    document.getElementById("login-password").value = "";
                    document.getElementById("login-errmsg").textContent = errmsg;
                    document.getElementById("login-errmsg").style.display = "block";
                    sergis.main.loading(false);
                    document.getElementById("login-username").focus();
                }).catch(sergis.error);
            }, false);
            document.getElementById("login-wrapper").style.display = "block";
            sergis.main.loading(false);
        }).catch(sergis.error);
    },
    
    /**
     * Initialize the SerGIS maps UI and frontend.
     *
     * @param displayName {string} The user's display name.
     */
    initAfterLogin: function (displayName) {
        document.getElementById("main-displayName").textContent = displayName;
        // Get some metadata
        sergis.backend.game.isJumpingAllowed().then(function (jumpingAllowed) {
            sergis.main.jumpingAllowed = jumpingAllowed;
            sergis.main.checkMetadata();
        }).catch(sergis.error);
        sergis.backend.game.getQuestionCount().then(function (questionCount) {
            sergis.main.questionCount = questionCount;
            document.getElementById("navigation-questionCount").textContent = "" + questionCount;
            sergis.main.checkMetadata();
        }).catch(sergis.error);
    },
    
    /**
     * Check if jumping is allowed, and set up the interface to show this.
     */
    checkMetadata: function () {
        // Only run if all the metadata has been filled in
        if (sergis.main.jumpingAllowed !== null && sergis.main.questionCount !== null) {
            // If jumping is allowed, set that up
            if (sergis.main.jumpingAllowed) {
                // Make question select box
                var select = document.createElement("select");
                select.setAttribute("id", "navigation-questionIndex-select");
                for (var option, i = 1; i <= sergis.main.questionCount; i++) {
                    option = document.createElement("option");
                    option.setAttribute("value", option.textContent = "" + i);
                    select.appendChild(option);
                }
                document.getElementById("navigation-questionIndex").appendChild(select);
                select.addEventListener("change", function (event) {
                    sergis.main.go(parseInt(this.value, 10));
                }, false);
                // Show previous/next ("Back"/"Skip") buttons
                document.getElementById("navigation-previous").style.display = "inline";
                document.getElementById("navigation-next").style.display = "inline";
            }
            // Go to the first question
            sergis.main.go();
        }
    },
    
    /**
     * Log the user out (by using sergis.backend.logOut).
     */
    logOut: function () {
        sergis.main.loading(true);
        sergis.backend.account.logOut().then(function () {
            // Easiest to just refresh
            location.reload();
        }).catch(sergis.error);
    },
    
    /**
     * Initialize (or re-initialize) the map.
     *
     * @returns {Promise} The Promise returned by sergis.frontend.init.
     */
    initMap: function () {
        return sergis.frontend.init(
            document.getElementById("map-container"),
            sergis.main.map.latitude,
            sergis.main.map.longitude,
            sergis.main.map.zoom
        );
    },
    
    /**
     * Handle going to a new question.
     *
     * @param questionIndex {number} The question to go to (if it's not the first time).
     */
    go: function (questionIndex) {
        sergis.main.loading(true);
        if (sergis.main.questionIndex === null) {
            // It's the first time!
            sergis.main.questionIndex = questionIndex = 1;
            sergis.backend.game.getQuestion(1).then(function (question) {
                // Get start data
                if (question.map && question.map.latitude && question.map.longitude && question.map.zoom) {
                    sergis.main.map.latitude = question.map.latitude;
                    sergis.main.map.longitude = question.map.longitude;
                    sergis.main.map.zoom = question.map.zoom;
                    // Now that we have the start data, initialize the map
                    sergis.main.initMap().then(function () {
                        // Make map visible; show question content; hide loading sign
                        document.getElementById("main-wrapper").style.display = "block";
                        sergis.main.showQuestion(question, 1);
                        sergis.main.adjustContent();
                        sergis.main.loading(false);
                    }).catch(sergis.error);
                } else {
                    sergis.error("Invalid Question object!");
                }
            }).catch(sergis.error);
        } else {
            // Check if it's a valid questionIndex
            if (questionIndex < 1 || questionIndex > sergis.main.questionCount) {
                // BAD!!! (An error is passed to show the stack trace in the error console.)
                sergis.error("Invalid questionIndex!", new Error());
            } else {
                var oldQuestionIndex = sergis.main.questionIndex;
                sergis.main.questionIndex = questionIndex;
                sergis.backend.game.getQuestion(questionIndex).then(function (question) {
                    // Update the map coordinates/zoom
                    if (question.map) {
                        if (question.map.latitude)
                            sergis.main.map.latitude = question.map.latitude;
                        if (question.map.longitude)
                            sergis.main.map.longitude = question.map.longitude;
                        if (question.map.zoom)
                            sergis.main.map.zoom = question.map.zoom;
                    }
                    // Show the content of the question
                    sergis.main.showQuestion(question, questionIndex);
                    // Check if the question we're going to is out of order
                    if (questionIndex != oldQuestionIndex + 1) {
                        // It's out of order; we'll have to completely re-draw the map
                        sergis.main.initMap().then(function () {
                            // Now, get all the previous actions
                            sergis.backend.game.getPreviousActions().then(function (actions) {
                                // Now, do all the actions
                                sergis.main.doActions(actions).then(function () {
                                    // We're finally done
                                    sergis.main.loading(false);
                                }).catch(sergis.error);
                            }).catch(sergis.error);
                        }).catch(sergis.error);
                    } else {
                        // Just re-center the map
                        sergis.frontend.centerMap(
                            sergis.main.map.latitude,
                            sergis.main.map.longitude,
                            sergis.main.map.zoom
                        ).then(function () {
                            // All ready
                            sergis.main.loading(false);
                        }).catch(sergis.error);
                    }
                }).catch(sergis.error);
            }
        }
    },
    
    /**
     * Shortcut to go to the next question.
     */
    goNext: function () {
        sergis.main.go(Math.min(sergis.main.questionIndex + 1, sergis.main.questionCount));
    },
    
    /**
     * Shortcut to go to the previous question.
     */
    goPrevious: function () {
        sergis.main.go(Math.max(sergis.main.questionIndex - 1, 1));
    },
    
    /**
     * Handle showing question data (i.e. title, content, actions; not map).
     *
     * @param question {Question} The SerGIS Question object.
     */
    showQuestion: function (question) {
        if (sergis.main.jumpingAllowed) {
            // If it's the first item, make sure "Back" is hidden
            document.getElementById("navigation-previous").style.visibility =
                sergis.main.questionIndex == 1 ? "hidden" : "visible";
            // If it's the last item, make sure "Skip" is hidden
            document.getElementById("navigation-next").style.visibility =
                sergis.main.questionIndex == sergis.main.questionCount ? "hidden" : "visible";
        }
        
        // Set title and question index
        document.getElementById("sidebar-title-text").textContent = question.title;
        document.getElementById("sidebar-title-index").textContent = "" + sergis.main.questionIndex;
        if (sergis.main.jumpingAllowed) {
            document.getElementById("navigation-questionIndex-select").value = "" + sergis.main.questionIndex;
        } else {
            document.getElementById("navigation-questionIndex").textContent = "" + sergis.main.questionIndex;
        }
        
        // Clear old content
        var contentHolder = document.getElementById("sidebar-content"), lastChild;
        while (lastChild = contentHolder.lastChild) {
            contentHolder.removeChild(lastChild);
        }
        
        // Render new content
        for (var i = 0; i < question.content.length; i++) {
            contentHolder.appendChild(sergis.main.renderContent(question.content[i], true));
        }
        
        // Render answers
        if (question.answers && question.answers.length > 0) {
            var p, button;
            for (i = 0; i < question.answers.length; i++) {
                button = document.createElement("button");
                button.appendChild(sergis.main.renderContent(question.answers[i]));
                button.addEventListener("click", (function (answerIndex) {
                    return (function (event) {
                        sergis.main.pickChoice(answerIndex);
                    });
                })(i), false);
                p = document.createElement("p");
                p.style.margin = "10px";
                p.appendChild(button);
                contentHolder.appendChild(p);
            }
        } else if (sergis.main.questionIndex < sergis.main.questionCount) {
            // Just make "Continue" button
            var button = document.createElement("button");
            button.appendChild(document.createTextNode("Continue"));
            button.addEventListener("click", function (event) {
                sergis.main.goNext();
            }, false);
            var p = document.createElement("p");
            p.style.margin = "10px";
            p.appendChild(button);
            contentHolder.appendChild(p);
        }
        
        // Make sure we're scrolled to the top
        contentHolder.scrollTop = 0;
    },
    
    /**
     * Handle choosing an answer to the current question.
     *
     * @param answerIndex {number} The answer index.
     */
    pickChoice: function (answerIndex) {
        sergis.main.loading(true);
        sergis.backend.game.getActions(sergis.main.questionIndex, answerIndex).then(function (actions) {
            // Check to make sure we have actions, and if so, check for the "special actions"
            if (!actions || !actions.length || (actions.length == 1 && actions[0].name == "continue")) {
                // Go to the next question
                sergis.main.goNext();
            } else if (actions.length == 1 && actions[0].name == "goto" && actions[0].data && actions[0].data.length) {
                sergis.main.go(actions[0].data[0]);
            } else if (actions.length == 1 && actions[0].name == "logout") {
                // Log the user out
                sergis.main.logOut();
            } else {
                // It's just normal actions
                sergis.main.doActions(actions).then(function () {
                    // All actions taken; go to the next question
                    sergis.main.goNext();
                }).catch(sergis.error);
            }
        }).catch(sergis.error);
    },
    
    /**
     * Perform a list of actions.
     *
     * @param actions {array} The list of Action objects.
     *
     * @returns {Promise} A Promise that will be resolved if all the actions have been completed successfully.
     */
    doActions: function (actions) {
        var promises = [];
        for (var i = 0; i < actions.length; i++) {
            if (sergis.frontend.actions.hasOwnProperty(actions[i].name)) {
                // Do the frontend action
                promises.push(sergis.frontend.actions[actions[i].name].apply(sergis.frontend.actions, actions[i].data));
            } else {
                // BAD!!! (An error is passed to show the stack trace in the error console.)
                sergis.error("Invalid action: " + actions[i].name, new Error());
            }
        }
        return Promise.all(promises);
    }
};


window.addEventListener("load", function (event) {
    sergis.main.init();
}, false);
