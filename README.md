# Sage Playground

An interactive browser-based playground for [Sage](https://github.com/sagelang/sage) — a language for building intelligent agents.

**[Try it live →](https://sagelang.github.io/sage-playground/)**

## Features

- Write and run Sage code directly in your browser
- Powered by a tree-walking interpreter compiled to WebAssembly — no server required
- Syntax-highlighted code editor with example programs
- Real-time console output
- Supports agents, functions, control flow, records, enums, pattern matching, and all standard library operations

## Examples

| Example | Description |
|---------|-------------|
| Hello World | Minimal agent that prints a greeting |
| Counter Loop | Demonstrates loops and string operations |
| String Operations | String manipulation and helper functions |
| Functions | First-class functions, closures, and higher-order patterns |
| Records & Enums | Custom data types and pattern matching |
| Multi-Agent | Spawning agents with summon/await |

## How It Works

The playground uses `sage-playground-engine`, a tree-walking interpreter compiled to WebAssembly via `wasm-bindgen`. Sage source code is parsed, type-checked, and interpreted entirely in the browser — no compilation step, no server.

```
.sg source → parse → check → interpret (in browser via WASM)
```

The interpreter supports the full Sage language except for features that require native I/O (HTTP, filesystem, shell, database). Agent output is routed to the browser console panel.

## Development

```bash
# Serve locally
python3 -m http.server 8080

# Open http://localhost:8080
```

## Rebuilding the WASM Engine

To rebuild the interpreter WASM module from the Sage compiler source:

```bash
cd /path/to/sage
cargo build -p sage-playground-engine --target wasm32-unknown-unknown --release
wasm-bindgen target/wasm32-unknown-unknown/release/sage_playground_engine.wasm --out-dir pkg --target web
```

Then copy the `pkg/` output into `wasm/`.

## License

MIT — see [Sage](https://github.com/sagelang/sage) for details.
