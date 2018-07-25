//main entry point
extern(C): // disable D mangling

int max(int v1, int v2, int v3){
	if(v1 > v2){
		if(v1 > v3){
			return v1;
		}
		return v3;
	}
	else if(v2 > v3){
		return v2;
	}
	return v3;
}

int min(int v1, int v2, int v3){
	if(v1 < v2){
		if(v1 < v3){
			return v1;
		}
		return v3;
	}
	else if(v2 < v3){
		return v2;
	}
	return v3;
}

float pixelLightness(int r, int g, int b){
	immutable int maxValue = max(r, g, b);
	immutable int minValue = min(r, g, b);
	//510 = 255 * 2
	return (maxValue + minValue) / 510.0;
}

void fillBayerMatrix(float* bayerMatrix, float ditherRCoefficient){
	bayerMatrix[0] = -0.5 * ditherRCoefficient;
	bayerMatrix[1] = 0.166666667 * ditherRCoefficient;
	bayerMatrix[2] = 0.5 * ditherRCoefficient;
	bayerMatrix[3] = -.166666667 * ditherRCoefficient;
}

void dither(int imageWidth, int imageHeight, int heapOffset, int heapLength){
	//pixels array starts at offset 0 in wasm heap
	ubyte* pixels = cast(ubyte*) 0;
	//* 4 since RGBA format
	immutable int pixelsLength = imageWidth * imageHeight * 4;
	//based on the value of r from https://en.wikipedia.org/wiki/Ordered_dithering
    //formula is hightestValue / cube_root(numColors)
    //highest value should be 1
    //r = 1 / cube_root(2) because we are using 2 colors
    immutable float ditherRCoefficient = 0.7937005259840997;
    
    //2x2 bayer matrix
    immutable int bayerDimensions = 2;
    //create array on heap
    float* bayerMatrix = cast(float*) heapOffset;

    /*
    //adjust heapOffset and heapLength, in case we want to use them again
    auto matrixSize = float.sizeof * bayerDimensions * bayerDimensions; 
    heapOffset += matrixSize;
    heapLength -= matrixSize;
    */

    //initialize matrix
    fillBayerMatrix(bayerMatrix, ditherRCoefficient);
    
    //threshold where we switch between black and white
    immutable float threshold = 0.5;

    for(int pixelOffset=0,x=0,y=0;pixelOffset<pixelsLength;pixelOffset+=4){
    	//ignore transparent pixels
    	if(pixels[pixelOffset+3] > 0){
    		//have to disable array bounds check in compiler for dynamic array index
    		float bayerValue = bayerMatrix[(y%bayerDimensions) * bayerDimensions + (x%bayerDimensions)];
    		float currentLightness = pixelLightness(pixels[pixelOffset], pixels[pixelOffset+1], pixels[pixelOffset+2]);
    		
    		//dither between black and white
    		ubyte outputColor = 0;
    		if((currentLightness + bayerValue) >= threshold){
    			outputColor = 255;
    		}
    		//set color in pixels
    		for(int i=0;i<3;i++){
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

// seems to be the required entry point
void _start() {}