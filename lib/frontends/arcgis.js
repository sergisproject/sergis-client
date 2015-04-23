/*
    The SerGIS Project - sergis-client

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

/*
 * This is a SerGIS Client Frontend file for the ArcGIS API.
 * For more on SerGIS Frontends, see:
 * http://sergisproject.github.io/docs/client.html#frontends
 */

/*
 * SerGIS JSON Map Object - frontendInfo for ArcGIS
 * See http://sergisproject.github.io/docs/json.html#map-object
 *
 * "basemap" (string|Array<string>): A string representing the basemap to use.
 *     Options are: "streets", "satellite", "hybrid", "topo", "gray",
 *         "dark-grey", "oceans", "national-geographic", "terrain", "osm".
 *     If an array is specified with multiple basemaps, then the user will be
 *     allowed to choose between the multiple basemaps.
 *
 * "layers" (Array<SerGIS_ArcGIS~Layer): An array with toggleable map layers.
 *     Each object is a SerGIS_ArcGIS~Layer (see below). If `toggleable` is set
 *     to `false` in the layer, then the layer is shown and the user cannot
 *     hide it. If `toggleable` is unset or set to `true`, then the layer is
 *     hidden by default, but the user may choose to show it.
 *     For more on how layer toggling works with regards to groups, see
 *     SerGIS_ArcGIS~Layer below.
 */



// These type definitions are used below in SerGIS's ArcGIS Frontend code.

/**
 * @typedef {object} SerGIS_ArcGIS~Layer
 * @description An object representing a remote ArcGIS Server map layer.
 * @see SerGIS_ArcGIS~loadMapLayers
 * @see sergis.frontend.actions.showLayer
 * @see sergis.frontend.actions.hideLayer
 *
 * @property {string} name - A name that represents this layer. May be shown to
 *           the user (if this is necessary).
 *
 * @property {string} [group] - A group name to add this layer to. Multiple
 *           SerGIS_ArcGIS~Layer objects can share the same group.
 *           If the layer is being added through the `showLayers` map action,
 *           then this can later be used by the `hideLayers` and `removeLayers`
 *           map actions to hide or remove the layer(s).
 *           If the layer is being added through `layers` in the frontendInfo
 *           (see block comment above), then this property is used to group
 *           layers such that only one from each group can be selected at once.
 *
 * @property {string} [type="dynamic"] - The type of layer. Possible values are:
 *           "dynamic" (an ArcGIS dynamic map service layer),
 *           "tiled" (an ArcGIS tiled map service layer),
 *           "image" (an ArcGIS image service layer),
 *           "feature" (a feature layer)
 *
 * @property {array.<string>} urls - The URLs to the layer on an ArcGIS Server
 *           (usually just an array with one item).
 *
 * @property {number} [opacity=1] - The opacity of the layer.
 *
 * @property {boolean} [toggleable] - Whether the user can toggle the layer
 *           (i.e. turn it on and off). By default, this is false if the layer
 *           is added through the `showLayer` action, and true if the layer is
 *           specified in the prompt's `frontendInfo`.
 */

/**
 * @typedef {object} SerGIS_ArcGIS~DrawStyle
 * @description An object representing style for a drawing using the ArcGIS
 *              frontend. Default values can be seen in the function
 *              `checkDrawStyle`.
 * @see sergis.frontend.actions.draw
 * @see drawObjects
 * @see checkDrawStyle
 *
 * @property {string} dotStyle - "circle", "cross", "diamond", "square", "x"
 *           (case insensitive)
 * @property {array.<number>} dotColor - [red, green, blue, alpha]
 * @property {string} lineStyle - one of "Dash", "DashDot", "DashDotDot",
 *           "LongDash", "LongDashDot", "Null", "ShortDash", "ShortDashDot",
 *           "ShortDashDotDot", "ShortDot", "Solid" (case insensitive)
 * @property {array.<number>} lineColor - [red, green, blue, alpha]
 * @property {number} lineWidth - positive integer
 * @property {array.<number>} fillColor - [red, green, blue, alpha]
 * @property {string} fillStyle - "backward_diagonal", "cross",
 *           "diagonal_cross", "forward_diagonal", "horizontal", "null",
 *           "solid", "vertical" (case insensitive)
 */

/**
 * @typedef {object} SerGIS_ArcGIS~Point
 * @description An object representing a map point.
 *
 * @property {number} latitude - The latitude coordinate.
 * @property {number} longitude - The longitude coordinate.
 */

/**
 * @typedef {string} SerGIS_ArcGIS~Unit
 * @description The name of an ArcGIS unit constant (case insensitive).
 * A list of these can be found at:
 * {@link https://developers.arcgis.com/javascript/jsapi/geometryservice-amd.html}
 *
 * Any property or parameter that takes a SerGIS_ArcGIS~Unit is looking for one
 * of those constants WITHOUT THE "UNIT_" in front.
 *
 * Distance units: "foot", "kilometer", "meter", "nautical_mile",
 *     "statute_mile", "us_nautical_mile"
 * Area units: "acres", "ares", "hectacres", "square_centimeters",
 *     "square_decimeters", "square_feet", "square_inches",
 *     "square_kilometers", "square_meters", "square_miles",
 *     "square_millimeters", "square_yards"
 */


/**
 * This "namespace" is an anonymous, self-executing function (to prevent
 * variables from leaking into the global scope).
 * Therefore, all variables within are inner members of this "namespace".
 * @namespace SerGIS_ArcGIS
 */
