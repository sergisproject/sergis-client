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
    var testusername = "username";
    var testpassword = "password";
    var displayName = "Test User";
    var isLoggedIn = false;
    
    var testQuestions = [
        // Question 1
        {
            question: {
                title: "Introduction",
                content: [
                    {type: "html", content: "<b>Hello</b> <i>World!</i>"}
                ],
                map: {
                    latitude: -34.397,
                    longitude: 150.644,
                    zoom: 8
                },
                answers: []
            },
            actions: []
        },
        
        // Question 2
        {
            question: {
                title: "Introduction",
                content: [
                    {type: "text", content: "<b>Hello</b> <i>World!</i>"}
                ],
                answers: []
            },
            actions: []
        }
    ];
    
    sergis.backend = {
        account: {
            logIn: function (username, password) {
                return new Promise(function (resolve, reject) {
                    if (username == testusername && password == testpassword) {
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
            isJumpingAllowed: function () {
                return new Promise(function (resolve, reject) {
                    resolve(true);
                });
            },
            
            getPreviousActions: function () {
                return new Promise(function (resolve, reject) {
                    // ...
                });
            },
            
            getQuestionCount: function () {
                return new Promise(function (resolve, reject) {
                    resolve(testQuestions.length);
                });
            },
            
            getQuestion: function (questionIndex) {
                return new Promise(function (resolve, reject) {
                    resolve(testQuestions[questionIndex - 1].question);
                });
            },
            
            getAction: function (questionIndex, actionIndex) {
                return new Promise(function (resolve, reject) {
                    resolve(testQuestions[questionIndex - 1].answers[actionIndex]);
                });
            }
        }
    };
})();
