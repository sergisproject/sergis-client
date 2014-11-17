/*
 * The SerGIS Project - sergis-client
 *
 * This is a SerGIS Client Backend file. For more on SerGIS Backends, see:
 * http://sergisproject.github.io/docs/
 *
 * This backend does not connect to a server; it just uses data that is stored
 * locally. Although this is not very secure, it is a simple way to handle it.
 */

// Test values (global so they can be modified in a browser console)
var testdata = {
    // username/password for login
    username: "username",
    password: "password",
    
    // properties for the SerGIS User object
    displayName: "Test User",
    promptIndex: null,
    
    // whether to start off logged in
    startLoggedIn: true,
    
    // The location of the SerGIS JSON Game Data file (relative to index.html)
    // If not provided, we're going to assume that there's a global object `SERGIS_JSON_DATA` that contains the SerGIS JSON Game Data.
    //jsonfile: "testdata.json",
    
    // This is filled in with the contents of "jsonfile"
    jsondata: null
};

// This is wrapped inside an anonymous, self-executing function to prevent
// variables from leaking into the global scope.
(function () {
    var isLoggedIn = testdata.startLoggedIn;
    var currentPromptIndex;
    
    /**
     * Load our JSON data.
     *
     * NOTE: The Promise returned is never rejected.
     * If something goes awry, we neither resolve nor reject. (Just for fun, you know...)
     *
     * @return Promise
     */
    var loadJSON = function () {
        return new Promise(function (resolve, reject) {
            if (!testdata.jsonfile) {
                // No JSON file path; let's assume that there's a global object with the data
                testdata.jsondata = SERGIS_JSON_DATA;
                resolve();
            } else {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", testdata.jsonfile, true);
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
                        testdata.jsondata = data;
                        // Everything's good! Continue on with life.
                        resolve();
                    }
                };
                xhr.send();
            }
        });
    };
    
    var user = {
        displayName: testdata.displayName,
        promptIndex: testdata.promptIndex || undefined
    };
    
    /**
     * @namespace
     * @see {@link http://sergisproject.github.io/docs/client.html}
     */
    sergis.backend = {
        account: {
            logIn: function (username, password) {
                return new Promise(function (resolve, reject) {
                    if (username == testdata.username && password == testdata.password) {
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
                        user.jumpingBackAllowed = testdata.jsondata.jumpingBackAllowed;
                        user.jumpingForwardAllowed = testdata.jsondata.jumpingForwardAllowed;
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
                    var actions = [], i, j, chosen, action,
                        promptList = testdata.jsondata.promptList;
                    for (i = 0; i < currentPromptIndex - 1; i++) {
                        if (typeof promptList[i].chosen == "number") {
                            chosen = promptList[i].chosen;
                            for (j = 0; j < promptList[i].actionList[chosen].actions.length; j++) {
                                action = promptList[i].actionList[chosen].actions[j];
                                if (action && action.name && ["explain", "goto", "continue", "logout"].indexOf(action.name) == -1) {
                                    actions.push(action);
                                }
                            }
                        }
                    }
                    resolve(actions);
                });
            },
            
            getPromptCount: function () {
                return new Promise(function (resolve, reject) {
                    resolve(testdata.jsondata.promptList.length);
                });
            },
            
            getPrompt: function (promptIndex) {
                return new Promise(function (resolve, reject) {
                    // This is in a timeout solely if you want to test the loading sign
                    setTimeout(function () {
                        currentPromptIndex = promptIndex;
                        resolve(testdata.jsondata.promptList[promptIndex - 1].prompt);
                    }, 1000);
                });
            },
            
            getActions: function (promptIndex, choiceIndex) {
                return new Promise(function (resolve, reject) {
                    // Store the user's choice (so we can access it later using getPreviousMapActions)
                    testdata.jsondata.promptList[promptIndex - 1].chosen = choiceIndex;
                    resolve(testdata.jsondata.promptList[promptIndex - 1].actionList[choiceIndex].actions);
                });
            }
        }
    };
})();
