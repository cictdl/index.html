Third-party runtime for பொருள் தேடல் (search by meaning), loaded only when a reader opens meaning search.

| file | package | licence |
|---|---|---|
| ort.wasm.bundle.min.js | onnxruntime-web 1.23.2 (WebAssembly build; its ort-wasm-simd-threaded.wasm travels in the meaning pack) | MIT — LICENSE-onnxruntime.txt |
| tokenizers.min.js | @huggingface/tokenizers 0.2.0 | Apache-2.0 — LICENSE-tokenizers.txt |

The model itself (intfloat/multilingual-e5-small, MIT; ONNX int8 export by Xenova, vocabulary-pruned by
build/build_meaning.py) is in ../meaning/, downloaded on request, never bundled in the app shell.
