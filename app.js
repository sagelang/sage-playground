// Sage Playground — browser-based agent runner powered by WebAssembly

// ---- Example source code ----
const EXAMPLES = {
    hello: {
        name: 'Hello World',
        wasm: './wasm/wasm_hello/wasm_hello.js',
        source: `// Hello World — the simplest Sage agent
// This agent runs entirely in your browser via WebAssembly

agent Main {
    on start {
        print("Hello from Sage in the browser!")

        let greeting = "Sage agents run natively in WebAssembly"
        print(greeting)

        yield(42)
    }
}

run Main`,
    },

    counter: {
        name: 'Counter Loop',
        wasm: './wasm/wasm_counter/wasm_counter.js',
        source: `// Counter — loops and string operations
// Demonstrates control flow running natively in WASM

agent Counter {
    on start {
        print("Counter agent started")
        let i = 0
        while i < 5 {
            i = i + 1
            print("  count: " ++ int_to_str(i))
        }
        print("Counter finished — final count: " ++ int_to_str(i))
        yield(i)
    }
}

run Counter`,
    },

    fetch: {
        name: 'HTTP Fetch',
        wasm: './wasm/wasm_fetch/wasm_fetch.js',
        source: `// HTTP Fetch — make requests from the browser
// Uses the browser's native Fetch API under the hood
// (target URL must allow CORS)

agent Fetcher {
    use Http

    on start {
        print("Fetching data from httpbin.org...")
        let resp = try Http.get("https://httpbin.org/get")
        print("Status: " ++ int_to_str(resp.status))
        print("Body length: " ++ int_to_str(len(resp.body)))
        print("Done!")
        yield(resp.status)
    }

    on error(e) {
        print("Fetch failed (CORS issue?)")
        yield(0)
    }
}

run Fetcher`,
    },

    divine: {
        name: 'LLM Agent',
        wasm: './wasm/wasm_divine/wasm_divine.js',
        source: `// LLM Agent — call a language model from the browser
// Configure your OpenAI-compatible endpoint below,
// then run to see divine() in action.

agent Main {
    on start {
        print("Asking the oracle...")
        let answer = try divine(
            "What is the meaning of life? Reply in one sentence."
        )
        print("Oracle says: " ++ answer)
        yield(answer)
    }

    on error(e) {
        print("The oracle is silent today.")
        yield("error")
    }
}

run Main`,
    },
};

// ---- Syntax highlighting ----
const KEYWORDS = new Set([
    'agent', 'on', 'start', 'error', 'stop', 'waking', 'resting',
    'let', 'if', 'else', 'while', 'for', 'in', 'return', 'yield',
    'try', 'catch', 'use', 'run', 'fn', 'match', 'spawn', 'send',
    'divine', 'belief', 'supervisor', 'strategy', 'children',
]);

const TYPES = new Set([
    'Int', 'Float', 'String', 'Bool', 'List', 'Map', 'Http',
]);

function highlight(source) {
    let html = '';
    const lines = source.split('\n');

    for (const line of lines) {
        if (line.trimStart().startsWith('//')) {
            html += `<span class="sy-comment">${esc(line)}</span>\n`;
            continue;
        }

        // Tokenize line
        let i = 0;
        while (i < line.length) {
            // String literal
            if (line[i] === '"') {
                let j = i + 1;
                while (j < line.length && line[j] !== '"') {
                    if (line[j] === '\\') j++;
                    j++;
                }
                j = Math.min(j + 1, line.length);
                html += `<span class="sy-str">${esc(line.slice(i, j))}</span>`;
                i = j;
                continue;
            }

            // Number
            if (/\d/.test(line[i]) && (i === 0 || !/\w/.test(line[i - 1]))) {
                let j = i;
                while (j < line.length && /[\d.]/.test(line[j])) j++;
                html += `<span class="sy-num">${esc(line.slice(i, j))}</span>`;
                i = j;
                continue;
            }

            // Word (keyword, type, identifier)
            if (/[a-zA-Z_@]/.test(line[i])) {
                let j = i;
                while (j < line.length && /[\w@]/.test(line[j])) j++;
                const word = line.slice(i, j);

                if (word === 'agent' || word === 'supervisor') {
                    html += `<span class="sy-kw">${esc(word)}</span>`;
                    // Next word is the agent name
                    let k = j;
                    while (k < line.length && line[k] === ' ') k++;
                    let nameEnd = k;
                    while (nameEnd < line.length && /\w/.test(line[nameEnd])) nameEnd++;
                    if (nameEnd > k) {
                        html += esc(line.slice(j, k));
                        html += `<span class="sy-agent">${esc(line.slice(k, nameEnd))}</span>`;
                        j = nameEnd;
                    }
                } else if (KEYWORDS.has(word)) {
                    html += `<span class="sy-kw">${esc(word)}</span>`;
                } else if (TYPES.has(word)) {
                    html += `<span class="sy-type">${esc(word)}</span>`;
                } else if (word.startsWith('@')) {
                    html += `<span class="sy-kw">${esc(word)}</span>`;
                } else {
                    // Check if it's a function call
                    let peek = j;
                    while (peek < line.length && line[peek] === ' ') peek++;
                    if (line[peek] === '(') {
                        html += `<span class="sy-fn">${esc(word)}</span>`;
                    } else {
                        html += esc(word);
                    }
                }
                i = j;
                continue;
            }

            // Operator
            if ('+-*/%=<>!&|.{}()[],:;'.includes(line[i])) {
                html += `<span class="sy-op">${esc(line[i])}</span>`;
                i++;
                continue;
            }

            html += esc(line[i]);
            i++;
        }
        html += '\n';
    }

    return html;
}

