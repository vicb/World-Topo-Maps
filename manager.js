/*
 * This file is part of the World Topo Map project.
 *
 * (c) Victor Berchet <victor@suumit.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

(function() {
    var map,
        setOptions,
        ctor = google.maps.Map;

    function setMapTypes(options) {
        if (options && options.mapTypeControlOptions && options.mapTypeControlOptions.mapTypeIds) {
            WTGmap.gmap.mapTypes = options.mapTypeControlOptions.mapTypeIds;
        }
    }

    google.maps.Map = function(node, options) {
        map = this;
        setMapTypes(options);
        ctor.apply(this, arguments);

        setOptions = ctor.prototype.setOptions;
        ctor.prototype.setOptions = function(options) {
            setMapTypes(options);
            WTGmap.gmap.setOptions(arguments);
        };
    };

    google.maps.Map.prototype = ctor.prototype;

    WTGmap.gmap = {
        mapTypes: [
            google.maps.MapTypeId.ROADMAP,
            google.maps.MapTypeId.TERRAIN,
            google.maps.MapTypeId.SATELLITE
        ],
        setOptions: function() { setOptions.apply(map, arguments); }
    };
})();

WTGmap.Manager = function(map, maps) {
    var nbMap = maps.length,
        mapIndex = 0,
        wtgBounds = [],
        signature;

    function enableMaps() {
        var currentMap = map.getMapTypeId();

        for (var i = 0; i < nbMap; i++) {
            maps[i][currentMap == 'WTGMAP.' + i ? 'enable' : 'disable']();
        }
    }

    function activateMaps() {
        var nbBounds,
            found = false,
            mapTypes = WTGmap.gmap.mapTypes.slice(),
            center = map.getCenter();

        if (center) {
            for (var i = 0; i < nbMap; i++) {
                nbBounds = wtgBounds[i].length;
                found = false;
                for (var j = 0; j < nbBounds; j++) {
                    if (wtgBounds[i][j].contains(center)) {
                        mapTypes.push('WTGMAP.' + i);
                        found = true;
                        break;
                    }
                }
                if (!found && map.getMapTypeId() === 'WTGMAP.' + i) {
                    map.setMapTypeId(WTGmap.gmap.mapTypes[0]);
                }
            }

            if (mapTypes.toString() !== signature) {
                WTGmap.gmap.setOptions({
                    mapTypeControlOptions: {
                        mapTypeIds: mapTypes
                    }
                });
                signature = mapTypes.toString();
            }
        }
    }

    function registerMaps() {
        var bounds;
        for (var i = 0; i < nbMap; i++) {
            map.mapTypes.set('WTGMAP.' + mapIndex++, maps[i].mapType);
            bounds = maps[i].bounds;
            wtgBounds.push(bounds.length ? bounds : [bounds]);
        }
    }

    registerMaps();
    activateMaps();
    enableMaps();
    google.maps.event.addListener(map, 'maptypeid_changed', enableMaps);
    google.maps.event.addListener(map, 'bounds_changed', activateMaps);
}


