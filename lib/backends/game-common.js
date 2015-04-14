/*
    The SerGIS Project - sergis-client/sergis-server

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// This is a helper file for sergis-client/lib/backends/local.js and
// sergis-server/modules/socketServers/gameSocketHandler.js

// NOTE: It's used by BOTH sergis-client AND sergis-server! Before you change
// something, make sure you're not going to break anything in either.

var gameCommon = {};
// Support node.js (if that's who's using us)
if (typeof module == "object") module.exports = gameCommon;

(function () {
    /*
     * Each of these functions is called with at least 3 arguments:
     *
     * `jsondata` (object) - The game's JSON data (you can assume that it exists
     *     and that jsondata.promptList exists and has a length >= 0).
     * `state` (object) - The current state tied to this game session/user.
     *     Changes to this are "committed" by the backend once the function is
     *     resolved.
     * Any other function-specific arguments should follow.
     *
     * Each of these functions must return a Promise that is resolved or
     * rejected.
     */


    gameCommon.getPreviousMapActions = function (jsondata, state) {
        return new Promise(function (resolve, reject) {
            var actions = [],
                nonMapActions = ["explain", "endGame", "goto"];

            var pushActions = function (promptIndex) {
                // If onJumpBack=="hide", make sure that we don't show "future" happenings (and make sure a choice exists)
                if ((promptIndex < state.currentPromptIndex || jsondata.onJumpBack != "hide") && typeof state.userChoices[promptIndex] == "number") {
                    var actionList = jsondata.promptList[promptIndex].actionList[state.userChoices[promptIndex]],
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
                for (var promptIndex, i = 0; i < state.userChoiceOrder.length; promptIndex = state.userChoiceOrder[++i]) {
                    pushActions(promptIndex);
                }
            } else {
                // Return the actions in the order of the prompts
                for (var promptIndex = 0; promptIndex < state.userChoices.length; promptIndex++) {
                    pushActions(promptIndex);
                }
            }
            return resolve(actions);
        });
    };
    
    gameCommon.getPromptCount = function (jsondata, state) {
        return Promise.resolve(jsondata.promptList.length);
    };
    
    gameCommon.getPrompt = function (jsondata, state, promptIndex) {
        return new Promise(function (resolve, reject) {
            // Make sure the promptIndex exists
            if (promptIndex < 0 || promptIndex >= jsondata.promptList.length) {
                // BAD!!
                return reject("Invalid promptIndex.");
            }

            // Check if promptIndex is equal to where we're expecting to go
            if (promptIndex == state.nextAllowedPromptIndex) {
                // We're good... we're expecting the user to go to this prompt
                state.nextAllowedPromptIndex = null;
            } else {
                // We're not sure if the user can go to this prompt index, let's check...
                if (promptIndex < state.currentPromptIndex) {
                    // Jumping backwards!
                    if (!jsondata.jumpingBackAllowed) {
                        // BAD!!
                        return reject("Jumping back not allowed!");
                    }
                } else if (promptIndex > state.currentPromptIndex + 1) {
                    // Jumping forwards!
                    if (!jsondata.jumpingForwardAllowed) {
                        // BAD!!
                        return reject("Jumping forward not allowed!");
                    }
                } // else: Either same promptIndex, or the next one (always allowed)
            }

            // If we're jumping backwards, check onJumpBack (this is also checked in getPreviousMapActions)
            if (promptIndex < state.currentPromptIndex) {
                if (jsondata.onJumpBack == "reset") {
                    // Get rid of the user's "future" choices
                    state.userChoices.splice(promptIndex, state.userChoices.length - promptIndex);
                }
            }

            // If we're here, then everything's good to continue
            state.currentPromptIndex = promptIndex;
            // Clear out any possible history of responses to this question
            if (typeof state.userChoices[promptIndex] == "number") {
                delete state.userChoices[promptIndex];
            }
            if (state.userChoiceOrder.indexOf(promptIndex) != -1) {
                state.userChoiceOrder.splice(state.userChoiceOrder.indexOf(promptIndex), 1);
            }
            // Finally, resolve with the prompt
            return resolve(jsondata.promptList[promptIndex].prompt);
        });
    };
    
    gameCommon.getGameOverContent = function (jsondata, state) {
        return new Promise(function (resolve, reject) {
            var breakdown = "<table><thead><tr>" +
                "<th>Question</th><th>Your Score</th><th>Possible Points</th>" +
                "</tr></thead><tbody>";
            var i, j, score, best, worst, pointValue, title, totalScore = 0;
            var somePromptHasAPointValue = false;
            for (i = 0; i < jsondata.promptList.length; i++) {
                // Just skip over this if there aren't any actions at all
                if (jsondata.promptList[i].actionList && jsondata.promptList[i].actionList.length) {
                    // Calculate score for this prompt
                    score = 0;
                    if (typeof state.userChoices[i] == "number") {
                        score += jsondata.promptList[i].actionList[state.userChoices[i]].pointValue || 0;
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
                        somePromptHasAPointValue = true;
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
            
            var messages = [
                {"type": "html", "value": "<h3>Congratulations!</h3>"},
                {"type": "text", "value": "You have completed " + (state.gameName || "this game") + "."}
            ];
            if (somePromptHasAPointValue) {
                messages.push({"type": "html", "value": "Your total score was: <b>" + totalScore + "</b>"});
                messages.push({"type": "text", "value": "Scoring breakdown:"});
                messages.push({"type": "html", "value": breakdown});
            }

            return resolve(messages);
        });
    };
    
    gameCommon.pickChoice = function (jsondata, state, promptIndex, choiceIndex) {
        return new Promise(function (resolve, reject) {
            // Make sure that this was the prompt that the user was on
            if (promptIndex != state.currentPromptIndex) {
                return reject("Invalid promptIndex!");
            }
            
            // Store the user's choice (so we can access it later using getPreviousMapActions)
            state.userChoices[promptIndex] = choiceIndex;
            // Store the order
            if (state.userChoiceOrder.indexOf(promptIndex) != -1) {
                state.userChoiceOrder.splice(state.userChoiceOrder.indexOf(promptIndex), 1);
            }
            state.userChoiceOrder.push(promptIndex);
            
            // Get the actionList
            var actionList = (jsondata.promptList[promptIndex].actionList &&
                              jsondata.promptList[promptIndex].actionList[choiceIndex]) || {};

            // Get the actions (if there are any)
            var actions = actionList.actions || [];
            
            // Figure out the next prompt
            var nextPromptIndex = null;
            if (typeof actionList.nextPrompt == "number") {
                // We have a numeric nextPrompt
                nextPromptIndex = actionList.nextPrompt;
            } else if (actionList.nextPrompt === "end") {
                // Ending the game via "end" nextPrompt
                nextPromptIndex = "end";
            } else if (actionList.nextPrompt) {
                // TODO: Resolve the Conditional
            } else if (actions.length == 1 && actions[0].name == "endGame") {
                // Ending the game via the deprecated `endGame` action
                actions.shift();
                nextPromptIndex = "end";
            }
            
            // If we still don't have a next prompt, check if there is a deprecated "goto" action
            if (nextPromptIndex === null) {
                for (var i = actions.length - 1; i >= 0; i--) {
                    if (actions[i].name == "goto") {
                        // Found one!
                        if (nextPromptIndex === null && actions[i].data && actions[i].data.length) {
                            nextPromptIndex = actions[i].data[0];
                        }
                        // Splice it out so the client doesn't cry
                        actions.splice(i, 1);
                    }
                }
            }

            // Store the next prompt index
            // (to make sure that, if jumping is disabled, it don't yell at the user for going in a non-sequential order)
            state.nextAllowedPromptIndex = nextPromptIndex;

            // Finally, resolve with the actions and next prompt
            return resolve({
                nextPromptIndex: nextPromptIndex,
                actions: actions
            });
        });
    };
})();
