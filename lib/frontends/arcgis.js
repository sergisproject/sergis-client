/*
 * The SerGIS Project - sergis-client
 *
 * This is a SerGIS Client Frontend file for the ArcGIS API.
 * For more on SerGIS Frontends, see:
 * http://sergisproject.github.io/docs/client.html#frontends
 */

/**
 * @namespace
 * @see {@link http://sergisproject.github.io/docs/client.html}
 */
sergis.frontend = {
    name: "arcgis",
    map: null,
    
    init: function (mapContainer, map) {
        return new Promise(function (resolve, reject) {
            require(["esri/map"], function (Map) {
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
                sergis.frontend.map = new Map("map-container-ARCGIS_API", info);
                resolve();
            });
        });
    },
    
    centerMap: function (map) {
        return new Promise(function (resolve, reject) {
            // Check for any other changes that we need to make first
            // (so it can load crap for them while changing the map zoom)
            if (map.frontendInfo && map.frontendInfo.arcgis) {
                if (map.frontendInfo.arcgis.basemap) {
                    sergis.frontend.map.setBasemap(map.frontendInfo.arcgis.basemap);
                }
            }
            // NOTE: This below looks like it returns a Promise... but it doesn't. It's a "Deferred" (damn dojo)
            sergis.frontend.map.centerAndZoom([map.longitude, map.latitude], map.zoom).then(function () {
                resolve();
            }, reject);
        });
    },
    
    actions: {
        buffer: function (/* ... */) {
            var args = Array.prototype.slice.call(arguments, 0);
            return new Promise(function (resolve, reject) {
                // ...
                alert("Doing buffer:\n" + JSON.stringify(args));
                resolve();
            });
        }
    }
};
