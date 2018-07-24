//main entry point

extern(C): // disable D mangling

//same as wasm instance memory
__gshared ubyte* pixels;

void dither(int imageWidth, int imageHeight){ 
	pixels[0] = cast(ubyte)(pixels[0] + 8);
}

// seems to be the required entry point
void _start() {}