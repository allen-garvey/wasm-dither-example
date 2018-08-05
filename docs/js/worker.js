(function(){
    var App = {};
    App.Timer = (function(){
        
        let timeInMilliseconds;
        if(performance){
            timeInMilliseconds = ()=> {return performance.now();};
        }
        else{
            timeInMilliseconds = ()=> {return Date.now();};
        }
        
        function timeFunctionBase(functionToTime, done){
            const start = timeInMilliseconds();
            functionToTime();
            const end = timeInMilliseconds();
            const seconds = (end - start) / 1000;
            done(seconds);
        }
        
        function timeFunctionMegapixels(name, numPixels, functionToTime){
            //even though we are returning only 2 values here, we need space for 3 values since we are returning ditherId
            let stats = new Float32Array(3);
            timeFunctionBase(functionToTime, (seconds)=>{
                const results = megapixelsMessage(name, numPixels, seconds);
                console.log(results.message);
                stats[0] = results.seconds;
                stats[1] = results.megapixelsPerSecond;
            });
            return stats;
        }
        
        function megapixelsMessage(name, numPixels, seconds){
            const megapixels = numPixels / 1000000;
            const megapixelsPerSecond = megapixels / seconds;
    
            return {
                message: `${name}: ${seconds}s, ${megapixelsPerSecond.toFixed(2)} megapixels/s`,
                megapixelsPerSecond,
                seconds,
    
            };
        }
        
        return {
            megapixelsPerSecond: timeFunctionMegapixels,
        };
    })();

    App.JsOrderedDither = (function(Timer){
        //returns lightness in range 0-1
        function pixelLightness(r, g, b){
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            //255*2 = 510
            return (max + min) / 510;
        }
        function calculateDitherRCoefficient(numColors){
            const highestValue = 1;
            return highestValue / Math.cbrt(numColors);
        }
        function getBayerMatrix(){
            const ditherRCoefficient = calculateDitherRCoefficient(2);
            return new Float32Array([
                -0.5 		 * ditherRCoefficient,
                0.166666667  * ditherRCoefficient,
                0.5 		 * ditherRCoefficient,
                -.166666667  * ditherRCoefficient,
            ]);
        }
        function ditherImage(pixels, imageWidth, imageHeight){
            const pixelsLength = pixels.length;
            const bayerDimensions = 2;
            const bayerMatrix = getBayerMatrix();
            const threshold = 0.5;
            
            for(let pixelOffset=0,x=0,y=0;pixelOffset<pixelsLength;pixelOffset+=4){
                //ignore transparent pixels
                if(pixels[pixelOffset+3] > 0){
                    const bayerValue = bayerMatrix[y%bayerDimensions * bayerDimensions + (x%bayerDimensions)];
                    const currentLightness = pixelLightness(pixels[pixelOffset], pixels[pixelOffset+1], pixels[pixelOffset+2]);
                    
                    //dither between black and white
                    const outputColor = currentLightness + bayerValue >= threshold ? 255 : 0;
                    //set color in pixels
                    for(let i=0;i<3;i++){
                        pixels[pixelOffset+i] = outputColor;
                    }
                }
                x++;
                if(x >= imageWidth){
                    x = 0;
                    y++;
                }
            }
        }

        function ditherWrapper(pixels, imageWidth, imageHeight, ditherId){
            const performanceResults = Timer.megapixelsPerSecond('JS  Ordered dithering performance', imageWidth*imageHeight, ()=>{
                ditherImage(pixels, imageWidth, imageHeight);
            });
            performanceResults[2] = ditherId;

            //can't use pixels.length, because buffer might be bigger than actual pixels
            const imageResponseHeader = new Uint32Array([imageWidth, imageHeight]);
        
            postMessage(imageResponseHeader.buffer, [imageResponseHeader.buffer])
            postMessage(pixels.buffer, [pixels.buffer]);
            postMessage(performanceResults, [performanceResults.buffer]);
        }

        return {
            dither: ditherWrapper,
        };
    })(App.Timer);

    (function(Timer, JsOrderedDither){
        let wasmExports = null;
        let heapStart = 0;
        let imageHeader = null;
        
        //from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/instantiate
        //ok that instantiate is less efficient, since we are in webworker, plus this is compatible with edge and safari, while instantiate streaming is not
        function loadWebAssembly(wasmArrayBuffer){
            const resultCode = new Int8Array([1]);
            
            WebAssembly.instantiate(wasmArrayBuffer, {})
            .then(wasmResults => {
                wasmExports = wasmResults.instance.exports;
                //need to save byte size of program globals so we don't overwrite them with the heap
                heapStart = wasmExports.memory.buffer.byteLength;
                postMessage(resultCode.buffer, [resultCode.buffer]);
            }).catch((e)=>{
                console.log(e);
                resultCode[0] = -1;
                postMessage(resultCode.buffer, [resultCode.buffer]);
            });
        }
        
        
        function wasmDitherImage(pixels, imageWidth, imageHeight, ditherId){
            const memoryPageSize = 64 * 1024;
            
            //setting memory from: https://stackoverflow.com/questions/46748572/how-to-access-webassembly-linear-memory-from-c-c
            const currentMemorySize = wasmExports.memory.buffer.byteLength;
            const totalMemoryRequired = heapStart + pixels.length;
            //see if we need to grow memory
            if(totalMemoryRequired > currentMemorySize){
                //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Memory/grow
                //grow will add amount * pageSize to total memory
                const growthAmount = Math.ceil((totalMemoryRequired - currentMemorySize) / memoryPageSize);
                wasmExports.memory.grow(growthAmount);
            }
            //load image into memory
            const wasmHeap = new Uint8Array(wasmExports.memory.buffer, heapStart);
            wasmHeap.set(pixels);
            //dither image
            const performanceResults = Timer.megapixelsPerSecond('WASM ordered dithering performance', imageWidth * imageHeight, ()=>{
                wasmExports.dither(heapStart, imageWidth, imageHeight);
            });
            performanceResults[2] = ditherId;
            //dithered image is now in the wasmHeap
            
            //can't use pixels.length, because buffer might be bigger than actual pixels
            const ditherResultPixels = wasmHeap.subarray(0, imageWidth * imageHeight * 4);
            const imageResponseHeader = new Uint32Array([imageWidth, imageHeight]);
        
            postMessage(imageResponseHeader.buffer, [imageResponseHeader.buffer])
            //can't transfer ditherResultPixels buffer, since it is also wasm heap
            postMessage(ditherResultPixels);
            postMessage(performanceResults, [performanceResults.buffer]);
        }
        
        onmessage = (e)=>{
            const messageData = e.data;
            if(wasmExports === null){
                loadWebAssembly(messageData);
                return;
            }
        
            if(imageHeader === null){
                imageHeader = new Uint32Array(messageData);
                return;
            }
            //message data must be pixels then
            const pixels = new Uint8Array(messageData);
            const ditherId = imageHeader[2];
            if(ditherId === 1){
                wasmDitherImage(pixels, imageHeader[0], imageHeader[1], ditherId);
            }
            else{
                JsOrderedDither.dither(pixels, imageHeader[0], imageHeader[1], ditherId);
            }
            imageHeader = null;
        };
    })(App.Timer, App.JsOrderedDither);
})();