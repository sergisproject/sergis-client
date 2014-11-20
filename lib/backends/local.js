/*
 * The SerGIS Project - sergis-client
 *
 * This is a SerGIS Client Backend file. For more on SerGIS Backends, see:
 * http://sergisproject.github.io/docs/client.html#backends
 *
 * This backend does not connect to a server; it just uses data that is stored
 * locally. Although this is not very secure, it is a simple way to handle it.
 */

/**
 * This "namespace" is an anonymous, self-executing function (to prevent
 * variables from leaking into the global scope).
 * Therefore, all variables within are inner members of this "namespace".
 * @namespace SerGIS_Local
 */
(function () {
    /**
     * Whether to start off logged in.
     * @memberof SerGIS_Local
     * @inner
     */
    var isLoggedIn = true;
    
    /**
     * If isLoggedIn starts off false, this is the username that the user must
     * enter.
     * @memberof SerGIS_Local
     * @inner
     */
    var testUsername = "username";
    
    /**
     * If isLoggedIn starts off false, this is the password that the user must
     * enter.
     * @memberof SerGIS_Local
     * @inner
     */
    var testPassword = "password";
    
    /**
     * Values for the user.
     * (jumpingBackAllowed and jumpingForwardAllowed added based on JSON file.)
     * @memberof SerGIS_Local
     * @inner
     */
    var user = {
        displayName: "Test User",
        promptIndex: null
    };
    
    
    /**
     * Our JSON Game Data.
     * @memberof SerGIS_Local
     * @inner
     */
    var jsondata;
    
    /**
     * What promptIndex the user is currently on.
     * @memberof SerGIS_Local
     * @inner
     */
    var currentPromptIndex;
    
    /**
     * What the user has chosen, based on promptIndex.
     * @memberof SerGIS_Local
     * @inner
     */
    var userChoices = [];
    
    /**
     * The order that the user chose answers to prompts (each element is a
     * promptIndex).
     * @memberof SerGIS_Local
     * @inner
     */
    var userChoiceOrder = [];
    
    
    /**
     * Load our JSON data.
     *
     * NOTE: The Promise returned is never rejected.
     * If something goes awry, we neither resolve nor reject. (Just for fun, you know...)
     *
     * @memberof SerGIS_Local
     * @inner
     *
     * @param {string} jsonfile - The location of the JSON file.
     *
     * @return Promise
     */
    var loadJSON = function (jsonfile) {
        return new Promise(function (resolve, reject) {
            if (!jsonfile) {
                // No JSON file path; let's assume that there's a global object with the data
                jsondata = SERGIS_JSON_DATA;
                resolve();
            } else {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", jsonfile, true);
                xhr.onreadystatechange = function () {
                    if (this.readyState != 4) return false;
                    if (this.status != 200) {
                        // HTTP error!
                        sergis.error("Couldn't fetch JSON data!\n" +
                            "Details: HTTP " + this.status + " (" + this.statusText + ")");
                    } else {
                        // Everything returned all good!
                        // Let's try parsing the JSON
                        var data;
                        try {
                            data = JSON.parse(xhr.responseText);
                            if (!data) throw "Details: No data found.";
                        } catch (err) {
                            sergis.error("Couldn't parse JSON data!\nDetails: " + err.message, err);
                            return;
                        }
                        jsondata = data;
                        // Everything's good! Continue on with life.
                        resolve();
                    }
                };
                xhr.send();
            }
        });
    };
    
    /**
     * @namespace
     * @see {@link http://sergisproject.github.io/docs/client.html}
     */
    sergis.backend = {
        account: {
            logIn: function (username, password) {
                return new Promise(function (resolve, reject) {
                    if (username == testUsername && password == testPassword) {
                        isLoggedIn = true;
                        resolve(user);
                    } else {
                        reject("Username or password incorrect.");
                    }
                });
            },
            
            logOut: function () {
                return new Promise(function (resolve, reject) {
                    isLoggedIn = false;
                    resolve();
                });
            },
            
            getUser: function () {
                return new Promise(function (resolve, reject) {
                    // We'll use this time as an excuse to load the JSON file
                    // (NOTE: We're not worrying about if this promise is rejected,
                    //  because if it is, we don't want to continue anyway...
                    //  so the getUser promise will remain unresolved.)
                    loadJSON().then(function () {
                        user.jumpingBackAllowed = jsondata.jumpingBackAllowed;
                        user.jumpingForwardAllowed = jsondata.jumpingForwardAllowed;
                        if (isLoggedIn) {
                            resolve(user);
                        } else {
                            reject("Not logged in.");
                        }
                    }).catch(sergis.error);
                });
            }
        },
        
        game: {
            getPreviousMapActions: function () {
                return new Promise(function (resolve, reject) {
                    var actions = [],
                        nonMapActions = ["explain", "goto", "continue", "logout"];
                    
                    var pushActions = function (promptIndex) {
                        var actionList = jsondata.promptList[promptIndex].actionList[userChoices[promptIndex]],
                            i, action;
                        for (i = 0; i < actionList.actions.length; i++) {
                            action = actionList.actions[i];
                            if (action && action.name && nonMapActions.indexOf(action.name) == -1) {
                                actions.push(action);
                            }
                        }
                    };
                    
                    if (jsondata.showActionsInUserOrder) {
                        // Return the actions in the order that the user chose them
                        for (var promptIndex, i = 0; i < userChoiceOrder.length; promptIndex = userChoiceOrder[++i]) {
                            // If onJumpBack=="hide", make sure that we don't show "future" happenings (and make sure a choice exists)
                            if ((promptIndex < currentPromptIndex || testdata.onJumpBack != "hide") && typeof userChoices[promptIndex] == "number") {
                                pushActions(promptIndex);
                            }
                        }
                    } else {
                        // Return the actions in the order of the prompts
                        for (var promptIndex = 0; promptIndex < userChoices.length; promptIndex++) {
                            if (typeof userChoices[promptIndex] == "number") {
                                pushActions(promptIndex);
                            }
                        }
                    }
                    resolve(actions);
                });
            },
            
            getPromptCount: function () {
                return new Promise(function (resolve, reject) {
                    resolve(jsondata.promptList.length);
                });
            },
            
            getPrompt: function (promptIndex) {
                return new Promise(function (resolve, reject) {
                    // This is in a timeout solely to test the loading sign
                    setTimeout(function () {
                        if (promptIndex < currentPromptIndex) {
                            // Jumping backwards!
                            if (!jsondata.jumpingBackAllowed) {
                                // BAD!!
                                reject("Jumping back not allowed!");
                                return;
                            } else {
                                // Check onJumpBack (this is also checked in getPreviousMapActions)
                                if (jsondata.onJumpBack == "reset") {
                                    // Get rid of the user's "future" choices
                                    userChoices.splice(promptIndex, userChoices.length - promptIndex);
                                }
                                
                            }
                        } else if (promptIndex > currentPromptIndex + 1) {
                            // Jumping forwards!
                            if (!jsondata.jumpingForwardAllowed) {
                                // BAD!!
                                reject("Jumping forward not allowed!");
                                return;
                            }
                        } // else: Either same promptIndex, or the next one (always allowed)
                        
                        // If we're here, then everything's good to continue
                        currentPromptIndex = promptIndex;
                        // Clear out any possible history of responses to this question
                        if (typeof userChoices[promptIndex] == "number") {
                            delete userChoices[promptIndex];
                        }
                        if (userChoiceOrder.indexOf(promptIndex) != -1) {
                            userChoiceOrder.splice(userChoiceOrder.indexOf(promptIndex), 1);
                        }
                        // Finally, resolve with the prompt
                        resolve(jsondata.promptList[promptIndex].prompt);
                    }, 500);
                });
            },
            
            getActions: function (promptIndex, choiceIndex) {
                return new Promise(function (resolve, reject) {
                    // Store the user's choice (so we can access it later using getPreviousMapActions)
                    userChoices[promptIndex] = choiceIndex;
                    // Store the order
                    if (userChoiceOrder.indexOf(promptIndex) != -1) {
                        userChoiceOrder.splice(userChoiceOrder.indexOf(promptIndex), 1);
                    }
                    userChoiceOrder.push(promptIndex);
                    // Finally, resolve with the actions
                    resolve(jsondata.promptList[promptIndex].actionList[choiceIndex].actions);
                });
            }
        }
    };
})();
