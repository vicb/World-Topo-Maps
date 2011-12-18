/*
 * This file is part of the World Topo Map project.
 *
 * (c) Victor Berchet <victor@suumit.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

WTGmap.getIgnFMap = function(map, drm, layer, options) {

    var tileSize,
        copyright,
        bounds = [],
        territory = 'FXX',
        listeners = {},
        zoomOffsetMiller = Math.round(Math.log(2 * Math.PI * 6378137 / (39135.75 * 256)) / Math.LN2),
        zoomOffsetGeop = Math.round(Math.log(2 * Math.PI * 6378137 / (2048 * 256)) / Math.LN2),
        options = options || {},
        googProj = new WTGmap.Projection.google(),
        options = {
            alt: options.alt || 'IGN',
            getTileUrl: getTileUrl,
            isPng: false,
            maxZoom: options.maxZoom || 18,
            minZoom: options.minZoom || 2,
            name: options.name || 'IGN',
            tileSize: new google.maps.Size(256, 256)
        },
        params = {
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
        },
        mapType = new google.maps.ImageMapType(options);

    for (var t in params) {
        if (params.hasOwnProperty(t)) {
            params[t].bounds = new google.maps.LatLngBounds(
                new google.maps.LatLng(params[t].bounds[0], params[t].bounds[1]),
                new google.maps.LatLng(params[t].bounds[2], params[t].bounds[3])
            );
            bounds.push(params[t].bounds);
        }
    }

    function getTileUrl(point, zoom) {
        return 'http://wxs.ign.fr/geoportail/wmsc?LAYERS={layer}&EXCEPTIONS=text/xml&FORMAT=image/jpeg&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&SRS={proj}&BBOX={bbox}&WIDTH=256&HEIGHT=256&TILED=true&gppkey={key}'
            .replace('{bbox}', [point.x * tileSize, (-point.y - 1) * tileSize, (point.x + 1) * tileSize, -point.y * tileSize])
            .replace('{key}', drm.getToken())
            .replace('{proj}', googProj.proj.name)
            .replace('{territory}', territory)
            .replace('{layer}', layer === WTGmap.LAYER_MAP ? 'GEOGRAPHICALGRIDSYSTEMS.MAPS' : 'ORTHOIMAGERY.ORTHOPHOTOS')
        ;
    }

    function initCopyright() {
        var img = document.createElement('img'),
            link = document.createElement('a');

        if (layer === WTGmap.LAYER_MAP) {
            link.href = 'http://www.ign.fr';
            link.title = img.alt = 'Copyright Ign';
            img.src = 'img/logo_ign.gif';
        } else {
            link.href = 'http://www.planetobserver.com';
            link.title = img.alt = 'Copyright Planet Observer';
            img.src = 'img/logo_planetobserver.gif';
        }
        link.target = '_blank';
        link.style.padding = link.style.borderWidth = '0';
        link.style.margin = '3px';
        img.style.padding = img.style.margin = img.style.borderWidth = '0';
        link.style.display = 'none';
        link.appendChild(img);
        map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(link);
        return link;
    }

    function initProjection() {
        var scale,
            zoom = map.getZoom();

        if (zoom < zoomOffsetGeop) {
            scale = function(zoom) {
                return 39135.75 / Math.pow(2, zoom - zoomOffsetMiller);
            };
            googProj.proj = WTGmap.Projection.miller();
            territory = 'world';
        } else {
            var oldTerritory = territory,
                center = map.getCenter(),
                bounds = map.getBounds();

            if (!params[territory] || (bounds && !params[territory].bounds.intersects(bounds))) {
                for(var t in params) {
                    if(params.hasOwnProperty(t) && bounds && params[t].bounds.intersects(bounds)) {
                        territory = t;
                        break;
                    }
                }
            }

            scale = function(zoom) {
                return 2048 / Math.pow(2, zoom - zoomOffsetGeop);
            };
            if (!bounds || oldTerritory != territory) {
                googProj.proj = WTGmap.Projection.geoportal({
                    Kx: params[territory].Kx,
                    Ky: 111319.49079327
                });
                map.setCenter(center);
            }
        }

        googProj.scale0 = scale(0);
        tileSize = options.tileSize.width * scale(zoom);
    }

    google.maps.event.addListener(map, 'idle', drm.getToken);

    initProjection();
    copyright = initCopyright();
    mapType.projection = googProj;

    return {
        mapType: mapType,
        bounds: bounds,
        enable: function() {
            initProjection();
            listeners.zoom = google.maps.event.addListener(map, 'zoom_changed', initProjection);
            listeners.center = google.maps.event.addListener(map, 'center_changed', initProjection);
            copyright.style.display = 'block';
        },
        disable: function() {
            listeners.zoom && google.maps.event.removeListener(listeners.zoom);
            listeners.center && google.maps.event.removeListener(listeners.center);
            copyright.style.display = 'none';
        }
    }
};

WTGmap.Drm = {
    token: null,
    script: null,
    updateToken: function(json) {
        WTGmap.Drm.token = json.gppkey;
        document.body.removeChild(WTGmap.Drm.script);
        WTGmap.Drm.script = null;
    }
}

WTGmap.IgnGeoDrm = function(apiKey) {
    var tickTimer,
        tiles = 1,
        ttl = 1;

    function xdSend(url) {
        WTGmap.Drm.script = document.createElement('script');
        WTGmap.Drm.script.setAttribute('src', url);
        WTGmap.Drm.script.setAttribute('type', 'text/javascript');
        document.body.appendChild(WTGmap.Drm.script);
    }

    function getToken() {
        if (tiles > 0) {
            tiles = 0;
            tickTimer = window.setTimeout(getToken, 1 * 60 * 1000);
            if (--ttl === 0) {
                ttl = 9;
                xdSend('http://jeton-api.ign.fr/getToken?callback=WTGmap.Drm.updateToken&output=json&key=' + apiKey + (WTGmap.Drm.token ? '&gppkey=' + WTGmap.Drm.token : ''));
            }
        } else {
            xdSend('http://jeton-api.ign.fr/releaseToken?gppkey=' + WTGmap.Drm.token);
            ttl = 1;
            WTGmap.Drm.token = null;
            tickTimer = null;
        }
    }

    getToken();

    return {
        getToken: function() {
            tiles++;
            if (!tickTimer) {
                getToken();
            }
            return WTGmap.Drm.token;
        }
    }

}