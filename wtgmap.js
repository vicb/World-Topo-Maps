/*
 * This file is part of the World Topo Map project.
 *
 * (c) Victor Berchet <victor@suumit.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

var WTGmap = {
    LAYER_MAP:   'MAP',
    LAYER_PHOTO: 'PHOTO'
};

WTGmap.Projection = function() {
    /**
     * Convert degree to radian
     *
     * @param {number} deg The value expressed in degree
     *
     * @return {number} The value expressed in radian
     */
     function deg2rad(deg) {
         return deg * Math.PI / 180;
     }

    /**
     * Convert radian to degree
     *
     * @param {number} rad The value expressed in radian
     *
     * @return {number} The value expressed in degree
     */

     function rad2deg(rad) {
         return rad / Math.PI * 180;
     }

    /**
     * Convert degree to sexagecimal seconds
     *
     * @param {number} angle The value expressed in decimal degree
     *
     * @return {number} The value expressed in sexagecimal second
     */
    function deg2secsex(angle) {
        var deg = parseInt(angle),
            min = parseInt((angle - deg) * 60),
            sec = (((angle - deg) * 60) - min) * 60;
        return sec + min * 60 + deg * 3600;
    }

    var wgs84 = {
        A: 6378137,
        B: 6356752.314
    }

    var utm = {
        // credits: Chuck Taylor @ http://home.hiwaay.net/~taylorc/toolbox/geography/geoutm.html
        SCALE_FACTOR: 0.9996,
        arcLengthOfMeridian: function(phi) {
            var n = (wgs84.A - wgs84.B) / (wgs84.A + wgs84.B),
                alpha = (wgs84.A + wgs84.B) / 2 * (1 + Math.pow(n, 2) / 4 + Math.pow(n, 4) / 64),
                beta = -3 * n / 2 + 9 * Math.pow(n, 3) / 16 - 3 * Math.pow(n, 5) / 32,
                gamma = 15 * Math.pow(n, 2) / 16 + 15 * Math.pow(n, 4) / 32,
                delta = -35 * Math.pow(n, 3) / 48 + 105 * Math.pow(n, 5) / 256,
                epsilon = 315 * Math.pow(n, 4) / 512;

            return alpha * (
                phi
                + beta * Math.sin (2 * phi)
                + gamma * Math.sin (4 * phi)
                + delta * Math.sin (6 * phi)
                + epsilon * Math.sin (8 * phi)
            )
        },
        centralMeridian: function(zone) {
            return deg2rad(-183 + (zone * 6));
        },
        footpointLatitude: function(y)
        {
            var n = (wgs84.A - wgs84.B) / (wgs84.A + wgs84.B),
                alpha = (wgs84.A + wgs84.B) / 2 * (1 + Math.pow(n, 2) / 4 + Math.pow(n, 4) / 64),
                y = y / alpha,
                beta = 3 * n / 2 - 27 * Math.pow(n, 3) / 32 + 269 * Math.pow(n, 5) / 512,
                gamma = 21 * Math.pow(n, 2) / 16 - 55 * Math.pow(n, 4) / 32,
                delta = 151 * Math.pow(n, 3) / 96 - 417 * Math.pow(n, 5) / 128,
                epsilon = 1097 * Math.pow(n, 4) / 512;

            return y
                + beta * Math.sin(2 * y)
                + gamma * Math.sin(4 * y)
                + delta * Math.sin(6 * y)
                + epsilon * Math.sin(8 * y)
            ;
        },
        mapLatLonToXY: function(phi, lambda, lambda0) {
            var ep2 = (Math.pow(wgs84.A, 2) - Math.pow(wgs84.B, 2)) / Math.pow(wgs84.B, 2),
                nu2 = ep2 * Math.pow(Math.cos(phi), 2),
                N = Math.pow(wgs84.A, 2) / wgs84.B / Math.sqrt(1 + nu2),
                t = Math.tan(phi),
                t2 = t * t,
                tmp = t2 * t2 * t2 - Math.pow(t, 6),
                l = lambda - lambda0,
                l3 = 1 - t2 + nu2,
                l4 = 5 - t2 + 9 * nu2 + 4 * nu2 * nu2,
                l5 = 5 - 18 * t2 + t2 * t2 + 14 * nu2 - 58 * t2 * nu2,
                l6 = 61 - 58 * t2 + t2 * t2 + 270 * nu2 - 330 * t2 * nu2,
                l7 = 61 - 479 * t2 + 179 * t2 * t2 - t2 * t2 * t2,
                l8 = 1385 - 3111 * t2 + 543 * t2 * t2 - t2 * t2 * t2;

            return {
                x: N * Math.cos(phi) * l
                    + (N / 6 * Math.pow(Math.cos(phi), 3) * l3 * Math.pow(l, 3))
                    + (N / 120 * Math.pow(Math.cos(phi), 5) * l5 * Math.pow(l, 5))
                    + (N / 5040 * Math.pow(Math.cos(phi), 7) * l7 * Math.pow(l, 7)),
                y: utm.arcLengthOfMeridian(phi)
                    + (t / 2 * N * Math.pow(Math.cos(phi), 2) * Math.pow(l, 2))
                    + (t / 24 * N * Math.pow(Math.cos(phi), 4) * l4 * Math.pow (l, 4))
                    + (t / 720 * N * Math.pow(Math.cos(phi), 6) * l6 * Math.pow (l, 6))
                    + (t / 40320 * N * Math.pow(Math.cos(phi), 8) * l8 * Math.pow (l, 8))
            }
        },
        mapXYToLatLon: function(x, y, lambda0)
        {
            var phif = utm.footpointLatitude(y),
                ep2 = (Math.pow (wgs84.A, 2) - Math.pow (wgs84.B, 2)) / Math.pow (wgs84.B, 2),
                cf = Math.cos(phif),
                nuf2 = ep2 * Math.pow (cf, 2),
                Nf = Math.pow(wgs84.A, 2) / (wgs84.B * Math.sqrt(1 + nuf2)),
                tf = Math.tan(phif),
                tf2 = tf * tf,
                tf4 = tf2 * tf2,
                x1frac = 1 / (Nf * cf),
                x2frac = tf / (2 * Math.pow(Nf, 2)),
                x3frac = 1 / (6 * Math.pow(Nf, 3) * cf),
                x4frac = tf / (24 * Math.pow(Nf, 4)),
                x5frac = 1 / (120 * Math.pow(Nf, 5) * cf),
                x6frac = tf / (720 * Math.pow(Nf, 6)),
                x7frac = 1 / (5040 * Math.pow(Nf, 7) * cf),
                x8frac = tf / (40320 * Math.pow(Nf, 8)),
                x2poly = -1 - nuf2,
                x3poly = -1 - 2 * tf2 - nuf2,
                x4poly = 5 + 3 * tf2 + 6 * nuf2 - 6 * tf2 * nuf2 - 3 * (nuf2 *nuf2) - 9 * tf2 * (nuf2 * nuf2),
                x5poly = 5 + 28 * tf2 + 24 * tf4 + 6 * nuf2 + 8 * tf2 * nuf2,
                x6poly = -61 - 90 * tf2 - 45 * tf4 - 107 * nuf2	+ 162 * tf2 * nuf2,
                x7poly = -61 - 662 * tf2 - 1320 * tf4 - 720 * (tf4 * tf2),
                x8poly = 1385 + 3633 * tf2 + 4095 * tf4 + 1575 * (tf4 * tf2);

            return {
                lat: phif
                    + x2frac * x2poly * (x * x)
                    + x4frac * x4poly * Math.pow(x, 4)
                    + x6frac * x6poly * Math.pow(x, 6)
                    + x8frac * x8poly * Math.pow(x, 8),

                lng: lambda0 + x1frac * x
                    + x3frac * x3poly * Math.pow(x, 3)
                    + x5frac * x5poly * Math.pow(x, 5)
                    + x7frac * x7poly * Math.pow(x, 7)
            };
        }

    };

    /**
     * The google map projection
     *
     * @constructor
     * @param {object=} proj   The projection object
     * @param {number}  scale0 The resolution at zoom level0 (= a single tile)
     *
     * @return {google.maps.Projection} The projection
     */
    function Projection(proj, scale0) {
        this.proj = proj;
        this.scale0 = scale0;
    }

    /**
     * Forward projection
     *
     * @param {google.maps.LatLng} latLng The coordinates
     *
     * @return {google.maps.Point} The projected coordinates
     */
    Projection.prototype.fromLatLngToPoint = function(latLng) {
        var coord = this.proj.forward(latLng.lat(), latLng.lng());
        return new google.maps.Point(
            (coord.x - this.proj.origin.x) / this.scale0,
            (this.proj.origin.y - coord.y) / this.scale0
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
        var coord = this.proj.inverse(
            this.proj.origin.x + point.x * this.scale0,
            this.proj.origin.y - point.y * this.scale0
        );
        return new google.maps.LatLng(coord.lat, coord.lng, noWrap);
    };

    return {
        swisstopo: function() {
            return {
                name: '21781',
                origin: {x: 420000, y: 350000},
                forward : function(lat, lng) {
                    lat = (deg2secsex(lat) - 169028.66) / 10000;
                    lng = (deg2secsex(lng) - 26782.5) / 10000;

                    var lat2 = Math.pow(lat, 2),
                        lat3 = Math.pow(lat, 3),
                        lng2 = Math.pow(lng, 2),
                        lng3 = Math.pow(lng, 3)

                    return {
                        x: 600072.37 + 211455.93 * lng -  10938.51 * lng * lat - 0.36 * lng * lat2 - 44.54 * lng3,
                        y: 200147.07 + 308807.95 * lat + 3745.25 * lng2 + 76.63 * lat2 - 194.56 * lng2 * lat + 119.79 * lat3
                    };
                },
                inverse : function(x, y) {
                    x = (x - 600000) / 1000000;
                    y = (y - 200000) / 1000000;

                    var y2 = Math.pow(y, 2),
                        y3 = Math.pow(y, 3),
                        x2 = Math.pow(x, 2),
                        x3 = Math.pow(x, 3);

                    return {
                        lat: 100 / 36 * (16.9023892 +  3.238272 * y - 0.270978 * x2 - 0.002528 * y2 - 0.0447 * x2 * y - 0.0140 * y3),
                        lng: 100 / 36 * (2.6779094 + 4.728982 * x + 0.791484 * x * y + 0.1306 * x * y2 - 0.0436 * x3)
                    };
                }
            }
        },

        geoportal: function(factors) {
            return {
                name: 'IGNF:GEOPORTAL{territory}',
                origin: {x: 0, y: 0},
                forward : function(lat, lng) {
                    return {
                        x: lng * factors.Kx,
                        y: lat * factors.Ky
                    };
                },
                inverse : function(x, y) {
                    return {
                        lat: y / factors.Ky,
                        lng: x / factors.Kx
                    };
                }
            }
        },

        miller: function() {
            return {
                name: 'IGNF:MILLER',
                origin: {x: 0, y: 0},
                forward: function(lat, lng) {
                    return {
                        x: deg2rad(lng) * 6378137,
                        y: 6378137 * Math.log(Math.tan(Math.PI / 4 + deg2rad(lat) * 0.4)) * 1.25
                    }
                },
                inverse: function(x, y) {
                    return {
                        lng: rad2deg(x) / 6378137,
                        lat: rad2deg(Math.atan(Math.exp(y / 6378137 / 1.25)) - Math.PI / 4) / 0.4
                    }

                }
            };
        },

        iberpix: function(zone) {
            return {
                name: 'UTM',
                origin: {x: 0, y: 0},
                forward: function(lat, lng) {
                    var point = utm.mapLatLonToXY(
                        deg2rad(lat),
                        deg2rad(lng),
                        utm.centralMeridian(zone)
                    );
                    return {
                        x: point.x * utm.SCALE_FACTOR + 500000,
                        y: point.y * utm.SCALE_FACTOR
                    };
                },
                inverse: function(x, y) {
                    var ll =  utm.mapXYToLatLon(
                        (x - 500000) / utm.SCALE_FACTOR,
                        y / utm.SCALE_FACTOR,
                        utm.centralMeridian(zone)
                    );
                    return {
                        lat: rad2deg(ll.lat),
                        lng: rad2deg(ll.lng)
                    }
                }
            };
        },

        google: function(proj, scale0) {
            return new Projection(proj, scale0);
        }
    };

}();