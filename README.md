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
   - `es6-promise.js` - JavaScript Promise polyfill (modified for compatibility with ArcGIS API)
   - `main.js` - The main JavaScript file
   - `style.css` - The main CSS stylesheet
   - `style-simple.css` - A simpler CSS stylesheet (used to be used for templated pages in [sergis-server](https://github.com/sergisproject/sergis-server))
   - `testdata.json` - Some sample [SerGIS JSON Game Data](http://sergisproject.github.io/docs/json.html) that is used by the `local.js` backend

## TODO

- Fix issues with jumping around and maps (check how this all works out...)
- Add option to "Restart Game" when score is shown
- Make "Find Path" work (network analyst)
- Add ability to buffer features in a feature layer
- Support conditionals and collectibles and shit
  - In the JSON spec, with conditionals, add some sort of way to retrieve a user's choice for a specific prompt (as a variable-like thing in a conditional)

- Add ability to specify multiple basemaps in frontend info, which would allow the user to choose. (See JSON spec)
- Add ability to specify multiple map projections in frontend info, which would allow the user to choose. (Needs to be implemented in JSON spec)

## License

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.

For more, see `LICENSE.txt` and `CONTRIBUTORS.txt`.
