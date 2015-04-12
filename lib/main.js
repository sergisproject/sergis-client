/*
    The SerGIS Project - sergis-client

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
 */

// Special SerGIS objects (for JSDoc)
// http://sergisproject.github.io/docs/json.html

/**
 * @typedef SerGISCondition
 * @description A SerGIS JSON Condition Object.
 * @see {@link http://sergisproject.github.io/docs/json.html#condition-object}
 */

/**
 * @typedef SerGISAction
 * @description A SerGIS JSON Action Object.
 * @see {@link http://sergisproject.github.io/docs/json.html#action-object}
 */

/**
 * @typedef SerGISContent
 * @description A SerGIS JSON Content Object.
 * @see {@link http://sergisproject.github.io/docs/json.html#content-object}
 */

/**
 * @typedef SerGISPrompt
 * @description A SerGIS JSON Prompt Object.
 * @see {@link http://sergisproject.github.io/docs/json.html#prompt-object}
 */

/**
 * @typedef SerGISMap
 * @description A SerGIS JSON Map Object.
 * @see {@link http://sergisproject.github.io/docs/json.html#map-object}
 */


// Use Promise polyfill if needed
if (typeof Promise == "undefined") {
    Promise = ES6Promise.Promise;
}

// Polyfill window.location.origin if needed
if (!window.location.origin) {
    window.location.origin = window.location.protocol + "//" +
        window.location.hostname +
        (window.location.port ? ":" + window.location.port: "");
}


// Set Loading text, if we have basic support for what we need.
// (This is why this file MUST be loaded at the end of the HTML body.)
if (typeof window.addEventListener == "function" &&
    typeof XMLHttpRequest != "undefined" &&
    typeof document.getElementById("loading-text").textContent == "string" &&
    typeof Promise == "function" &&
    typeof Array.isArray == "function" &&
    typeof JSON == "object" && typeof JSON.parse == "function") {
    
    // Looks like we have all of the basics that we need
    document.getElementById("loading-text").textContent = "Loading...";
    
    window.addEventListener("load", function (event) {
        sergis.main.init();
    }, false);
} else {
    // We're missing something important
    document.getElementById("loading-text").innerHTML = 'Please upgrade to a <a href="http://whatbrowser.org/">modern browser</a>.';
    if (console) {
        console.log("addEventListener", typeof window.addEventListener);
        console.log("XMLHttpRequest", typeof XMLHttpRequest);
        console.log("textContent", typeof document.getElementById("loading-text").textContent);
        console.log("Promise", typeof Promise);
        console.log("Array.isArray", typeof Array.isArray);
        console.log("JSON", typeof JSON);
        console.log("JSON.parse", typeof JSON.parse);
    }
}

/**
 * Shuffle the contents of an array (in place).
 *
 * @param {Array} arr - The array to shuffle.
 */
