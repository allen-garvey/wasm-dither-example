# wasm-dither-example

Initial example of using WebAssembly with D and LDC to dither an image in the browser, [based off this tutorial](https://wiki.dlang.org/Generating_WebAssembly_with_LDC). Demo at [https://allen-garvey.github.io/wasm-dither-example/](https://allen-garvey.github.io/wasm-dither-example/)

## Dependencies for building

* [LDC >= 1.11.0 beta2](https://github.com/ldc-developers/ldc/releases/)

## Optional dependencies (for serving files for local development)

* npm and node >= 6
* python 2
* python 3

## Dependencies for running

* Modern web browser that supports WebAssembly

## Getting Started

* Make sure `-L--no-warn-search-mismatch` is removed or commented out in `/etc/ldc2.conf `in the ldc2 binary directory
* Run `./build`
* If you have any of the optional dependencies, follow the instructions in the relevant section. Otherwise, you will need a local web server setup to serve files from the `docs` directory in this repository.

### Serving files using npm and node

* Run `npm install`
* Run `npm start`
* Open your browser to [http://localhost:3000](http://localhost:3000)

### Serving files with python 2

* `cd` into the `docs` directory in this repository
* Run `python -m SimpleHTTPServer 3000`
* Open your browser to [http://localhost:3000](http://localhost:3000)

### Serving files with python 3

* `cd` into the `docs` directory in this repository
* Run `python3 -m http.server 3000`
* Open your browser to [http://localhost:3000](http://localhost:3000)

## License

wasm-dither-example is released under the MIT License. See license.txt for more details.