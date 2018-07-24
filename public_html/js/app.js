
WebAssembly.instantiateStreaming(fetch('js/dither.wasm'), {})
	.then(wasmResults => {
  		const wasmExports = wasmResults.instance.exports;
	});