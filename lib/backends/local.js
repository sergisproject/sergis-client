/*
 * This is a SerGIS Client Backend file. For more on SerGIS Backends, see:
 * http://sergisproject.github.io/docs/
 *
 * This backend does not connect to a server; it just uses data that is stored
 * locally. Although this is not very secure, it is a simple way to handle it.
 */

// This is wrapped inside an anonymous, self-executing function to prevent
// variables from leaking into the global scope.
(function () {
    // Test values
    var username = "username";
    var password = "password";
    var displayName = "Test User";
    var isLoggedIn = false;
    
    sergis.backend = {
        account: {
            logIn: function (username, password) {
                return new Promise(function (resolve, reject) {
                    if (username == username && password == password) {
                        isLoggedIn = true;
                        resolve(displayName);
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
                    if (isLoggedIn) {
                        resolve(displayName);
                    } else {
                        reject("Not logged in.");
                    }
                });
            }
        },
        
        game: {
            allowJumpingAround: true,
            
            getPreviousActions: function () {
                return new Promise(function (resolve, reject) {
                    // ...
                });
            },
            
            getQuestionCount: function () {
                return new Promise(function (resolve, reject) {
                    // ...
                });
            },
            
            getQuestion: function (questionIndex) {
                return new Promise(function (resolve, reject) {
                    // ...
                });
            },
            
            getAction: function (questionIndex, actionIndex) {
                return new Promise(function (resolve, reject) {
                    // ...
                });
            }
        }
    };
})();