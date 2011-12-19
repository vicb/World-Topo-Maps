# World Topo Map

Adds topo map layers to Google Maps API v3.

**Please make sure to conform to the license terms for any layer you use.**

## Data source

### France

* [IGN](http://www.ign.fr) tiles
    * topographic maps & satellite images
    * [license](https://api.ign.fr/geoportail/presentation.do?presentationSubjectId=6)
    * [Request an API key](https://api.ign.fr/geoportail/registration.do)
    * [documentation](https://api.ign.fr/geoportail/api/doc/index.html)

### Spain

* [Iberpix](http://www.ign.es) tiles
    * topographic maps & satellite images

### Switzerland

* [SwissTopo](http://www.swisstopo.ch/) tiles
    * topographic maps & satellite images
    * [license](http://www.swisstopo.admin.ch/internet/swisstopo/en/home/products/services/web_services/webaccess.html#parsys_91592)
    * [request an API key](http://www.geo.admin.ch/internet/geoportal/fr/home/services/geoservices/display_services/api_services/order_form.html)
    * [documentation](http://api.geo.admin.ch/main/wsgi/doc/build/services/sdiservices.html#wmts)

## Credits

Various resources that saved me a lot of development time:

* Shama [explains](http://www.developpez.net/forums/d999116/applications/sig-systeme-dinformation-geographique/ign-api-geoportail/affichage-couches-ign-sous-googlemap/) how to integrate geoportail tiles within Google maps API.
* Marcin Grysko [explains](http://grysz.com/2011/04/12/how-ign-tile-servers-work/) how the spain ign tile server works.
* World Topo Maps uses some code from [Chuck Taylor](http://home.hiwaay.net/~taylorc/toolbox/geography/geoutm.html) for the UTM projection (not used any more)
* [Transverse Mercator](http://code.google.com/p/google-maps-utility-library-v3/source/browse/trunk/arcgislink/src/arcgislink.js) projection from Nianwei Liu.

## Todo

* Make the core class API agnostic to make it possible to support other mapping libraries.