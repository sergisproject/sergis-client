/*
 * The SerGIS Project - sergis-client
 *
 * This is a SerGIS Client Frontend file for the ArcGIS API.
 * For more on SerGIS Frontends, see:
 * http://sergisproject.github.io/docs/client.html#frontends
 */

// These type definitions are used below in SerGIS's ArcGIS Frontend code.

/**
 * @typedef {object} SerGIS_ArcGIS_DrawStyle
 * @description An object representing style for a drawing using the ArcGIS
 *              frontend. Default values can be seen in the function
 *              `checkDrawStyle`.
 * @see sergis.frontend.actions.draw
 * @see drawObject
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
 * @typedef {object} SerGIS_ArcGIS_Point
 * @description An object representing a map point.
 *
 * @property {number} latitude - The latitude coordinate.
 * @property {number} longitude - The longitude coordinate.
 */

/**
 * @typedef {string} SerGIS_ArcGIS_Unit
 * @description The name of an ArcGIS unit constant (case insensitive).
 * A list of these can be found at:
 * {@link https://developers.arcgis.com/javascript/jsapi/geometryservice-amd.html}
 *
 * Any property or parameter that takes a SerGIS_ArcGIS_Unit is looking for one
 * of those constants WITHOUT THE "UNIT_" in front.
 *
 * Distance units: "foot", "kilometer", "meter", "nautical_mile",
 *     "statute_mile", "us_nautical_mile"
 * Area units: "acres", "ares", "hectacres", "square_centimeters",
 *     "square_decimeters", "square_feet", "square_inches",
 *     "square_kilometers", "square_meters", "square_miles",
 *     "square_millimeters", "square_yards"
 */


// Special SerGIS objects (for JSDoc)
// http://sergisproject.github.io/docs/json.html

/**
 * @typedef SerGISMap
 * @description A SerGIS JSON Map Object.
 * @see {@link http://sergisproject.github.io/docs/json.html#map-object}
 */


