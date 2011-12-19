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
 * @param {google.map.Map}         map     The google map
 * @param {layer}                  layer   The name of the layer to display
 * @param {google.map.MapOptions=} options The map options
 *
 * @return {map} The map
 */
WTGmap.getSwissTopoMap = function(map, layer, options) {

    var gZoom,
        copyright,
        center,
        listeners = {},
        server = 0,
        options = options || {},
        googProj = new WTGmap.Projection.google(WTGmap.Projection.swisstopo()),
        params = {
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
        options = {
            alt: options.alt || 'SwissTopo ' + layer,
            getTileUrl: getTileUrl,
            isPng: false,
            maxZoom: options.maxZoom || 18,
            minZoom: options.minZoom || 5,
            name: options.name || 'SwissTopo ' + layer,
            tileSize: new google.maps.Size(256, 256)
        },
        mapType = new google.maps.ImageMapType(options);

    /**
     * Create a control to display the copyright
     */
    function initCopyright() {
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
        map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(link);
        return link;
    }

    /**
     * Initialize the projection accordring to the map center and zoom level
     */
    function initProjection() {
        var zoom = map.getZoom();

        if (gZoom && zoom == 10) {
            // skip zoom level 10 which is not supported
            var delta = zoom - gZoom;
            zoom = zoom + delta / Math.abs(delta);
            map.setZoom(zoom);
        }
        gZoom = zoom;

        googProj.scale0 = params[gZoom].scale * Math.pow(2, zoom);
        map.setCenter(center);
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
        return 'http://wmts{server}.geo.admin.ch/1.0.0/{layer}/default/{date}/{proj}/{zoom}/{y}/{x}.jpeg'
            .replace('{server}', server++ % 4)
            .replace('{y}', point.y)
            .replace('{x}', point.x)
            .replace('{proj}', googProj.proj.name)
            .replace('{zoom}', params[gZoom].zoom)
            .replace('{date}', layer === WTGmap.LAYER_MAP ? '20111206' : '20110914')
            .replace('{layer}', layer === WTGmap.LAYER_MAP ? 'ch.swisstopo.pixelkarte-farbe' : 'ch.swisstopo.swissimage')
        ;
    }

    center = map.getCenter();
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
        bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(45.398181, 5.140242),
            new google.maps.LatLng(48.230651, 11.47757)
        ),
        /**
         * This function must be called before displaying the map
         */
        enable: function() {
            center = map.getCenter();
            initProjection();
            // Capture the center value when the map becomes idle
            // This is required to apply this value when the zoom level changes as consecutive zoom
            // resolution ratio is not 2 as expected by the google maps API
            listeners.idle = google.maps.event.addListener(map, 'idle', function(){ center = map.getCenter(); });
            listeners.zoom = google.maps.event.addListener(map, 'zoom_changed', initProjection);
            copyright.style.display = 'block';
        },
        /**
         * This function must be called when the map is no more displayed
         */
        disable: function() {
            listeners.idle && google.maps.event.removeListener(listeners.idle);
            listeners.zoom && google.maps.event.removeListener(listeners.zoom);
            copyright.style.display = 'none';
        }
    }
};
