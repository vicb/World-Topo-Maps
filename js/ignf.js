/*
 * This file is part of the World Topo Map project.
 *
 * (c) Victor Berchet <victor@suumit.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Returns a map object for France
 *
 * @param {object=} options The map options
 *
 * @return {map} The map
 */
WTMap.getIgnFMap = (function() {

    var ctor,
        projections = [],
        ZOOM_OFFSET_MILLER = Math.round(Math.log(2 * Math.PI * 6378137 / (39135.75 * 256)) / Math.LN2),
        SCALE0_MILLER = 39135.75 * Math.pow(2, ZOOM_OFFSET_MILLER),
        ZOOM_OFFSET_GEOP = Math.round(Math.log(2 * Math.PI * 6378137 / (2048 * 256)) / Math.LN2),
        SCALE0_GEOP = 2048 * Math.pow(2, ZOOM_OFFSET_GEOP),
        TILE_SIZE = { x: 256, y: 256 },
        PARAMS = {
            'ANF': {Kx: 107526.37112657, bounds: [11.7, -64, 18.18, -59]},
            'ASP': {Kx: 87720.95583112,  bounds: [-40, 76, -36, 79]},
            'CRZ': {Kx: 77329.01607478,  bounds: [-48, 47, -44, 55]},
            'FXX': {Kx: 76627.28085145,  bounds: [27.33, -31.17, 80.83, 69.03]},
            'GUF': {Kx: 111048.32210860, bounds: [-4.3, -62.1, 11.5, -46]},
            'MYT': {Kx: 108886.89283435, bounds: [-17.5, 40, 3, 56]},
            'NCL': {Kx: 103213.63456212, bounds: [-24.3, 160, -17.1, 170]},
            'PYF': {Kx: 107526.37112657, bounds: [-28.2, -160, 11, -108]},
            'REU': {Kx: 103925.69769224, bounds: [-26.2, 37.5, -17.75, 60]},
            'SPM': {Kx: 75919.71016400, bounds: [43.5, -60, 52, -50]},
            'WLF': {Kx: 108012.82616793, bounds: [-14.6, -178.5, -12.8, -175.8]}
        }
    ;

    // Initialize the parameters
    for (var t in PARAMS) {
        if (PARAMS.hasOwnProperty(t)) {
            PARAMS[t].bounds = {
                sw: { lat: PARAMS[t].bounds[0], lng: PARAMS[t].bounds[1] },
                ne: { lat: PARAMS[t].bounds[2], lng: PARAMS[t].bounds[3] }
            };
        }
    }

    /**
     * Create a control to display the copyright
     */
    function initCopyright(wtMap) {
        var img = document.createElement('img'),
            link = document.createElement('a');

        if (wtMap.options.layer === WTMap.LAYER_MAP) {
            link.href = 'http://www.ign.fr';
            link.title = img.alt = 'Copyright Ign';
            img.src = wtMap.options.logosUrl["map"];
        } else {
            link.href = 'http://www.planetobserver.com';
            link.title = img.alt = 'Copyright Planet Observer';
            img.src = wtMap.options.logosUrl["photo"];
        }
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
     * Initialize the projection accordring to the map center and zoom level
     */
    function setProjection(wtMap) {
        var oldTerritory = wtMap.territory,
            zoom = wtMap.adapter.getZoom();

        if (zoom < ZOOM_OFFSET_GEOP) {
            // Lower zoom levels use a Miller projection
            wtMap.scale0 = SCALE0_MILLER;
            wtMap.territory = 'world';
            wtMap.projection = projections.world = projections.world || WTMap.Projection.miller();
            wtMap.projectionName = 'IGNF:MILLER';

        } else {
            // Higher zoom levels use an equirectangular projection
            if (!PARAMS[wtMap.territory] || !wtMap.adapter.isAreaVisible(PARAMS[wtMap.territory].bounds)) {
                wtMap.territory = 'FXX';
                for(var t in PARAMS) {
                    if(PARAMS.hasOwnProperty(t) && wtMap.adapter.isAreaVisible(PARAMS[t].bounds)) {
                        wtMap.territory = t;
                        break;
                    }
                }
            }
            wtMap.scale0 = SCALE0_GEOP;

            wtMap.projectionName = 'IGNF:GEOPORTAL' + wtMap.territory;

            if (wtMap.territory !== oldTerritory) {
                var center = wtMap.adapter.getCenter();
                wtMap.projection = projections[wtMap.territory] || WTMap.Projection.equiRectangular({
                    x: PARAMS[wtMap.territory].Kx,
                    y: 111319.49079327
                });
                wtMap.adapter.setCenter(center);
            }

        }
    }

    ctor = function(options) {
        options = options || {};
        var layer = options.layer || WTMap.LAYER_MAP;

        this.options = {
            layer: layer,
            isPng: false,
            name: options.name || 'IGN ' + layer,
            maxZoom: options.maxZoom || 18,
            minZoom: options.minZoom || 2,
            logosUrl: options.logos || { map: '/img/logo_ign.gif', photo: '/img/logo_planetobserver.gif' },
            tileSize: TILE_SIZE,
            drm: options.drm
        };

        this.tileSize = null;
        this.projectionName = null;
        this.territory = null,
        this.copyright = null;
        this.adapter = null;
        this.listeners = {};
        this.projection = null;
        this.scale0 = null;
    }

    ctor.prototype = {
        getBounds: function() {
            var bounds = [];
            for (var t in PARAMS) {
                if (PARAMS.hasOwnProperty(t)) {
                    bounds.push(PARAMS[t].bounds);
                }
            }
            return bounds;
        },

        init: function(adapter) {
            this.adapter = adapter;
            this.copyright = initCopyright(this);
            // Update the DRM token even if the map is not currenlty enabled
            adapter.afterMove(this.options.drm.getToken);
            setProjection(this);
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
            var tileSize = 256 * this.scale0 / Math.pow(2, zoom);

            return 'http://wxs.ign.fr/geoportail/wmsc?LAYERS={layer}&EXCEPTIONS=text/xml&FORMAT=image/jpeg&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&SRS={proj}&BBOX={bbox}&WIDTH=256&HEIGHT=256&TILED=true&gppkey={key}'
                .replace('{bbox}', [
                    tileSize * point.x,
                    -tileSize * (point.y + 1),
                    tileSize * (point.x + 1),
                    -tileSize * point.y
                ])
                .replace('{key}', this.options.drm.getToken())
                .replace('{proj}', this.projectionName)
                .replace('{layer}', this.options.layer === WTMap.LAYER_MAP ? 'GEOGRAPHICALGRIDSYSTEMS.MAPS' : 'ORTHOIMAGERY.ORTHOPHOTOS')
            ;
        },

        /**
         * This function must be called before displaying the map
         */
        enable: function() {
            console.log('enable');
            var me = this;
            setProjection(this);
            this.listeners.move = this.adapter.afterMove(function() { setProjection(me); });
            this.copyright.style.display = 'block';
        },

        /**
         * This function must be called when the map is no more displayed
         */
        disable: function() {
            this.listeners.move && this.adapter.removeListener(this.listeners.move);
            this.copyright.style.display = 'none';
        }
    };

    return ctor;

})();

WTMap.Drm = {
    token: null,
    script: null,
    /**
     * This callback update the token value
     *
     * @param {Object} json The token
     */
    updateToken: function(json) {
        WTMap.Drm.token = json.gppkey;
        document.body.removeChild(WTMap.Drm.script);
        WTMap.Drm.script = null;
    }
}

WTMap.IgnGeoDrm = function(apiKey) {
    var tickTimer,
        tiles = 1,
        ttl = 1;

    /**
     * Make a JSONP call
     *
     * @param {string} url The URL to call
     */
    function xdSend(url) {
        WTMap.Drm.script = document.createElement('script');
        WTMap.Drm.script.setAttribute('src', url);
        WTMap.Drm.script.setAttribute('type', 'text/javascript');
        document.body.appendChild(WTMap.Drm.script);
    }

    /**
     * Update the token
     */
    function getToken() {
        if (tiles > 0) {
            // Start a new period when there has been some activity during the last period,
            tiles = 0;
            tickTimer = window.setTimeout(getToken, 1 * 60 * 1000);
            if (--ttl === 0) {
                // Update the token value when the ttl is reached
                ttl = 9;
                xdSend('http://jeton-api.ign.fr/getToken?callback=WTMap.Drm.updateToken&output=json&key=' + apiKey + (WTMap.Drm.token ? '&gppkey=' + WTMap.Drm.token : ''));
            }
        } else {
            // Release the token when there has been no activity
            xdSend('http://jeton-api.ign.fr/releaseToken?gppkey=' + WTMap.Drm.token);
            ttl = 1;
            WTMap.Drm.token = null;
            tickTimer = null;
        }
    }

    getToken();

    return {
        /**
         * Returns the token value
         *
         * @return {string} The token
         */
        getToken: function() {
            tiles++;
            if (!tickTimer) {
                // Restart a period when the timer has been stopped
                getToken();
            }
            return WTMap.Drm.token;
        }
    }

}
