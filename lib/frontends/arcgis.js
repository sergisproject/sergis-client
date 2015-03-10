/*
    The SerGIS Project - sergis-client

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

/*
 *
 * This is a SerGIS Client Frontend file for the ArcGIS API.
 * For more on SerGIS Frontends, see:
 * http://sergisproject.github.io/docs/client.html#frontends
 */

/*
 * SerGIS JSON Map Object - frontendInfo for ArcGIS
 * See http://sergisproject.github.io/docs/json.html#map-object
 *
 * "basemap": A string representing the basemap to use. Options are: "streets",
 *            "satellite", "hybrid", "topo", "gray", "oceans", "osm",
 *            "national-geographic"
 *
 * "layers": An array of objects representing toggleable map layers. Each
 *           object is a SerGIS_ArcGIS~Layer (see below). If more than one are
 *           provided, then the user is allowed to switch between the possible
 *           layers.
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
 * @property {string} [group] - A group name to add this layer to. Multiple
 *           SerGIS_ArcGIS~Layer objects can share the same group. This can
 *           later be used by the hideLayer action
 *           (sergis.frontend.actions.hideLayer) to hide the layer(s). (This is
 *           ignored if the layer is for frontendInfo.layers.)
 * @property {array.<string>} urls - The URLs to the layer on an ArcGIS Server
 *           (usually just an array with one item).
 * @property {number} [opacity=1] - The opacity of the layer.
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
            return new Promise(function (resolve, reject) {
                // Since it's the first time, load everything we need from the ArcGIS API
                initRequire().then(function () {
                    // Initialize the map
                    initMap(mapContainer, map).then(function () {
                        // Initialize the geometry service
                        gSvc = new api.GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
                        // Resolve with a list of toolbar buttons
                        resolve(toolbarButtons.map(function (button) {
                            return {
                                label: button.label,
                                tooltip: button.tooltip
                            };
                        }));
                    }, reject).catch(sergis.error);
                }, reject).catch(sergis.error);
            });
        },
        
        reinit: function (mapContainer, map) {
            return new Promise(function (resolve, reject) {
                // Clear out all previous drawing info
                drawnObjects = {};
                // Initialize the map
                resolve(initMap(mapContainer, map));
            });
        },
        
        centerMap: function (map) {
            var promises = [];
            // Check for any other changes that we need to make first
            // (so it can load crap for them while changing the map zoom)
            if (map.frontendInfo && map.frontendInfo.arcgis) {
                // Check basemap
                if (map.frontendInfo.arcgis.basemap) {
                    gMap.setBasemap(map.frontendInfo.arcgis.basemap);
                }
                // Check layers
                if (map.frontendInfo.arcgis.layers && map.frontendInfo.arcgis.layers.length) {
                    // Load the layers
                    promises.push(loadMapLayers(map.frontendInfo.arcgis.layers, true));
                } else {
                    // Make sure the "layers" box is hidden
                    promises.push(loadMapLayers());
                }
            }
            // NOTE: "centerAndZoom" returns a "Deferred" (damn dojo)
            promises.push(gMap.centerAndZoom([map.longitude, map.latitude], map.zoom));
            // Return a Promise that will be resolved when all the above stuff is done
            return Promise.all(promises);
        },
        
        mapContainerResized: function () {
            return new Promise(function (resolve, reject) {
                gMap.resize();
                resolve();
            });
        },
        
        toolbarAction: function (buttonIndex) {
            return new Promise(function (resolve, reject) {
                if (toolbarButtons[buttonIndex]) {
                    resolve(toolbarButtons[buttonIndex].action());
                } else {
                    reject("Invalid buttonIndex!");
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
                        // Make sure the group name is a string
                        layer.group = "" + layer.group;
                        if (!mapLayersFromActions.hasOwnProperty(layer.group)) {
                            mapLayersFromActions[layer.group] = [];
                        }
                        var dynamicLayers = createDynamicMapLayers(layer, true);
                        mapLayersFromActions[layer.group].push({
                            name: layer.name,
                            dynamicLayers: dynamicLayers
                        });
                    }
                    resolve();
                });
            },
            
            /**
             * Hide one or more previously shown layer(s).
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
                if (args.length == 0) args = [undefined];
                return new Promise(function (resolve, reject) {
                    // Go through each argument provided to this function
                    for (var group, a = 0; a < args.length; a++) {
                        group = args[a];
                        // Make sure the group name is a string
                        group = "" + group;
                        if (mapLayersFromActions.hasOwnProperty(group)) {
                            var i, j;
                            for (i = 0; i < mapLayersFromActions[group].length; i++) {
                                for (j = 0; j < mapLayersFromActions[group][i].dynamicLayers.length; j++) {
                                    mapLayersFromActions[group][i].dynamicLayers[j].setVisibility(false);
                                }
                            }
                        }
                    }
                    resolve();
                });
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
                        objectName.substring(0, 11) == "userDrawing" ||
                        drawnObjects[objectName]) {
                        
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
                    if (!objectName) {
                        objectName = "userDrawing_" + userDrawingIndex;
                    }
                    if (drawnObjects[objectName]) {
                        var o = drawnObjects[objectName],
                            params = new api.BufferParameters();
                        params.distances = [distance];
                        params.unit = api.GeometryService["UNIT_" + unit.toUpperCase()];
                        params.outSpatialReference = gMap.spatialReference;
                        // Make style
                        if (!style) style = {};
                        checkDrawStyle(style);
                        if (o.geometries[0].type == "polygon") {
                            // We're buffering a polygon; simplify it so it is
                            // topologically correct.
                            gSvc.simplify(o.geometries, function (geometries) {
                                params.geometries = geometries;
                                gSvc.buffer(params, function (bufferedGeometries) {
                                    drawBuffer(bufferedGeometries, style);
                                    resolve();
                                });
                            });
                        } else {
                            // Not a polygon
                            params.geometries = o.geometries;
                            gSvc.buffer(params, function (bufferedGeometries) {
                                drawBuffer(bufferedGeometries, style);
                                resolve();
                            });
                        }
                    } else {
                        reject("Invalid objectName!");
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
     * Current map layers that the user can choose from. (These are NOT
     * SerGIS_ArcGIS~Layer objects.)
     * @see SerGIS_ArcGIS~loadMapLayers
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     */
    var mapLayers = [];
    
    /**
     * Map layers created from actions.
     * @see sergis.frontend.actions.showLayer
     * @see sergis.frontend.actions.hideLayer
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     */
    mapLayersFromActions = {};
    
    /**
     * The index of the last geometry item drawn by the user.
     * Corresponds to drawnObjects["userDrawing_" + index].
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     */
    var userDrawingIndex = -1;
    
    /**
     * A map of geometry items (points, lines, polygons) that have been drawn
     * through map actions (key is internal ID of what we drew, value is object
     * with 3 arrays: `geometries`, `symbols`, and `graphics`).
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     */
    var drawnObjects = {};
    
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
            label: {type: "text", value: "Find Latitude/Longitude"},
            tooltip: "Draw a point on the map and get its latitude/longitude coordinates",
            action: makeDrawHandler("POINT")
        },
        {
            label: {type: "text", value: "Measure Distance"},
            tooltip: "Draw a line on the map and get its distance",
            action: makeDrawHandler("LINE")
        },
        {
            label: {type: "text", value: "Measure Multi-line Distance"},
            tooltip: "Draw a polyline on the map and get its total distance",
            action: makeDrawHandler("POLYLINE")
        },
        {
            label: {type: "text", value: "Measure Area"},
            tooltip: "Draw a polygon on the map and get its total area",
            action: makeDrawHandler("POLYGON")
        },
        {
            label: {type: "text", value: "Reset Map"},
            tooltip: "Remove all custom drawings from the map",
            action: function () {
                return sergis.main.reinitMap();
            }
        }
    ];
    
    
    /**
     * Make an event handler for a toolbar "Draw ..." button.
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @param {string} type - The name of a constant in esri.toolbars.Draw.
     *
     * @return {function}
     */
    function makeDrawHandler(type) {
        return (function () {
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
        var index = ++userDrawingIndex,
            geometry = event.geometry;
        // Draw the object on the map
        var style = {};
        checkDrawStyle(style);
        drawObjects("userDrawing_" + index, [geometry], style);
        // Deactivate the drawing and put the zoom slider back
        gToolbar.deactivate();
        gMap.showZoomSlider();
        // Depending on the type of drawing, report a status message back to the user
        if (geometry.type == "point") {
            sergis.main.status({
                type: "text",
                value: "Latitude: " + geometry.getLatitude().toFixed(3) + ", Longitude: " + geometry.getLongitude().toFixed(3)
            });
        } else if (geometry.type == "polygon") {
            findArea(geometry);
        } else {
            findLength(geometry);
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
            // TODO: We need to be able to let the user choose the unit.
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
        // TODO: We need to be able to let the user choose the unit.
        params.lengthUnit = api.GeometryService["UNIT_" + unit.toUpperCase()];
        params.geodesic = true;
        params.polylines = [geometry];
        gSvc.lengths(params, function (result) {
            makeUnitStatus(result.lengths[0], unit, geometry);
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
     * @param {string} drawnObjectName - The name of the thing to draw (its
     *        data will be stored in drawnObjects[drawnObjectName]).
     * @param {array} geometries - The geometry object(s)
     *        ("esri/geometry/Geometry") representing the object(s) to draw.
     * @param {SerGIS_ArcGIS~DrawStyle} style - See the corresponding typedef
     *        at the top of this file.
     */
    function drawObjects(drawnObjectName, geometries, style) {
        var o = (drawnObjects[drawnObjectName] = {});
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
     * Draw a buffer on the map.
     * (Called by frontend.actions.buffer)
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @param bufferedGeometries - The buffered geometries.
     * @param {SerGIS_ArcGIS~DrawStyle} style - See the corresponding typedef
     *        at the top of this file.
     */
    function drawBuffer(bufferedGeometries, style) {
        var symbol = new api.SimpleFillSymbol(
            api.SimpleFillSymbol["STYLE_" + style.fillStyle.toUpperCase()],
            new api.SimpleLineSymbol(
                api.SimpleLineSymbol["STYLE_" + style.lineStyle.toUpperCase()],
                new api.Color(style.lineColor),
                2
            ),
            new api.Color(style.fillColor)
        );
        
        for (var graphic, i = 0; i < bufferedGeometries.length; i++) {
            graphic = new api.Graphic(bufferedGeometries[i], symbol);
            gMap.graphics.add(graphic);
        }
    }
    
    /**
     * Load a list of layers for the map (from a SerGIS JSON Map Object's
     * frontendInfo.layers).
     *
     * @param {array} [layers] - The list of layers to load and show. If not
     *        provided, then the "Layers" box is hidden. (See "frontendInfo
     *        for ArcGIS" at the top of this file.)
     * @param {boolean} [addToMap] - Whether to add the layer to the map right
     *        away.
     *
     * @return {Promise.<array>} An array of ArcGISDynamicMapServiceLayer
     *         objects to add to the map (or already added if addToMap==true).
     */
    function loadMapLayers(layers, addToMap) {
        return new Promise(function (resolve, reject) {
            var i, j;
            // Hide all old map layers
            for (i = 0; i < mapLayers.length; i++) {
                for (j = 0; j < mapLayers[i].dynamicLayers.length; j++) {
                    mapLayers[i].dynamicLayers[j].setVisibility(false);
                }
            }
            // Pretend that all of the old never existed
            mapLayers = [];
            // Create the new
            var allDynamicLayers = [];
            if (layers && layers.length) {
                var dynamicLayers;
                for (i = 0; i < layers.length; i++) {
                    // Create the dynamic layers for this layer
                    dynamicLayers = createDynamicMapLayers(layers[i], addToMap, layers.length > 1);
                    // Add them to the array that we return
                    extendArray(allDynamicLayers, dynamicLayers);
                    // Add the layer to mapLayers
                    mapLayers.push({
                        name: layers[i].name,
                        dynamicLayers: dynamicLayers
                    });
                }
                
                // If we have more than one map layer to choose from
                if (mapLayers.length > 1) {
                    // Populate the layer selection popup
                    var container = document.createElement("div");
                    
                    var title = document.createElement("h2");
                    title.textContent = "Map Layers";
                    container.appendChild(title);
                    
                    var form = document.createElement("form");
                    form.addEventListener("submit", function (event) {
                        event.preventDefault();
                    }, false);
                    
                    var div, radio, label, k;
                    for (k = 0; k < mapLayers.length; k++) {
                        radio = document.createElement("input");
                        radio.setAttribute("id", "layerselector" + Math.random());
                        radio.setAttribute("name", "layerselector");
                        radio.setAttribute("type", "radio");
                        radio.addEventListener("click", (function (k) {
                            return (function (event) {
                                // Let's show/hide all the map layers
                                var i, j;
                                // Show this map layer
                                for (i = 0; i < mapLayers[k].dynamicLayers.length; i++) {
                                    mapLayers[k].dynamicLayers[i].setVisibility(true);
                                }
                                // Hide the others
                                for (i = 0; i < mapLayers.length; i++) {
                                    if (i == k) continue;
                                    for (j = 0; j < mapLayers[i].dynamicLayers.length; j++) {
                                        mapLayers[i].dynamicLayers[j].setVisibility(false);
                                    }
                                }
                            });
                        })(k), false);
                        
                        label = document.createElement("label");
                        label.setAttribute("for", radio.getAttribute("id"));
                        label.textContent = mapLayers[k].name;
                        
                        div = document.createElement("div");
                        div.appendChild(radio);
                        div.appendChild(label);
                        
                        form.appendChild(div);
                    }
                    
                    container.appendChild(form);
                    sergis.main.showPopupContent(container);
                } else {
                    // Only one layer; hide the layer selection popup
                    sergis.main.showPopupContent();
                }
            } else {
                // No layers; hide the layer selection popup
                sergis.main.showPopupContent();
            }
            resolve(allDynamicLayers);
        });
    }
    
    /**
     * Create an array of ArcGISDynamicMapServiceLayer from a
     * SerGIS_ArcGIS~Layer object.
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @param {SerGIS_ArcGIS~Layer} layer - The layer info for the layer to
     *        create.
     * @param {boolean} [addToMap] - Whether to add the layer to the map right
     *        away.
     * @param {boolean} [hideWhenAdded] - Whether to hide the layer after
     *        adding it to the map (if `addToMap` is true).
     *
     * @return {Array} Array of ArcGISDynamicMapServiceLayer representing the
     *         layer.
     */
    function createDynamicMapLayers(layer, addToMap, hideWhenAdded) {
        var imageParameters, dynamicLayer, dynamicLayers = [];
        if (layer.urls) {
            for (var i = 0; i < layer.urls.length; i++) {
                imageParameters = new api.ImageParameters();
                imageParameters.format = "jpeg"; //set the image type to PNG24, note default is PNG8.
                dynamicLayer = new api.ArcGISDynamicMapServiceLayer(layer.urls[i], {
                    "opacity": typeof layer.opacity == "number" ? layer.opacity : 1,
                    "imageParameters": imageParameters
                });
                // Push it for storage
                dynamicLayers.push(dynamicLayer);
                if (addToMap) {
                    // Add the layer to the map now
                    gMap.addLayer(dynamicLayer);
                    if (hideWhenAdded) {
                        // Make it invisible (after an extremely start timeout so it starts loading)
                        hideDynamicMapLayer(dynamicLayer);
                    }
                }
            }
        }
        return dynamicLayers;
    }
    
    /**
     * Hide a dynamic map layer after an extremely short timeout (so it starts
     * loading).
     *
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @param dynamicLayer - The ArcGISDynamicMapServiceLayer to hide.
     */
    function hideDynamicMapLayer(dynamicLayer) {
        // Make it invisible (after an extremely start timeout so it starts loading)
        setTimeout(function () {
            dynamicLayer.setVisibility(false);
        }, 20);
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
            
            // Remove info about old map layer stuff
            mapLayers = [];
            mapLayersFromActions = {};
            
            // Get all the map information together
            var info = {
                center: [map.longitude, map.latitude],
                zoom: map.zoom,
                logo: false,
                // Default basemap:
                basemap: "streets"
            };
            // Check for any other changes that we need to make
            var mapLayersPromise;
            if (map.frontendInfo && map.frontendInfo.arcgis) {
                // Check basemap
                if (map.frontendInfo.arcgis.basemap) {
                    info.basemap = map.frontendInfo.arcgis.basemap;
                }
                // Check layers
                if (map.frontendInfo.arcgis.layers && map.frontendInfo.arcgis.layers.length) {
                    mapLayersPromise = loadMapLayers(map.frontendInfo.arcgis.layers);
                }
            }
            // Create the map
            gMap = new api.Map("map-container-ARCGIS_API", info);
            gMap.on("load", function (event) {
                // Initialize the drawing ability
                gToolbar = new api.Draw(gMap);
                gToolbar.on("draw-end", onDrawEnd);
                
                // If we have map layers, add them
                if (mapLayersPromise) {
                    mapLayersPromise.then(function (dynamicLayers) {
                        for (var i = 0; i < dynamicLayers.length; i++) {
                            gMap.addLayer(dynamicLayers[i]);
                            // Make it invisible (after an extremely start timeout so it starts loading)
                            hideDynamicMapLayer(dynamicLayers[i]);
                        }
                        
                        // Finally, we're done
                        resolve();
                    });
                } else {
                    // No map layers; we're done
                    resolve();
                }
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
