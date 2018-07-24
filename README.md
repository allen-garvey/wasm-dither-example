# wasm-dither-test

Initial test of using webassembly with D and ldc2 to dither an image in the browser. [Based off of this tutorial](https://wiki.dlang.org/Generating_WebAssembly_with_LDC)

## Dependencies for building

* ldc2 >= 1.11.0 beta2
* npm
* node >= 6

## Dependencies for running

* Modern web browser that supports webassembly

## Getting Started

* Make sure `-L--no-warn-search-mismatch` is removed or commented out in `/etc/ldc2.conf `in the ldc2 binary directory
* Run `./compile`
* Run `npm install && npm start`
* Open your browser to [http://localhost:3000](http://localhost:3000)

## License

wasm-dither-test is released under the MIT License. See license.txt for more details.