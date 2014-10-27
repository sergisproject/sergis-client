var sergis = {
    /**
     * Report an error to the console and possibly alert the user.
     * Commonly used as the handler for rejected Promises.
     */
    error: function () {
        // No matter what, we better not throw anything
        try {
            if (typeof console == "undefined") window.console = {};
            if (typeof console.error != "function") {
                console.error = console.log || function () {};
            }
            console.error.apply(console, arguments);
            if (arguments.length > 0) {
                if (typeof arguments[0] == "string") {
                    // It's a string; alert the user.
                    alert("Error: " + arguments[0]);
                } else if (arguments[0] instanceof Error) {
                    // We have an Error; alert the user.
                    var err = arguments[0];
                    alert("SerGIS Error: " + err.name + ":\n" + err.message +
                        (err.stack ? "\n\n" + err.stack : ""));
                }
            }
        } catch (err) {}
    }
};

sergis.main = {
    /**
     * The current question.
     */
    questionIndex: null,
    
    /**
     * The total number of questions.
     */
    questionCount: null,
    
    /**
     * Whether jumping around is allowed.
     */
    jumpingAllowed: null,
    
    /**
     * Current map info.
     */
    map: {
        latitude: null,
        longitude: null,
        zoom: null
    },
    
    /**
     * Adjust the height of the sidebar content.
     */
    adjustContent: function () {
        document.getElementById("sidebar-content").style.top = 
            document.getElementById("sidebar-title").offsetHeight + "px";
        document.getElementById("sidebar-content").style.bottom = 
            document.getElementById("sidebar-footer").offsetHeight + "px";
    },
    
    /**
     * Show or hide the loading sign.
     *
     * @param isLoading {boolean} Whether the loading sign should be visible.
     */
    loading: function (isLoading) {
        document.getElementById("loading").style.display = isLoading ? "block" : "none";
    },
    
    /**
     * Initialize SerGIS (onload stuff).
     */
    init: function () {
        // Set up resizing
        window.addEventListener("resize", function (event) {
            sergis.main.adjustContent();
        }, false);
        
        // Set up logout button
        document.getElementById("main-logout").addEventListener("click", function (event) {
            event.preventDefault();
            sergis.main.loading(true);
            sergis.backend.account.logOut().then(function () {
                // Easiest to just refresh
                location.reload();
            }).catch(sergis.error);
        }, false);
        
        // Check if anyone is logged in
        sergis.backend.account.getUser().then(function (displayName) {
            sergis.main.mapsinit(displayName);
        }, function (errmsg) {
            // Probably not logged in; initialize login form
            document.getElementById("login-form").addEventListener("submit", function (event) {
                event.preventDefault();
                // Show loading sign
                sergis.main.loading(true);
                // Check login
                var username = document.getElementById("login-username").value,
                    password = document.getElementById("login-password").value;
                sergis.backend.account.logIn(username, password).then(function (displayName) {
                    // Successful login
                    document.getElementById("login-wrapper").style.display = "none";
                    sergis.main.mapsinit(displayName);
                }, function (errmsg) {
                    // Unsuccessful login
                    document.getElementById("login-password").value = "";
                    document.getElementById("login-errmsg").textContent = errmsg;
                    document.getElementById("login-errmsg").style.display = "block";
                    sergis.main.loading(false);
                    document.getElementById("login-username").focus();
                }).catch(sergis.error);
            }, false);
            document.getElementById("login-wrapper").style.display = "block";
            sergis.main.loading(false);
        }).catch(sergis.error);
    },
    
    /**
     * Initialize the SerGIS maps UI and frontend.
     *
     * @param displayName {string} The user's display name.
     */
    mapsinit: function (displayName) {
        document.getElementById("main-displayName").textContent = displayName;
        // What to do after we have all the metadata we need
        var checkMetadata = function () {
            if (sergis.main.jumpingAllowed !== null && sergis.main.questionCount !== null) {
                // Go to the first question
                sergis.main.go();
            }
        };
        // Get some metadata
        sergis.backend.game.isJumpingAllowed().then(function (jumpingAllowed) {
            sergis.main.jumpingAllowed = jumpingAllowed;
            checkMetadata();
        }).catch(sergis.error);
        sergis.backend.game.getQuestionCount().then(function (questionCount) {
            sergis.main.questionCount = questionCount;
            checkMetadata();
        }).catch(sergis.error);
    },
    
    /**
     * Handle going to a new question.
     *
     * @param questionIndex {number} The question to go to (if it's not the first time).
     */
    go: function (questionIndex) {
        sergis.main.loading(true);
        if (sergis.main.questionIndex === null) {
            // It's the first time!
            sergis.main.questionIndex = 1;
            sergis.backend.game.getQuestion(1).then(function (question) {
                // Get start data
                if (question.map && question.map.latitude && question.map.longitude && question.map.zoom) {
                    sergis.main.map.latitude = question.map.latitude;
                    sergis.main.map.longitude = question.map.longitude;
                    sergis.main.map.zoom = question.map.zoom;
                    // Now that we have the start data, initialize the frontend
                    sergis.frontend.init(
                        document.getElementById("map-container"),
                        question.map.latitude,
                        question.map.longitude,
                        question.map.zoom
                    ).then(function () {
                        // Make map visible; show question content; hide loading sign
                        document.getElementById("main-wrapper").style.display = "block";
                        sergis.main.showQuestion(question, 1);
                        sergis.main.adjustContent();
                        sergis.main.loading(false);
                    }).catch(sergis.error);
                } else {
                    sergis.error("Invalid Question object!");
                }
            }).catch(sergis.error);
        } else {
            sergis.backend.game.getQuestion(questionIndex)
        }
    },
    
    /**
     * Handle showing question data (i.e. title, content, actions; not map).
     *
     * @param question {Question} The question.
     * @param questionIndex {number} The question index (for the title and stuff).
     */
    showQuestion: function (question, questionIndex) {
        document.getElementById("sidebar-title").textContent = questionIndex + ": " + question.title;
        // ...
    }
};


window.addEventListener("load", function (event) {
    sergis.main.init();
}, false);