function shuffleArray(arr) {
    if (arr.length > 0) {
        var i = arr.length, j, temp;
        while (--i) {
            j = Math.floor(Math.random() * (i + 1));
            temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
};

/**
 * Extend the contents of an array with the contents of a different array.
 *
 * @param {Array} daddyArray - The array to extend into (mutated in-place).
 * @param {Array} childArray - The array being extended into `daddyArray`.
 */
function extendArray(daddyArray, childArray) {
    for (var i = 0; i < childArray.length; i++) {
        daddyArray.push(childArray[i]);
    }
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
     * @type {number}
     */
    promptIndex: null,
    
    /**
     * The total number of prompts.
     * @type {number}
     */
    promptCount: null,
    
    /**
     * The User object returned by backend.logIn or backend.getUser.
     */
    user: null,
    
    /**
     * Current map info.
     * @type {SerGISMap}
     */
    map: null,
    
    /**
     * Is the frontend initialized?
     * @type {boolean}
     */
    frontendInitialized: false,
    
    /**
     * Whether the skip warning has been shown (if jumpingBack is disallowed
     * but jumpingForward is allowed).
     * @type {boolean}
     */
    skipWarningShown: false,
    
    /**
     * Whether the mouse is currently down on the sidebar resizer.
     * @type {boolean}
     */
    resizerMouseDown: false,
    
    /**
     * The starting coordinate for a resizing mousemove.
     * @type {number}
     */
    resizerMouseX: null,
    
    /**
     * The current width ratio of the sidebar.
     * (Sidebar width = full width * this number)
     * @type {number}
     */
    sidebarWidthRatio: 0.3,
    
    /**
     * Whether the loading sign is currently showing.
     *
     * 0: hidden,
     * 1: shown over entire page,
     * 2: shown over sidebar
     */
    loadingVisible: 1,
    
    /**
     * Whether the sidebar overlay is currently showing content.
     * @type {boolean}
     */
    sidebarContentVisible: false,
    
    /**
     * The toolbar buttons from the frontend, identified by button ID.
     * @type {object.<string, object}
     */
    toolbarButtonStates: {},
    
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
     * @param {boolean} showOverAll - Whether to show the loading sign over the
     *        entire page (instead of just the sidebar) if showLoading==true.
     */
    loading: function (showLoading, showInstantly, showOverAll) {
        if (showLoading) {
            var toState = showOverAll ? 1 : 2;
            // Make sure it's not already showing
            if (sergis.main.loadingVisible !== toState) {
                if (showInstantly) {
                    // Show it now
                    sergis.main.handleLoading(toState);
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
                        sergis.main.loadingTimeout = null;
                        sergis.main.handleLoading(toState);
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
            sergis.main.handleLoading(0);
        }
    },
    
    /**
     * Handle the actual showing or hiding of one of the loading signs.
     *
     * @param {number} toState - The loadingVisible state to move to.
     */
    handleLoading: function (toState) {
        if (toState == 1) {
            // Show over entire page
            sergis.main.loadingVisible = 1;
            document.getElementById("loading").style.display = "block";
            document.getElementById("sidebar-overlay").style.display = "none";
        } else if (toState == 2) {
            // Show only over sidebar
            sergis.main.loadingVisible = 2;
            document.getElementById("loading").style.display = "none";
            document.getElementById("sidebar-overlay-content").style.display = "none";
            document.getElementById("sidebar-overlay-loading").style.display = "block";
            document.getElementById("sidebar-overlay").style.display = "block";
        } else {
            // Hide everything
            sergis.main.loadingVisible = 0;
            document.getElementById("loading").style.display = "none";
            document.getElementById("sidebar-overlay").style.display = "none";
            // If the sidebar was showing content, show it again
            if (sergis.main.sidebarContentVisible) {
                document.getElementById("sidebar-overlay-content").style.display = "block";
                document.getElementById("sidebar-overlay-loading").style.display = "none";
                document.getElementById("sidebar-overlay").style.display = "block";
            }
        }
    },
    
    /**
     * Show some content in the overlay on top of the sidebar.
     *
     * @param {(SerGISContent|Array.<SerGISContent>|Element)} content - The
     *        content to show (must be a SerGIS Content object, an array of
     *        SerGIS Content objects, or a DOM Element).
     * @param {function} oncontinue - A callback function for when the user
     *        clicks "Continue".
     * @param {function} [onback] - A callback function for when the user
     *        clicks "Back". If not provided, then a "Back" button is not
     *        shown.
     */
    showSidebarContent: function (content, oncontinue, onback) {
        sergis.main.sidebarContentVisible = true;
        document.getElementById("sidebar-overlay-loading").style.display = "none";
        document.getElementById("sidebar-overlay-content").style.display = "block";
        
        // Clear old content
        var contentHolder = document.getElementById("sidebar-overlay-content"), lastChild;
        while (lastChild = contentHolder.lastChild) {
            contentHolder.removeChild(lastChild);
        }
        
        // Render new content
        if (content instanceof Element) {
            contentHolder.appendChild(content);
        } else {
            if (!Array.isArray(content)) {
                content = [content];
            }
            for (var i = 0; i < content.length; i++) {
                contentHolder.appendChild(sergis.main.renderContent(content[i], true));
            }
        }
        
        var p = document.createElement("p"), button;
        
        // Make a "Back" button, if applicable
        if (typeof onback == "function") {
            button = document.createElement("button");
            button.appendChild(document.createTextNode("Back"));
            button.addEventListener("click", function (event) {
                document.getElementById("sidebar-overlay").style.display = "none";
                sergis.main.sidebarContentVisible = false;
                onback();
            }, false);
            p.appendChild(button);
            p.appendChild(document.createTextNode(" "));
        }
        
        // Make "Continue" button
        button = document.createElement("button");
        button.appendChild(document.createTextNode("Continue"));
        button.addEventListener("click", function (event) {
            document.getElementById("sidebar-overlay").style.display = "none";
            sergis.main.sidebarContentVisible = false;
            oncontinue();
        }, false);
        p.appendChild(button);
        
        // Append the buttons container
        contentHolder.appendChild(p);
        
        // Show it all
        document.getElementById("sidebar-overlay").style.display = "block";
        
        // Focus the "Continue" button
        button.focus();
    },
    
    /**
     * Show some content in the popup on the map. (Usually called by
     * frontends.)
     *
     * @param {(SerGISContent|Array.<SerGISContent>|Element)} [content] - The
     *        content to show (must be a SerGIS Content object, an array of
     *        SerGIS Content objects, or a DOM Element). If not provided, the
     *        popup on the map is hidden.
     */
    showPopupContent: function (content) {
        // Clear old content
        var contentHolder = document.getElementById("map-popup"), lastChild;
        while (lastChild = contentHolder.lastChild) {
            contentHolder.removeChild(lastChild);
        }
        
        if (content) {
            // Render new content
            if (content instanceof Element) {
                contentHolder.appendChild(content);
            } else {
                if (!Array.isArray(content)) {
                    content = [content];
                }
                for (var i = 0; i < content.length; i++) {
                    contentHolder.appendChild(sergis.main.renderContent(content[i], true));
                }
            }
            
            // Show it all
            contentHolder.style.display = "block";
        } else {
            // Hide it all
            contentHolder.style.display = "none";
        }
    },
    
    /**
     * Render a SerGIS Content Object.
     *
     * @param {SerGISContent} content - The SerGIS Content object.
     * @param {boolean} wrapElem - Whether to wrap the element in a <div>.
     *
     * @returns {Element} The rendered content.
     */
    renderContent: function (content, wrapElem) {
        // If content is already a DOM element, then just return it
        if (content instanceof Element) return content;
        
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
            elem = document.createElement("span");
            elem.appendChild(document.createTextNode(content.value));
        }
        
        // Do styling, if specified
        if (content.style) {
            elem.style = content.style;
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
     * Show a status message. (Usually called by frontends.)
     *
     * @param {SerGISContent} [status=""] - The message to show. If not
     *        provided, clears the status bar.
     */
    status: function (status) {
        // Clear old content
        var contentHolder = document.getElementById("main-toolbox-status"), lastChild;
        while (lastChild = contentHolder.lastChild) {
            contentHolder.removeChild(lastChild);
        }
        
        // Add new content
        if (status) {
            contentHolder.appendChild(sergis.main.renderContent(status));
        }
    },
    
    /**
     * Show the user a warning message if he or she is skipping a prompt, but
     * jumping back is not enabled.
     *
     * @return {Promise.<boolean>} False if the user chooses not to continue,
     *         or true otherwise.
     */
    checkSkipWarning: function () {
        return new Promise(function (resolve, reject) {
            // If jumping back is allowed, or if the skip warning has already been shown, then just continue
            if (sergis.main.user.jumpingBackAllowed || sergis.main.skipWarningShown) {
                resolve(true);
            } else {
                sergis.main.showSidebarContent({
                    "type": "html",
                    "value": "<p>If you skip a question, you will not be able to return to it.</p><p>Are you sure that you want to skip this question?</p><p>(This warning will not be shown again.)</p>"
                }, function () {
                    // "Continue" button pressed
                    resolve(true);
                }, function () {
                    // "Back" button pressed
                    resolve(false);
                });
                sergis.main.skipWarningShown = true;
            }
        });
    },
    
    /**
     * Adjust the height of the sidebar content.
     */
    adjustSidebarContent: function () {
        document.getElementById("sidebar-content").style.top = 
            document.getElementById("sidebar-title").offsetHeight + "px";
        document.getElementById("sidebar-content").style.bottom = 
            document.getElementById("sidebar-footer").offsetHeight + "px";
    },
    
    /**
     * Adjust the width of the sidebar based on sergis.main.sidebarWidthRatio.
     */
    adjustSidebarWidth: function () {
        var width = Math.round(window.innerWidth * sergis.main.sidebarWidthRatio);
        document.getElementById("sidebar").style.width = width + "px";
        document.getElementById("sidebar-overlay").style.width = width + "px";
        document.getElementById("sidebar-resizer").style.right = width + "px";
        document.getElementById("map-popup").style.right = width + "px";
        
        if (sergis.main.user.layout && sergis.main.user.layout.disableTranslucentSidebar) {
            // Update the map's width too
            document.getElementById("map-container").style.right = width + "px";

            // Resize the map to fit its new container width
            if (sergis.main.frontendInitialized && typeof sergis.frontend.mapContainerResized == "function") {
                sergis.frontend.mapContainerResized();
            }
        }
        
        // Make sure the height is still good
        sergis.main.adjustSidebarContent();
    },
    
    /**
     * Check whether the mouse is down on the sidebar divider.
     */
    resizerOnMouseDown: function (event) {
        sergis.main.resizerMouseDown = true;
        var startX = 0, elem = this;
        do {
            startX += elem.offsetLeft;
        } while (elem = elem.offsetParent);
        sergis.main.resizerMouseX = startX - event.clientX;
    },
    
    /**
     * Stop resizing the sidebar.
     */
    resizerOnMouseUp: function (event) {
        sergis.main.resizerMouseDown = false;
    },
    
    /**
     * Resize the sidebar (if the mouse is down on the splitter)
     */
    resizerOnMouseMove: function (event) {
        if (!sergis.main.resizerMouseDown) return;
        var width = window.innerWidth - (sergis.main.resizerMouseX + event.clientX) - 5;
        sergis.main.sidebarWidthRatio = width / window.innerWidth;
        sergis.main.adjustSidebarWidth();
    },
    
    /**
     * Initialize SerGIS (onload stuff).
     */
    init: function () {
        // Set up resizing
        window.addEventListener("resize", function (event) {
            sergis.main.adjustSidebarWidth();
        }, false);
        
        document.getElementById("sidebar-resizer").addEventListener("mousedown",
            sergis.main.resizerOnMouseDown, false);
        document.getElementById("sidebar-resizer").addEventListener("mouseup",
            sergis.main.resizerOnMouseUp, false);
        document.addEventListener("mousemove", sergis.main.resizerOnMouseMove, false);
        
        // Set up previous/next buttons ("Back"/"Skip")
        document.getElementById("navigation-previous").addEventListener("click", function (event) {
            sergis.main.goPrevious();
        }, false);
        document.getElementById("navigation-next").addEventListener("click", function (event) {
            sergis.main.goNext(true);
        }, false);
        
        // Check if anyone is logged in
        sergis.backend.account.getUser().then(function (user) {
            sergis.main.initAfterLogin(user);
        }, function (errmsg) {
            console.log("getUser error:", errmsg);
            // Probably not logged in; initialize login form
            document.getElementById("login-form").addEventListener("submit", function (event) {
                event.preventDefault();
                // Show loading sign
                sergis.main.loading(true, true, true);
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
     * @param {object} user - An object representing a SerGIS user.
     */
    initAfterLogin: function (user) {
        // Store the user metadata
        sergis.main.user = user;
        
        // Set up display name
        if (sergis.main.user.displayName) {
            // Somebody is logged in!
            document.getElementById("main-header-title").setAttribute("title", "Logged in as " + sergis.main.user.displayName);
        }
        
        // Set up top-left-corner button
        if (sergis.main.user.homeURL) {
            document.getElementById("main-header-title-link").setAttribute("href", sergis.main.user.homeURL);
        }
        
        // Set up sidebar resizer
        if (sergis.main.user.layout && sergis.main.user.layout.disableSidebarResizing) {
            // Disable sidebar resizer
            document.getElementById("sidebar-resizer").style.display = "none";
        }
        
        // Set up default width/height
        var widthRatio = sergis.main.user.layout && sergis.main.user.layout.defaultSidebarWidthRatio;
        if (typeof widthRatio == "number" && widthRatio > 0 && widthRatio < 1) {
            sergis.main.sidebarWidthRatio = widthRatio;
        }
        sergis.main.adjustSidebarWidth();
        
        // And get some more
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
        // If jumping is allowed, set that up
        if (sergis.main.user.jumpingBackAllowed || sergis.main.user.jumpingForwardAllowed) {
            var back = sergis.main.user.jumpingBackAllowed,
                forward = sergis.main.user.jumpingForwardAllowed;
            // Make prompt select box
            var select = document.createElement("select");
            select.setAttribute("id", "navigation-promptNumber-select");
            for (var option, i = 0; i < sergis.main.promptCount; i++) {
                option = document.createElement("option");
                option.setAttribute("id", "navigation-promptNumber-select-option" + i);
                option.textContent = (i + 1);
                option.setAttribute("data-includestitle", "nope");
                option.setAttribute("value", "" + i);
                // If jumping forward isn't allowed, then everything is disabled by default
                option.disabled = !forward;
                select.appendChild(option);
            }
            document.getElementById("navigation-promptNumber").appendChild(select);
            select.addEventListener("change", function (event) {
                // Show skip warning, if applicable
                sergis.main.checkSkipWarning().then(function (doSkip) {
                    if (doSkip) {
                        // Either the warning didn't need to be shown, or the user chose to continue
                        sergis.main.go(parseInt(select.value, 10));
                    } else {
                        // The user didn't choose to continue
                        select.value = "" + sergis.main.promptIndex;
                    }
                }).catch(sergis.error);
            }, false);
            // Show previous/next ("Back"/"Skip") buttons
            if (back) document.getElementById("navigation-previous").style.display = "inline";
            if (forward) document.getElementById("navigation-next").style.display = "inline";
        } else {
            // Jumping not allowed; check if the navigation footer should be hidden
            if (!sergis.main.user.layout || !sergis.main.user.layout.showPromptNumber) {
                document.getElementById("sidebar-footer-navigation").style.display = "none";
            }
        }
        // Go to the first prompt
        sergis.main.go();
    },
    
    /**
     * Initialize the map for the first time, and set up any toolbar buttons
     * specified by the frontend.
     *
     * @returns {Promise}
     */
    initMap: function () {
        // Make sure the frontend has the things that we need
        if (!sergis.frontend || !sergis.frontend.name || !sergis.frontend.actions) {
            return Promise.reject(new Error("Invalid frontend!"));
        }
        return sergis.frontend.init(
            document.getElementById("map-container"),
            sergis.main.map
        ).then(function (toolbarButtons) {
            // Set as initialized
            sergis.main.frontendInitialized = true;
            // Make toolbar buttons
            if (toolbarButtons && toolbarButtons.length > 0) {
                for (var li, btn, i = 0; i < toolbarButtons.length; i++) {
                    li = document.createElement("li");
                    btn = toolbarButtons[i];
                    sergis.main.toolbarButtonStates[btn.id] = {
                        hidden: false,
                        disabled: false,
                        elem: li
                    };
                    
                    // Make the button
                    li.appendChild(sergis.main.renderContent(btn.label));
                    if (btn.tooltip) li.title = btn.tooltip;
                    li.addEventListener("click", (function (btn) {
                        return (function (event) {
                            if (!this.hasAttribute("disabled")) {
                                sergis.main.loading(true);
                                sergis.frontend.toolbarButtonAction(btn.id).then(function () {
                                    sergis.main.loading(false);
                                }).catch(sergis.error);
                            }
                        });
                    })(btn), false);
                    document.getElementById("main-toolbox-buttons").appendChild(li);
                    //document.getElementById("main-toolbox-buttons").appendChild(document.createTextNode(" "));
                }
            } else {
                // No toolbar buttons; hide the toolbox
                document.getElementById("main-toolbox").style.display = "none";
            }
            // Nothing to resolve with
            return null;
        });
    },
    
    /**
     * Re-initializes the map after it has already been initialized and draws
     * all of the previous map actions.
     *
     * @returns {Promise}
     */
    reinitMap: function () {
        // Reset the status
        sergis.main.status();
        // Start the (re)initialization
        var initFunc = (typeof sergis.frontend.reinit == "function") ? "reinit" : "init";
        return sergis.frontend[initFunc](
            document.getElementById("map-container"),
            sergis.main.map
        ).then(function () {
            // Now, get all the previous actions
            return sergis.backend.game.getPreviousMapActions();
        }).then(function (actions) {
            // Now, do all the actions
            return sergis.main.doActions(actions);
        });
    },
    
    /**
     * Handle going to a new prompt.
     *
     * @param {number} promptIndex - The prompt to go to (if it's not the first
     *        time).
     */
    go: function (promptIndex) {
        if (sergis.main.promptIndex === null) {
            // Make sure we're "loading"
            sergis.main.loading(true, true, true);
            // It's the first time!
            sergis.main.promptIndex = promptIndex = 0;
            sergis.backend.game.getPrompt(0).then(function (prompt) {
                // Get start data (NOTE: We NEED a starting latitude/longitude/zoom!)
                if (prompt.map && typeof prompt.map.latitude == "number" &&
                    typeof prompt.map.longitude == "number" && typeof prompt.map.zoom == "number") {
                    
                    sergis.main.map = prompt.map;
                    // We have to make the map area visible before we initialize it
                    // (otherwise, some frontends won't render correctly)
                    document.getElementById("main-wrapper").style.display = "block";
                    sergis.main.adjustSidebarContent();
                    // Now that we have the start data, initialize the map
                    sergis.main.initMap().then(function () {
                        // Map is ready; show prompt content and hide loading sign
                        sergis.main.showPrompt(prompt);
                        sergis.main.loading(false);
                    }).catch(sergis.error);
                } else {
                    sergis.error("Invalid Prompt object!");
                }
            }).catch(sergis.error);
        } else {
            sergis.main.loading(true);
            // Check if it's a valid promptIndex
            if (promptIndex < 0 || promptIndex >= sergis.main.promptCount) {
                // BAD!!! (An error is passed to show the stack trace in the error console.)
                sergis.error("Invalid promptIndex!", new Error());
            } else {
                var oldPromptIndex = sergis.main.promptIndex;
                sergis.main.promptIndex = promptIndex;
                sergis.backend.game.getPrompt(promptIndex).then(function (prompt) {
                    // Update the map object
                    var oldLatitude = sergis.main.map.latitude,
                        oldLongitude = sergis.main.map.longitude,
                        oldZoom = sergis.main.map.zoom;
                    sergis.main.map = prompt.map || {};
                    
                    // Whether the new Map object is different than the old.
                    // If there's frontendInfo for our frontend, then we'll start off as `true`, otherwise `false`.
                    // If either the latitude, longitude, or zoom has changed, then this is set to `true` below.
                    var newMapIsDifferent = !!(sergis.main.map.frontendInfo && sergis.main.map.frontendInfo[sergis.frontend.name]);
                    
                    // Make sure we have latitude, longitude, and zoom
                    if (typeof sergis.main.map.latitude != "number")
                        sergis.main.map.latitude = oldLatitude;
                    else newMapIsDifferent = true;
                    if (typeof sergis.main.map.longitude != "number")
                        sergis.main.map.longitude = oldLongitude;
                    else newMapIsDifferent = true;
                    if (typeof sergis.main.map.zoom != "number")
                        sergis.main.map.zoom = oldZoom;
                    else newMapIsDifferent = true;
                    
                    // Show the content of the prompt
                    sergis.main.showPrompt(prompt);
                    
                    // Update the map if it changed
                    if (newMapIsDifferent) {
                        // Check if the prompt we're going to is out of order
                        if (promptIndex != oldPromptIndex + 1) {
                            // It's out of order; we'll have to completely re-draw the map
                            return sergis.main.reinitMap();
                        } else {
                            // Just re-center the map
                            return sergis.frontend.centerMap(sergis.main.map);
                        }
                    }
                }).then(function () {
                    // All ready!
                    sergis.main.loading(false);
                }).catch(sergis.error);
            }
        }
    },
    
    /**
     * Go to the next prompt.
     *
     * @param {boolean} isSkipping - Whether this function is being called
     *        because the user pressed "skip" (or similar).
     */
    goNext: function (isSkipping) {
        var afterSkip = function () {
            // First, check if we're done with the game
            if (sergis.main.promptIndex + 1 >= sergis.main.promptCount) {
                // Yup, we're done
                sergis.main.endGame();
            } else {
                sergis.main.go(Math.min(sergis.main.promptIndex + 1, sergis.main.promptCount - 1));
            }
        };
        if (!isSkipping) {
            afterSkip();
        } else {
            // Show skip warning, if applicable
            sergis.main.checkSkipWarning().then(function (doSkip) {
                if (doSkip) {
                    // Either the warning didn't need to be shown, or the user chose to continue
                    afterSkip();
                }
            }).catch(sergis.error);
        }
    },
    
    /**
     * Go to the previous prompt.
     */
    goPrevious: function () {
        sergis.main.go(Math.max(sergis.main.promptIndex - 1, 0));
    },
    
    /**
     * Handle showing prompt data (including title, content, choices, and
     * toolbar buttons, but NOT the map).
     *
     * @param {SerGISPrompt} prompt - The SerGIS Prompt object.
     */
    showPrompt: function (prompt) {
        var i;
        
        if (sergis.main.user.jumpingBackAllowed) {
            // If it's the first item, make sure "Back" is hidden
            document.getElementById("navigation-previous").style.visibility =
                sergis.main.promptIndex === 0 ? "hidden" : "visible";
        }
        if (sergis.main.user.jumpingForwardAllowed) {
            // If it's the last item, make sure "Skip" is hidden
            document.getElementById("navigation-next").style.visibility =
                sergis.main.promptIndex === (sergis.main.promptCount - 1) ? "hidden" : "visible";
        }
        
        // Set title and prompt index
        document.getElementById("sidebar-title-text").textContent = prompt.title;
        if (sergis.main.user.jumpingBackAllowed || sergis.main.user.jumpingForwardAllowed) {
            var select = document.getElementById("navigation-promptNumber-select");
            var option = document.getElementById("navigation-promptNumber-select-option" + sergis.main.promptIndex);
            select.value = "" + sergis.main.promptIndex;
            setTimeout(function () {
                if (!select.hasAttribute("data-widthSet")) {
                    // Make sure that the size of our <select> doesn't change (when we add titles)
                    // This is in a timeout to give it time to render the width
                    select.style.width = select.getBoundingClientRect().width + "px";
                    select.setAttribute("data-widthSet", "yup");
                }
                if (option.getAttribute("data-includestitle") == "nope") {
                    // Add the title
                    option.textContent += " (" + prompt.title + ")";
                    option.setAttribute("data-includestitle", "yep");
                }
            }, 1);
            if (!(sergis.main.user.jumpingBackAllowed && sergis.main.user.jumpingForwardAllowed)) {
                // They're not both allowed; go through and disable prompt indexes that we can't go to
                for (i = 0; i < sergis.main.promptCount; i++) {
                    option = document.getElementById("navigation-promptNumber-select-option" + i);
                    if (i < sergis.main.promptIndex) {
                        option.disabled = !sergis.main.user.jumpingBackAllowed;
                    } else if (i > sergis.main.promptIndex) {
                        option.disabled = !sergis.main.user.jumpingForwardAllowed;
                    } else {
                        option.disabled = false;
                    }
                }
            }
        } else {
            document.getElementById("navigation-promptNumber").textContent = "" + (sergis.main.promptIndex + 1);
        }
        
        // Set any toolbar button changes (if there are any that apply to our current frontend)
        if (prompt.buttons && prompt.buttons[sergis.frontend.name]) {
            var buttons = prompt.buttons[sergis.frontend.name];
            for (var buttonID in buttons) {
                if (buttons.hasOwnProperty(buttonID) && sergis.main.toolbarButtonStates[buttonID]) {
                    // Update "hidden" and/or "disabled"
                    if (typeof buttons[buttonID].hidden == "boolean") {
                        sergis.main.toolbarButtonStates[buttonID].hidden = buttons[buttonID].hidden;
                        sergis.main.toolbarButtonStates[buttonID].elem.style.display = buttons[buttonID].hidden ? "none" : "";
                    }
                    if (typeof buttons[buttonID].disabled == "boolean") {
                        sergis.main.toolbarButtonStates[buttonID].disabled = buttons[buttonID].disabled;
                        if (buttons[buttonID].disabled) {
                            sergis.main.toolbarButtonStates[buttonID].elem.setAttribute("disabled", "disabled");
                        } else {
                            sergis.main.toolbarButtonStates[buttonID].elem.removeAttribute("disabled");
                        }
                    }
                }
            }
        }
        
        // Clear old content
        var contentHolder = document.getElementById("sidebar-content"), lastChild;
        while (lastChild = contentHolder.lastChild) {
            contentHolder.removeChild(lastChild);
        }
        
        // Render new content
        for (i = 0; i < prompt.contents.length; i++) {
            contentHolder.appendChild(sergis.main.renderContent(prompt.contents[i], true));
        }
        
        // Render choices
        if (prompt.choices && prompt.choices.length > 0) {
            var p, button, choiceElems = [];
            for (i = 0; i < prompt.choices.length; i++) {
                button = document.createElement("button");
                button.style.visibility = "hidden";
                button.appendChild(sergis.main.renderContent(prompt.choices[i]));
                button.addEventListener("click", (function (choiceIndex) {
                    return (function (event) {
                        sergis.main.pickChoice(choiceIndex);
                    });
                })(i), false);
                p = document.createElement("p");
                p.style.margin = "10px";
                p.appendChild(button);
                choiceElems.push(p);
            }
            if (prompt.randomizeChoices) shuffleArray(choiceElems);
            for (i = 0; i < choiceElems.length; i++) {
                contentHolder.appendChild(choiceElems[i]);
            }
            // Do button widths
            setTimeout(function () {
                // Make each button visible
                for (var i = 0; i < choiceElems.length; i++) {
                    choiceElems[i].getElementsByTagName("button")[0].style.visibility = "visible";
                }
                // Find the button with the highest width
                var maxWidth = 0;
                for (i = 0; i < choiceElems.length; i++) {
                    maxWidth = Math.max(maxWidth, choiceElems[i].getElementsByTagName("button")[0].getBoundingClientRect().width)
                }
                // Set all the buttons to that width
                for (i = 0; i < choiceElems.length; i++) {
                    choiceElems[i].getElementsByTagName("button")[0].style.minWidth = maxWidth + "px";
                }
            }, 10);
        } else {
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
        
        // Adjust the height of everything and make sure we're scrolled to the top
        setTimeout(function () {
            sergis.main.adjustSidebarContent();
            contentHolder.scrollTop = 0;
        }, 11);
    },
    
    /**
     * Handle picking a choice for the current prompt.
     *
     * @param {number} choiceIndex - The choice index.
     */
    pickChoice: function (choiceIndex) {
        sergis.main.loading(true);
        sergis.backend.game.pickChoice(sergis.main.promptIndex, choiceIndex).then(function (choiceResults) {
            var nextPromptIndex = choiceResults.nextPromptIndex;
            var actions = choiceResults.actions;
            // Check to make sure we have actions, and if so, check for the "Gameplay Actions"
            if (!actions || !actions.length) {
                // No actions; go to the next prompt
                return nextPromptIndex;
            } else {
                // It's all Map Actions (and/or possibly the "explain" Gameplay Action)
                return sergis.main.doActions(actions).then(function () {
                    // Move on to the next prompt index
                    return nextPromptIndex;
                });
            }
        }).then(function (nextPromptIndex) {
            // Any actions are done
            if (typeof nextPromptIndex == "number") {
                sergis.main.go(nextPromptIndex);
            } else if (nextPromptIndex === "end") {
                sergis.main.endGame();
            } else {
                sergis.main.goNext();
            }
        }).catch(sergis.error);
    },
    
    /**
     * Perform a list of actions, one-by-one.
     *
     * @param {Array.<SerGISAction>} actions - The list of Action objects.
     *
     * @returns {Promise} A Promise that will be resolved if all the actions
     *          have been completed successfully.
     */
    doActions: function (actions) {
        return new Promise(function (resolve, reject) {
            // Process the next action
            var action = actions[0];
            if (!action) return resolve();
            
            if (action.name == "explain") {
                // It's an explanation action
                sergis.main.loading(false);
                sergis.main.showSidebarContent(action.data, function () {
                    sergis.main.loading(true, true);
                    resolve();
                });
            } else if (action.frontend) {
                // It's a Map Action (frontend-specific)
                if (action.frontend != sergis.frontend.name) {
                    // It doesn't match our frontend, so let's just ignore it
                    resolve();
                } else {
                    // It's a frontend-specific action that matches our current frontend
                    if (sergis.frontend.actions.hasOwnProperty(action.name)) {
                        // Do the frontend action
                        resolve(sergis.frontend.actions[action.name].apply(sergis.frontend.actions, action.data));
                    } else {
                        // BAD!!!
                        reject("Invalid action for " + sergis.frontend.name + ": " + action.name);
                    }
                }
            } else {
                // We have no idea what this action is
                reject("Invalid action: " + action.name);
            }
        }).then(function () {
            // Are there any actions left?
            var actionsRemaining = actions.slice(1);
            if (actionsRemaining.length > 0) {
                // Do the remaining actions
                return sergis.main.doActions(actionsRemaining);
            }
        });
    },
    
    /**
     * Show the user the game over content.
     */
    endGame: function () {
        sergis.main.loading(true);
        sergis.backend.game.getGameOverContent().then(function (contents) {
            // Hide navigation in footer
            document.getElementById("sidebar-footer-navigation").style.display = "none";
            sergis.main.adjustSidebarContent();
            
            // Set title and number
            document.getElementById("sidebar-title-text").textContent = "Game Over";
            
            // Clear old content
            var contentHolder = document.getElementById("sidebar-content"), lastChild;
            while (lastChild = contentHolder.lastChild) {
                contentHolder.removeChild(lastChild);
            }
            
            // Render new content
            for (var i = 0; i < contents.length; i++) {
                contentHolder.appendChild(sergis.main.renderContent(contents[i], true));
            }
            
            // We're done!
            sergis.main.loading(false);
            
            // Adjust the height of everything and make sure we're scrolled to the top
            setTimeout(function () {
                sergis.main.adjustSidebarContent();
                contentHolder.scrollTop = 0;
            }, 1);
        }).catch(sergis.error);
    }
};
