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
 * This backend connects to the SerGIS Server:
 * https://github.com/sergisproject/sergis-server
 */

(function () {
    
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
                    // We'll use this time as an excuse to load the JSON file
                    // (NOTE: We're not worrying about if this promise is rejected,
                    //  because if it is, we don't want to continue anyway...
                    //  so the getUser promise will remain unresolved.)
                    loadJSON("/lib/testdata.json").then(function () {
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
                    resolve(jsondata.promptList.length);
                });
            },
            
            getPrompt: function (promptIndex) {
                return new Promise(function (resolve, reject) {
                    // This is in a timeout solely to test the loading sign
                    setTimeout(function () {
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
                    var i, j, score, best, pointValue, totalScore = 0;
                    for (i = 0; i < jsondata.promptList.length; i++) {
                        // Just skip over this if there aren't any actions at all
                        if (jsondata.promptList[i].actionList && jsondata.promptList[i].actionList.length) {
                            breakdown += "<tr><td>" + (i + 1) + "</td>";
                            // Calculate score for this prompt
                            score = 0;
                            if (typeof userChoices[i] == "number") {
                                score += jsondata.promptList[i].actionList[userChoices[i]].pointValue || 0;
                            }
                            totalScore += score;
                            breakdown += "<td>" + score + "</td>";
                            // Calculate best score for this prompt
                            best = 0
                            for (j = 0; j < jsondata.promptList[i].actionList.length; j++) {
                                pointValue = jsondata.promptList[i].actionList[j].pointValue;
                                if (pointValue && pointValue > best) {
                                    best = pointValue;
                                }
                            }
                            breakdown += "<td>" + best + "</td>";
                            breakdown += "</tr>";
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