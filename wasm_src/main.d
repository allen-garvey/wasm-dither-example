//main entry point
extern(C): // disable D mangling

//based on the value of r from https://en.wikipedia.org/wiki/Ordered_dithering
//formula is hightestValue / cube_root(numColors)
//highest value should be 1
//r = 1 / cube_root(2) because we are using 2 colors
enum float DITHER_R_COEFFICIENT = 0.7937005259840997;

template TInitialize(T){
    //sort of halfway between static and dynamic array 
    //like dynamic array in that length and offset can be runtime values
    //but like static array in that length cannot change after initialization without possible causing problems
    T[] fixedArray(int offset, int length){
        //take pointer to (global/heap? not sure correct term) memory and convert to array by taking slice
        //(make sure you disable bounds checking in compiler since assert is not supported in wasm currently)
        return (cast(T*) offset)[0..length];
    }
}

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
	//510 = 255 * 2 to convert to 0-1 range
	return (maxValue + minValue) / 510.0;
}

void fillBayerMatrix(float[] bayerMatrix){
	bayerMatrix[0] = -0.5 		 * DITHER_R_COEFFICIENT;
	bayerMatrix[1] = 0.166666667 * DITHER_R_COEFFICIENT;
	bayerMatrix[2] = 0.5 		 * DITHER_R_COEFFICIENT;
	bayerMatrix[3] = -.166666667 * DITHER_R_COEFFICIENT;
}

void dither(int imageWidth, int imageHeight, int heapOffset, int heapLength){
	//* 4 since RGBA format
	immutable int pixelsLength = imageWidth * imageHeight * 4;
    //pixels array starts at offset 0 in wasm heap
    ubyte[] pixels = TInitialize!(ubyte).fixedArray(0, pixelsLength);
    
    //2x2 bayer matrix
    immutable int bayerDimensions = 2;
    //create array using heap memory
    float[] bayerMatrix = TInitialize!(float).fixedArray(heapOffset, bayerDimensions*bayerDimensions);

    /*
    //adjust heapOffset and heapLength, in case we want to use them again
    heapOffset += bayerMatrix.sizeof;
    heapLength -= bayerMatrix.sizeof;
    */

    //initialize matrix
    fillBayerMatrix(bayerMatrix);
    
    //lightness threshold where we switch between black and white
    immutable float threshold = 0.5;

    for(int pixelOffset=0,x=0,y=0;pixelOffset<pixelsLength;pixelOffset+=4){
    	//ignore transparent pixels
    	if(pixels[pixelOffset+3] > 0){
    		immutable float bayerValue = bayerMatrix[y%bayerDimensions * bayerDimensions + (x%bayerDimensions)];
    		immutable float currentLightness = pixelLightness(pixels[pixelOffset], pixels[pixelOffset+1], pixels[pixelOffset+2]);
    		
    		//dither between black and white
    		ubyte outputColor = 0;
    		if(currentLightness + bayerValue >= threshold){
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