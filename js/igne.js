/*
 * This file is part of the World Topo Map project.
 *
 * (c) Victor Berchet <victor@suumit.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Returns a map object for Spain
 *
 * @param {object=} options The map options
 *
 * @return {map} The map
 */
WTMap.getIgnEMap = (function() {
    var ctor,
        projections = {},
        server = 0,
        ZOOM_OFFSET = Math.round(Math.log(2 * Math.PI * 6378137 / (2048 * 256)) / Math.LN2),
        SCALE0 = 2048 * Math.pow(2, ZOOM_OFFSET),
        TILE_SIZE = {x: 256, y: 256},
        LAYER_NAMES = {}
    ;

    LAYER_NAMES[WTMap.LAYER_MAP] = ['mapa_millon', "mapa_mtn200", "mapa_mtn50", "mapa_mtn25"];
    LAYER_NAMES[WTMap.LAYER_PHOTO] = ['mapa_inicio', "spot5", "pnoa", "pnoa"];

    /**
     * Create a control to display the copyright
     */
    function initCopyright(wtMap) {
        var img = document.createElement('img'),
            link = document.createElement('a');

        link.href = 'http://www.ign.es';
        link.title = img.alt = 'Copyright Ign';
        img.src = wtMap.options.logoUrl;

        link.target = '_blank';
        link.style.padding = link.style.borderWidth = '0';
        link.style.margin = '3px';
        img.style.padding = img.style.margin = img.style.borderWidth = '0';
        link.style.display = 'none';
        link.appendChild(img);
        wtMap.adapter.addCopyrightControl(link);
        return link;
    }

    /**
     * Returns the name of the layer according to the zoom value
     *
     * @param {Array.<string>} layers List of layer names
     * @param {number}         zoom The google map zoom level
     *
     * @return {string} The layer name
     */
    function getLayerName(layers, zoom) {
        if (zoom < 11) {
            return layers[0];
        } else if (zoom < 13) {
            return layers[1];
        } else if (zoom < 15) {
            return layers[2];
        } else {
            return layers[3];
        }
    }

    /**
     * Initialize the projection according to the map center and zoom level
     */
    function setProjection(wtMap) {
        var oldZone = wtMap.zone,
            zoom = wtMap.adapter.getZoom(),
            center = wtMap.adapter.getCenter();

console.log('setproj');

        if (zoom < 11) {
            wtMap.zone = 30;
        } else {
            var lngCenter = center.lng;
            if (lngCenter < -6) {
                wtMap.zone = 29;
            } else if (lngCenter < 0) {
                wtMap.zone = 30;
            } else {
                wtMap.zone = 31;
            }
        }

        if (oldZone != wtMap.zone) {
            wtMap.projection = projections[wtMap.zone] = projections[wtMap.zone] || WTMap.Projection.utm(wtMap.zone, true);
            wtMap.adapter.setCenter(center);
        }
    }

    ctor = function(options) {
        options = options || {};
        var layer = options.layer || WTMap.LAYER_MAP;

        this.options = {
            layer: layer,
            isPng: false,
            name: options.name || 'IGNE ' + layer,
            maxZoom: options.maxZoom || 18,
            minZoom: options.minZoom || 6,
            tileSize: TILE_SIZE,
            logoUrl: options.logo || '/img/logo_igne.gif'
        };

        this.layers = LAYER_NAMES[layer];
        this.zone = null;
        this.adapter = null;
        this.copyright = null;
        this.listeners = {};
        this.projection = null;
        this.scale0 = SCALE0;
    }

    ctor.prototype = {
        getBounds: function() {
            return {
                sw: { lat: 34, lng: -13.5 },
                ne: { lat: 44, lng: 4 }
            };
        },

        init: function(adapter) {
            this.adapter = adapter;
            this.copyright = initCopyright(this, this.options.logoUrl);
            setProjection(this);
        },

        /**
         * This function must be called before displaying the map
         */
        enable: function() {
            var me = this;
            setProjection(this);
            this.listeners.zoom = this.adapter.onCenterChange(function() { setProjection(me); });
            this.copyright.style.display = 'block';
        },

        /**
         * This function must be called when the map is no more displayed
         */
        disable: function() {
            this.listeners.zoom && this.adapter.removeListener(this.listeners.zoom);
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
            return "http://ts{server}.iberpix.ign.es/tileserver/n={layer};z={zone};r={scale};i={x};j={y}.jpg"
                .replace('{server}', server++ % 5)
                .replace('{layer}', getLayerName(this.layers, zoom))
                .replace('{zone}', this.zone)
                .replace('{scale}', 2048 / Math.pow(2, zoom - ZOOM_OFFSET) * 1000)
                .replace('{x}', point.x)
                .replace('{y}', -(point.y + 1))
            ;
        }
    };

    return ctor;

})();