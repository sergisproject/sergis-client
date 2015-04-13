# SerGIS Web Client

The web-based client for [the SerGIS Project](http://sergisproject.github.io/)

## Files

 - `index.html` - The main HTML file
 - `lib` - Directory of static resources (CSS stylesheets and JavaScript files)
   - `backends` - Directory of [SerGIS backends](http://sergisproject.github.io/docs/client.html#backends)
     - `game-common.js` - Common code that is shared between multiple backends
     - `local.js` - A special backend that uses local files instead of accessing a server for data
     - `sergis-server.js` - A backend that uses [SerGIS Server](https://github.com/sergisproject/sergis-server)
   - `frontends` - Directory of [SerGIS frontends](http://sergisproject.github.io/docs/client.html#frontends)
     - `arcgis.js` - A frontend that uses the ArcGIS JavaScript API to render the map
   - `es6-promise-2.0.0.min.js` - JavaScript Promise polyfill (modified for compatibility with ArcGIS API)
   - `main.js` - The main JavaScript file
   - `style.css` - The main CSS stylesheet
   - `style-simple.css` - A simpler CSS stylesheet (used for templated pages in [sergis-server](https://github.com/sergisproject/sergis-server))
   - `testdata.json` - Some sample [SerGIS JSON Game Data](http://sergisproject.github.io/docs/json.html) that is used by the `local.js` backend

## TODO

- make little thingie below map popup the first time we use it to tell the user that they can toggle layers
- json for changing map projection (and/or ability for user to change it in toolbar)
- ability for user to change basemap in toolbar (so, this and the projection would have defaults in the JSON and be changable by the user in the toolbar; this would be prompt-specific)
- Make "Find Path" work


## License

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.

For more, see `LICENSE.txt` and `CONTRIBUTORS.txt`.
