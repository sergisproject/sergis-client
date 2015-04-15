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
                        var game = document.getElementById("sergis-backend-script").getAttribute("data-game");
                        if (!game) {
                            reject("Invalid game.");
                            return;
                        }
                        
                        socket.emit("logIn", game, username, password, function (userData, _token) {
                            if (userData && _token) {
                                token = _token;
                                resolve(userData);
                            } else if (userData === false && _token === false) {
                                reject("User does not have access to this game.");
                            } else if (userData === false) {
                                reject("Username or password incorrect.");
                            } else {
                                reject("Error logging in.");
                            }
                        });
                    }
                });
            },
            
            getUser: function () {
                return new Promise(function (resolve, reject) {
                    // Load socket.io
                    var origin = document.getElementById("sergis-backend-script").getAttribute("data-socket-io-origin") || window.location.origin;
                    var prefix = document.getElementById("sergis-backend-script").getAttribute("data-socket-io-prefix") || "";
                    console.log("Connecting to socket.io at: " + origin + prefix + "/socket.io");
                    socket = io.connect(origin + "/game", {
                        path: prefix + "/socket.io"
                    });
                    socket.on("connecting", function () {
                        console.log("Connecting to socket server...");
                    });
                    socket.on("connect", function () {
                        console.log("Connected to socket server");
                        var game = document.getElementById("sergis-backend-script").getAttribute("data-game"),
                            session = document.getElementById("sergis-backend-script").getAttribute("data-session");
                        if (!game) {
                            reject();
                            return;
                        }
                        
                        socket.emit("getUser", game, session, function (userData, _token) {
                            if (userData === false) {
                                reject();
                            } else if (userData && typeof userData == "object") {
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
    var gameFunctions = ["getPreviousMapActions", "getPromptCount", "getPrompt", "getGameOverContent", "pickChoice"];
    for (var i = 0; i < gameFunctions.length; i++) {
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
