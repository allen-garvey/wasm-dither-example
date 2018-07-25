
let workerLoadWasmResponseCode = null;
let workerHasSentPixels = false;
function ditherWorkerMessageReceived(e){
	const messageData = e.data;
	if(workerLoadWasmResponseCode === null){
		const responseCodeArray = new Int8Array(messageData);
		workerLoadWasmResponseCode = responseCodeArray[0];
		//check for success
		if(workerLoadWasmResponseCode > 0){
			//success
			document.documentElement.classList.remove('loading');
		}
		else{
			//failed
			document.getElementById('status-message').textContent = "Looks like something went wrong, or your browser does not support WebAssembly.";
		}
		return;
	}
	if(!workerHasSentPixels){
		//buffer might be bigger than actual pixels
		const pixels = new Uint8Array(messageData).subarray(0, displayCanvas.width * displayCanvas.height * 4);
		displayDitherResults(pixels);
		workerHasSentPixels = true;
	}
	else{
		//display performance results
		const performanceResults = new Float32Array(messageData);
		displayPerformanceResults(performanceResults[0], performanceResults[1]);
		workerHasSentPixels = false;
	}
}

const displayCanvas = document.getElementById('display-canvas');
const displayCanvasContext = displayCanvas.getContext('2d');
const imageElement = document.createElement('img');
let currentImageObjectUrl;

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
		loadImage(imageElement);
	};
	if(currentImageObjectUrl){
		URL.revokeObjectURL(currentImageObjectUrl);
	}
	currentImageObjectUrl = URL.createObjectURL(file);
	imageElement.src = currentImageObjectUrl;
	
	this.value = null;
}, false);

//create webworker
const ditherWorker = new Worker('js/worker.js');
ditherWorker.onmessage = ditherWorkerMessageReceived;
//send wasm to worker
fetch('js/dither.wasm').then((response)=>{
	return response.arrayBuffer();
}).then((buffer)=>{
	ditherWorker.postMessage(buffer);
}).catch((e)=>{
	console.log(e);
	document.getElementById('status-message').textContent = "Could not fetch WebAssembly file";
});

function canvasLoadImage(canvas, context, image, scale=1){
	const scaledImageWidth = Math.round(image.width * scale);
	const scaledImageHeight = Math.round(image.height * scale);
	canvas.width = scaledImageWidth;
	canvas.height = scaledImageHeight;
	context.drawImage(image, 0, 0, scaledImageWidth, scaledImageHeight);
}

//pixels should be UInt8ClampedArray
function drawPixels(context, imageWidth, imageHeight, pixels){
	const imageData = context.createImageData(imageWidth, imageHeight);
	imageData.data.set(pixels);
	context.putImageData(imageData, 0, 0);
}

function clearCanvas(context){
	context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}


function loadImage(image){
	let scaledImageWidth = image.width;
	let scaledImageHeight = image.height;

	//scale image if too large (required for phones)
	const largestDimension = Math.max(scaledImageWidth, scaledImageHeight);
	const maxImageDimension = Math.min(window.innerWidth, 1800);
	const scale = largestDimension > maxImageDimension ? maxImageDimension / largestDimension : 1;
	
	//turn image into arrayBuffer by drawing it and then getting it from canvas
	clearCanvas(displayCanvasContext);
	canvasLoadImage(displayCanvas, displayCanvasContext, image, scale);
	scaledImageWidth = displayCanvas.width;
	scaledImageHeight = displayCanvas.height;
	const pixels = new Uint8Array(displayCanvasContext.getImageData(0, 0, scaledImageWidth, scaledImageHeight).data.buffer);

	const imageHeader = new Uint16Array([scaledImageWidth, scaledImageHeight]);
	ditherWorker.postMessage(imageHeader.buffer, [imageHeader.buffer]);
	ditherWorker.postMessage(pixels.buffer, [pixels.buffer]);
}

function displayDitherResults(ditherResultPixels){
	clearCanvas(displayCanvasContext);
	drawPixels(displayCanvasContext, displayCanvas.width, displayCanvas.height, ditherResultPixels);
}

function displayPerformanceResults(seconds, megapixelsPerSecond){
	document.getElementById('performance-results').textContent = `Ordered dithering performance: ${seconds} seconds, ${megapixelsPerSecond.toFixed(2)} megapixels per second`;
}