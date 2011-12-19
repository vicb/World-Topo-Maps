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
 * @param {google.map.Map}         map     The google map
 * @param {layer}                  layer   The name of the layer to display
 * @param {google.map.MapOptions=} options The map options
 *
 * @return {map} The map
 */
WTGmap.getIgnEMap = function(map, layer, options) {

    var zone,
        center,
        copyright,
        layerNames,
        server = 0,
        listeners = {},
        zoomOffset = Math.round(Math.log(2 * Math.PI * 6378137 / (2048 * 256)) / Math.LN2),
        options = options || {},
        googProj = new WTGmap.Projection.google(WTGmap.Projection.iberpix(30), 2048 * Math.pow(2,  zoomOffset)),
        options = {
            alt: options.alt || 'IGNE ' + layer,
            getTileUrl: getTileUrl,
            isPng: false,
            maxZoom: options.maxZoom || 18,
            minZoom: options.minZoom || 6,
            name: options.name || 'IGNE ' + layer,
            tileSize: new google.maps.Size(256, 256)
        },
        mapType = new google.maps.ImageMapType(options);


    layerNames = layer === WTGmap.LAYER_MAP ?
        ['mapa_million', "mapa_mtn200", "mapa_mtn50", "mapa_mtn25"] :
        ['mapa_inicio', "spot5", "pnoa", "pnoa"];

    /**
     * Returns the name of the layer according to the zoom value
     *
     * @param {!number} zoom The google map zoom level
     *
     * @return {string} The layer name
     */
    function getLayer(zoom) {
        if (zoom < 11) {
            return layerNames[0];
        } else if (zoom < 13) {
            return layerNames[1];
        } else if (zoom < 15) {
            return layerNames[2];
        } else {
            return layerNames[3];
        }
    }

    /**
     * Returns the URL of the request tile
     *
     * @param {google.maps.Point} point Tile coordinate
     * @param {number}            zoom  The zoom level
     *
     * @return {string} The tile URL
     */
    function getTileUrl(point, zoom) {
        return "http://ts{server}.iberpix.ign.es/tileserver/n={layer};z={zone};r={scale};i={x};j={y}.jpg"
            .replace('{server}', server++ % 5)
            .replace('{layer}', getLayer(zoom))
            .replace('{zone}', zone)
            .replace('{scale}', 2048 / Math.pow(2, zoom - 6) * 1000)
            .replace('{x}', point.x)
            .replace('{y}', -(point.y + 1))
        ;
    }

    /**
     * Create a control to display the copyright
     */
    function initCopyright() {
        var img = document.createElement('img'),
            link = document.createElement('a');

        link.href = 'http://www.ign.es';
        link.title = img.alt = 'Copyright Ign';
        img.src = 'img/logo_igne.gif';

        link.target = '_blank';
        link.style.padding = link.style.borderWidth = '0';
        link.style.margin = '3px';
        img.style.padding = img.style.margin = img.style.borderWidth = '0';
        link.style.display = 'none';
        link.appendChild(img);
        map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(link);
        return link;
    }

    /**
     * Initialize the projection accordring to the map center and zoom level
     */
    function initProjection() {
        var oldZone = zone,
            zoom = map.getZoom(),
            center = map.getCenter();

        if (zoom < 11) {
            zone = 30;
        } else {
            var lngCenter = map.getCenter().lng();
            if (lngCenter < -6) {
                zone = 29;
            } else if (lngCenter < 0) {
                zone = 30;
            } else {
                zone = 31;
            }
        }

        if (oldZone != zone) {
            googProj.proj = WTGmap.Projection.iberpix(zone);
            map.setCenter(center);
        }
    }

    initProjection();
    copyright = initCopyright();
    mapType.projection = googProj;

    return {
        /** @type {google.maps.ImageMapType} */
        mapType: mapType,
        /**
         * The area covered by the tiles
         * @type {google.maps.LatLngBounds}
         */
        bounds: bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(34, -13.5),
            new google.maps.LatLng(44, 4)
        ),
        /**
         * This function must be called before displaying the map
         */
        enable: function() {
            initProjection();
            listeners.zoom = google.maps.event.addListener(map, 'zoom_changed', initProjection);
            listeners.center = google.maps.event.addListener(map, 'center_changed', initProjection);
            copyright.style.display = 'block';
        },
        /**
         * This function must be called when the map is no more displayed
         */
        disable: function() {
            listeners.zoom && google.maps.event.removeListener(listeners.zoom);
            listeners.center && google.maps.event.removeListener(listeners.center);
            copyright.style.display = 'none';
        }
    }
};