function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---- Console ----
const consoleEl = document.getElementById('console');

function timestamp() {
    return new Date().toISOString().slice(11, 23);
}

function appendLog(msg, level = 'info') {
    const div = document.createElement('div');
    div.className = `log ${level}`;
    div.innerHTML = `<span class="ts">${timestamp()}</span>${esc(String(msg))}`;
    consoleEl.appendChild(div);
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

window.clearConsole = () => { consoleEl.innerHTML = ''; };

// Intercept console output from WASM
const origLog = console.log;
const origWarn = console.warn;
const origError = console.error;

console.log = (...args) => {
    origLog(...args);
    appendLog(args.map(String).join(' '), 'info');
};
console.warn = (...args) => {
    origWarn(...args);
    appendLog(args.map(String).join(' '), 'warn');
};
console.error = (...args) => {
    origError(...args);
    appendLog(args.map(String).join(' '), 'error');
};

// ---- Editor ----
const editorEl = document.getElementById('editor');
const selectEl = document.getElementById('example-select');

function loadExample(name) {
    const ex = EXAMPLES[name];
    if (!ex) return;
    editorEl.innerHTML = highlight(ex.source);

    // Show/hide LLM config
    const llmConfig = document.getElementById('llm-config');
    if (name === 'divine') {
        llmConfig.classList.remove('hidden');
    } else {
        llmConfig.classList.add('hidden');
    }
}

selectEl.addEventListener('change', () => loadExample(selectEl.value));

// ---- WASM Runner ----
const wasmCache = {};

window.runExample = async () => {
    const btn = document.getElementById('btn-run');
    const name = selectEl.value;
    const ex = EXAMPLES[name];
    if (!ex) return;

    btn.disabled = true;
    appendLog(`Running ${ex.name}...`, 'system');

    try {
        // Configure LLM if needed
        if (name === 'divine') {
            const url = document.getElementById('llm-url').value.trim();
            const model = document.getElementById('llm-model').value.trim();
            if (url) {
                appendLog(`LLM: ${model} @ ${url}`, 'system');
            } else {
                appendLog('No LLM endpoint configured — divine() will fail', 'warn');
            }
        }

        // Load WASM module (cached after first load)
        if (!wasmCache[name]) {
            appendLog('Loading WASM module...', 'system');
            const startLoad = performance.now();
            wasmCache[name] = await import(ex.wasm);
            const loadMs = (performance.now() - startLoad).toFixed(0);
            const wasmSize = await getWasmSize(ex.wasm);
            appendLog(`Module loaded (${wasmSize}, ${loadMs}ms)`, 'system');
        }

        const mod = wasmCache[name];

        // Configure LLM endpoint if available
        if (name === 'divine' && mod.sage_configure) {
            const url = document.getElementById('llm-url').value.trim();
            const model = document.getElementById('llm-model').value.trim();
            if (url) {
                mod.sage_configure(url, model, '');
            }
        }

        // Run the agent
        const startRun = performance.now();
        await mod.default();
        const runMs = (performance.now() - startRun).toFixed(0);
        appendLog(`Finished in ${runMs}ms`, 'success');

    } catch (e) {
        appendLog(`Error: ${e.message}`, 'error');
    } finally {
        btn.disabled = false;
    }
};

async function getWasmSize(jsPath) {
    try {
        const wasmPath = jsPath.replace('.js', '_bg.wasm');
        const resp = await fetch(wasmPath, { method: 'HEAD' });
        const bytes = parseInt(resp.headers.get('content-length') || '0');
        if (bytes > 1048576) return `${(bytes / 1048576).toFixed(1)}MB`;
        if (bytes > 1024) return `${(bytes / 1024).toFixed(0)}KB`;
        return `${bytes}B`;
    } catch {
        return '?KB';
    }
}

// ---- Keyboard shortcuts ----
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter = Run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runExample();
    }
});

// ---- Init ----
appendLog('Welcome to the Sage Playground', 'system');
appendLog('Select an example and press Run (or Ctrl+Enter)', 'system');
appendLog('', 'info');
loadExample('hello');
