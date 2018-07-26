(function(){
	var App = {};
	App.Canvas = (function(){
		function canvasLoadImage(canvas, context, image, scale=1){
			const scaledImageWidth = Math.round(image.width * scale);
			const scaledImageHeight = Math.round(image.height * scale);
			canvas.width = scaledImageWidth;
			canvas.height = scaledImageHeight;
			context.drawImage(image, 0, 0, scaledImageWidth, scaledImageHeight);
		}
		
		//pixels should be UInt8ClampedArray
		function drawPixels(context, imageWidth, imageHeight, pixels){
			context.canvas.width = imageWidth;
			context.canvas.height = imageHeight;
			const imageData = context.createImageData(imageWidth, imageHeight);
			imageData.data.set(pixels);
			context.putImageData(imageData, 0, 0);
		}
		
		function clearCanvas(context){
			context.clearRect(0, 0, context.canvas.width, context.canvas.height);
		}
	
		return {
			loadImage: canvasLoadImage,
			draw: drawPixels,
			clear: clearCanvas,
		};
	})();

	(function(Canvas){
		let workerLoadWasmResponseCode = null;
		let workerHasSentPixels = false;
		let workerResponseImageHeader = null;
		
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
			if(workerResponseImageHeader === null){
				workerResponseImageHeader = new Uint32Array(messageData);
			}
			else if(!workerHasSentPixels){
				//buffer might be bigger than actual pixels
				const pixels = new Uint8Array(messageData).subarray(0, workerResponseImageHeader[0] * workerResponseImageHeader[1] * 4);
				displayDitherResults(pixels, workerResponseImageHeader[0], workerResponseImageHeader[1]);
				workerHasSentPixels = true;
			}
			else{
				//display performance results
				const performanceResults = new Float32Array(messageData);
				displayPerformanceResults(performanceResults[0], performanceResults[1], performanceResults[2]);
				workerHasSentPixels = false;
				workerResponseImageHeader = null;
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
		
		function loadImage(image){
			let scaledImageWidth = image.width;
			let scaledImageHeight = image.height;
		
			//scale image if too large (required for phones)
			const largestDimension = Math.max(scaledImageWidth, scaledImageHeight);
			const maxImageDimension = Math.min(window.innerWidth, 1800);
			const scale = largestDimension > maxImageDimension ? maxImageDimension / largestDimension : 1;
			
			//turn image into arrayBuffer by drawing it and then getting it from canvas
			Canvas.clear(displayCanvasContext);
			Canvas.loadImage(displayCanvas, displayCanvasContext, image, scale);
			scaledImageWidth = displayCanvas.width;
			scaledImageHeight = displayCanvas.height;
			const pixels = new Uint8Array(displayCanvasContext.getImageData(0, 0, scaledImageWidth, scaledImageHeight).data.buffer);
			//value of a radio button from: https://stackoverflow.com/questions/9618504/how-to-get-the-selected-radio-button-s-value
			const ditherMethod = parseInt(document.querySelector('input[name="dither-method"]:checked').value);
			const imageHeader = new Uint32Array([scaledImageWidth, scaledImageHeight, ditherMethod]);
			ditherWorker.postMessage(imageHeader.buffer, [imageHeader.buffer]);
			ditherWorker.postMessage(pixels.buffer, [pixels.buffer]);
		}
		
		function displayDitherResults(ditherResultPixels, imageWidth, imageHeight){
			Canvas.clear(displayCanvasContext);
			Canvas.draw(displayCanvasContext, imageWidth, imageHeight, ditherResultPixels);
		}
		
		function displayPerformanceResults(seconds, megapixelsPerSecond, ditherId){
			const ditherMethodName = ditherId === 1 ? 'WASM' : 'JS';
			document.getElementById('performance-results').textContent = `${ditherMethodName} ordered dithering performance: ${seconds} seconds, ${megapixelsPerSecond.toFixed(2)} megapixels per second`;
		}
	})(App.Canvas);
})();