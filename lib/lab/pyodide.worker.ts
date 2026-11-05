/// <reference lib="webworker" />
/** Web Worker hosting Pyodide (self-hosted under /pyodide/). Runs learner code + tests off the main thread. */
import { PY_HARNESS, type WorkerRequest, type WorkerResponse } from './protocol'

interface PyodideLike {
  globals: { set: (k: string, v: unknown) => void }
  setStdout: (o: { batched: (s: string) => void }) => void
  runPythonAsync: (code: string) => Promise<unknown>
}

const post = (m: WorkerResponse) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(m)
let pyodide: Promise<PyodideLike> | null = null

async function boot(): Promise<PyodideLike> {
  post({ type: 'progress', message: 'Đang tải Python (Pyodide)…' })
  const url = `${self.location.origin}/pyodide/pyodide.mjs`
  const mod = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url)) as { loadPyodide: (o: { indexURL: string }) => Promise<PyodideLike> }
  const py = await mod.loadPyodide({ indexURL: `${self.location.origin}/pyodide/` })
  post({ type: 'ready' })
  return py
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const req = e.data
  try {
    pyodide ??= boot()
    const py = await pyodide
    let stdout = ''
    py.setStdout({ batched: (s) => (stdout += s + '\n') })
    py.globals.set('USER_CODE', req.code)
    py.globals.set('TEST_CODE', req.tests)
    const json = (await py.runPythonAsync(PY_HARNESS)) as string
    post({ type: 'result', id: req.id, results: JSON.parse(json), stdout })
  } catch (err) {
    pyodide = null
    post({ type: 'error', id: req.id, message: err instanceof Error ? err.message : String(err) })
  }
}
