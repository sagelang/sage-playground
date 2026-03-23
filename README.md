# Sage Playground

An interactive browser-based playground for [Sage](https://github.com/sagelang/sage) — a language for building intelligent agents.

**[Try it live →](https://sagelang.github.io/sage-playground/)**

## Features

- Write and run Sage agents directly in your browser
- Powered by WebAssembly — no server required for execution
- Syntax-highlighted code editor with example agents
- Real-time console output
- HTTP fetch via browser's native Fetch API
- LLM integration via configurable OpenAI-compatible endpoint

## Examples

| Example | Description |
|---------|-------------|
| Hello World | Minimal agent that prints a greeting |
| Counter Loop | Demonstrates loops and string operations |
| HTTP Fetch | Makes HTTP requests using the browser Fetch API |
| LLM Agent | Calls a language model using `divine()` |

## How It Works

Sage programs are compiled to WebAssembly using `sage build --target web`, which runs the full compilation pipeline:

```
.sg source → parse → check → codegen → cargo build --target wasm32 → wasm-bindgen → .wasm + .js
```

The resulting WASM modules run natively in the browser with no server-side execution needed. Agent output is routed to the browser console.

## Building Examples

To rebuild the WASM examples from source:

```bash
cd /path/to/sage
sage build examples/wasm_hello.sg --target web
sage build examples/wasm_counter.sg --target web
sage build examples/wasm_fetch.sg --target web
sage build examples/wasm_divine.sg --target web
```

Then copy the `hearth/*/pkg/` directories into `wasm/`.

## Development

```bash
# Serve locally
python3 -m http.server 8080

# Open http://localhost:8080
```

## License

MIT — see [Sage](https://github.com/sagelang/sage) for details.
