/*
 * The SerGIS Project - sergis-client
 *
 * This is a SerGIS Client Frontend file for the ArcGIS Online API. For more on
 * SerGIS Frontends, see: http://sergisproject.github.io/docs/
 */

/**
 * @namespace
 * @see {@link http://sergisproject.github.io/docs/client.html}
 */
sergis.frontend = {
    map: null,
    
    init: function (mapContainer, latitude, longitude, zoom) {
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
                // Load the map
                setTimeout(function () {
                    sergis.frontend.map = new Map("map-container-ARCGIS_API", {
                        center: [latitude, longitude],
                        zoom: zoom,
                        basemap: "streets"
                    });
                }, 1);
                // Additional basemap options are:
                // "satellite", "hybrid", "topo", "gray", "oceans", "osm", "national-geographic"
                resolve();
            });
        });
    },
    
    centerMap: function (latitude, longitude, zoom) {
        return new Promise(function (resolve, reject) {
            // ...
        });
    },
    
    actions: {
        buffer: function (/* ... */) {
            return new Promise(function (resolve, reject) {
                // ...
            });
        }
    }
};
