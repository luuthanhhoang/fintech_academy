/**
 * Source of the Pyodide module worker. Built as a string and started from a Blob URL so the bundler
 * cannot turn it into a classic worker (Pyodide requires a module worker). Pyodide is self-hosted
 * under /pyodide/ (copied from node_modules at build time).
 */
import { PY_HARNESS } from './protocol'

export function pyodideWorkerSource(origin: string): string {
  return `
import { loadPyodide } from ${JSON.stringify(`${origin}/pyodide/pyodide.mjs`)};
const HARNESS = ${JSON.stringify(PY_HARNESS)};
let pyodide = null;
async function boot() {
  postMessage({ type: 'progress', message: 'Đang tải Python (Pyodide)…' });
  const py = await loadPyodide({ indexURL: ${JSON.stringify(`${origin}/pyodide/`)} });
  postMessage({ type: 'ready' });
  return py;
}
self.onmessage = async (e) => {
  const req = e.data;
  try {
    pyodide ??= boot();
    const py = await pyodide;
    let stdout = '';
    py.setStdout({ batched: (s) => { stdout += s + '\\n'; } });
    py.globals.set('USER_CODE', req.code);
    py.globals.set('TEST_CODE', req.tests);
    const json = await py.runPythonAsync(HARNESS);
    postMessage({ type: 'result', id: req.id, results: JSON.parse(json), stdout });
  } catch (err) {
    pyodide = null;
    postMessage({ type: 'error', id: req.id, message: err && err.message ? err.message : String(err) });
  }
};
`
}
