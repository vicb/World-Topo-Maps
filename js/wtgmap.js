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
        A:  6378137,
        B:  6356752.314,
        IF: 298.257220143
    }

    /**
     * Source by Nianwei Liu :
     * http://code.google.com/p/google-maps-utility-library-v3/source/browse/trunk/arcgislink/src/arcgislink.js
     *
     * Create a Transverse Mercator Projection. The <code>params</code> passed in constructor should contain the
     * following properties: <br/>
     * <code>
     * <br/>-wkid: well-known id
     * <br/>-semi_major:  ellipsoidal semi-major axis in meters
     * <br/>-unit: meters per unit
     * <br/>-inverse_flattening: inverse of flattening of the ellipsoid where 1/f  =  a/(a - b)
     * <br/>-Scale Factor: scale factor at origin
     * <br/>-latitude_of_origin: phi0, latitude of the false origin
     * <br/>-central_meridian: lamda0, longitude of the false origin  (with respect to the prime meridian)
     * <br/>-false_easting: FE, false easting, the Eastings value assigned to the natural origin
     * <br/>-false_northing: FN, false northing, the Northings value assigned to the natural origin
     * </code>
     * <br/>e.g. Georgia West State Plane NAD83 Feet:
     * <br/><code> var gawsp83  = new TransverseMercator({wkid: 102667, semi_major:6378137.0,
     *  inverse_flattening:298.257222101,central_meridian:-84.16666666666667, latitude_of_origin: 30.0,
     *  scale_factor:0.9999, false_easting:2296583.333333333, false_northing:0, unit: 0.3048006096012192});
     *  </code>
     * @param {Object} params
     * @name TransverseMercator
     * @constructor
     * @class This class (<code>TransverseMercator</code>) represents a Spatial Reference System based on
     * <a target  = wiki href  = 'http://en.wikipedia.org/wiki/Transverse_Mercator_projection'>Transverse Mercator Projection</a>
     */
    function TransverseMercator(params) {
        console.log('ctor');
        params = params || {};
        //GLatLng(33.74561,-84.454308)<  === >  GPoint(2209149.07977075, 1362617.71496891);
        this.a_ = params.semi_major / params.unit;
        var f_i = params.inverse_flattening;
        this.k0_ = params.scale_factor;
        var phi0 = deg2rad(params.latitude_of_origin);
        this.lamda0_ = deg2rad(params.central_meridian);
        this.FE_ = params.false_easting;
        this.FN_ = params.false_northing;
        var f = 1.0 / f_i;//this.
        /*e: eccentricity of the ellipsoid where e^2  =  2f - f^2 */
        this.es_ = 2 * f - f * f;
        /* e^4 */
        this.ep4_ = this.es_ * this.es_;
        /* e^6 */
        this.ep6_ = this.ep4_ * this.es_;
        /* e'  second eccentricity where e'^2  =  e^2 / (1-e^2) */
        this.eas_ = this.es_ / (1 - this.es_);
        this.M0_ = this.calc_m_(phi0, this.a_, this.es_, this.ep4_, this.ep6_);
    }

      /**
       * calc_m_
       * @param {Object} phi
       * @param {Object} a
       * @param {Object} es
       * @param {Object} ep4
       * @param {Object} ep6
       */
    TransverseMercator.prototype.calc_m_ = function(phi, a, es, ep4, ep6) {
        return a * ((1 - es / 4 - 3 * ep4 / 64 - 5 * ep6 / 256) * phi - (3 * es / 8 + 3 * ep4 / 32 + 45 * ep6 / 1024) * Math.sin(2 * phi) + (15 * ep4 / 256 + 45 * ep6 / 1024) * Math.sin(4 * phi) - (35 * ep6 / 3072) * Math.sin(6 * phi));
      };
      /**
       * see {@link SpatialReference}
     * @param {Array.number} lnglat
     * @return {Array.number}
       */
    TransverseMercator.prototype.forward = function(lnglat) {
        var phi = deg2rad(lnglat[1]);
        var lamda = deg2rad(lnglat[0]);
        var nu = this.a_ / Math.sqrt(1 - this.es_ * Math.pow(Math.sin(phi), 2));
        var T = Math.pow(Math.tan(phi), 2);
        var C = this.eas_ * Math.pow(Math.cos(phi), 2);
        var A = (lamda - this.lamda0_) * Math.cos(phi);
        var M = this.calc_m_(phi, this.a_, this.es_, this.ep4_, this.ep6_);
        var E = this.FE_ + this.k0_ * nu * (A + (1 - T + C) * Math.pow(A, 3) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * this.eas_) * Math.pow(A, 5) / 120);
        var N = this.FN_ + this.k0_ * (M - this.M0_) + nu * Math.tan(phi) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 120 + (61 - 58 * T + T * T + 600 * C - 330 * this.eas_) * Math.pow(A, 6) / 720);
        return [E, N];
      };
      /**
       * see {@link SpatialReference}
     * @param {Array.number}  coords
     * @return {Array.number}
       */
    TransverseMercator.prototype.inverse = function(coords) {
        var E = coords[0];
        var N = coords[1];
        var e1 = (1 - Math.sqrt(1 - this.es_)) / (1 + Math.sqrt(1 - this.es_));
        var M1 = this.M0_ + (N - this.FN_) / this.k0_;
        var mu1 = M1 / (this.a_ * (1 - this.es_ / 4 - 3 * this.ep4_ / 64 - 5 * this.ep6_ / 256));
        var phi1 = mu1 + (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu1) + (21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu1) + (151 * Math.pow(e1, 3) / 6) * Math.sin(6 * mu1) + (1097 * Math.pow(e1, 4) / 512) * Math.sin(8 * mu1);
        var C1 = this.eas_ * Math.pow(Math.cos(phi1), 2);
        var T1 = Math.pow(Math.tan(phi1), 2);
        var N1 = this.a_ / Math.sqrt(1 - this.es_ * Math.pow(Math.sin(phi1), 2));
        var R1 = this.a_ * (1 - this.es_) / Math.pow((1 - this.es_ * Math.pow(Math.sin(phi1), 2)), 3 / 2);
        var D = (E - this.FE_) / (N1 * this.k0_);
        var phi = phi1 - (N1 * Math.tan(phi1) / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * this.eas_) * Math.pow(D, 4) / 24 + (61 + 90 * T1 + 28 * C1 + 45 * T1 * T1 - 252 * this.eas_ - 3 * C1 * C1) * Math.pow(D, 6) / 720);
        var lamda = this.lamda0_ + (D - (1 + 2 * T1 + C1) * Math.pow(D, 3) / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * this.eas_ + 24 * T1 * T1) * Math.pow(D, 5) / 120) / Math.cos(phi1);
        return [rad2deg(lamda), rad2deg(phi)];
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
            var proj = new TransverseMercator({
                semi_major: wgs84.A,
                inverse_flattening: wgs84.IF,
                unit: 1,
                scale_factor: 0.9996,
                false_easting: 500000,
                latitude_of_origin: 0,
                false_northing: 0,
                central_meridian: zone * 6 - 183
            });

            return {
                name: 'UTM',
                origin: {x: 0, y: 0},
                forward: function(lat, lng) {
                    var point = proj.forward([lng, lat]);
                    return {
                        x: point[0],
                        y: point[1]
                    };
                },
                inverse: function(x, y) {
                    var ll =  proj.inverse([x, y]);
                    return {
                        lat: ll[1],
                        lng: ll[0]
                    }
                }
            };
        },

        google: function(proj, scale0) {
            return new Projection(proj, scale0);
        }
    };

}();