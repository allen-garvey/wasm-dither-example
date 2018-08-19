
D_SRC_DIR=wasm_src
D_SRC=$(D_SRC_DIR)/main.d
WASM_OUTPUT=docs/js/dither.wasm

all: $(WASM_OUTPUT)

$(WASM_OUTPUT): $(D_SRC)
	ldc2 -mtriple=wasm32-unknown-unknown-wasm -betterC -O $(D_SRC) -of=$(WASM_OUTPUT) -od=$(D_SRC_DIR)
