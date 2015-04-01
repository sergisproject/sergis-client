/*
    The SerGIS Project - sergis-client

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

/*
 * This is a SerGIS Client Backend file. For more on SerGIS Backends, see:
 * http://sergisproject.github.io/docs/client.html#backends
 *
 * This backend does not connect to a server; it just uses data that is stored
 * locally. Although this is not very secure, it is a simple way to handle it.
 *
 * Also, if there is SerGIS JSON Game Data after the hash in the URL, it is used
 * instead of a local JSON file.
 * Example: index.html#json-game-data::{JSON GAME DATA HERE}
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
        //displayName: "SerGIS User",
        buttons: [{
            label: "Refresh",
            action: function () {
                location.reload();
            }
        }],
        promptIndex: null
    };
    
    /**
     * URL for testdata.json.
     * @memberof SerGIS_Local
     * @inner
     */
    var testdataURL = "lib/testdata.json";
    
    
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
     * Which choice we are expecting the user to go to next. Changed in
     * getActions to allow "goto" actions to take the user to a question that
     * isn't the next one, even if jumping is disabled.
     * @memberof SerGIS_Local
     * @inner
     */
    var nextAllowedPromptIndex = null;
    
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
     * If something goes awry, we neither resolve nor reject. (Just for fun,
     * you know...)
     *
     * @memberof SerGIS_Local
     * @inner
     *
     * @param {string} jsonfile - The location of the JSON file.
     *
     * @return {Promise}
     */
    var loadJSON = function (jsonfile) {
        return new Promise(function (resolve, reject) {
            if (!jsonfile) {
                // No JSON file path :(
                sergis.error("No SerGIS JSON Game Data found.");
                return;
            }
            
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
        });
    };
    
    /**
     * Fill up jsondata with SerGIS JSON Game Data from somewhere.
     * Places that we look (in this order):
     *   1. JSONDATA global
     *   2. URL hash
     *   3. URL query string (currently commented out)
     *   4. "lib/testdata.json"
     *
     * NOTE: The Promise returned is never rejected.
     * If something goes awry, we neither resolve nor reject. (Just for fun,
     * you know...)
     *
     * @memberof SerGIS_Local
     * @inner
     *
     * @return {Promise}
     */
    var fillJSON = function () {
        return new Promise(function (resolve, reject) {
            // 1. Check SERGIS_JSON_DATA
            if (typeof SERGIS_JSON_DATA == "object") {
                // Yay, we'll use this!
                jsondata = SERGIS_JSON_DATA;
                resolve();
                return;
            }
            
            // 2. Check if the hash contains some JSON data
            if (location.hash && location.hash.substring(0, 15) == "#jsongamedata::") {
                var gamedata;
                try {
                    gamedata = decodeURIComponent(location.hash.substring(15));
                } catch (err) {
                    sergis.error("Invalid data provided in the URL hash.", err);
                    return;
                }
                if (gamedata) {
                    var data;
                    try {
                        data = JSON.parse(gamedata);
                    } catch (err) {
                        sergis.error("Invalid JSON data provided in the URL hash.", err);
                        return;
                    }
                    if (data) {
                        jsondata = data;
                        resolve();
                        return;
                    }
                }
            }
            
            /*
            // 3. Check if the query string contains some JSON data
            if (location.search && location.search.substring(1)) {
                // Populate `query` with the query string contents
                var search = location.search.substring(1).split("&");
                var query = {}, name, value;
                for (var i = 0; i < search.length; i++) {
                    if (search[i].indexOf("=") != -1) {
                        name = decodeURIComponent(search[i].substring(0, search[i].indexOf("=")));
                        value = decodeURIComponent(search[i].substring(search[i].indexOf("=") + 1));
                    } else {
                        name = decodeURIComponent(search[i]);
                        value = true;
                    }
                    query[name] = value;
                }
                
                // Do we have something that we want?
                if (query.hasOwnProperty("jsongamedata") && query.jsongamedata) {
                    var data;
                    try {
                        data = JSON.parse(query.jsongamedata);
                    } catch (err) {
                        sergis.error("Invalid JSON data provided in URL query string.", err);
                        return;
                    }
                    if (data) {
                        jsondata = data;
                        resolve();
                        return;
                    }
                }
            }
            */
            
            // 4. If we're still here, try to load testdataURL
            resolve(loadJSON(testdataURL));
        });
    };
    
    /**
     * @namespace
     * @see {@link http://sergisproject.github.io/docs/client.html#backends}
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
                    // We'll use this time as an excuse to load the JSON data.
                    // NOTE: We're not worrying about if this promise is rejected,
                    // because if it is, we don't want to continue anyway...
                    // so the getUser promise will remain unresolved.
                    fillJSON().then(function () {
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
        
        /**
         * NOTE: These are heavily related to sergis-server/modules/gameSocketHandler.js
         * @see https://github.com/sergisproject/sergis-server/blob/master/modules/gameSocketHandler.js
         */
        game: {
            getPreviousMapActions: function () {
                return new Promise(function (resolve, reject) {
                    var actions = [],
                        nonMapActions = ["explain", "goto", "logout"];
                    
                    var pushActions = function (promptIndex) {
                        // If onJumpBack=="hide", make sure that we don't show "future" happenings (and make sure a choice exists)
                        if ((promptIndex < currentPromptIndex || jsondata.onJumpBack != "hide") && typeof userChoices[promptIndex] == "number") {
                            var actionList = jsondata.promptList[promptIndex].actionList[userChoices[promptIndex]],
                                i, action;
                            if (actionList.actions) {
                                for (i = 0; i < actionList.actions.length; i++) {
                                    action = actionList.actions[i];
                                    if (action && action.name && nonMapActions.indexOf(action.name) == -1) {
                                        actions.push(action);
                                    }
                                }
                            }
                        }
                    };
                    
                    if (jsondata.showActionsInUserOrder) {
                        // Return the actions in the order that the user chose them
                        for (var promptIndex, i = 0; i < userChoiceOrder.length; promptIndex = userChoiceOrder[++i]) {
                            pushActions(promptIndex);
                        }
                    } else {
                        // Return the actions in the order of the prompts
                        for (var promptIndex = 0; promptIndex < userChoices.length; promptIndex++) {
                            pushActions(promptIndex);
                        }
                    }
                    resolve(actions);
                });
            },
            
            getPromptCount: function () {
                return new Promise(function (resolve, reject) {
                    if (!jsondata || !jsondata.promptList || !jsondata.promptList.length) {
                        reject("Invalid JSON Game Data.");
                        return;
                    }

                    resolve(jsondata.promptList.length);
                });
            },
            
            getPrompt: function (promptIndex) {
                return new Promise(function (resolve, reject) {
                    // This is in a timeout solely to test the loading sign
                    setTimeout(function () {
                        // Make sure the promptIndex exists
                        if (promptIndex < 0 || promptIndex >= jsondata.promptList.length) {
                            // BAD!!
                            reject("Invalid promptIndex.");
                            return;
                        }
                        
                        // Check if promptIndex is equal to where we're expecting to go
                        if (promptIndex == nextAllowedPromptIndex) {
                            // We're good... we're expecting the user to go to this prompt
                            nextAllowedPromptIndex = null;
                        } else {
                            // We're not sure if the user can go to this prompt index, let's check...
                            if (promptIndex < currentPromptIndex) {
                                // Jumping backwards!
                                if (!jsondata.jumpingBackAllowed) {
                                    // BAD!!
                                    reject("Jumping back not allowed!");
                                    return;
                                }
                            } else if (promptIndex > currentPromptIndex + 1) {
                                // Jumping forwards!
                                if (!jsondata.jumpingForwardAllowed) {
                                    // BAD!!
                                    reject("Jumping forward not allowed!");
                                    return;
                                }
                            } // else: Either same promptIndex, or the next one (always allowed)
                        }
                        
                        // If we're jumping backwards, check onJumpBack (this is also checked in getPreviousMapActions)
                        if (promptIndex < currentPromptIndex) {
                            if (jsondata.onJumpBack == "reset") {
                                // Get rid of the user's "future" choices
                                userChoices.splice(promptIndex, userChoices.length - promptIndex);
                            }
                        }
                        
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
                    }, 50);
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
                    // Get the actions (if there are any)
                    var actions = (jsondata.promptList[promptIndex].actionList &&
                                   jsondata.promptList[promptIndex].actionList[choiceIndex] &&
                                   jsondata.promptList[promptIndex].actionList[choiceIndex].actions) || [];
                    var last = actions[actions.length - 1];
                    // Check if there is a "goto" that would affect the question sequence
                    // (to make sure that, if jumping is disabled, it doesn't yell at the user for going in a non-sequential order)
                    if (last && last.name && last.name == "goto" && last.data && last.data.length) {
                        nextAllowedPromptIndex = last.data[0];
                    } else {
                        nextAllowedPromptIndex = null;
                    }
                    // Finally, resolve with the actions
                    resolve(actions);
                });
            },
            
            getGameOverContent: function () {
                return new Promise(function (resolve, reject) {
                    var breakdown = "<table><thead><tr>" +
                        "<th>Question</th><th>Your Score</th><th>Possible Points</th>" +
                        "</tr></thead><tbody>";
                    var i, j, score, best, worst, pointValue, title, totalScore = 0;
                    for (i = 0; i < jsondata.promptList.length; i++) {
                        // Just skip over this if there aren't any actions at all
                        if (jsondata.promptList[i].actionList && jsondata.promptList[i].actionList.length) {
                            // Calculate score for this prompt
                            score = 0;
                            if (typeof userChoices[i] == "number") {
                                score += jsondata.promptList[i].actionList[userChoices[i]].pointValue || 0;
                            }
                            totalScore += score;
                            // Calculate best score for this prompt
                            best = 0;
                            worst = 0;
                            for (j = 0; j < jsondata.promptList[i].actionList.length; j++) {
                                pointValue = jsondata.promptList[i].actionList[j].pointValue;
                                if (pointValue && pointValue > best) best = pointValue;
                                if (pointValue && pointValue < worst) worst = pointValue;
                            }
                            // Make sure that at least one of the choices has a point value
                            // (Otherwise, it's not really important)
                            if (best != 0 || worst != 0) {
                                title = jsondata.promptList[i].prompt.title || "";
                                if (title) title = " (" + title + ")";
                                title = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
                                breakdown += "<tr><td>" + (i + 1) + title + "</td>";
                                breakdown += "<td>" + score + "</td>";
                                breakdown += "<td>" + best + "</td>";
                                breakdown += "</tr>";
                            }
                        }
                    }
                    breakdown += "</tbody></table>";
                    resolve([
                        {"type": "html", "value": "<h3>Congratulations!</h3>"},
                        {"type": "text", "value": "You have completed SerGIS."},
                        {"type": "html", "value": "Your total score was: <b>" + totalScore + "</b>"},
                        {"type": "text", "value": "Scoring breakdown:"},
                        {"type": "html", "value": breakdown}
                    ]);
                });
            }
        }
    };
})();
