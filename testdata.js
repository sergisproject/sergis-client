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
        {
            "prompt": {
                "title": "Introduction",
                "contents": [
                    {"type": "html", "value": "<h3>Welcome to SerGIS!</h3>"},
                    {"type": "text", "value": "SerGIS is a system for \"serious\" GIS games. This example relates to making decisions regarding flooding in Malmö, Sweden."},
                    {"type": "text", "value": "In this example, you can skip around between questions or go back to questions that you have previously answered. However, like the rest of the game, all these properties are configurable."},
                    {"type": "text", "value": "Press \"Continue\" to begin the game."}
                ],
                "map": {
                    "latitude": 47,
                    "longitude": 13,
                    "zoom": 4,
                    "frontendInfo": {
                        "arcgis": {
                            "basemap": "gray"
                        }
                    }
                }
            }
        },
        
        {
            "prompt": {
                "title": "Introduction",
                "contents": [
                    {"type": "text", "value": "You have traveled to Malmö, Sweden to help out after a recent flooding in August. Malmö's public safety responses to floods are notorously slow; the nearby city of Copenagen flooded at the same time and received much quicker warning."},
                    {"type": "image", "value": "http://static.akipress.org/127/.storage/ennews/images/World/a30761d752243f8b9685371572c94350.jpg"},
                    {"type": "text", "value": "Creating a plan of action for the next flood will speed up response, reduce danger, and minimize property damage."}
                ],
                "map": {
                    "latitude": 55.58,
                    "longitude": 13,
                    "zoom": 6,
                    "frontendInfo": {
                        "arcgis": {
                            "basemap": "hybrid"
                        }
                    }
                }
            }
        },
        
        {
            "prompt": {
                "title": "Malmö",
                "contents": [
                    {"type": "text", "value": "Which district should be used as a safe area?"},
                    {"type": "text", "value": "Select different map layers to the left to view them on the map. Use this to aid you in choosing your answer."},
                    {"type": "text", "value": "The districts are labeled by number. These numbers do not correspond to any ranking."}
                ],
                "map": {
                    "latitude": 55.58,
                    "longitude": 13,
                    "zoom": 11,
                    "frontendInfo": {
                        "arcgis": {
                            "basemap": "streets",
                            "layers": [
                                {
                                    "name": "Accidents (by jenks)",
                                    "opacity": 0.83,
                                    "urls": [
                                        "http://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/malmo/accidents_jenks/MapServer"
                                    ]
                                },
                                {
                                    "name": "Accidents (by equal interval)",
                                    "opacity": 0.83,
                                    "urls": [
                                        "http://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/malmo/accidents_equalinterval/MapServer"
                                    ]
                                }
                            ]
                        }
                    }
                },
                "choices": [
                    {"type": "text", "value": "District 1"},
                    {"type": "text", "value": "District 3"},
                    {"type": "text", "value": "District 6"},
                    {"type": "text", "value": "District 10"}
                ]
            },
            "actionList": [
                {
                    "actions": [
                        {
                            "name": "explain",
                            "data": [
                                {"type": "text", "value": "This is an adequate choice because of the ability to use the bridge to Copenhagen for evacuation, but it is too close to the shoreline to be the best option in the case of flooding."},
                                {"type": "text", "value": "A better choice would be District 3, which is further from the shoreline and provides many evacuation routes into the rest of Sweden."}
                            ]
                        }
                    ],
                    "pointValue": 2
                },
                {
                    "actions": [
                        {
                            "name": "explain",
                            "data": [
                                {"type": "text", "value": "This is the best choice because it is the furthest from the shoreline and provides many evacuation routes into the rest of Sweden."}
                            ]
                        }
                    ],
                    "pointValue": 3
                },
                {
                    "actions": [
                        {
                            "name": "explain",
                            "data": [
                                {"type": "text", "value": "This district cuts off evacuation routes and is too close to the shoreline. It is a bad choice."}
                            ]
                        }
                    ],
                    "pointValue": 0
                },
                {
                    "actions": [
                        {
                            "name": "explain",
                            "data": [
                                {"type": "text", "value": "This district cuts off evacuation routes, has a high accident rate, and is part of the inner city, so it is already crowded. Overall, it is not a good choice."}
                            ]
                        }
                    ],
                    "pointValue": 0
                }
            ]
        },
        
        {
            "prompt": {
                "title": "Malmö",
                "contents": [
                    {"type": "text", "value": "Which district should be given priority in an evacuation?"}
                ],
                "map": {
                    "latitude": 55.58,
                    "longitude": 13,
                    "zoom": 11,
                    "frontendInfo": {
                        "arcgis": {
                            "basemap": "streets",
                            "layers": [
                                {
                                    "name": "Accidents (by jenks)",
                                    "opacity": 0.83,
                                    "urls": [
                                        "http://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/malmo/accidents_jenks/MapServer"
                                    ]
                                },
                                {
                                    "name": "Illness (by jenks)",
                                    "opacity": 0.83,
                                    "urls": [
                                        "http://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/malmo/illness_jenks/MapServer"
                                    ]
                                },
                                {
                                    "name": "Accidents (by equal interval)",
                                    "opacity": 0.83,
                                    "urls": [
                                        "http://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/malmo/accidents_equalinterval/MapServer"
                                    ]
                                },
                                {
                                    "name": "Illness (by geometric interval)",
                                    "opacity": 0.83,
                                    "urls": [
                                        "http://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/malmo/illness_geometricinterval/MapServer"
                                    ]
                                }
                            ]
                        }
                    }
                },
                "randomizeChoices": false,
                "choices": [
                    {"type": "text", "value": "District 2"},
                    {"type": "text", "value": "District 5"},
                    {"type": "text", "value": "District 7"},
                    {"type": "text", "value": "District 8"},
                    {"type": "text", "value": "District 9"},
                    {"type": "text", "value": "District 10"}
                ]
            },
            "actionList": [
                {
                    // district 2
                    "actions": [
                        {
                            "name": "explain",
                            "data": [
                                {"type": "text", "value": "Decent choice, but not the best."}
                            ]
                        }
                    ],
                    "pointValue": 1
                },
                {
                    // district 5
                    "actions": [
                        {
                            "name": "explain",
                            "data": [
                                {"type": "text", "value": "Bad choice."}
                            ]
                        }
                    ],
                    "pointValue": 0
                },
                {
                    // district 7
                    "actions": [
                        {
                            "name": "explain",
                            "data": [
                                {"type": "text", "value": "Bad choice."}
                            ]
                        }
                    ],
                    "pointValue": 0
                },
                {
                    // district 8
                    "actions": [
                        {
                            "name": "explain",
                            "data": [
                                {"type": "text", "value": "Good choice!"}
                            ]
                        }
                    ],
                    "pointValue": 3
                },
                {
                    // district 9
                    "actions": [
                        {
                            "name": "explain",
                            "data": [
                                {"type": "text", "value": "Bad choice."}
                            ]
                        }
                    ],
                    "pointValue": 0
                },
                {
                    // district 10
                    "actions": [
                        {
                            "name": "explain",
                            "data": [
                                {"type": "text", "value": "Decent choice, but not the best."}
                            ]
                        }
                    ],
                    "pointValue": 1
                }
            ]
        },
        
        {
            "prompt": {
                "title": "Malmö",
                "contents": [
                    {"type": "text", "value": "Which routes should be used during an evacuation?"}
                ],
                "map": {
                    "frontendInfo": {
                        "arcgis": {
                            "layers": [
                                {
                                    "name": "Bus Routes",
                                    "urls": [
                                        "http://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/malmo/bus_routes/MapServer"
                                    ]
                                },
                                {
                                    "name": "Walking Paths",
                                    "urls": [
                                        "http://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/malmo/walking_paths/MapServer"
                                    ]
                                },
                                {
                                    "name": "City Tunnels",
                                    "urls": [
                                        "http://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/malmo/city_tunnels/MapServer"
                                    ]
                                }
                            ]
                        }
                    }
                },
                "randomizeChoices": false,
                "choices": [
                    {"type": "text", "value": "Bus Routes"},
                    {"type": "text", "value": "Walking Paths"},
                    {"type": "text", "value": "City Tunnels"}
                ]
            },
            "actionList": [
                {
                    "actions": [
                        {
                            "name": "explain",
                            "data": [
                                {"type": "text", "value": "Good choice! This is obviously the best answer."}
                            ]
                        }
                    ],
                    "pointValue": 3
                },
                {
                    "actions": [
                        {
                            "name": "explain",
                            "data": [
                                {"type": "text", "value": "Although this is a viable option, it is not as fast and cannot hold the same volume of people as the bus routes."}
                            ]
                        }
                    ],
                    "pointValue": 1
                },
                {
                    "actions": [
                        {
                            "name": "explain",
                            "data": [
                                {"type": "text", "value": "Bad choice! This is obviously the worst answer. The tunnels are underground, and thus would be flooded."}
                            ]
                        }
                    ],
                    "pointValue": -1
                }
            ]
        },
        
        // All of the following prompts are just for testing; they're not actually related to Malmö.
        
        {
            "prompt": {
                "title": "SerGIS",
                "contents": [
                    {"type": "text", "value": "For now, those are the only questions related to Malmö. The rest of the questions show different features of the SerGIS platform."}
                ]
            }
        },
        
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
        
        {
            // "prompt" is a SerGIS JSON Prompt Object
            "prompt": {
                "title": "SerGIS",
                // Each item in the "contents" array is a SerGIS JSON Content Object
                "contents": [
                    {"type": "html", "value": "This example shows what happens if...<br>a) no actions are provided for a choice in the JSON file (the &quot;I Agree&quot; choice), and<br>b) The action <code>goto[0]</code> (the &quot;I Disagree&quot; choice)."},
                    {"type": "text", "value": "Clicking \"I Disagree\" will take you back to the first non-Malmö prompt, but note how the response to the second non-Malmö prompt (i.e. the buffer) is now gone. This is due to the \"onJumpBack\": \"hide\" setting in the JSON file. (\"jumpingBackAllowed\", \"onJumpBack\", \"jumpingForwardAllowed\", and \"showActionsInUserOrder\" are settings in the JSON file that give you fine-grained control over how users are able to jump between questions and what happens when they do.)", "style": "font-size: 85%"}
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
                        {"name": "goto", "data": [6]}
                    ]
                }
            ]
        },
        
        {
            // "prompt" is a SerGIS JSON Prompt Object
            "prompt": {
                "title": "Test Questions",
                // Each item in the "contents" array is a SerGIS JSON Content Object
                "contents": [
                    {"type": "text", "value": "<b>Hello</b> <i>World!</i> (without HTML parsing)"},
                    {"type": "html", "value": "<b>Hello</b> <i>World!</i> (with HTML parsing)"},
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