(function () {
    /**
     * @namespace
     * @see {@link http://sergisproject.github.io/docs/client.html#frontends}
     */
    sergis.frontend = {
        name: "arcgis",
        
        init: function (mapContainer, map) {
            // Since it's the first time, load everything we need from the ArcGIS API
            return initRequire().then(function () {
                // Initialize the map
                return initMap(mapContainer, map);
            }).then(function () {
                // Initialize the geometry service
                gSvc = new api.GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
                // Resolve with a list of toolbar buttons
                return toolbarButtons;
            });
        },
        
        reinit: function (mapContainer, map) {
            // Clear out all previous drawn object/layer info
            mapItems.reset();
            
            // Initialize the map (returns a Promise)
            return initMap(mapContainer, map);
        },
        
        centerMap: function (map) {
            // Check for any changes that we need to make first
            if (map.frontendInfo && map.frontendInfo.arcgis) {
                // Check basemap
                if (map.frontendInfo.arcgis.basemap) {
                    gMap.setBasemap(map.frontendInfo.arcgis.basemap);
                }
                // Check layers
                if (map.frontendInfo.arcgis.layers && map.frontendInfo.arcgis.layers.length) {
                    // Load the layers and update the layers box
                    loadMapLayers(map.frontendInfo.arcgis.layers);
                } else {
                    // Update the layers box
                    loadMapLayers();
                }
            }
            // NOTE: "centerAndZoom" returns a "Deferred" (damn dojo),
            // but it's thenable, so Promise will figure it out.
            return Promise.resolve(gMap.centerAndZoom([map.longitude, map.latitude], map.zoom));
        },
        
        mapContainerResized: function () {
            return new Promise(function (resolve, reject) {
                gMap.resize();
                resolve();
            });
        },
        
        toolbarButtonAction: function (buttonID) {
            return new Promise(function (resolve, reject) {
                if (toolbarButtonActions[buttonID]) {
                    resolve(toolbarButtonActions[buttonID]());
                } else {
                    reject("Invalid buttonID!");
                }
            });
        },
        
        /**
         * @namespace
         * @see {@link http://sergisproject.github.io/docs/client.html#frontends}
         */
        actions: {
            /**
             * Clear any drawn graphics on the map.
             *
             * @return {Promise}
             */
            clearGraphics: function () {
                return new Promise(function (resolve, reject) {
                    gMap.graphics.clear();
                    // Clear out all previous drawn object info
                    mapItems.reset();
                    resolve();
                });
            },
            
            /**
             * Show one or more remote layer(s).
             *
             * @param {...SerGIS_ArcGIS~Layer} layer - Info about the layer to
             *        display. Can be provided multiple times to show multiple
             *        layers.
             *
             * @return {Promise}
             */
            showLayers: function (/* layer, [layer, [...]] */) {
                var args = arguments;
                return new Promise(function (resolve, reject) {
                    // Go through each argument provided to this function
                    for (var layer, a = 0; a < args.length; a++) {
                        layer = args[a];
                        if (layer) {
                            // Make sure the group name is a string
                            layer.group = "" + (layer.group || "");
                            if (!mapItems.layersFromActions.hasOwnProperty(layer.group)) {
                                mapItems.layersFromActions[layer.group] = [];
                            }
                            var layers = createMapLayers(layer);
                            mapItems.layersFromActions[layer.group].push({
                                name: layer.name,
                                layers: layers,
                                toggleable: !!layer.toggleable,
                                visible: true
                            });
                        }
                    }
                    resolve();
                });
            },
            
            /**
             * Hide one or more previously shown layer(s). (NOTE: If the layer
             * was user-toggleable, then the user can just show it again.)
             *
             * @param {...string} [group] - The name of the layer group,
             *        corresponding to layers previously added using the
             *        `showLayers` action. If no group is specified, then hide
             *        all layers added through `showLayers` that did not have a
             *        group specified.
             *
             * @return {Promise}
             */
            hideLayers: function (/* [group, [group, [...]]] */) {
                var args = arguments;
                // If no arguments are passed, make sure we remove all layers without a group
                if (args.length === 0) args = [undefined];
                return new Promise(function (resolve, reject) {
                    // Go through each argument provided to this function
                    for (var group, a = 0; a < args.length; a++) {
                        group = args[a];
                        // Make sure the group name is a string
                        group = "" + group;
                        if (mapItems.layersFromActions.hasOwnProperty(group)) {
                            var i, j;
                            for (i = 0; i < mapItems.layersFromActions[group].length; i++) {
                                for (j = 0; j < mapItems.layersFromActions[group][i].layers.length; j++) {
                                    mapItems.layersFromActions[group][i].layers[j].setVisibility(false);
                                }
                            }
                        }
                    }
                    resolve();
                });
            },
            
            /**
             * Hide and remove one or more previously shown layer(s).
             *
             * @param {...string} [group] - The name of the layer group,
             *        corresponding to layers previously added using the
             *        `showLayers` action. If no group is specified, then remove
             *        all layers added through `showLayers` that did not have a
             *        group specified.
             *
             * @return {Promise}
             */
            removeLayers: function (/* [group, [group, [...]]] */) {
                // TODO...
            },
            
            /**
             * Draw a predefined point, line, polyline, or polygon on the map.
             *
             * @param {string} objectName - The name of the object that is
             *        drawn (for later reference). Must not have been used
             *        already, and must not start with "userDrawing".
             *
             * @param {string} type - The type of object(s) to draw; one of:
             *        "point" (draws a single point for each item in `points`),
             *        "line" or "polyline" (draws a line from `points`),
             *        "polygon" (draws an enclosed polygon from `points`).
             *
             * @param {SerGIS_ArcGIS~DrawStyle} [style] - See the corresponding
             *        typedef at the top of this file. (If not provided, then
             *        defaults from checkDrawStyle are used.)
             *
             * @param {...array.<SerGIS_ArcGIS~Point>} points - An array of 2
             *        or more map points. See the SerGIS_ArcGIS~Point typedef
             *        at the top of this file. NOTE: This parameter can be
             *        provided multiple times to draw multiple objects (and
             *        group them all under `objectName`; useful for making a
             *        set of data for later buffering or other analysis).
             *
             * @return {Promise}
             */
            draw: function (objectName, type /*, [style], points, [points, [...]] */) {
                var args = arguments;
                return new Promise(function (resolve, reject) {
                    // Where the points start in the argument list
                    var pointsStartPosition = 2;
                    var style = {};
                    if (!Array.isArray(args[2])) {
                        style = args[2];
                        pointsStartPosition = 3;
                    }
                    // Now that that's sorted out, let's get started
                    if (typeof objectName != "string" ||
                        mapItems.objectsFromActions[objectName]) {
                        
                        reject("Invalid objectName!");
                    } else {
                        // Add in default values for missing style stuff
                        if (!style) style = {};
                        checkDrawStyle(style);
                        
                        // Make list of geometries from list of list of points
                        var geometries = [];
                        var points;
                        for (var i = pointsStartPosition; i < args.length; i++) {
                            if (!Array.isArray(args[i])) continue;
                            // Make a shallow copy of the array (so, if we modify it, we don't modify the original passed to us by the user)
                            points = args[i].slice(0);
                            // Make the thing(s)
                            if (type == "point") {
                                geometries.push(new api.Point(points[0].longitude, points[0].latitude));
                            } else {
                                if (type == "polygon") {
                                    // Make sure first and last points are the same
                                    if (points[0] != points[points.length - 1]) {
                                        points.push(points[0]);
                                    }
                                }
                                // Convert the points to actual Points
                                var pointObjects = [];
                                for (var j = 0; j < points.length; j++) {
                                    //pointObjects.push(new api.Point(points[j].longitude, points[j].latitude));
                                    pointObjects.push([points[j].longitude, points[j].latitude]);
                                }
                                // Make the geometry
                                if (type == "polygon") {
                                    geometries.push(new api.Polygon(pointObjects));
                                } else {
                                    geometries.push(new api.Polyline(pointObjects));
                                }
                            }
                        }
                        // Draw the geometries
                        drawObjects(objectName, geometries, style);
                        resolve();
                    }
                });
            },
            
            // Actions that the old serious game could do: buffer, intersect, clip, union, multibuffer
            
            /**
             * Draw a buffer on the map around data.
             *
             * @param {number} distance - The size of the buffer.
             * @param {SerGIS_ArcGIS~Unit} unit - The unit that the size is in.
             * @param {string} [objectName] - The name of something that was
             *        previously drawn (through actions.draw) to buffer. If not
             *        provided, then the last item drawn by the user (using the
             *        toolbar buttons) is used.
             * @param {SerGIS_ArcGIS~DrawStyle} [style] - See the corresponding
             *        typedef at the top of this file. (If not provided, then
             *        defaults from checkDrawStyle are used.)
             *
             * @return {Promise}
             */
            buffer: function (distance, unit, objectName, style) {
                return new Promise(function (resolve, reject) {
                    if (objectName) {
                        if (mapItems.objectsFromActions[objectName]) {
                            // Draw the buffer around this object
                            resolve(drawBuffer(mapItems.objectsFromActions[objectName].geometries,
                                               distance,
                                               unit,
                                               style));
                        } else {
                            reject("Invalid objectName!");
                        }
                    } else {
                        // See if there's a user-drawn object to buffer...
                        if (mapItems.objectsFromUser.length > 0) {
                            // Buffer the last user-drawn item
                            resolve(drawBuffer(mapItems.objectsFromUser[mapItems.objectsFromUser.length - 1].geometries,
                                               distance,
                                               unit,
                                               style));
                        } else {
                            reject("Nothing to buffer.");
                        }
                    }
                });
            }
        }
    };
    
    
    // All following is support stuff for the functions in sergis.frontend
    
    /**
     * A map of SerGIS_ArcGIS~Unit items to human-readable unit strings, and the
     * preferred order for showing units in.
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     */
    var sergis_units = {
        length: {
            "foot": "feet",
            "kilometer": "kilometers",
            "meter": "meters",
            "nautical_mile": "nautical miles",
            "statute_mile": "miles",
            "us_nautical_mile": "US nautical miles"
        },
        length_order: ["kilometer", "meter", "statute_mile", "nautical_mile", "us_nautical_mile", "foot"],
        length_unit: "kilometer",
        
        area: {
            "acres": "acres",
            "ares": "ares",
            "hectacres": "hectacres",
            "square_centimeters": "square centimeters",
            "square_decimeters": "square decimeters",
            "square_feet": "square feet",
            "square_inches": "square inches",
            "square_kilometers": "square kilometers",
            "square_meters": "square meters",
            "square_miles": "square miles",
            "square_millimeters": "square millimeters",
            "square_yards": "square yards"
        },
        area_order: ["square_kilometers", "square_meters", "acres", "ares", "hectacres", "square_miles", "square_yards", "square_feet", "square_inches", "square_decimeters", "square_centimeters", "square_millimeters"],
        area_unit: "square_kilometers"
    };
    
    /**
     * A cache of things that have been "require"d.
     * @memberof SerGIS_ArcGIS
     * @inner
     */
    var api = {};
    
    /**
     * "global map"
     * @memberof SerGIS_ArcGIS
     * @inner
     */
    var gMap;
    
    /** 
     * "global toolbar"
     * @memberof SerGIS_ArcGIS
     * @inner
     */
    var gToolbar;
    
    /**
     * "global geometry service"
     * @memberof SerGIS_ArcGIS
     * @inner
     */
    var gSvc;
    
    /**
     * Layers and objects drawn on the map.
     *
     * @memebrof SerGIS_ArcGIS
     * @inner
     */
    var mapItems = {
        /**
         * Map layers created from actions, organized by group.
         * @see sergis.frontend.actions.showLayer
         * @see sergis.frontend.actions.hideLayer
         */
        layersFromActions: {},
        
        /**
         * Map layers that go with the current prompt, organized by group.
         * @see SerGIS_ArcGIS~loadMapLayers
         */
        layersFromPrompt: {},
        
        /**
         * A list of geometry items (points, lines, polygons) that have been
         * drawn through map actions, organized by object name.
         * Each value is an object with 3 arrays: `geometries`, `symbols`, and
         * `graphics`.
         */
        objectsFromActions: {},
        
        /**
         * A list of geometry items, such as buffers, that have been created
         * through map actions.
         * Each value is an object with 3 arrays: `geometries`, `symbols`, and
         * `graphics`.
         */
        graphicsFromActions: [],
        
        /**
         * A list of geometry items (points, lines, polygons) that have been
         * drawn by the user.
         * Each value is an object with 3 arrays: `geometries`, `symbols`, and
         * `graphics`.
         */
        objectsFromUser: [],
        
        /**
         * Reset all these to their defaults.
         *
         * @param {string} [prop] - A specific property to reset. If not
         *        specified, then all are reset.
         */
        reset: function (prop) {
            if (!prop || prop == "layersFromActions")
                mapItems.layersFromActions = {};
            if (!prop || prop == "layersFromPrompt")
                mapItems.layersFromPrompt = {};
            if (!prop || prop == "objectsFromActions")
                mapItems.objectsFromActions = {};
            if (!prop || prop == "graphicsFromActions")
                mapItems.graphicsFromActions = [];
            if (!prop || prop == "objectsFromUser")
                mapItems.objectsFromUser = [];
        }
    };
    
    /**
     * The ArcGIS-specific toolbar buttons.
     *
     * Each item is an object with the following properties:
     *   - label (SerGISContent): The label of the toolbar button,
     *   - tooltip (string): An optional tooltip for the toolbar button,
     *   - action (function): The action of the toolbar button. Can optionally
     *     return a Promise if the action happens asynchronously.
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @type {Array.<Object>}
     */
    var toolbarButtons = [
        {
            id: "drawPoint",
            label: {type: "text", value: "Find Lat/Long"},
            tooltip: "Draw a point on the map and get its latitude and longitude coordinates"
        },
        /*
        {
            id: "drawLine",
            label: {type: "text", value: "Measure Distance"},
            tooltip: "Draw a line on the map and get its distance"
        },
        */
        {
            id: "drawPolyline",
            label: {type: "text", value: "Measure Distance"},
            tooltip: "Draw one or more lines on the map and get the total distance"
        },
        {
            id: "drawPolygon",
            label: {type: "text", value: "Measure Area"},
            tooltip: "Draw a polygon on the map and get its total area"
        },
        /*
        {
            id: "findPath",
            label: {type: "text", value: "Find Path"},
            tooltip: "Find the shortest path between 2 points using the currently selected layer."
        },
        */
        {
            id: "resetMap",
            label: {type: "text", value: "Reset Map"},
            tooltip: "Remove all custom drawings from the map"
        }
    ];
    
    /**
     * The actions for each ArcGIS-specific toolbar button.
     *
     * Each item should be a function that will be called when the button is
     * clicked. It can optionally return a Promise if the action occurs
     * asynchronously.
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @type {Object.<string, Function>}
     */
    var toolbarButtonActions = {
        drawPoint: makeDrawHandler("POINT", function (geometry) {
            sergis.main.status({
                type: "text",
                value: "Latitude: " + geometry.getLatitude().toFixed(3) + ", Longitude: " + geometry.getLongitude().toFixed(3)
            });
        }),
        /*
        drawLine: makeDrawHandler("LINE", function (geometry) {
            findLength(geometry);
        }),
        */
        drawPolyline: makeDrawHandler("POLYLINE", function (geometry) {
            findLength(geometry);
        }),
        drawPolygon: makeDrawHandler("POLYGON", function (geometry) {
            findArea(geometry);
        }),
        findPath: makeDrawHandler("POINT", function (geometry1) {
            // Execute this right away (to draw another point)
            makeDrawHandler("POINT", function (geometry2) {
                findPath(geometry1, geometry2);
            })();
        }),
        resetMap: function () {
            return sergis.main.reinitMap();
        }
    };
    
    /**
     * The function to call after the next draw handler is complete.
     * @see SerGIS_ArcGIS~makeDrawHandler
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @type {Function}
     */
    var _drawEndHandler = null;
    
    
    /**
     * Make an event handler for a toolbar "Draw ..." button.
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @param {string} type - The name of a constant in esri.toolbars.Draw.
     * @param {Function} drawEndHandler - What to do when the user finishes
     *        drawing. Called with the geometry item drawn.
     *
     * @return {function}
     */
    function makeDrawHandler(type, drawEndHandler) {
        return (function () {
            _drawEndHandler = drawEndHandler;
            gToolbar.activate(esri.toolbars.Draw[type]);
            gMap.hideZoomSlider();
        });
    }
    
    /**
     * Handle when a drawing is done being drawn.
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     */
    function onDrawEnd(event) {
        var geometry = event.geometry;
        // Draw the object on the map
        var style = {};
        checkDrawStyle(style);
        drawObjects(null, [geometry], style);
        // Deactivate the drawing and put the zoom slider back
        gToolbar.deactivate();
        gMap.showZoomSlider();
        // Continue doing what we wanted to do
        if (typeof _drawEndHandler == "function") {
            _drawEndHandler(geometry);
            _drawEndHandler = null;
        }
    }
    
    /**
     * Make a status with a dropdown for the length/area unit.
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @param {number} number - The numeric result.
     * @param {SerGIS_ArcGIS~Unit} unit - The unit of the result.
     */
    function makeUnitStatus(number, unit, geometry) {
        var span = document.createElement("span");
        unit = unit.toLowerCase();
        var type;
        if (sergis_units.area_order.indexOf(unit) != -1) {
            type = "area";
            span.appendChild(document.createTextNode("Area: " + number.toLocaleString() + " "));
        } else {
            type = "length";
            span.appendChild(document.createTextNode("Distance: " + number.toLocaleString() + " "));
        }
        
        // Make <select> to switch units
        var select = document.createElement("select"),
            option, human;
        for (var i = 0; i < sergis_units[type + "_order"].length; i++) {
            human = sergis_units[type][sergis_units[type + "_order"][i]];
            option = document.createElement("option");
            option.setAttribute("value", sergis_units[type + "_order"][i]);
            if (sergis_units[type + "_order"][i] == unit) {
                option.setAttribute("selected", "selected");
            }
            option.appendChild(document.createTextNode(human));
            select.appendChild(option);
        }
        span.appendChild(select);
        select.addEventListener("change", function (event) {
            if (type == "area") {
                sergis_units.area_unit = this.value;
                findArea(geometry, true);
            } else {
                sergis_units.length_unit = this.value;
                findLength(geometry);
            }
        }, false);
        
        sergis.main.status(span);
    }
    
    /**
     * Helper function to execute something for each item in each group
     * (provided an object of group names to arrays).
     * NOTE: Any "groupless" elements (i.e. in obj[""]) will be sent back first.
     *
     * @param {...Object.<*, Array>} obj - One or more objects containing
     *        arrays to iterate over.
     * @param {Function} callback - A function to call for each item. The
     *        function is called with these 4 parameters:
     *            the group name,
     *            the array item,
     *            the index of the object in the arguments that it's from,
     *            the index of the array item.
     *        If the function returns `false`, the loop is broken.
     */
    function forEachItemInGroup() {
        // Find the arguments
        var objects = [], callback;
        var prop, obj, i, j;
        
        for (i = 0; i < arguments.length; i++) {
            if (typeof arguments[i] == "function") {
                // It's the callback
                callback = arguments[i];
                break;
            } else {
                // Not the callback
                objects.push(arguments[i]);
            }
        }
        
        // Check if obj[""] is a thing, and process it first
        for (i = 0; i < objects.length; i++) {
            obj = objects[i];
            if (obj[""] && obj[""].length) {
                for (j = 0; j < obj[""].length; j++) {
                    // Execute the callback and check its return value
                    if (callback("", obj[""][j], i, j) === false) {
                        // We're done
                        return;
                    }
                }
            }
        }
        
        // Process all the other properties in each object
        for (i = 0; i < objects.length; i++) {
            obj = objects[i];
            for (prop in obj) {
                if (obj.hasOwnProperty(prop) && prop != "") {
                    if (obj[prop] && obj[prop].length) {
                        for (j = 0; j < obj[prop].length; j++) {
                            // Execute the callback and check its return value
                            if (callback(prop, obj[prop][j], i, j) === false) {
                                // We're done
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Find the area of a polygon.
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @param geometry - The polygon.
     * @param {boolean} alreadySimplified - Whether the geometry has already
     *        been simplified.
     */
    function findArea(geometry, alreadySimplified) {
        var unit = sergis_units.area_unit;
        var after_simplification = function (simplifiedGeometries) {
            // Set up the parameters for the area operation
            var params = new api.AreasAndLengthsParameters();
            params.areaUnit = api.GeometryService["UNIT_" + unit.toUpperCase()];
            // "planar", "geodesic", "preserveShape"
            params.calculationType = "geodesic";
            params.polygons = simplifiedGeometries;
            gSvc.areasAndLengths(params, function (result) {
                makeUnitStatus(result.areas[0], unit, geometry);
            });
        };
        if (alreadySimplified) {
            after_simplification([geometry]);
        } else {
            gSvc.simplify([geometry], function (simplifiedGeometries) {
                after_simplification(simplifiedGeometries);
            });
        }
    }
    
    /**
     * Find the length of a polyline.
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @param geometry - The polyline.
     */
    function findLength(geometry) {
        var unit = sergis_units.length_unit;
        // Set up the parameters for the length operation
        var params = new api.LengthsParameters();
        params.lengthUnit = api.GeometryService["UNIT_" + unit.toUpperCase()];
        params.geodesic = true;
        params.polylines = [geometry];
        gSvc.lengths(params, function (result) {
            makeUnitStatus(result.lengths[0], unit, geometry);
        });
    }
    
    /**
     * Find the shortest path between 2 points.
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @param startGeometry - The start point.
     * @param endGeometry - The end point.
     */
    function findPath(startGeometry, endGeometry) {
        
    }
    
    /**
     * Make a buffer around a certain geometry.
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @param {Array} geometries - The array of Geometry objects to buffer.
     * @param {number} distance - The distance to draw the buffer.
     * @param {string} unit - The unit for the distance.
     * @param {SerGIS_ArcGIS~DrawStyle} [style] - The draw style for the buffer.
     *        If not specified, then the defaults in `checkDrawStyle` are used.
     *
     * @return {Promise}
     */
    function drawBuffer(geometries, distance, unit, style) {
        return new Promise(function (resolve, reject) {
            var params = new api.BufferParameters();
            params.distances = [distance];
            params.unit = api.GeometryService["UNIT_" + unit.toUpperCase()];
            params.outSpatialReference = gMap.spatialReference;
            // Make style
            if (!style) style = {};
            checkDrawStyle(style);
            if (geometries[0].type == "polygon") {
                // We're buffering a polygon; simplify it so it is topologically correct.
                gSvc.simplify(geometries, function (newGeometries) {
                    params.geometries = newGeometries;
                    gSvc.buffer(params, function (bufferedGeometries) {
                        resolve(bufferedGeometries);
                    });
                });
            } else {
                // Not a polygon
                params.geometries = geometries;
                gSvc.buffer(params, function (bufferedGeometries) {
                    resolve(bufferedGeometries);
                });
            }
        }).then(function (bufferedGeometries) {
            var symbol = new api.SimpleFillSymbol(
                api.SimpleFillSymbol["STYLE_" + style.fillStyle.toUpperCase()],
                new api.SimpleLineSymbol(
                    api.SimpleLineSymbol["STYLE_" + style.lineStyle.toUpperCase()],
                    new api.Color(style.lineColor),
                    2
                ),
                new api.Color(style.fillColor)
            );

            var item = {
                geometries: [],
                symbols: [],
                graphics: []
            };
            mapItems.graphicsFromActions.push(item);
            
            var graphic;
            for (var i = 0; i < bufferedGeometries.length; i++) {
                item.geometries.push(bufferedGeometries[i]);
                item.symbols.push(symbol);
                
                graphic = new api.Graphic(bufferedGeometries[i], symbol)
                item.graphics.push(graphic);
                gMap.graphics.add(graphic);
            }
        });
    }
    
    /**
     * Check a SerGIS_ArcGIS~DrawStyle object and put in default values for
     * missing ones (modifications done in place).
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @param {SerGIS_ArcGIS~DrawStyle} style - See the corresponding typedef
     *        at the top of this file.
     */
    function checkDrawStyle(style) {
        // *** HERE ARE THE DEFAULT STYLE VALUES ***
        if (!style.dotStyle) style.dotStyle = "circle";
        if (!style.dotColor) style.dotColor = [0, 255, 0, 0.25];
        if (!style.lineStyle) style.lineStyle = "Solid";
        if (!style.lineColor) style.lineColor = [255, 0, 0];
        if (!style.lineWidth) style.lineWidth = 2;
        if (!style.fillColor) style.fillColor = [255, 0, 0, 0.25];
        if (!style.fillStyle) style.fillStyle = "solid";
    }
    
    /**
     * Draw some geometry on the map.
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @param {string} [drawnObjectName] - A name for the drawing (its data
     *        will be stored in mapItems.objectsFromActions[drawnObjectName]).
     *        If not provided, then the drawing is added to
     *        mapItems.objectsFromUser.
     * @param {array} geometries - The geometry object(s)
     *        ("esri/geometry/Geometry") representing the object(s) to draw.
     * @param {SerGIS_ArcGIS~DrawStyle} style - See the corresponding typedef
     *        at the top of this file.
     */
    function drawObjects(drawnObjectName, geometries, style) {
        var o = {};
        if (drawnObjectName) {
            mapItems.objectsFromActions[drawnObjectName] = o;
        } else {
            mapItems.objectsFromUser.push(o);
        }
        o.geometries = geometries;
        o.symbols = [];
        o.graphics = [];
        // Go through each geometry and add it to the map
        for (var i = 0; i < o.geometries.length; i++) {
            // Make the actual map symbol
            switch (o.geometries[i].type) {
                case "point":
                    o.symbols[i] = new api.SimpleMarkerSymbol(
                        api.SimpleMarkerSymbol["STYLE_" + style.dotStyle.toUpperCase()],
                        10,
                        new api.SimpleLineSymbol(
                            api.SimpleLineSymbol["STYLE_" + style.lineStyle.toUpperCase()],
                            new api.Color(style.lineColor),
                            1
                        ),
                        new api.Color(style.dotColor)
                    );
                    break;
                case "polyline":
                    o.symbols[i] = new api.SimpleLineSymbol(
                        api.SimpleLineSymbol["STYLE_" + style.lineStyle.toUpperCase()],
                        new api.Color(style.lineColor),
                        style.lineWidth
                    );
                    break;
                case "polygon":
                    o.symbols[i] = new api.SimpleFillSymbol(
                        api.SimpleFillSymbol["STYLE_" + style.fillStyle.toUpperCase()],
                        new api.SimpleLineSymbol(
                            api.SimpleLineSymbol["STYLE_" + style.lineStyle.toUpperCase()],
                            new api.Color(style.lineColor),
                            style.lineWidth
                        ),
                        new api.Color(style.fillColor)
                    );
                    break;
            }
            
            // Add the symbol to the map
            o.graphics[i] = new api.Graphic(o.geometries[i], o.symbols[i]);
            gMap.graphics.add(o.graphics[i]);
        }
    }
    
    /**
     * Load a list of prompt-specified layers for the map (from a SerGIS JSON
     * Map Object's frontendInfo.arcgis.layers).
     *
     * @param {array} [layers] - The list of layers to load and show. If not
     *        provided, and there are no other layers, then the "Layers" box is
     *        hidden. (See "frontendInfo for ArcGIS" at the top of this file.)
     */
    function loadMapLayers(layers) {
        // Hide all the old prompt map layers
        forEachItemInGroup(mapItems.layersFromPrompt, function (group, mapLayer) {
            for (var i = 0; i < mapLayer.layers.length; i++) {
                mapLayer.layers[i].setVisibility(false);
            }
        });
        // Pretend that all of the old ones never existed
        mapItems.reset("layersFromPrompt");

        // Create the new prompt map layers
        var haveToggleableLayers = false;

        if (layers && layers.length) {
            var newMapLayers, layer, toggleable;
            for (var i = 0; i < layers.length; i++) {
                if ((layer = layers[i]) && layer.name && layer.urls.length) {
                    // Make sure the layer has a string group
                    layer.group = "" + (layer.group || "");

                    // Is this layer toggleable? (i.e. if layer.toggleable is true or undefined)
                    toggleable = layer.toggleable !== false;
                    if (toggleable) haveToggleableLayers = true;

                    // Create the new layers for this layer (hidden by default if toggleable)
                    newMapLayers = createMapLayers(layer, toggleable);

                    // Add the layer to layersFromPrompt, by its group
                    if (!mapItems.layersFromPrompt[layer.group]) {
                        mapItems.layersFromPrompt[layer.group] = [];
                    }
                    mapItems.layersFromPrompt[layer.group].push({
                        name: layer.name,
                        layers: newMapLayers,
                        toggleable: toggleable,
                        visible: !toggleable
                    });
                }
            }
        }

        // Check if we have ANY toggleable layers (possibly from other layers)
        if (!haveToggleableLayers) {
            // Check other layers (from actions)
            forEachItemInGroup(mapItems.layersFromActions, function (group, mapLayer) {
                if (mapLayer.toggleable) {
                    haveToggleableLayers = true;
                    // break
                    return false;
                }
            });
        }

        if (haveToggleableLayers) {
            // Populate the layer selection popup
            var container = document.createElement("div");
            container.className = "noselect";

            var title = document.createElement("h2");
            title.textContent = "Map Layers";
            container.appendChild(title);

            var form = document.createElement("form");
            form.addEventListener("submit", function (event) {
                event.preventDefault();
            }, false);

            var inputIdHash = "" + Math.random();
            var id = function () {
                return "layer-selector-id-" + inputIdHash + "-" + Array.prototype.join.call(arguments, "-");
            }
            var previousGroup = "";

            forEachItemInGroup(mapItems.layersFromActions, mapItems.layersFromPrompt, function (group, mapLayer, objectIndex, itemIndex) {
                if (!mapLayer.toggleable) return;
                var mapItemsObject = mapItems[objectIndex == 0 ? "layersFromActions" : "layersFromPrompt"];

                var input = document.createElement("input");
                input.setAttribute("id", id(objectIndex, group, itemIndex));

                // If there is a group, then make a radio; otherwise, a checkbox
                if (group) {
                    input.setAttribute("type", "radio");
                    input.setAttribute("name", "layer-selector-" + objectIndex + "-" + group);
                } else {
                    input.setAttribute("type", "checkbox");
                }

                input.addEventListener("click", function (event) {
                    var i, j, vis;
                    // Show/hide map layers based on the state of the radio/check boxes
                    if (group) {
                        // If we were already visible, then the button must have already been checked,
                        // so uncheck it to make us invisible (i.e. so no radio button is checked)
                        if (mapLayer.visible) {
                            this.checked = false;
                        }
                        
                        // Check everyone in our group
                        for (i = 0; i < mapItemsObject[group].length; i++) {
                            vis = mapItemsObject[group][i].visible =
                                document.getElementById(id(objectIndex, group, i)).checked;
                            // Set the visibility of each individual layer
                            for (j = 0; j < mapItemsObject[group][i].layers.length; j++) {
                                mapItemsObject[group][i].layers[j].setVisibility(vis);
                            }
                        }
                    } else {
                        // If there's no group, then we only need to worry about ourselves
                        mapLayer.visible = this.checked;
                        // Set the visibility of each individual layer
                        for (i = 0; i < mapLayer.layers.length; i++) {
                            mapLayer.layers[i].setVisibility(mapLayer.visible);
                        }
                    }
                }, false);

                // Make a label
                var label = document.createElement("label");
                label.setAttribute("for", id(objectIndex, group, itemIndex));
                label.textContent = mapLayer.name;

                var div = document.createElement("div");
                if (group != previousGroup) {
                    div.appendChild(document.createElement("hr"));
                    previousGroup = group;
                }
                div.appendChild(input);
                div.appendChild(label);

                form.appendChild(div);
            });

            container.appendChild(form);
            sergis.main.showPopupContent(container);
        } else {
            // No toggleable layers; hide the layer selection popup
            sergis.main.showPopupContent();
        }
    }
    
    /**
     * Create an array of Map Layers from a SerGIS_ArcGIS~Layer object.
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @param {SerGIS_ArcGIS~Layer} layer - The layer info for the layer to
     *        create.
     * @param {boolean} [hideWhenAdded] - Whether to hide the layer after
     *        adding it to the map.
     *
     * @return {Array} Array of ArcGISDynamicMapServiceLayer objects
     *         representing the layer.
     */
    function createMapLayers(layer, hideWhenAdded) {
        var imageParameters, mapLayer, mapLayers = [];
        if (layer.urls) {
            for (var i = 0; i < layer.urls.length; i++) {
                switch (layer.type) {
                    case "tiled":
                        mapLayer = new api.ArcGISTiledMapServiceLayer(layer.urls[i], {
                            "opacity": typeof layer.opacity == "number" ? layer.opacity : 1
                        });
                        break;
                    case "image":
                        mapLayer = new api.ArcGISImageServiceLayer(layer.urls[i], {
                            "opacity": typeof layer.opacity == "number" ? layer.opacity : 1
                        });
                        break;
                    case "feature":
                        mapLayer = new api.FeatureLayer(layer.urls[i], {
                            "opacity": typeof layer.opacity == "number" ? layer.opacity : 1
                        });
                        break;
                    //case "dynamic":
                    default:
                        imageParameters = new api.ImageParameters();
                        imageParameters.format = "jpeg"; //set the image type to PNG24, note default is PNG8.
                        mapLayer = new api.ArcGISDynamicMapServiceLayer(layer.urls[i], {
                            "opacity": typeof layer.opacity == "number" ? layer.opacity : 1,
                            "imageParameters": imageParameters
                        });
                }
                // Push it for storage
                mapLayers.push(mapLayer);
                // Add the layer to the map now
                gMap.addLayer(mapLayer);
                if (hideWhenAdded) {
                    // Make it invisible (after an extremely start timeout so it starts loading)
                    hideMapLayer(mapLayer);
                }
            }
        }
        return mapLayers;
    }
    
    /**
     * Hide a map layer after an extremely short timeout (so it starts loading).
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @param layer - The ArcGISDynamicMapServiceLayer to hide.
     */
    function hideMapLayer(mapLayer) {
        // Make it invisible (after an extremely start timeout so it starts loading)
        setTimeout(function () {
            if (mapLayer.loaded) {
                // Already loaded
                mapLayer.setVisibility(false);
            } else {
                var visibilityHasBeenSet = false;
                mapLayer.on("visibility-changed", function (event) {
                    visibilityHasBeenSet = true;
                });
                mapLayer.on("load", function (event) {
                    // Only hide it if the visibility hasn't been modified by someone else
                    if (!visibilityHasBeenSet) {
                        mapLayer.setVisibility(false);
                        visibilityHasBeenSet = true;
                    }
                });
            }
        }, 50);
    }
    
    /**
     * Initialize (or re-initialize) the map.
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @param {Element} mapContainer - The DOM element to stick the map into.
     * @param {SerGISMap} map - The SerGIS JSON Map object to position the map.
     *
     * @return {Promise}
     */
    function initMap(mapContainer, map) {
        return new Promise(function (resolve, reject) {
            // Remove all children of mapContainer
            while (mapContainer.firstChild) {
                mapContainer.removeChild(mapContainer.firstChild);
            }
            // Make a sub-container
            var mapElem = document.createElement("div");
            mapElem.id = "map-container-ARCGIS_API";
            mapElem.style.margin = "0";
            mapElem.style.padding = "0";
            mapElem.style.height = "100%";
            mapContainer.appendChild(mapElem);
            
            // Get all the map information together
            var info = {
                center: [map.longitude, map.latitude],
                zoom: map.zoom,
                logo: false,
                // Default basemap:
                basemap: "streets"
            };
            
            // Any frontend info that needs to be checked BEFORE creating the map
            if (map.frontendInfo && map.frontendInfo.arcgis) {
                // Check basemap
                if (map.frontendInfo.arcgis.basemap) {
                    info.basemap = map.frontendInfo.arcgis.basemap;
                }
            }
            
            // Create the map
            gMap = new api.Map("map-container-ARCGIS_API", info);
            gMap.on("load", function (event) {
                // Initialize the drawing ability
                gToolbar = new api.Draw(gMap);
                gToolbar.on("draw-end", onDrawEnd);
                
                // Any frontend info that needs to be checked AFTER creating the map
                if (map.frontendInfo && map.frontendInfo.arcgis &&
                    map.frontendInfo.arcgis.layers && map.frontendInfo.arcgis.layers.length) {
                    // Add map layers
                    loadMapLayers(map.frontendInfo.arcgis.layers);
                } else {
                    // Update the layers popup
                    loadMapLayers();
                }
                
                // We're done!
                resolve();
            });
        });
    }
    
    /**
     * A map of ArcGIS code names for different parts of the API, mapped to the
     * name we use when loading them into `api`.
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     */
    var toBeRequired = {
        "esri/map": "Map",
        "esri/graphic": "Graphic",
        "esri/Color": "Color",
        
        "esri/geometry/Geometry": "Geometry",
        "esri/geometry/Point": "Point",
        "esri/geometry/Multipoint": "Multipoint",
        "esri/geometry/Polygon": "Polygon",
        "esri/geometry/Polyline": "Polyline",
        
        "esri/tasks/GeometryService": "GeometryService",
        "esri/tasks/BufferParameters": "BufferParameters",
        "esri/tasks/AreasAndLengthsParameters": "AreasAndLengthsParameters",
        "esri/tasks/LengthsParameters": "LengthsParameters",
        
        "esri/layers/ArcGISDynamicMapServiceLayer": "ArcGISDynamicMapServiceLayer",
        "esri/layers/ImageParameters": "ImageParameters",
        "esri/layers/ArcGISTiledMapServiceLayer": "ArcGISTiledMapServiceLayer",
        "esri/layers/ArcGISImageServiceLayer": "ArcGISImageServiceLayer",
        "esri/layers/FeatureLayer": "FeatureLayer",
        
        "esri/toolbars/draw": "Draw",
        
        "esri/symbols/SimpleMarkerSymbol": "SimpleMarkerSymbol",
        "esri/symbols/SimpleLineSymbol": "SimpleLineSymbol",
        "esri/symbols/SimpleFillSymbol": "SimpleFillSymbol"
    };
    
    /**
     * Require all the stuff that we'll need, if we haven't already.
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @return {Promise}
     */
    function initRequire() {
        return new Promise(function (resolve, reject) {
            var requireArgs = [],
                requireNames = [];
            for (var prop in toBeRequired) {
                if (toBeRequired.hasOwnProperty(prop) && toBeRequired[prop]) {
                    requireArgs.push(prop);
                    requireNames.push(toBeRequired[prop]);
                    // We don't want to require it more than once
                    delete toBeRequired[prop];
                }
            }
            if (requireArgs.length > 0) {
                require(requireArgs, function () {
                    for (var i = 0; i < arguments.length; i++) {
                        api[requireNames[i]] = arguments[i];
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
})();
