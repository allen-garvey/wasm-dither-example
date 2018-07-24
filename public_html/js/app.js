
WebAssembly.instantiateStreaming(fetch('js/dither.wasm'), {})
	.then(wasmResults => {
		console.log(wasmResults);
		const wasmExports = wasmResults.instance.exports;

		//setting memory from: https://stackoverflow.com/questions/46748572/how-to-access-webassembly-linear-memory-from-c-c
		// wasmExports.memory.grow(3);
		const linearMemory = new Uint8Array(wasmExports.memory.buffer);
		linearMemory[0] = 1;
		
		wasmExports.dither(8, 1);
		
		console.log(linearMemory);
	});