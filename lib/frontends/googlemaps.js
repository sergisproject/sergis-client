/*
 * This is a SerGIS Client Frontend file for the Google Maps API. For more on
 * SerGIS Frontends, see: http://sergisproject.github.io/docs/
 */

sergis.frontend = {
    map: null,
    
    init: function (mapContainer, latitude, longitude, zoom) {
        this.map = new google.maps.Map(mapContainer, {
            center: {
                lat: latitude,
                lng: longitude
            },
            zoom: zoom
        });
    },
    
    centerMap: function (latitude, longitude, zoom) {
        this.map.setCenter(new google.maps.LatLng(latitude, longitude));
        this.map.setZoom(zoom || 8);
    },
    
    actions: {
        buffer: function () {
        
        }
    }
};
