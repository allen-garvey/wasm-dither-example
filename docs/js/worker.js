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
            let stats;
            timeFunctionBase(functionToTime, (seconds)=>{
                const results = megapixelsMessage(name, numPixels, seconds);
                console.log(results.message);
                stats = new Float32Array([results.seconds, results.megapixelsPerSecond]);
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

    (function(Timer){
        let wasmExports = null;
        let imageHeader = null;
        
        //from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/instantiate
        //ok that instantiate is less efficient, since we are in webworker, plus this is compatible with edge and safari, while instantiate streaming is not
        function loadWebAssembly(wasmArrayBuffer){
            const resultCode = new Int8Array([1]);
            
            WebAssembly.instantiate(wasmArrayBuffer, {})
            .then(wasmResults => {
                wasmExports = wasmResults.instance.exports;
                postMessage(resultCode.buffer, [resultCode.buffer]);
            }).catch((e)=>{
                console.log(e);
                resultCode[0] = -1;
                postMessage(resultCode.buffer, [resultCode.buffer]);
            });
        }
        
        
        function ditherImage(pixels, imageWidth, imageHeight){
            const imageByteSize = imageWidth * imageHeight * 4;
            const memoryPageSize = 64 * 1024;
            
            //setting memory from: https://stackoverflow.com/questions/46748572/how-to-access-webassembly-linear-memory-from-c-c
            const currentMemorySize = wasmExports.memory.buffer.byteLength;
            //extra memory in bytes to store up to 16*16 bayer matrix of floats, floats in D are 32 bit
            const extraMemoryForHeap = 4 * 256;
            const totalMemoryRequired = pixels.length + extraMemoryForHeap;
            //see if we need to grow memory
            if(totalMemoryRequired > currentMemorySize){
                //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Memory/grow
                //grow will add amount * pageSize to total memory
                const growthAmount = Math.ceil((totalMemoryRequired - currentMemorySize) / memoryPageSize);
                wasmExports.memory.grow(growthAmount);
            }
            //load image into memory
            const wasmHeap = new Uint8ClampedArray(wasmExports.memory.buffer);
            wasmHeap.set(pixels);
            //figure out how much heap memory there is, and its offset
            const heapOffset = imageByteSize;
            const heapSize = wasmHeap.length - imageByteSize;
            //dither image
            const performanceResults = Timer.megapixelsPerSecond('Ordered dithering performance', imageWidth * imageHeight, ()=>{
                wasmExports.dither(imageWidth, imageHeight, heapOffset, heapSize);
            });
            //dithered image is now in the wasmHeap
            
            //draw result on canvas
            //can't use pixels.length, because buffer might be bigger than actual pixels
            const ditherResultPixels = wasmHeap.subarray(0, imageWidth * imageHeight * 4);
            const imageResponseHeader = new Uint32Array([imageWidth, imageHeight]);
        
            postMessage(imageResponseHeader.buffer, [imageResponseHeader.buffer])
            //can't transfer ditherResultPixels buffer, since it is also wasm heap
            postMessage(ditherResultPixels.buffer);
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
            ditherImage(pixels, imageHeader[0], imageHeader[1]);
            imageHeader = null;
        };
    })(App.Timer);
})();