// This is a SerGIS JSON Game Data file.
// See http://sergisproject.github.io/docs/json.html

// Since we can't load a JSON file unless running on a real web server (impractical for development),
// we're loading this as an actual JavaScript file, hence the assignment to SERGIS_JSON_DATA on the line below.

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
                            "basemap": "streets",
                            "layers": [
                                {
                                    "name": "Malmo",
                                    "urls": [
                                        "http://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/malmo/Malmo_test/MapServer"
                                    ]
                                }
                            ]
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
                        // This is an "explain" action
                        {
                            "name": "explain",
                            "data": [
                                {"type": "text", "value": "Good choice! Once you click \"Continue\", a polygon will be drawn and a buffer will be placed around it."}
                            ]
                        },
                        // This is a "draw" action (specific to the "arcgis" frontend)
                        {
                            "name": "draw",
                            "frontend": "arcgis",
                            "data": [
                                "firstPromptDrawing",
                                "polygon",
                                [
                                    {
                                        "latitude": 55.6,
                                        "longitude": 12
                                    },
                                    {
                                        "latitude": 57,
                                        "longitude": 14
                                    },
                                    {
                                        "latitude": 55.6,
                                        "longitude": 15
                                    }
                                ]
                            ]
                        },
                        // This is an "explain" action
                        {
                            "name": "explain",
                            "data": [
                                {"type": "text", "value": "There's a polygon! Next we'll buffer it..."}
                            ]
                        },
                        // This is a "buffer" action (specific to the "arcgis" frontend)
                        {
                            "name": "buffer",
                            "frontend": "arcgis",
                            "data": [
                                50,
                                "statute_mile",
                                "firstPromptDrawing"
                            ]
                        },
                        // This is an "explain" action
                        {
                            "name": "explain",
                            "data": [
                                {"type": "html", "value": "<b><u>Here's another explanation <i>after</i> the Map Action happened!</u></b>"},
                                {"type": "text", "value": "Notice the polygon & the 50-mile buffer..."}
                            ]
                        }
                    ],
                    "pointValue": 5
                },
                // Second choice's actions:
                {
                    // Each item in the "actions" array is a SerGIS JSON Action Object
                    "actions": [],
                    "pointValue": 2
                },
                // Third choice's actions:
                {
                    // Each item in the "actions" array is a SerGIS JSON Action Object
                    "actions": [],
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
                    {"type": "text", "value": "(This is to test if no actions are provided (\"I Agree\") and \"goto[0]\" (\"I Do Not Agree\")"}
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
                    // No actions, so doesn't do anything before going on to the next prompt
                    // (You could provide an empty array, but not providing anything works just as well)
                    // (Just make sure that there's an empty object here to hold the place in actionList)
                    //"actions": []
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
                    {"type": "text", "value": "<b>Hello</b> <i>World!</i> (menos HTML parsing)"},
                    {"type": "html", "value": "<b>Hello</b> <i>World!</i> (con HTML parsing)"},
                    {"type": "image", "value": "http://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/70px-Wikipedia-logo-v2.svg.png"},
                    {"type": "youtube", "value": "dQw4w9WgXcQ"},
                    {"type": "text", "value": "Note the \"Continue\" button (since we didn't provide any choices)"}
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
        }
    ]
}
