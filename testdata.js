// This is a SerGIS JSON Game Data file.
// However, since we can't load a JSON file unless running on a real web server (impractical for development),
// we're loading this as an actual JavaScript file, hence the assignment on the line below.
// For a production environment, get rid of these comments and the assignment below, and set the location of this file in lib/backends/local.js.
var SERGIS_JSON_DATA = {
    "jumpingAllowed": true,
    "promptList": [
        {
            "prompt": {
                "title": "Introduction",
                "contents": [
                    {"type": "html", "value": "<b>Hello</b> <i>World!</i>"},
                    {"type": "text", "value": "Note how the choice positions are randomized for this prompt."}
                ],
                "map": {
                    "latitude": 55.6,
                    "longitude": 13,
                    "zoom": 5
                },
                "randomizeChoices": true,
                "choices": [
                    {"type": "html", "value": "Choice <b>NUMBER 1</b>"},
                    {"type": "text", "value": "Choice <2>"},
                    {"type": "image", "value": "http://www.text2image.com/user_images/text2image_R45488_20141117_035359.jpg"}
                ]
            },
            "actionList": [
                {
                    "actions": [
                        {"name": "explain", "data": [
                            {"type": "text", "value": "Good choice!"}
                        ]},
                        {"name": "buffer", "data": []},
                        {"name": "explain", "data": [
                            {"type": "html", "value": "<b><u>Here's another explanation <i>after</i> the Map Action happened!</u></b>"}
                        ]}
                    ],
                    "pointValue": 1
                },
                {
                    "actions": [
                        {"name": "buffer"}
                    ],
                    "pointValue": 2
                }
            ]
        },
        {
            "prompt": {
                "title": "Legal Crap",
                "contents": [
                    {"type": "text", "value": "You must agree to this legal crap to continue."},
                    {"type": "text", "value": "(This is to test \"continue\" (\"I Agree\") and \"logOut\" (\"I Do Not Agree\")"}
                ],
                "map": {
                    "latitude": 30,
                    "longitude": -20,
                    "zoom": 3
                },
                "choices": [
                    {"type": "text", "value": "I Agree"},
                    {"type": "text", "value": "I Disagree"}
                ]
            },
            "actionList": [
                {
                    "actions": [
                        {"name": "continue"}
                    ]
                },
                {
                    "actions": [
                        {"name": "goto", "data": [1]}
                    ]
                }
            ]
        },
        {
            "prompt": {
                "title": "Test Questions",
                "contents": [
                    {"type": "text", "value": "<b>Hello</b> <i>World!</i> (again, menos HTML parsing)"},
                    {"type": "image", "value": "http://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/70px-Wikipedia-logo-v2.svg.png"},
                    {"type": "youtube", "value": "dQw4w9WgXcQ"},
                    {"type": "text", "value": "Note the \"Continue\" button (since we didn't provide any choices and this isn't the last question)"}
                ],
                "map": {
                    "latitude": 55.6,
                    "longitude": 13,
                    "zoom": 5
                }
            }
        },
        {
            "prompt": {
                "title": "Test Questions",
                "contents": [
                    {"type": "text", "value": "<b>Hello</b> <i>World!</i> (again, menos HTML parsing)"},
                    {"type": "image", "value": "http://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/70px-Wikipedia-logo-v2.svg.png"},
                    {"type": "youtube", "value": "dQw4w9WgXcQ"},
                    {"type": "text", "value": "Note the lack of any choice buttons (since we didn't provide any choices and this IS the last question)"}
                ],
                "map": {
                    "latitude": 0,
                    "longitude": 0,
                    "zoom": 2
                }
            }
        }
    ]
}