// This is all wrapped inside an anonymous, self-executing function to prevent
// variables from leaking into the global scope.
(function () {
    /**
     * Make an event handler for a toolbar "Draw ..." button.
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
     * The ArcGIS-specific toolbar buttons.
     *
     * Each item is an object with the following properties:
     *   - label (SerGISContent): The label of the toolbar button,
     *   - tooltip (string): An optional tooltip for the toolbar button,
     *   - action (function): The action of the toolbar button. Can optionally
     *     return a Promise if the action happens asynchronously.
     *
     * @type {Array.<Object>}
     */
    var toolbarButtons = [
        {
            label: {type: "text", value: "Layers"},
            tooltip: "Turn specific map layers on or off",
            action: function () {
                return new Promise(function (resolve, reject) {
                    // ...
                    resolve();
                });
            }
        },
        {
            label: {type: "text", value: "Measure"},
            tooltip: "Measure a distance on the map",
            action: function () {
                return new Promise(function (resolve, reject) {
                    // ...
                    resolve();
                });
            }
        },
        {
            label: {type: "text", value: "Draw Point"},
            tooltip: "Draw a point on the map",
            action: makeDrawHandler("POINT")
        },
        {
            label: {type: "text", value: "Draw Line"},
            tooltip: "Draw a line on the map",
            action: makeDrawHandler("LINE")
        },
        {
            label: {type: "text", value: "Draw Polyline"},
            tooltip: "Draw a polyline on the map",
            action: makeDrawHandler("POLYLINE")
        },
        {
            label: {type: "text", value: "Draw Polygon"},
            tooltip: "Draw a polygon on the map",
            action: makeDrawHandler("POLYGON")
        },
        {
            label: {type: "text", value: "Reset Map"},
            tooltip: "Remove all custom drawings from the map",
            action: function () {
                // This is a bit hackish, calling stuff from sergis.main
                return sergis.main.reinitMap();
            }
        }
    ];
    
    /** A cache of things that have been "require"d. */
    var api = {};
    /** "global map" */
    var gMap;
    /** "global toolbar" */
    var gToolbar;
    /** "global geometry service" */
    var gSvc;
    
    /**
     * The index of the last geometry item drawn by the user.
     * Corresponds to drawnObjects["userDrawing_" + index].
     */
    var userDrawingIndex = -1;
    
    /**
     * A map of geometry items (points, lines, polygons) that have been drawn
     * through map actions (key is internal ID of what we drew, value is object
     * with `geometry`, `symbol`, and `graphic`).
     */
    var drawnObjects = {};
    
    /**
     * Check a SerGIS_ArcGIS_DrawStyle object and put in default values for
     * missing ones (modifications done in place).
     *
     * @param {SerGIS_ArcGIS_DrawStyle} style - See the corresponding typedef
     *        at the top of this file.
     */
    var checkDrawStyle = function (style) {
        // *** HERE ARE THE DEFAULT STYLE VALUES ***
        if (!style.dotStyle) style.dotStyle = "circle";
        if (!style.dotColor) style.dotColor = [0, 255, 0, 0.25];
        if (!style.lineStyle) style.lineStyle = "Solid";
        if (!style.lineColor) style.lineColor = [255, 0, 0];
        if (!style.lineWidth) style.lineWidth = 2;
        if (!style.fillColor) style.fillColor = [0, 255, 0, 0.25];
        if (!style.fillStyle) style.fillStyle = "solid";
    };
    
    /**
     * Draw some geometry on the map.
     *
     * @param {string} drawnObjectName - The name of the thing to draw (its
     *        data will be stored in drawnObjects[drawnObjectName]).
     * @param geometry - The geometry ("esri/geometry/Geometry") of the object
     *        to draw.
     * @param {SerGIS_ArcGIS_DrawStyle} style - See the corresponding typedef
     *        at the top of this file.
     */
    var drawObject = function (drawnObjectName, geometry, style) {
        var o = (drawnObjects[drawnObjectName] = {});
        o.geometry = geometry;
        // Make the actual map symbol
        switch (o.geometry.type) {
            case "point":
                o.symbol = new api.SimpleMarkerSymbol(
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
                o.symbol = new api.SimpleLineSymbol(
                    api.SimpleLineSymbol["STYLE_" + style.lineStyle.toUpperCase()],
                    new api.Color(style.lineColor),
                    style.lineWidth
                );
                break;
            case "polygon":
                o.symbol = new api.SimpleFillSymbol(
                    api.SimpleFillSymbol.STYLE_NONE,
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
        o.graphic = new api.Graphic(o.geometry, o.symbol);
        gMap.graphics.add(o.graphic);
    };
    
    /**
     * Draw a buffer on the map.
     * (Called by frontend.actions.buffer)
     *
     * @param bufferedGeometries - The buffered geometries.
     */
    var drawBuffer = function (bufferedGeometries) {
        var symbol = new api.SimpleFillSymbol(
            api.SimpleFillSymbol.STYLE_SOLID,
            new api.SimpleLineSymbol(api.SimpleLineSymbol.STYLE_SOLID, new api.Color([255,0,0,0.65]), 2),
            new api.Color([255, 0, 0, 0.35])
        );
        
        for (var graphic, i = 0; i < bufferedGeometries.length; i++) {
            graphic = new api.Graphic(bufferedGeometries[i], symbol);
            gMap.graphics.add(graphic);
        }
    };
    
    /**
     * Initialize (or re-initialize) the map.
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
                zoom: map.zoom
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
                gToolbar.on("draw-end", function (event) {
                    var index = ++userDrawingIndex;
                    // Draw the object on the map
                    var style = {};
                    checkDrawStyle(style);
                    drawObject("userDrawing_" + index, event.geometry, style);
                    // Deactivate the drawing and put the zoom slider back
                    gToolbar.deactivate();
                    gMap.showZoomSlider();
                });
                
                resolve();
            });
        });
    };
    
    /**
     * A map of ArcGIS code names for different parts of the API, mapped to the
     * name we use when loading them into `api`.
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
        
        "esri/toolbars/draw": "Draw",
        
        "esri/symbols/SimpleMarkerSymbol": "SimpleMarkerSymbol",
        "esri/symbols/SimpleLineSymbol": "SimpleLineSymbol",
        "esri/symbols/SimpleFillSymbol": "SimpleFillSymbol"
    };
    
    /**
     * Require all the stuff that we'll need, if we haven't already.
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
             * @param {string} type - The type of object to draw; one of:
             *        "point" (draws a single point for each item in `points`),
             *        "line" or "polyline" (draws a line from `points`),
             *        "polygon" (draws an enclosed polygon from `points`).
             *
             * @param {array.<SerGIS_ArcGIS_Point>} points - An array of 2 or
             *        more map points. See the SerGIS_ArcGIS_Point typedef at
             *        the top of this file.
             *
             * @param {SerGIS_ArcGIS_DrawStyle} [style] - See the corresponding
             *        typedef at the top of this file.
             *
             * @return {Promise}
             */
            draw: function (objectName, type, points, style) {
                return new Promise(function (resolve, reject) {
                    if (typeof objectName != "string" ||
                        objectName.substring(0, 11) == "userDrawing" ||
                        drawnObjects[objectName]) {
                        
                        reject("Invalid objectName!");
                    } else {
                        // Add in default values for missing style stuff
                        if (!style) style = {};
                        checkDrawStyle(style);
                        // Make the thing
                        if (type == "point") {
                            drawObject(objectName, new api.Point(points[0].longitude, points[0].latitude), style);
                        } else {
                            if (type == "polygon") {
                                // Make sure first and last points are the same
                                if (points[0] != points[points.length - 1]) {
                                    points.push(points[0]);
                                }
                            }
                            // Convert the points to actual Points
                            var pointObjects = [];
                            for (var i = 0; i < points.length; i++) {
                                //pointObjects.push(new api.Point(points[i].longitude, points[i].latitude));
                                pointObjects.push([points[i].longitude, points[i].latitude]);
                            }
                            // Make the geometry
                            var geometry;
                            if (type == "polygon") {
                                geometry = new api.Polygon(pointObjects);
                            } else {
                                geometry = new api.Polyline(pointObjects);
                            }
                            // Draw the geometry
                            drawObject(objectName, geometry, style);
                        }
                        resolve();
                    }
                });
            },
            
            // Actions that the old serious game could do: buffer, intersect, clip, union, multibuffer
            
            /**
             * Draw a buffer on the map around data.
             *
             * @param {number} distance - The size of the buffer.
             * @param {SerGIS_ArcGIS_Unit} unit - The unit that the size is in.
             * @param {string} [objectName] - The name of something that was
             *        previously drawn (through actions.draw) to buffer. If not
             *        provided, then the last item drawn by the user (using the
             *        toolbar buttons) is used.
             * @param {SerGIS_ArcGIS_DrawStyle} [style] - See the corresponding
             *        typedef at the top of this file.
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
                        if (o.geometry.type == "polygon") {
                            // We're buffering a polygon; simplify it so it is
                            // topologically correct.
                            gSvc.simplify([o.geometry], function (geometries) {
                                params.geometries = geometries;
                                gSvc.buffer(params, function (bufferedGeometries) {
                                    drawBuffer(bufferedGeometries, style);
                                    resolve();
                                });
                            });
                        } else {
                            // Not a polygon
                            params.geometries = [o.geometry];
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
