var sergis = {
    error: function () {
        if (typeof console == "undefined") window.console = {};
        if (typeof console.error != "function") console.error = function () {};
        console.error.apply(console, arguments);
    }
};

sergis.main = {
    adjustContent: function () {
        document.getElementById("sidebar-content").style.top = 
            document.getElementById("sidebar-title").offsetHeight + "px";
        document.getElementById("sidebar-content").style.bottom = 
            document.getElementById("sidebar-footer").offsetHeight + "px";
    },
    
    init: function () {
        sergis.frontend.init(document.getElementById("map-container"),
            -34.397, 150.644, 8).then(null, sergis.error);
    }
};


window.addEventListener("load", function (event) {
    // Set up resizing
    sergis.main.adjustContent();
    window.addEventListener("resize", function (event) {
        sergis.main.adjustContent();
    }, false);
    
    // Initialize content
    sergis.main.init();
}, false);
