//main entry point

extern(C): // disable D mangling

void dither(int imageWidth, int imageHeight){
	//pixels array starts at offset 0 in wasm heap
	ubyte* pixels = cast(ubyte*) 0;
	pixels[0] = cast(ubyte)(pixels[0] + 8);;
}

// seems to be the required entry point
void _start() {}