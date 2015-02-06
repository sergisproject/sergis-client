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
    var socket;
    var token;
    
    /**
     * @namespace
     * @see {@link http://sergisproject.github.io/docs/client.html#backends}
     */
    sergis.backend = {
        account: {
            logIn: function (username, password) {
                return new Promise(function (resolve, reject) {
                    if (!socket) {
                        reject("No connection to server.");
                    } else {
                        socket.emit("logIn", username, password, function (userData, _token) {
                            if (userData) {
                                token = _token;
                                resolve(userData);
                            } else {
                                reject("Username or password incorrect.");
                            }
                        });
                    }
                });
            },
            
            logOut: function () {
                return new Promise(function (resolve, reject) {
                    if (!socket) {
                        reject("No connection to server.");
                    } else {
                        socket.emit("logOut", function (isResolved) {
                            if (isResolved) resolve();
                            else reject();
                        });
                    }
                });
            },
            
            getUser: function () {
                return new Promise(function (resolve, reject) {
                    // Load socket.io
                    socket = io.connect(window.location.origin + "/client");
                    socket.on("connecting", function () {
                        console.log("Connecting to socket server...");
                    });
                    socket.on("connect", function () {
                        console.log("Connected to socket server");
                        socket.emit("getUser", function (userData, _token) {
                            if (userData) {
                                token = _token;
                                resolve(userData);
                            } else {
                                reject();
                            }
                        });
                    });
                    
                    socket.on("connect_failed", function () {
                        sergis.error("Connection to socket server failed.");
                    });
                    
                    socket.on("disconnect", function () {
                        console.log("Disconnected from socket server");
                    });
                    socket.on("error", function (err) {
                        console.log("Error connecting to socket server: ", err);
                    });
                    socket.on("reconnect", function () {
                        console.log("Reconnected to socket server");
                    });
                    socket.on("reconnecting", function (num) {
                        console.log("Reconnecting to socket server... (attempt " + num + ")");
                    });
                    socket.on("reconnect_error", function (err) {
                        console.log("Error reconnecting to socket server: ", err);
                    });
                    socket.on("reconnect_failed", function () {
                        console.log("Failed to reconnect to socket server");
                    });
                });
            }
        },
        
        game: {}
    };
    
    // All the sergis.backend.game.* stuff works in practically the same way
    var gameFunctions = ["getPreviousMapActions", "getPromptCount", "getPrompt", "getActions", "getGameOverContent"];
    for (var func, i = 0; i < gameFunctions.length; i++) {
        (function (func) {
            sergis.backend.game[func] = function () {
                var args = Array.prototype.slice.call(arguments);
                return new Promise(function (resolve, reject) {
                    if (!socket) {
                        reject("No connection to server.");
                    } else {
                        socket.emit("game", token, func, args, function (isResolved, data) {
                            (isResolved ? resolve : reject)(data);
                        });
                    }
                });
            };
        })(gameFunctions[i]);
    }
})();
