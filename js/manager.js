/*
 * This file is part of the World Topo Map project.
 *
 * (c) Victor Berchet <victor@suumit.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// Override google map ctor and SetOptions method to get the list of enabled maps
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
        setMapTypes(options || {});
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

/**
 * The map manager is used to enable only visible maps in the MapTypeControl
 *  @param {google.maps.Map} map  A google map instance (base on API v3)
 *  @param {Array.<map>}     maps A list of maps to be managed
 */
WTGmap.Manager = function(map, maps) {
    var nbMap = maps.length,
        wtgBounds = [],
        signature;

    /**
     * Enable the currently selected map
     */
    function enableMaps() {
        var currentMap = map.getMapTypeId();
        for (var i = 0; i < nbMap; i++) {
            maps[i][currentMap == 'WTGMAP.' + i ? 'enable' : 'disable']();
        }
    }

    /**
     * Activate only the visible maps
     */
    function activateMaps() {
        var nbBounds,
            found = false,
            mapTypes = WTGmap.gmap.mapTypes.slice(),
            center = map.getCenter();

        if (center) {
            // Build the list of visible maps
            for (var i = 0; i < nbMap; i++) {
                nbBounds = wtgBounds[i].length;
                found = false;
                for (var j = 0; j < nbBounds; j++) {
                    if (wtgBounds[i][j].contains(center)) {
                        mapTypes.push(getMapName(i));
                        found = true;
                        break;
                    }
                }
                // If the current map is not visible, fallback to the first map
                if (!found && map.getMapTypeId() === getMapName(i)) {
                    map.setMapTypeId(WTGmap.gmap.mapTypes[0]);
                }
            }

            // Update the MapTypeControl only when required to prevent flickering
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

    /**
     * Register the managed maps
     */
    function registerMaps() {
        var bounds;
        for (var i = 0; i < nbMap; i++) {
            map.mapTypes.set(getMapName(i), maps[i].mapType);
            bounds = maps[i].bounds;
            wtgBounds.push(bounds.length ? bounds : [bounds]);
        }
    }

    /**
     * Compute the name of the map according to its index
     * @param {number} index The map index
     *
     * @return {string} The map name
     */
    function getMapName(index) {
        return 'WTGMAP.' + index;
    }

    registerMaps();
    activateMaps();
    enableMaps();
    // Enable only the selected map on map changes
    google.maps.event.addListener(map, 'maptypeid_changed', enableMaps);
    // Update the list of visible maps when the map moves
    google.maps.event.addListener(map, 'bounds_changed', activateMaps);
}

