// Sage Playground — interactive Sage interpreter powered by WebAssembly

// ---- Example source code ----
const EXAMPLES = {
    hello: {
        name: 'Hello World',
        source: `// Hello World — the simplest Sage agent
// Edit this code and press Run (or Ctrl+Enter)

agent Main {
    on start {
        print("Hello from Sage!");
        print("Running in your browser via WebAssembly");
        yield(42);
    }
}

run Main;`,
    },

    counter: {
        name: 'Counter Loop',
        source: `// Counter — loops and string operations

agent Main {
    on start {
        print("Counting to 10:");
        let sum = 0;
        let i = 0;
        while i < 10 {
            i = i + 1;
            sum = sum + i;
            print("  " ++ int_to_str(i) ++ " (sum: " ++ int_to_str(sum) ++ ")");
        }
        print("Total: " ++ int_to_str(sum));
        yield(sum);
    }
}

run Main;`,
    },

    strings: {
        name: 'String Operations',
        source: `// String operations in Sage

fn repeat(s: String, n: Int) -> String {
    let result = "";
    let i = 0;
    while i < n {
        result = result ++ s;
        i = i + 1;
    }
    return result;
}

agent Main {
    on start {
        let greeting = "Hello, Sage!";
        print("Original: " ++ greeting);
        print("Length: " ++ int_to_str(len(greeting)));
        print("Upper: " ++ to_upper(greeting));
        print("Lower: " ++ to_lower(greeting));
        print("Contains 'Sage': " ++ int_to_str(len(split(greeting, "Sage")) - 1));

        let parts = split("one,two,three", ",");
        print("Split: " ++ join(parts, " | "));

        let stars = repeat("*", 20);
        print(stars);
        print("  Sage Playground");
        print(stars);

        yield(0);
    }
}

run Main;`,
    },

    fibonacci: {
        name: 'Fibonacci',
        source: `// Fibonacci sequence with recursion

fn fib(n: Int) -> Int {
    if n <= 1 {
        return n;
    }
    return fib(n - 1) + fib(n - 2);
}

agent Main {
    on start {
        print("Fibonacci sequence:");
        let i = 0;
        while i <= 15 {
            let f = fib(i);
            print("  fib(" ++ int_to_str(i) ++ ") = " ++ int_to_str(f));
            i = i + 1;
        }
        yield(fib(15));
    }
}

run Main;`,
    },
};

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

function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

window.clearConsole = () => { consoleEl.innerHTML = ''; };

// ---- Editor ----
const editorEl = document.getElementById('editor');
const highlightEl = document.getElementById('highlight').firstElementChild;
const selectEl = document.getElementById('example-select');

// ---- Syntax highlighting ----
const SAGE_KEYWORDS = new Set([
    'agent', 'on', 'start', 'fn', 'let', 'while', 'if', 'else', 'for', 'in',
    'loop', 'break', 'return', 'yield', 'run', 'match', 'try', 'catch', 'fail',
    'divine', 'infer', 'spawn', 'use', 'mod', 'pub', 'enum', 'record', 'protocol',
    'supervisor', 'tool', 'summon', 'emit', 'subscribe', 'checkpoint',
]);

const SAGE_TYPES = new Set([
    'Int', 'Float', 'Bool', 'String', 'List', 'Map', 'Result', 'Option',
]);

const SAGE_BUILTINS = new Set([
    'print', 'trace', 'int_to_str', 'float_to_str', 'str_to_int', 'str_to_float',
    'len', 'contains', 'split', 'trim', 'to_upper', 'to_lower', 'push', 'get',
    'slice', 'join', 'abs', 'min', 'max', 'range', 'chr', 'type_of',
]);

