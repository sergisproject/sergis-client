// This is a SerGIS JSON Game Data file.
// See http://sergisproject.github.io/docs/json.html


/*
NOTE:
 - Since we can't load a JSON file unless running on a real web server (impractical for development),
   we're loading this as an actual JavaScript file, hence the assignment to SERGIS_JSON_DATA on the line below.

 - Comments (like these) technically are NOT valid JSON. Make sure to remove all the comments in this file when converting back to JSON.
*/


/*
ARCGIS NOTES:
 - ArcGIS Basemap options are:
   "streets", "satellite", "hybrid", "topo", "gray", "oceans", "osm", "national-geographic"
*/


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
                "title": "Malmö",
                // Each item in the "contents" array is a SerGIS JSON Content Object
                "contents": [
                    {"type": "text", "value": "Which district should be given priority in an evacuation?"}
                ],
                // "map" is a SerGIS JSON Map Object
                "map": {
                    "latitude": 55.6,
                    "longitude": 13,
                    "zoom": 10,
                    "frontendInfo": {
                        "arcgis": {
                            "basemap": "streets",
                            // Providing one layer will show only that layer.
                            // Providing multiple layers will allow the user to choose between them, with none being visible by default.
                            "layers": [
                                {
                                    "name": "Overcrowding",
                                    "opacity": 0.9,
                                    "urls": [
                                        "http://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/malmo/MALM_Trygghet_levnadsf_trangbodd_12_SWE/MapServer"
                                        // MALM_Trygghet_levnadsf_trångbodd_12_SWE
                                    ]
                                },
                                {
                                    "name": "Illness",
                                    "opacity": 0.9,
                                    "urls": [
                                        "http://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/malmo/MALM_Trygghet_levnadsf_ohalsa_02_11_SWE/MapServer"
                                        // MALM_Trygghet_levnadsf_ohälsa_02_11_SWE
                                    ]
                                },
                                {
                                    "name": "Injury",
                                    "opacity": 0.8,
                                    "urls": [
                                        "http://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/malmo/Malmo_test/MapServer"
                                        // MALM_Trygghet_levnadsf_kränkning_12_SWE
                                    ]
                                },
                            ]
                        }
                    }
                },
                "randomizeChoices": true,
                // Each item in the "choices" array is a SerGIS JSON Content Object
                "choices": [
                    {"type": "text", "value": "Väster"},
                    {"type": "text", "value": "Innerstaden"},
                    {"type": "text", "value": "Norr"},
                    {"type": "text", "value": "Söder"},
                    {"type": "text", "value": "Öster"}
                ]
            },
            "actionList": [
                {
                    // Each item in the "actions" array is a SerGIS JSON Action Object
                    "actions": [
                        {
                            "name": "explain",
                            "data": [
                                {"type": "text", "value": "Good choice!"}
                            ]
                        }
                    ],
                    "pointValue": 2
                },
                {
                    // Each item in the "actions" array is a SerGIS JSON Action Object
                    "actions": [
                        {
                            "name": "explain",
                            "data": [
                                {"type": "text", "value": "Good choice!"}
                            ]
                        }
                    ],
                    "pointValue": 2
                },
                {
                    // Each item in the "actions" array is a SerGIS JSON Action Object
                    "actions": [
                        {
                            "name": "explain",
                            "data": [
                                {"type": "text", "value": "Good choice!"}
                            ]
                        }
                    ],
                    "pointValue": 2
                },
                {
                    // Each item in the "actions" array is a SerGIS JSON Action Object
                    "actions": [
                        {
                            "name": "explain",
                            "data": [
                                {"type": "text", "value": "Good choice!"}
                            ]
                        }
                    ],
                    "pointValue": 2
                },
                {
                    // Each item in the "actions" array is a SerGIS JSON Action Object
                    "actions": [
                        {
                            "name": "explain",
                            "data": [
                                {"type": "text", "value": "Good choice!"}
                            ]
                        }
                    ],
                    "pointValue": 2
                }
            ]
        },
        
        
        
        // All of the following prompts are just for testing; they're not actually related to Malmo.
        
        
        
        // Second prompt:
        {
            // "prompt" is a SerGIS JSON Prompt Object
            "prompt": {
                "title": "Introduction",
                // Each item in the "contents" array is a SerGIS JSON Content Object
                "contents": [
                    {"type": "html", "value": "<b>Hello</b> <i>World!</i>"},
                    {"type": "text", "value": "Note how the choice positions are randomized for this prompt. Also, each choice's content is defined in a different way."},
                    {"type": "html", "value": "Select &quot;Choice <b>NUMBER 1</b>&quot; to see an example of a buffer and an explanation."}
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
        
        // Third prompt:
        {
            // "prompt" is a SerGIS JSON Prompt Object
            "prompt": {
                "title": "Legal Crap Test",
                // Each item in the "contents" array is a SerGIS JSON Content Object
                "contents": [
                    {"type": "text", "value": "You must agree to this legal crap to continue."},
                    {"type": "html", "value": "This is just to show what happens if...<br>a) no actions are provided (&quot;I Agree&quot;), and<br>b) <code>goto[0]</code> (&quot;I Disagree&quot;)."},
                    {"type": "text", "value": "Clicking \"I Disagree\" will take you back to the first prompt, but note how the response to the second prompt (i.e. the buffer) is now gone. This is due to the \"onJumpBack\": \"hide\" setting in the JSON file. (\"jumpingBackAllowed\", \"onJumpBack\", \"jumpingForwardAllowed\", and \"showActionsInUserOrder\" are settings in the JSON file that give you fine-grained control over how users are able to jump between questions and what happens when they do.)", "style": "font-size: 85%"}
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
        
        // Fourth prompt:
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
