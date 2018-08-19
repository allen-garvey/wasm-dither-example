# wasm-dither-example

Example of using WebAssembly with D and LDC to dither an image in the browser, and compare performance with a pure JavaScript implementation. Demo at [https://allen-garvey.github.io/wasm-dither-example/](https://allen-garvey.github.io/wasm-dither-example/)

## Dependencies for running

* Modern web browser that supports WebAssembly

## Dependencies for building

* [LDC >= 1.11.0](https://github.com/ldc-developers/ldc/releases/tag/v1.11.0)
* make

## Optional dependencies (for serving files for local development)

* npm and node >= 6
* python 2
* python 3

## Getting Started

* Run `make`
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

## Helpful Resources

* [Generating WebAssembly with LDC](https://wiki.dlang.org/Generating_WebAssembly_with_LDC)
* [WebAssembly Overview: So Fast! So Fun! Sorta Difficult!](https://dzone.com/articles/webassembly-overview-so-fast-so-fun-sorta-difficul)
* [How to return a string (or similar) from Rust in WebAssembly?](https://stackoverflow.com/questions/47529643/how-to-return-a-string-or-similar-from-rust-in-webassembly)

## License

wasm-dither-example is released under the MIT License. See license.txt for more details.