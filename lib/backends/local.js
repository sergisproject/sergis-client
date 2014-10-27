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
    var currentQuestionIndex;
    
    var testQuestions = [
        // Question 1
        {
            question: {
                title: "Introduction",
                content: [
                    {type: "html", value: "<b>Hello</b> <i>World!</i>"}
                ],
                map: {
                    latitude: -34.397,
                    longitude: 150.644,
                    zoom: 8
                },
                answers: [
                    {type: "html", value: "Choice <b>NUMBER 1</b>"},
                    {type: "text", value: "Choice <2>"}
                ]
            },
            actions: [
                [{name: "buffer", data: []}],
                [{name: "buffer"}]
            ]
        },
        
        // Question 2
        {
            question: {
                title: "Introduction",
                content: [
                    {type: "text", value: "<b>Hello</b> <i>World!</i> (again, menos HTML)"},
                    {type: "image", value: "http://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/70px-Wikipedia-logo-v2.svg.png"},
                    {type: "youtube", value: "dQw4w9WgXcQ"}
                ],
                answers: []
            },
            actions: []
        },
        
        // Question 3
        {
            question: {
                title: "Legal Crap",
                content: [
                    {type: "text", value: "You must agree to this legal crap to continue."},
                    {type: "text", value: "(This is to test \"continue\" (\"I Agree\") and \"logOut\" (\"I Do Not Agree\")"}
                ],
                answers: [
                    {type: "text", value: "I Agree"},
                    {type: "text", value: "I Do Not Agree"}
                ]
            },
            actions: [
                [{name: "continue"}],
                [{name: "logout"}]
            ]
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
                    var actions = [], i, j, chosenAction, action;
                    for (i = 0; i < currentQuestionIndex - 1; i++) {
                        if (typeof testQuestions[i].chosenAction == "number") {
                            chosenAction = testQuestions[i].chosenAction;
                            for (j = 0; j < testQuestions[i].actions[chosenAction].length; j++) {
                                action = testQuestions[i].actions[chosenAction][j];
                                if (action && action.name && ["continue", "goto", "logout"].indexOf(action.name) == -1) {
                                    actions.push(action);
                                }
                            }
                        }
                    }
                    resolve(actions);
                });
            },
            
            getQuestionCount: function () {
                return new Promise(function (resolve, reject) {
                    resolve(testQuestions.length);
                });
            },
            
            getQuestion: function (questionIndex) {
                return new Promise(function (resolve, reject) {
                    currentQuestionIndex = questionIndex;
                    resolve(testQuestions[questionIndex - 1].question);
                });
            },
            
            getActions: function (questionIndex, actionIndex) {
                return new Promise(function (resolve, reject) {
                    // Store what the user chose (so we can access it later using getPreviousActions)
                    testQuestions[questionIndex - 1].chosenAction = actionIndex;
                    resolve(testQuestions[questionIndex - 1].actions[actionIndex]);
                });
            }
        }
    };
})();