function highlightSage(source) {
    // Tokenise with a single regex — order matters (comments and strings first)
    const TOKEN_RE = /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?\b)|(\b[a-zA-Z_]\w*\b)|(\+\+|->|[{}();,=<>!+\-*/%.|&:@])/g;

    let result = '';
    let last = 0;
    let m;

    while ((m = TOKEN_RE.exec(source)) !== null) {
        // Append any unmatched text between tokens
        if (m.index > last) {
            result += esc(source.slice(last, m.index));
        }
        last = m.index + m[0].length;

        const [tok, comment, str, num, ident, op] = m;

        if (comment) {
            result += `<span class="hl-comment">${esc(comment)}</span>`;
        } else if (str) {
            result += `<span class="hl-str">${esc(str)}</span>`;
        } else if (num) {
            result += `<span class="hl-num">${esc(num)}</span>`;
        } else if (ident) {
            if (ident === 'true' || ident === 'false') {
                result += `<span class="hl-bool">${ident}</span>`;
            } else if (SAGE_KEYWORDS.has(ident)) {
                result += `<span class="hl-kw">${ident}</span>`;
            } else if (SAGE_TYPES.has(ident)) {
                result += `<span class="hl-type">${ident}</span>`;
            } else if (SAGE_BUILTINS.has(ident)) {
                result += `<span class="hl-builtin">${ident}</span>`;
            } else {
                result += esc(ident);
            }
        } else if (op) {
            result += `<span class="hl-op">${esc(op)}</span>`;
        } else {
            result += esc(tok);
        }
    }

    // Append any remaining text
    if (last < source.length) {
        result += esc(source.slice(last));
    }

    // Trailing newline so the pre height matches the textarea
    return result + '\n';
}

function syncHighlight() {
    highlightEl.innerHTML = highlightSage(editorEl.value);
}

function syncScroll() {
    const pre = highlightEl.parentElement;
    pre.scrollTop = editorEl.scrollTop;
    pre.scrollLeft = editorEl.scrollLeft;
}

function loadExample(name) {
    const ex = EXAMPLES[name];
    if (!ex) return;
    editorEl.value = ex.source;
    syncHighlight();
}

selectEl.addEventListener('change', () => loadExample(selectEl.value));

// Sync highlight on every input
editorEl.addEventListener('input', syncHighlight);
editorEl.addEventListener('scroll', syncScroll);

// Handle Tab key in editor
editorEl.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = editorEl.selectionStart;
        const end = editorEl.selectionEnd;
        editorEl.value = editorEl.value.substring(0, start) + '    ' + editorEl.value.substring(end);
        editorEl.selectionStart = editorEl.selectionEnd = start + 4;
        syncHighlight();
    }
});

// ---- WASM Engine ----
let engine = null;

async function loadEngine() {
    appendLog('Loading Sage interpreter...', 'system');
    const startLoad = performance.now();
    try {
        engine = await import('./wasm/engine/sage_playground_engine.js');
        await engine.default();
        const loadMs = (performance.now() - startLoad).toFixed(0);
        appendLog(`Interpreter ready (${loadMs}ms)`, 'system');
    } catch (e) {
        appendLog(`Failed to load interpreter: ${e.message}`, 'error');
    }
}

window.runExample = async () => {
    const btn = document.getElementById('btn-run');
    btn.disabled = true;

    try {
        if (!engine) {
            await loadEngine();
            if (!engine) return;
        }

        const source = editorEl.value;
        consoleEl.innerHTML = '';
        appendLog('Running...', 'system');

        const startRun = performance.now();
        const result = engine.run_sage(source);
        const runMs = (performance.now() - startRun).toFixed(1);

        // Display output lines
        for (const line of result.output) {
            appendLog(line, 'info');
        }

        if (result.success) {
            if (result.result && result.result !== '()') {
                appendLog(`=> ${result.result}`, 'success');
            }
            appendLog(`Completed in ${runMs}ms`, 'success');
        } else {
            appendLog(result.error, 'error');
        }
    } catch (e) {
        appendLog(`Error: ${e.message}`, 'error');
    } finally {
        btn.disabled = false;
    }
};

// ---- Keyboard shortcuts ----
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runExample();
    }
});

// ---- Init ----
appendLog('Welcome to the Sage Playground', 'system');
appendLog('Write Sage code and press Run (Ctrl+Enter)', 'system');
appendLog('', 'info');
loadExample('hello');
syncHighlight();
loadEngine();
