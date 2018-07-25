# wasm-dither-example

Initial example of using WebAssembly with D and ldc2 to dither an image in the browser. [Based off of this tutorial](https://wiki.dlang.org/Generating_WebAssembly_with_LDC)

## Dependencies for building

* ldc2 >= 1.11.0 beta2

## Optional dependencies

* npm
* node >= 6

## Dependencies for running

* Modern web browser that supports WebAssembly

## Getting Started

* Make sure `-L--no-warn-search-mismatch` is removed or commented out in `/etc/ldc2.conf `in the ldc2 binary directory
* Run `./build`
* If you have the optional dependencies, run `npm install`, `npm start` and open your browser to [http://localhost:3000](http://localhost:3000)
* If you do not have npm and node installed, you will need a local web server to serve files from the `docs` directory

## License

wasm-dither-example is released under the MIT License. See license.txt for more details.