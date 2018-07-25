#!/usr/bin/env bash

#have to do it this way, instead of using make, since we get weird permissions errors with make trying to run ldc2 for some reason
#make sure '-L--no-warn-search-mismatch' is removed or commented out in /etc/ldc2.conf in the ldc2 install directory
#can't use optimizations beyond inlining, or whole program gets optimized out
ldc2 -mtriple=wasm32-unknown-unknown-wasm -betterC -link-internally -enable-inlining wasm_src/main.d -of=public_html/js/dither.wasm -od=wasm_src
