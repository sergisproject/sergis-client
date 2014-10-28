/*
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
    
    // whether to allow jumping around
    jumpingAllowed: true,
    
    // whether to start off logged in
    startLoggedIn: false,
    
    // the prompts (questions)
    prompts: [
        // Prompt/Question 1
        {
            prompt: {
                title: "Introduction",
                content: [
                    {type: "html", value: "<b>Hello</b> <i>World!</i>"}
                ],
                map: {
                    latitude: -34.397,
                    longitude: 150.644,
                    zoom: 8
                },
                choices: [
                    {type: "html", value: "Choice <b>NUMBER 1</b>"},
                    {type: "text", value: "Choice <2>"}
                ]
            },
            actions: [
                [{name: "buffer", data: []}],
                [{name: "buffer"}]
            ]
        },
        
        // Prompt/Question 2
        {
            prompt: {
                title: "Introduction",
                content: [
                    {type: "text", value: "<b>Hello</b> <i>World!</i> (again, menos HTML)"},
                    {type: "image", value: "http://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/70px-Wikipedia-logo-v2.svg.png"},
                    {type: "youtube", value: "dQw4w9WgXcQ"}
                ],
                choices: []
            },
            actions: []
        },
        
        // Prompt/Question 3
        {
            prompt: {
                title: "Legal Crap",
                content: [
                    {type: "text", value: "You must agree to this legal crap to continue."},
                    {type: "text", value: "(This is to test \"continue\" (\"I Agree\") and \"logOut\" (\"I Do Not Agree\")"}
                ],
                choices: [
                    {type: "text", value: "I Agree"},
                    {type: "text", value: "I Do Not Agree"}
                ]
            },
            actions: [
                [{name: "continue"}],
                [{name: "logout"}]
            ]
        }
    ]
};

// This is wrapped inside an anonymous, self-executing function to prevent
// variables from leaking into the global scope.
(function () {
    var isLoggedIn = testdata.startLoggedIn;
    var currentPromptIndex;
    
    sergis.backend = {
        account: {
            logIn: function (username, password) {
                return new Promise(function (resolve, reject) {
                    if (username == testdata.username && password == testdata.password) {
                        isLoggedIn = true;
                        resolve({
                            displayName: testdata.displayName,
                            promptIndex: testdata.promptIndex || undefined
                        });
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
                        resolve({
                            displayName: testdata.displayName,
                            promptIndex: testdata.promptIndex || undefined
                        });
                    } else {
                        reject("Not logged in.");
                    }
                });
            }
        },
        
        game: {
            isJumpingAllowed: function () {
                return new Promise(function (resolve, reject) {
                    resolve(testdata.jumpingAllowed);
                });
            },
            
            getPreviousActions: function () {
                return new Promise(function (resolve, reject) {
                    var actions = [], i, j, chosen, action;
                    for (i = 0; i < currentPromptIndex - 1; i++) {
                        if (typeof testdata.prompts[i].chosen == "number") {
                            chosen = testdata.prompts[i].chosen;
                            for (j = 0; j < testdata.prompts[i].actions[chosen].length; j++) {
                                action = testdata.prompts[i].actions[chosen][j];
                                if (action && action.name && ["continue", "goto", "logout"].indexOf(action.name) == -1) {
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
                    resolve(testdata.prompts.length);
                });
            },
            
            getPrompt: function (promptIndex) {
                return new Promise(function (resolve, reject) {
                    currentPromptIndex = promptIndex;
                    resolve(testdata.prompts[promptIndex - 1].prompt);
                });
            },
            
            getActions: function (promptIndex, choiceIndex) {
                return new Promise(function (resolve, reject) {
                    // Store the user's choice (so we can access it later using getPreviousActions)
                    testdata.prompts[promptIndex - 1].chosen = choiceIndex;
                    resolve(testdata.prompts[promptIndex - 1].actions[choiceIndex]);
                });
            }
        }
    };
})();
