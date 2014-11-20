/*
 * The SerGIS Project - sergis-client
 *
 * This is a SerGIS Client Frontend file for the ArcGIS API.
 * For more on SerGIS Frontends, see:
 * http://sergisproject.github.io/docs/client.html#frontends
 */

// These type definitions are used below in SerGIS's ArcGIS Frontend code.

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
     * A map of SerGIS_ArcGIS~Unit items to human-readable unit strings, and the
     * preferred order for showing units in.
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
     * Make an event handler for a toolbar "Draw ..." button.
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @param {string} type - The name of a constant in esri.toolbars.Draw.
     *
     * @return {function}
     */
    var makeDrawHandler = function (type) {
        return (function () {
            gToolbar.activate(esri.toolbars.Draw[type]);
            gMap.hideZoomSlider();
        });
    };
    
    /**
     * Handle when a drawing is done being drawn.
     * @memberof SerGIS_ArcGIS
     * @inner
     */
    var onDrawEnd = function (event) {
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
    };
    
    /**
     * The ArcGIS-specific toolbar buttons.
     *
     * Each item is an object with the following properties:
     *   - label (SerGISContent): The label of the toolbar button,
     *   - tooltip (string): An optional tooltip for the toolbar button,
     *   - action (function): The action of the toolbar button. Can optionally
     *     return a Promise if the action happens asynchronously.
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @type {Array.<Object>}
     */
    var toolbarButtons = [
        {
            label: {type: "text", value: "Draw Point"},
            tooltip: "Draw a point on the map and get its latitude/longitude coordinates",
            action: makeDrawHandler("POINT")
        },
        {
            label: {type: "text", value: "Draw Line"},
            tooltip: "Draw a line on the map and get its distance",
            action: makeDrawHandler("LINE")
        },
        {
            label: {type: "text", value: "Draw Polyline"},
            tooltip: "Draw a polyline on the map and get its total distance",
            action: makeDrawHandler("POLYLINE")
        },
        {
            label: {type: "text", value: "Draw Polygon"},
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
     * Make a status with a dropdown for the length/area unit.
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @param {number} number - The numeric result.
     * @param {SerGIS_ArcGIS~Unit} unit - The unit of the result.
     */
    var makeUnitStatus = function (number, unit, geometry) {
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
    };
    
    /**
     * Find the area of a polygon.
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @param geometry - The polygon.
     * @param {boolean} alreadySimplified - Whether the geometry has already
     *        been simplified.
     */
    var findArea = function (geometry, alreadySimplified) {
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
    };
    
    /**
     * Find the length of a polyline.
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @param geometry - The polyline.
     */
    var findLength = function (geometry) {
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
    };
    
    /**
     * The index of the last geometry item drawn by the user.
     * Corresponds to drawnObjects["userDrawing_" + index].
     * @memberof SerGIS_ArcGIS
     * @inner
     */
    var userDrawingIndex = -1;
    
    /**
     * A map of geometry items (points, lines, polygons) that have been drawn
     * through map actions (key is internal ID of what we drew, value is object
     * with 3 arrays: `geometries`, `symbols`, and `graphics`).
     * @memberof SerGIS_ArcGIS
     * @inner
     */
    var drawnObjects = {};
    
    /**
     * Check a SerGIS_ArcGIS~DrawStyle object and put in default values for
     * missing ones (modifications done in place).
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @param {SerGIS_ArcGIS~DrawStyle} style - See the corresponding typedef
     *        at the top of this file.
     */
    var checkDrawStyle = function (style) {
        // *** HERE ARE THE DEFAULT STYLE VALUES ***
        if (!style.dotStyle) style.dotStyle = "circle";
        if (!style.dotColor) style.dotColor = [0, 255, 0, 0.25];
        if (!style.lineStyle) style.lineStyle = "Solid";
        if (!style.lineColor) style.lineColor = [255, 0, 0];
        if (!style.lineWidth) style.lineWidth = 2;
        if (!style.fillColor) style.fillColor = [255, 0, 0, 0.25];
        if (!style.fillStyle) style.fillStyle = "solid";
    };
    
    /**
     * Draw some geometry on the map.
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
    var drawObjects = function (drawnObjectName, geometries, style) {
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
    };
    
    /**
     * Draw a buffer on the map.
     * (Called by frontend.actions.buffer)
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @param bufferedGeometries - The buffered geometries.
     * @param {SerGIS_ArcGIS~DrawStyle} style - See the corresponding typedef
     *        at the top of this file.
     */
    var drawBuffer = function (bufferedGeometries, style) {
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
    };
    
    /**
     * Initialize (or re-initialize) the map.
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @param {Element} mapContainer - The DOM element to stick the map into.
     * @param {SerGISMap} map - The SerGIS JSON Map object to position the map.
     *
     * @return {Promise}
     */
    var initMap = function (mapContainer, map) {
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
                logo: false
            };
            // Check for any other changes that we need to make
            if (map.frontendInfo && map.frontendInfo.arcgis) {
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
                
                resolve();
            });
        });
    };
    
    /**
     * A map of ArcGIS code names for different parts of the API, mapped to the
     * name we use when loading them into `api`.
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
        
        "esri/toolbars/draw": "Draw",
        
        "esri/symbols/SimpleMarkerSymbol": "SimpleMarkerSymbol",
        "esri/symbols/SimpleLineSymbol": "SimpleLineSymbol",
        "esri/symbols/SimpleFillSymbol": "SimpleFillSymbol"
    };
    
    /**
     * Require all the stuff that we'll need, if we haven't already.
     * @memberof SerGIS_ArcGIS
     * @inner
     *
     * @return {Promise}
     */
    var initRequire = function () {
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
    };
    
    /**
     * Test function that returns a promise and alerts the arguments passed to the
     * function, then resolves the promise.
     * @memberof SerGIS_ArcGIS
     * @inner
     */
    var TEST_FRONTEND_ACTION = function () {
        var args = Array.prototype.slice.call(arguments, 0);
        return new Promise(function (resolve, reject) {
            alert("Doing action with:\n" + JSON.stringify(args));
            resolve();
        });
    }
    
    /**
     * @namespace
     * @see {@link http://sergisproject.github.io/docs/client.html}
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
            return new Promise(function (resolve, reject) {
                // Check for any other changes that we need to make first
                // (so it can load crap for them while changing the map zoom)
                if (map.frontendInfo && map.frontendInfo.arcgis) {
                    if (map.frontendInfo.arcgis.basemap) {
                        gMap.setBasemap(map.frontendInfo.arcgis.basemap);
                    }
                }
                // NOTE: This below looks like it returns a Promise... but it doesn't. It's a "Deferred" (damn dojo)
                gMap.centerAndZoom([map.longitude, map.latitude], map.zoom).then(function () {
                    resolve();
                }, reject);
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
         * @see {@link http://sergisproject.github.io/docs/client.html}
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
})();
