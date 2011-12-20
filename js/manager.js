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
            WTMap.gmap.mapTypes = options.mapTypeControlOptions.mapTypeIds;
        }
    }

    google.maps.Map = function(node, options) {
        map = this;
        setMapTypes(options || {});
        ctor.apply(this, arguments);

        setOptions = ctor.prototype.setOptions;
        ctor.prototype.setOptions = function(options) {
            setMapTypes(options);
            WTMap.gmap.setOptions(arguments);
        };
    };

    google.maps.Map.prototype = ctor.prototype;

    WTMap.gmap = {
        mapTypes: [
            google.maps.MapTypeId.ROADMAP,
            google.maps.MapTypeId.TERRAIN,
            google.maps.MapTypeId.SATELLITE
        ],
        setOptions: function() {setOptions.apply(map, arguments);}
    };
})();

/**
 * The map manager is used to enable only visible maps in the MapTypeControl
 *  @param {google.maps.Map} map  A google map instance (base on API v3)
 *  @param {Array.<map>}     maps A list of maps to be managed
 */
WTMap.Manager = function(adapter, maps) {
    var nbMap = maps.length,
        wtgBounds = [],
        signature;

    /**
     * Enable the currently selected map
     */
    function enableMaps() {
        var enable = false,
            currentMap = adapter.map.getMapTypeId();
        for (var i = 0; i < nbMap; i++) {
            if (currentMap === getMapName(i)) {
                enable = i;
            } else {
                maps[i].disable();
            }
        }
        if (enable !== false) {
            maps[enable].enable();
        }
    }

    /**
     * Activate only the visible maps
     */
    function activateMaps() {
        var nbBounds,
            found = false,
            mapTypes = WTMap.gmap.mapTypes.slice(),
            center = adapter.map.getCenter();

        if (center) {
            // Build the list of visible maps
            for (var i = 0; i < nbMap; i++) {
                nbBounds = wtgBounds[i].length;
                found = false;
                for (var j = 0; j < nbBounds; j++) {
//                    if (wtgBounds[i][j].contains(center)) {
                    if (wtgBounds[i][j].sw.lat < center.lat() && wtgBounds[i][j].ne.lat > center.lat() &&
                        wtgBounds[i][j].sw.lng < center.lng() && wtgBounds[i][j].ne.lng > center.lng()) {
                        mapTypes.push(getMapName(i));
                        found = true;
                        break;
                    }
                }
                // If the current map is not visible, fallback to the first map
                if (!found && adapter.map.getMapTypeId() === getMapName(i)) {
                    adapter.map.setMapTypeId(WTMap.gmap.mapTypes[0]);
                }
            }

            // Update the MapTypeControl only when required to prevent flickering
            if (mapTypes.toString() !== signature) {
                WTMap.gmap.setOptions({
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
            adapter.map.mapTypes.set(getMapName(i), adapter.getMapType(maps[i]));
            bounds = maps[i].getBounds();
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
    google.maps.event.addListener(adapter.map, 'maptypeid_changed', enableMaps);
    // Update the list of visible maps when the map moves
    google.maps.event.addListener(adapter.map, 'bounds_changed', activateMaps);
};

