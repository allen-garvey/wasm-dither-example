//main entry point
extern(C): // disable D mangling

//based on the value of r from https://en.wikipedia.org/wiki/Ordered_dithering
//formula is hightestValue / cube_root(numColors)
//highest value should be 1
//r = 1 / cube_root(2) because we are using 2 colors
enum float DITHER_R_COEFFICIENT = 0.7937005259840997;

ubyte max(ubyte v1, ubyte v2, ubyte v3)
{
    if (v1 > v2)
        return v1 > v3 ? v1 : v3;
    return v2 > v3 ? v2 : v3;
}

ubyte min(ubyte v1, ubyte v2, ubyte v3)
{
    if (v1 < v2)
        return v1 < v3 ? v1 : v3;
    return v2 < v3 ? v2 : v3;
}

float pixelLightness(ubyte r, ubyte g, ubyte b)
{
    const maxValue = max(r, g, b);
    const minValue = min(r, g, b);
    //510 = 255 * 2 to convert to 0-1 range
    return (maxValue + minValue) / 510.0f;
}

void dither(ubyte* pixelsData, int imageWidth, int imageHeight)
{
    //* 4 since RGBA format
    const pixelsLength = (cast(size_t) imageWidth) * imageHeight * 4;
    ubyte[] pixels = pixelsData[0 .. pixelsLength];

    //lightness threshold where we switch between black and white
    enum threshold = 0.5f;

    static immutable float[2][2] bayerMatrix =
    [
        [ -0.5f * DITHER_R_COEFFICIENT,  0.166666667f * DITHER_R_COEFFICIENT ],
        [  0.5f * DITHER_R_COEFFICIENT, -0.166666667f * DITHER_R_COEFFICIENT ],
    ];

    size_t i = 0;
    foreach (y; 0 .. imageHeight)
    {
        const bayerRow = bayerMatrix[y % bayerMatrix.length];
        foreach (x; 0 .. imageWidth)
        {
            //ignore transparent pixels
            if (pixels[i+3] > 0)
            {
                const bayerValue = bayerRow[x % bayerRow.length];
                const currentLightness = pixelLightness(pixels[i], pixels[i+1], pixels[i+2]);

                //dither between black and white
                const outputColor = currentLightness + bayerValue >= threshold ? 255 : 0;

                //set color in pixels
                pixels[i .. i+3] = outputColor;
            }
            i += 4;
        }
    }
}
/*
* Conditionally include assert stub so compiles for webassembly but will still work on other platforms
*/
version(WebAssembly){
    void __assert(const(char)* msg, const(char)* file, uint line) {}
}

// seems to be the required entry point
void _start() {}