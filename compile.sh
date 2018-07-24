#!/usr/bin/env bash

#have to do it this way, instead of using make, since can't get make to work correctly with ldc2 for some reason

WASM_SRC=`find ./wasm_src -type f -name '*.d'`
#make sure '-L--no-warn-search-mismatch' is removed or commented out in /etc/ldc2.conf in the ldc2 install directory
# have to disable array bounds check for dynamic array index
ldc2 -mtriple=wasm32-unknown-unknown-wasm -betterC -link-internally -boundscheck=off "$WASM_SRC" -of=public_html/js/dither.wasm
