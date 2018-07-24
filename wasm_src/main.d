//main entry point

extern(C): // disable D mangling

double add(double a, double b) { return a + b; }

// seems to be the required entry point
void _start() {}