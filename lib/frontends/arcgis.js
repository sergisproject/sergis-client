/*
 * The SerGIS Project - sergis-client
 *
 * This is a SerGIS Client Frontend file for the ArcGIS API.
 * For more on SerGIS Frontends, see:
 * http://sergisproject.github.io/docs/client.html#frontends
 */

// This is wrapped inside an anonymous, self-executing function to prevent
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
    
    // A reference to parameters about the last thing that we (the user) drew
    var lastDrawn = {
        geometry: null,
        symbol: null,
        graphic: null
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
                    lastDrawn.geometry = event.geometry;
                    // Make the actual map symbol
                    switch (lastDrawn.geometry.type) {
                        case "point":
                            lastDrawn.symbol = new api.SimpleMarkerSymbol(api.SimpleMarkerSymbol.STYLE_SQUARE, 10, new api.SimpleLineSymbol(api.SimpleLineSymbol.STYLE_SOLID, new api.Color([255,0,0]), 1), new api.Color([0,255,0,0.25]));
                            break;
                        case "polyline":
                            lastDrawn.symbol = new api.SimpleLineSymbol(api.SimpleLineSymbol.STYLE_DASH, new api.Color([255,0,0]), 1);
                            break;
                        case "polygon":
                            lastDrawn.symbol = new api.SimpleFillSymbol(api.SimpleFillSymbol.STYLE_NONE, new api.SimpleLineSymbol(api.SimpleLineSymbol.STYLE_DASHDOT, new api.Color([255,0,0]), 2), new api.Color([255,255,0,0.25]));
                            break;
                    }
                    // Add the symbol to the map
                    lastDrawn.graphic = new api.Graphic(lastDrawn.geometry, lastDrawn.symbol);
                    gMap.graphics.add(lastDrawn.graphic);
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
            clearGraphics: function () {
                return new Promise(function (resolve, reject) {
                    gMap.graphics.clear();
                    resolve();
                });
            },
            
            // Actions that the old serious game could do: buffer, intersect, clip, union, multibuffer
            buffer: TEST_FRONTEND_ACTION
        }
    };
})();
