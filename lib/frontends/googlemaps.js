/*
 * The SerGIS Project - sergis-client
 *
 * This is a SerGIS Client Frontend file for the Google Maps API.
 * For more on SerGIS Frontends, see:
 * http://sergisproject.github.io/docs/client.html#frontends
 */

/**
 * @namespace
 * @see {@link http://sergisproject.github.io/docs/client.html}
 */
sergis.frontend = {
    name: "googlemaps",
    map: null,
    
    init: function (mapContainer, map) {
        return new Promise(function (resolve, reject) {
            sergis.frontend.map = new google.maps.Map(mapContainer, {
                center: {
                    lat: map.latitude,
                    lng: map.longitude
                },
                zoom: map.zoom
            });
            resolve();
        });
    },
    
    centerMap: function (map) {
        return new Promise(function (resolve, reject) {
            sergis.frontend.map.setCenter(new google.maps.LatLng(map.latitude, map.longitude));
            sergis.frontend.map.setZoom(map.zoom || 8);
            resolve();
        });
    },
    
    actions: {
        buffer: function (/* ... */) {
            return new Promise(function (resolve, reject) {
                // TODO: do stuff
                resolve();
            });
        }
    }
};
