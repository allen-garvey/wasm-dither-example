
let wasmExports;
const displayCanvas = document.getElementById('display-canvas');
const displayCanvasContext = displayCanvas.getContext('2d');
const imageElement = document.createElement('img');
let currentImageObjectUrl;

WebAssembly.instantiateStreaming(fetch('js/dither.wasm'), {})
	.then(wasmResults => {
		wasmExports = wasmResults.instance.exports;
		document.documentElement.classList.remove('loading');
	});

document.getElementById('image-file-input').addEventListener('change', (e)=>{
	const files = e.target.files;
	if(files.length < 1){
		return window.alert('No files selected');
	}
	const file = files[0];
	if(!file.type.startsWith('image/')){
		return window.alert(`${file.name} appears to be of type ${file.type} rather than an image`);
	}
	imageElement.onload = ()=> {
		loadImage(imageElement, file);
	};
	if(currentImageObjectUrl){
		URL.revokeObjectURL(currentImageObjectUrl);
	}
	currentImageObjectUrl = URL.createObjectURL(file);
	imageElement.src = currentImageObjectUrl;
	
	this.value = null;
}, false);

function canvasLoadImage(canvas, context, image){
	const imageWidth = image.width;
	const imageHeight = image.height;
	canvas.width = imageWidth;
	canvas.height = imageHeight;
	context.drawImage(image, 0, 0, imageWidth, imageHeight);
}


function loadImage(image, file){
	const imageWidth = image.width;
	const imageHeight = image.height;
	
	//turn image into arrayBuffer by drawing it and then getting it from canvas
	canvasLoadImage(displayCanvas, displayCanvasContext, image);
	const pixels = new Uint8Array(displayCanvasContext.getImageData(0, 0, imageWidth, imageWidth).data.buffer);
	
	//setting memory from: https://stackoverflow.com/questions/46748572/how-to-access-webassembly-linear-memory-from-c-c
	const currentMemorySize = wasmExports.memory.buffer.byteLength;
	//see if we need to grow memory
	if(pixels.length > currentMemorySize){
		//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Memory/grow
		//grow will add amount * pageSize to total memory
		const memoryPageSize = 64 * 1024;
		const growthAmount = Math.ceil((pixels.length - currentMemorySize) / memoryPageSize);
		wasmExports.memory.grow(growthAmount);
	}
	//load image into memory
	const wasmHeap = new Uint8Array(wasmExports.memory.buffer);
	wasmHeap.set(pixels);
	//dither image
	wasmExports.dither(imageWidth, imageHeight);
	//dithered image is now in the wasmHeap
	console.log(wasmHeap);
}
