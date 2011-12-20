/*
 * This file is part of the World Topo Map project.
 *
 * (c) Victor Berchet <victor@suumit.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Returns a map object for Switzerland
 *
 * @param {object=} options The map options
 *
 * @return {map} The map
 */
WTMap.getSwissTopoMap = (function() {

    var ctor,
        server = 0,
        PARAMS = {
            5: {scale: 4000, zoom: 0},
            6: {scale: 2500, zoom: 6},
            7: {scale: 1250, zoom: 11},
            8: {scale: 650, zoom: 14},
            9: {scale: 250, zoom: 16},
            10: {scale: 200, zoom: 17},
            11: {scale: 100, zoom: 17},
            12: {scale: 50, zoom: 18},
            13: {scale: 20, zoom: 19},
            14: {scale: 10, zoom: 20},
            15: {scale: 5, zoom: 21},
            16: {scale: 2.5, zoom: 22},
            17: {scale: 1.5, zoom: 24},
            18: {scale: 0.5, zoom: 26}
        },
        TILE_SIZE = {x: 256, y: 256}
    ;

    /**
     * Create a control to display the copyright
     */
    function initCopyright(wtMap) {
        var link = document.createElement('a');

        link.href = 'http://www.swisstopo.ch/';
        link.title = 'Copyright SwissTopo';
        link.target = '_blank';
        link.innerHTML = "&copy; SwissTopo";
        link.style.fontFamily = 'Arial,sans-serif';
        link.style.fontSize = '12px';
        link.style.color = 'black';
        link.style.backgroundColor = 'white';
        link.style.padding = '3px';
        link.style.margin = '3px';
        link.style.border = '1px gray solid';
        link.style.display = 'none';
        link.style.textDecoration = 'none';
        wtMap.adapter.addCopyrightControl(link);
        return link;
    }

    /**
     * Initialize the projection according to the map center and zoom level
     */
    function setProjection(wtMap) {
        var zoom = wtMap.adapter.getZoom();

        if (wtMap.zoom && zoom == 10) {
            // skip zoom level 10 which is not supported
            var delta = zoom - wtMap.zoom;
            wtMap.zoom = zoom + delta / Math.abs(delta);
            wtMap.adapter.setZoom(zoom);
        }
        wtMap.zoom = zoom;
        wtMap.scale0 = PARAMS[zoom].scale * Math.pow(2, zoom);
        wtMap.adapter.setCenter(wtMap.center);
    }

    ctor = function(options) {
        options = options || {};
        var layer = options.layer || WTMap.LAYER_MAP;

        this.options = {
            layer: layer,
            isPng: false,
            name: options.name || 'SwissTopo ' + layer,
            maxZoom: options.maxZoom || 18,
            minZoom: options.minZoom || 5,
            tileSize: TILE_SIZE
        };

        this.zoom = null;
        this.copyright = null;
        this.center = null;
        this.adapter = null;
        this.listeners = {};
        this.projection = WTMap.Projection.ESPG_21781();
        this.scale0 = null;
    }

    ctor.prototype = {
        getBounds: function() {
            return {
                sw: {lat: 45.398181, lng: 5.140242},
                ne: {lat: 48.230651, lng: 11.47757}
            }
        },

        init: function(adapter) {
            this.center = adapter.getCenter();
            this.adapter = adapter;
            this.copyright = initCopyright(this);
            setProjection(this);
        },

        /**
         * This function must be called before displaying the map
         */
        enable: function() {
            var me = this;
            this.center = this.adapter.getCenter();
            setProjection(this);
            // Capture the center value when the map becomes idle
            // This is required to apply this value when the zoom level changes as consecutive zoom
            // resolution ratio is not 2 as expected by the google maps API
            this.listeners.move = this.adapter.afterMove(function() {me.center = me.adapter.getCenter();});
            this.listeners.zoom = this.adapter.onZoomChange(function() {setProjection(me);});
            this.copyright.style.display = 'block';
        },
        /**
         * This function must be called when the map is no more displayed
         */
        disable: function() {
            this.listeners.move && this.adapter.removeListener(this.listeners.move);
            this.listeners.zoom && this.adapter.removeListener(this.listeners.zoom)
            this.copyright.style.display = 'none';
        },

        /**
         * Returns the URL of the request tile
         *
         * @param {google.maps.Point} point Tile coordinate
         * @param {number}            zoom  The zoom level
         *
         * @return {string} The tile URL
         */
        getTileUrl: function(point, zoom) {
            return 'http://wmts{server}.geo.admin.ch/1.0.0/{layer}/default/{date}/{proj}/{zoom}/{y}/{x}.jpeg'
                .replace('{server}', server++ % 4)
                .replace('{y}', point.y)
                .replace('{x}', point.x)
                .replace('{proj}', 21781)
                .replace('{zoom}', PARAMS[zoom].zoom)
                .replace('{date}', this.options.layer === WTMap.LAYER_MAP ? '20111206' : '20110914')
                .replace('{layer}', this.options.layer === WTMap.LAYER_MAP ? 'ch.swisstopo.pixelkarte-farbe' : 'ch.swisstopo.swissimage')
            ;
        }
    }

    return ctor;

})();






