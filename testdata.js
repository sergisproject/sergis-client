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
                "title": "Malmö",
                // Each item in the "contents" array is a SerGIS JSON Content Object
                "contents": [
                    {"type": "text", "value": "Which district should be given priority in an evacuation?"}
                ],
                // "map" is a SerGIS JSON Map Object
                "map": {
                    "latitude": 55.6,
                    "longitude": 13,
                    "zoom": 6,
                    "frontendInfo": {
                        "arcgis": {
                            "basemap": "streets",
                            "layers": [
                                {
                                    "name": "Overcrowding",
                                    "urls": [
                                        "http://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/malmo/Malmo_test/MapServer"
                                        // MALM_Trygghet_levnadsf_tr(a with a circle on top)ngbodd_12_SWE
                                    ]
                                },
                                {
                                    "name": "Illness",
                                    "urls": [
                                        "http://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/malmo/Malmo_test/MapServer"
                                        // MALM_Trygghet_levnadsf_oh(a with 2 dots on top)lsa_02_11_SWE
                                    ]
                                },
                                {
                                    "name": "Injury",
                                    "urls": [
                                        "http://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/malmo/Malmo_test/MapServer"
                                        // MALM_Trygghet_levnadsf_kr(a with 2 dots on top)nkning_12_SWE
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
        }
    ]
}
