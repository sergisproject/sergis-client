/*
 * The SerGIS Project - sergis-client
 * Main JavaScript file.
 */

// Use Promise polyfill if needed
if (typeof Promise == "undefined") {
    Promise = ES6Promise.Promise;
}

// Set Loading text, if we have basic support for what we need.
// (This is why this file MUST be loaded at the end of the HTML body.)
if (typeof window.addEventListener == "function" &&
    typeof XMLHttpRequest == "function" &&
    typeof document.getElementById("loading-text").textContent == "string" &&
    typeof Promise == "function") {
    
    // Looks like we have all of the basics that we need
    document.getElementById("loading-text").textContent = "Loading...";
    
    window.addEventListener("load", function (event) {
        sergis.main.init();
    }, false);
} else {
    // We're missing something important
    document.getElementById("loading-text").innerHTML = 'Please upgrade to a <a href="http://whatbrowser.org/">more modern browser</a>.';
}

/**
 * @namespace
 */
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

/**
 * @namespace
 */
sergis.main = {
    /**
     * The current prompt.
     */
    promptIndex: null,
    
    /**
     * The total number of prompts.
     */
    promptCount: null,
    
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
     * Whether the loading sign is currently showing.
     */
    loadingVisible: true,
    
    /**
     * The timeout for showing the loading sign.
     */
    loadingTimeout: null,
    
    /**
     * Show or hide the loading sign.
     * This uses a timeout so the loading sign won't be shown if it only needs
     * to be shown for a split second.
     *
     * @param {boolean} showLoading - Whether loading sign should be visible.
     * @param {boolean} showInstantly - Whether loading sign should be shown
     *        right away (instead of using short timeout) if showLoading==true.
     */
    loading: function (showLoading, showInstantly) {
        if (showLoading) {
            // Make sure it's not already showing
            if (!sergis.main.loadingVisible) {
                if (showInstantly) {
                    // Show it now
                    sergis.main.loadingVisible = true;
                    document.getElementById("loading").style.display = "block";
                    // If something else wanted it to show soon, make sure that's cancelled
                    if (sergis.main.loadingTimeout) {
                        clearTimeout(sergis.main.loadingTimeout);
                        sergis.main.loadingTimeout = null;
                    }
                // Make sure it's not about to show
                } else if (!sergis.main.loadingTimeout) {
                    // Show it soon
                    sergis.main.loadingTimeout = setTimeout(function () {
                        // Show it now
                        sergis.main.loadingVisible = true;
                        sergis.main.loadingTimeout = null;
                        document.getElementById("loading").style.display = "block";
                    }, 250);
                }
            }
        } else {
            // If something else wanted it to show soon, make sure that's cancelled
            if (sergis.main.loadingTimeout) {
                clearTimeout(sergis.main.loadingTimeout);
                sergis.main.loadingTimeout = null;
            }
            // Hide it
            sergis.main.loadingVisible = false;
            document.getElementById("loading").style.display = "none";
        }
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
     * Render a SerGIS Content Object.
     *
     * @param {Content} content - The SerGIS Content object.
     * @param {boolean} wrapElem - Whether to wrap the element in a <div>.
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
        sergis.backend.account.getUser().then(function (user) {
            sergis.main.initAfterLogin(user);
        }, function (errmsg) {
            // Probably not logged in; initialize login form
            document.getElementById("login-form").addEventListener("submit", function (event) {
                event.preventDefault();
                // Show loading sign
                sergis.main.loading(true);
                // Check login
                var username = document.getElementById("login-username").value,
                    password = document.getElementById("login-password").value;
                sergis.backend.account.logIn(username, password).then(function (user) {
                    // Successful login
                    document.getElementById("login-wrapper").style.display = "none";
                    sergis.main.initAfterLogin(user);
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
     * @param {User} user - The SerGIS User object.
     */
    initAfterLogin: function (user) {
        document.getElementById("main-displayName").textContent = user.displayName || "User";
        // Get some metadata
        sergis.backend.game.isJumpingAllowed().then(function (jumpingAllowed) {
            sergis.main.jumpingAllowed = jumpingAllowed;
            sergis.main.checkMetadata();
        }).catch(sergis.error);
        sergis.backend.game.getPromptCount().then(function (promptCount) {
            sergis.main.promptCount = promptCount;
            document.getElementById("navigation-promptCount").textContent = "" + promptCount;
            sergis.main.checkMetadata();
        }).catch(sergis.error);
    },
    
    /**
     * Check if jumping is allowed, and set up the interface to show this.
     */
    checkMetadata: function () {
        // Only run if all the metadata has been filled in
        if (sergis.main.jumpingAllowed !== null && sergis.main.promptCount !== null) {
            // If jumping is allowed, set that up
            if (sergis.main.jumpingAllowed) {
                // Make prompt select box
                var select = document.createElement("select");
                select.setAttribute("id", "navigation-promptIndex-select");
                for (var option, i = 1; i <= sergis.main.promptCount; i++) {
                    option = document.createElement("option");
                    option.setAttribute("value", option.textContent = "" + i);
                    select.appendChild(option);
                }
                document.getElementById("navigation-promptIndex").appendChild(select);
                select.addEventListener("change", function (event) {
                    sergis.main.go(parseInt(this.value, 10));
                }, false);
                // Show previous/next ("Back"/"Skip") buttons
                document.getElementById("navigation-previous").style.display = "inline";
                document.getElementById("navigation-next").style.display = "inline";
            }
            // Go to the first prompt
            sergis.main.go();
        }
    },
    
    /**
     * Log the user out (by using sergis.backend.logOut).
     */
    logOut: function () {
        sergis.main.loading(true, true);
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
     * Handle going to a new prompt.
     *
     * @param {number} promptIndex - The prompt to go to (if it's not the first
     *        time).
     */
    go: function (promptIndex) {
        sergis.main.loading(true);
        if (sergis.main.promptIndex === null) {
            // It's the first time!
            sergis.main.promptIndex = promptIndex = 1;
            sergis.backend.game.getPrompt(1).then(function (prompt) {
                // Get start data
                if (prompt.map && prompt.map.latitude && prompt.map.longitude && prompt.map.zoom) {
                    sergis.main.map.latitude = prompt.map.latitude;
                    sergis.main.map.longitude = prompt.map.longitude;
                    sergis.main.map.zoom = prompt.map.zoom;
                    // Now that we have the start data, initialize the map
                    sergis.main.initMap().then(function () {
                        // Make map visible; show prompt content; hide loading sign
                        document.getElementById("main-wrapper").style.display = "block";
                        sergis.main.showPrompt(prompt, 1);
                        sergis.main.adjustContent();
                        sergis.main.loading(false);
                    }).catch(sergis.error);
                } else {
                    sergis.error("Invalid Prompt object!");
                }
            }).catch(sergis.error);
        } else {
            // Check if it's a valid promptIndex
            if (promptIndex < 1 || promptIndex > sergis.main.promptCount) {
                // BAD!!! (An error is passed to show the stack trace in the error console.)
                sergis.error("Invalid promptIndex!", new Error());
            } else {
                var oldPromptIndex = sergis.main.promptIndex;
                sergis.main.promptIndex = promptIndex;
                sergis.backend.game.getPrompt(promptIndex).then(function (prompt) {
                    // Update the map coordinates/zoom
                    if (prompt.map) {
                        if (typeof prompt.map.latitude == "number")
                            sergis.main.map.latitude = prompt.map.latitude;
                        if (typeof prompt.map.longitude == "number")
                            sergis.main.map.longitude = prompt.map.longitude;
                        if (typeof prompt.map.zoom == "number")
                            sergis.main.map.zoom = prompt.map.zoom;
                    }
                    // Show the content of the prompt
                    sergis.main.showPrompt(prompt, promptIndex);
                    // Check if the prompt we're going to is out of order
                    if (promptIndex != oldPromptIndex + 1) {
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
     * Shortcut to go to the next prompt.
     */
    goNext: function () {
        sergis.main.go(Math.min(sergis.main.promptIndex + 1, sergis.main.promptCount));
    },
    
    /**
     * Shortcut to go to the previous prompt.
     */
    goPrevious: function () {
        sergis.main.go(Math.max(sergis.main.promptIndex - 1, 1));
    },
    
    /**
     * Handle showing prompt data (i.e. title, content, choices; not map).
     *
     * @param {Prompt} prompt - The SerGIS Prompt object.
     */
    showPrompt: function (prompt) {
        if (sergis.main.jumpingAllowed) {
            // If it's the first item, make sure "Back" is hidden
            document.getElementById("navigation-previous").style.visibility =
                sergis.main.promptIndex == 1 ? "hidden" : "visible";
            // If it's the last item, make sure "Skip" is hidden
            document.getElementById("navigation-next").style.visibility =
                sergis.main.promptIndex == sergis.main.promptCount ? "hidden" : "visible";
        }
        
        // Set title and prompt index
        document.getElementById("sidebar-title-text").textContent = prompt.title;
        document.getElementById("sidebar-title-index").textContent = "" + sergis.main.promptIndex;
        if (sergis.main.jumpingAllowed) {
            document.getElementById("navigation-promptIndex-select").value = "" + sergis.main.promptIndex;
        } else {
            document.getElementById("navigation-promptIndex").textContent = "" + sergis.main.promptIndex;
        }
        
        // Clear old content
        var contentHolder = document.getElementById("sidebar-content"), lastChild;
        while (lastChild = contentHolder.lastChild) {
            contentHolder.removeChild(lastChild);
        }
        
        // Render new content
        for (var i = 0; i < prompt.content.length; i++) {
            contentHolder.appendChild(sergis.main.renderContent(prompt.content[i], true));
        }
        
        // Render choices
        if (prompt.choices && prompt.choices.length > 0) {
            var p, button;
            for (i = 0; i < prompt.choices.length; i++) {
                button = document.createElement("button");
                button.appendChild(sergis.main.renderContent(prompt.choices[i]));
                button.addEventListener("click", (function (choiceIndex) {
                    return (function (event) {
                        sergis.main.pickChoice(choiceIndex);
                    });
                })(i), false);
                p = document.createElement("p");
                p.style.margin = "10px";
                p.appendChild(button);
                contentHolder.appendChild(p);
            }
        } else if (sergis.main.promptIndex < sergis.main.promptCount) {
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
     * Handle picking a choice for the current prompt.
     *
     * @param {number} choiceIndex - The choice index.
     */
    pickChoice: function (choiceIndex) {
        sergis.main.loading(true);
        sergis.backend.game.getActions(sergis.main.promptIndex, choiceIndex).then(function (actions) {
            // Check to make sure we have actions, and if so, check for the "special actions"
            if (!actions || !actions.length || (actions.length == 1 && actions[0].name == "continue")) {
                // Go to the next prompt
                sergis.main.goNext();
            } else if (actions.length == 1 && actions[0].name == "goto" && actions[0].data && actions[0].data.length) {
                sergis.main.go(actions[0].data[0]);
            } else if (actions.length == 1 && actions[0].name == "logout") {
                // Log the user out
                sergis.main.logOut();
            } else {
                // It's just normal actions
                sergis.main.doActions(actions).then(function () {
                    // All actions taken; go to the next prompt
                    sergis.main.goNext();
                }).catch(sergis.error);
            }
        }).catch(sergis.error);
    },
    
    /**
     * Perform a list of actions.
     *
     * @param {Array.<SerGISAction>} actions - The list of Action objects.
     *
     * @returns {Promise} A Promise that will be resolved if all the actions
     *          have been completed successfully.
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
