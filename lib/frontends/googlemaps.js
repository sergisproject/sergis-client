/*
 * The SerGIS Project - sergis-client
 *
 * This is a SerGIS Client Frontend file for the Google Maps API. For more on
 * SerGIS Frontends, see: http://sergisproject.github.io/docs/
 */

sergis.frontend = {
    map: null,
    
    init: function (mapContainer, latitude, longitude, zoom) {
        return new Promise(function (resolve, reject) {
            sergis.frontend.map = new google.maps.Map(mapContainer, {
                center: {
                    lat: latitude,
                    lng: longitude
                },
                zoom: zoom
            });
            resolve();
        });
    },
    
    centerMap: function (latitude, longitude, zoom) {
        return new Promise(function (resolve, reject) {
            sergis.frontend.map.setCenter(new google.maps.LatLng(latitude, longitude));
            sergis.frontend.map.setZoom(zoom || 8);
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
