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
     * (jumpingBackAllowed, jumpingForwardAllowed, and layout are added based
     * on the JSON file.)
     * @memberof SerGIS_Local
     * @inner
     */
    var user = {
        //displayName: "SerGIS User",
        promptIndex: null,
        //homeURL: "."
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
     * The current state of the user's game.
     * @memberof SerGIS_Local
     * @inner
     */
    var state = {
        // Default state
        currentPromptIndex: null,
        nextAllowedPromptIndex: null,
        userChoices: [],
        userChoiceOrder: []
    };
    
    
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
                        if (!data) throw new Error("No data found.");
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
            
            getUser: function () {
                return new Promise(function (resolve, reject) {
                    // We'll use this time as an excuse to load the JSON data.
                    // NOTE: We're not worrying about if this promise is rejected,
                    // because if it is, we don't want to continue anyway...
                    // so the getUser promise will remain unresolved.
                    fillJSON().then(function () {
                        user.jumpingBackAllowed = jsondata.jumpingBackAllowed;
                        user.jumpingForwardAllowed = jsondata.jumpingForwardAllowed;
                        user.layout = jsondata.layout;
                        user.alwaysReinitializeMap = jsondata.alwaysReinitializeMap;
                        if (isLoggedIn) {
                            resolve(user);
                        } else {
                            reject("Not logged in.");
                        }
                    }).catch(sergis.error);
                });
            }
        },
        
        game: {}
    };
    
    // Now, all the functions in game-common.js need to be represented in sergis.backend.game.*
    for (var func in gameCommon) {
        if (gameCommon.hasOwnProperty(func)) {
            (function (func) {
                sergis.backend.game[func] = function () {
                    if (!jsondata || !jsondata.promptList || !jsondata.promptList.length) {
                        return Promise.reject(new Error("Invalid JSON Game Data."));
                    }
                    var args = [jsondata, state].concat(Array.prototype.slice.call(arguments));
                    return gameCommon[func].apply(gameCommon, args);
                };
            })(func);
        }
    }
})();
