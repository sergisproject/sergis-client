// This is a SerGIS JSON Game Data file.
// However, since we can't load a JSON file unless running on a real web server (impractical for development),
// we're loading this as an actual JavaScript file, hence the assignment on the line below.

// NOTE: ArcGIS Basemap options are:
// "streets", "satellite", "hybrid", "topo", "gray", "oceans", "osm", "national-geographic"

// Also, NOTE: Comments aren't technically valid JSON. Make sure to remove all the comments in this file when making it back to JSON.

// For a production environment, get rid of these comments and the assignment below, and set the location of this file in lib/backends/local.js.
var SERGIS_JSON_DATA = {
    "jumpingBackAllowed": true,
    "onJumpBack": "hide",
    "jumpingForwardAllowed": true,
    "showActionsInUserOrder": false,
    
    "promptList": [
        // First prompt:
        {
            // "prompt" is a SerGIS JSON Prompt Object
            "prompt": {
                "title": "Introduction",
                // Each item in the "contents" array is a SerGIS JSON Content Object
                "contents": [
                    {"type": "html", "value": "<b>Hello</b> <i>World!</i>"},
                    {"type": "text", "value": "Note how the choice positions are randomized for this prompt. Also, each choice's content is defined in a different way."},
                    {"type": "html", "value": "Select &quot;Choice <b>NUMBER 1</b>&quot; to see an example of an explanation."}
                ],
                // "map" is a SerGIS JSON Map Object
                "map": {
                    "latitude": 55.6,
                    "longitude": 13,
                    "zoom": 5,
                    "frontendInfo": {
                        "arcgis": {
                            "basemap": "streets"
                        }
                    }
                },
                "randomizeChoices": true,
                // Each item in the "choices" array is a SerGIS JSON Content Object
                "choices": [
                    // First choice:
                    {"type": "html", "value": "Choice <b>NUMBER 1</b>"},
                    // Second choice:
                    {"type": "text", "value": "Choice <2>"},
                    // Third choice:
                    {"type": "image", "value": "http://www.text2image.com/user_images/text2image_R45488_20141117_035359.jpg"}
                ]
            },
            "actionList": [
                // First choice's actions:
                {
                    // Each item in the "actions" array is a SerGIS JSON Action Object
                    "actions": [
                        {
                            "name": "explain",
                            "data": [
                                {"type": "text", "value": "Good choice!"}
                            ]
                        },
                        {
                            "name": "buffer",
                            "frontend": "arcgis",
                            "data": ["first prompt, first choice"]
                        },
                        {
                            "name": "explain",
                            "data": [
                                {"type": "html", "value": "<b><u>Here's another explanation <i>after</i> the Map Action happened!</u></b>"}
                            ]
                        }
                    ],
                    "pointValue": 5
                },
                // Second choice's actions:
                {
                    // Each item in the "actions" array is a SerGIS JSON Action Object
                    "actions": [
                        {
                            "name": "buffer",
                            "frontend": "arcgis",
                            "data": ["first prompt, second choice"]
                        }
                    ],
                    "pointValue": 2
                },
                // Third choice's actions:
                {
                    // Each item in the "actions" array is a SerGIS JSON Action Object
                    "actions": [
                        {
                            "name": "buffer",
                            "frontend": "arcgis",
                            "data": ["first prompt, third choice"]
                        }
                    ],
                    "pointValue": 2
                }
            ]
        },
        // Second prompt:
        {
            // "prompt" is a SerGIS JSON Prompt Object
            "prompt": {
                "title": "Legal Crap",
                // Each item in the "contents" array is a SerGIS JSON Content Object
                "contents": [
                    {"type": "text", "value": "You must agree to this legal crap to continue."},
                    {"type": "text", "value": "(This is to test \"continue\" (\"I Agree\") and \"goto[0]\" (\"I Do Not Agree\")"}
                ],
                // "map" is a SerGIS JSON Map Object
                "map": {
                    "latitude": 30,
                    "longitude": -20,
                    "zoom": 3,
                    "frontendInfo": {
                        "arcgis": {
                            "basemap": "national-geographic"
                        }
                    }
                },
                "choices": [
                    // First choice:
                    {"type": "text", "value": "I Agree"},
                    // Second choice:
                    {"type": "text", "value": "I Disagree"}
                ]
            },
            "actionList": [
                // First choice's actions:
                {
                    // Each item in the "actions" array is a SerGIS JSON Action Object
                    "actions": [
                        {"name": "continue"}
                    ]
                },
                // Second choice's actions:
                {
                    // Each item in the "actions" array is a SerGIS JSON Action Object
                    "actions": [
                        {"name": "goto", "data": [0]}
                    ]
                }
            ]
        },
        // Third prompt:
        {
            // "prompt" is a SerGIS JSON Prompt Object
            "prompt": {
                "title": "Test Questions",
                // Each item in the "contents" array is a SerGIS JSON Content Object
                "contents": [
                    {"type": "text", "value": "<b>Hello</b> <i>World!</i> (again, menos HTML parsing)"},
                    {"type": "image", "value": "http://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/70px-Wikipedia-logo-v2.svg.png"},
                    {"type": "youtube", "value": "dQw4w9WgXcQ"},
                    {"type": "text", "value": "Note the \"Continue\" button (since we didn't provide any choices and this isn't the last question)"}
                ],
                // "map" is a SerGIS JSON Map Object
                "map": {
                    "latitude": 55.6,
                    "longitude": 13,
                    "zoom": 5,
                    "frontendInfo": {
                        "arcgis": {
                            "basemap": "hybrid"
                        }
                    }
                }
            }
        },
        // Fourth prompt:
        {
            // "prompt" is a SerGIS JSON Prompt Object
            "prompt": {
                "title": "Test Questions",
                // Each item in the "contents" array is a SerGIS JSON Content Object
                "contents": [
                    {"type": "text", "value": "<b>Hello</b> <i>World!</i> (again, menos HTML parsing)"},
                    {"type": "image", "value": "http://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/70px-Wikipedia-logo-v2.svg.png"},
                    {"type": "youtube", "value": "dQw4w9WgXcQ"},
                    {"type": "text", "value": "Note the lack of any choice buttons (since we didn't provide any choices and this IS the last question)"}
                ],
                // "map" is a SerGIS JSON Map Object
                "map": {
                    "latitude": 0,
                    "longitude": 0,
                    "zoom": 2,
                    "frontendInfo": {
                        "arcgis": {
                            "basemap": "gray"
                        }
                    }
                }
            }
        }
    ]
}
