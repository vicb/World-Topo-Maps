/*
 * This file is part of the World Topo Map project.
 *
 * (c) Victor Berchet <victor@suumit.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

WTMap.Adapter.GMap = function(map) {
    this.map = map;
};

WTMap.Adapter.GMap.prototype = (function() {

    var Projection = function(wtMap) {
        this.wtMap = wtMap;
    };

    /**
     * Forward projection
     *
     * @param {google.maps.LatLng} latLng The coordinates
     *
     * @return {google.maps.Point} The projected coordinates
     */
    Projection.prototype.fromLatLngToPoint = function(latLng) {
        var projection = this.wtMap.projection,
            scale0 = this.wtMap.scale0,
            coord = projection.forward(latLng.lat(), latLng.lng());
        return new google.maps.Point(
            (coord.x - projection.origin.x) / scale0,
            (projection.origin.y - coord.y) / scale0
        );
    };

    /**
     * Inverse projection
     *
     * @param {google.maps.Point} point The projected coordinates
     * @param {boolean=} noWrap Whether to wrap the coordinates
     *
     * @return {google.maps.LatLng} latLng The coordinates
     */
    Projection.prototype.fromPointToLatLng = function(point, noWrap) {
        var projection = this.wtMap.projection,
            scale0 = this.wtMap.scale0,
            coord = projection.inverse(
                projection.origin.x + point.x * scale0,
                projection.origin.y - point.y * scale0
            );
        return new google.maps.LatLng(coord.lat, coord.lng, noWrap);
    };


    return {
        getCenter: function() {
            var ll = this.map.getCenter();
            return {
                lat: ll.lat(),
                lng: ll.lng()
            };
        },

        setCenter: function(ll) {
            ll && this.map.setCenter(new google.maps.LatLng(ll.lat, ll.lng));
        },

        getZoom: function() {
            return this.map.getZoom();
        },

        setZoom: function(zoom) {
            return this.map.setZoom(zoom);
        },

        getVisibleBounds: function() {
            var bounds = this.map.getBounds(),
                sw = bounds.getSouthWest(),
                ne = bounds.getNorthEast();
            return {
                sw: { lat: sw.lat(), lng: sw.lng() },
                ne: { lat: sw.lat(), lng: ne.lng() }
            }
        },

        setProjection: function(projection, scale0) {
            projection && (this.projection.projection = projection);
            scale0 && (this.projection.scale0 = scale0);
        },

        addCopyrightControl: function(node) {
            this.map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(node);
        },

        isAreaVisible: function(bounds) {
            var mapBounds = this.map.getBounds();
            if (!mapBounds) {
                return false;
            }
            return mapBounds.intersects(new google.maps.LatLngBounds(
                new google.maps.LatLng(bounds.sw.lat, bounds.sw.lng),
                new google.maps.LatLng(bounds.ne.lat, bounds.ne.lng)
            ));
        },

        onZoomChange: function(cb) {
            return google.maps.event.addListener(this.map, 'zoom_changed', cb);
        },

        onCenterChange: function(cb) {
            return google.maps.event.addListener(this.map, 'center_changed', cb);
        },

        afterMove: function(cb) {
            return google.maps.event.addListener(this.map, 'idle', cb);
        },

        removeListener: function(listener) {
            return google.maps.event.removeListener(listener);
        },

        getMapType: function(wtMap) {
            wtMap.init(this);
            var mapType = new google.maps.ImageMapType({
                alt: wtMap.options.name,
                getTileUrl: function() { return wtMap.getTileUrl.apply(wtMap, arguments) },
                maxZoom: wtMap.options.maxZoom,
                minZoom: wtMap.options.minZoom,
                name: wtMap.options.name,
                tileSize: new google.maps.Size(wtMap.options.tileSize.x, wtMap.options.tileSize.y)
            });
            mapType.projection = new Projection(wtMap);

            return mapType;
        }

    };
})();
