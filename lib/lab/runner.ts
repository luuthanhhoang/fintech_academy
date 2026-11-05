/** Main-thread client for the Pyodide worker with a hard timeout (terminates runaway code). */
import type { TestResult, WorkerRequest, WorkerResponse } from './protocol'

export interface RunOutcome {
  results: TestResult[]
  stdout: string
}

export class LabRunner {
  private worker: Worker | null = null
  private seq = 0

  constructor(private readonly onProgress: (msg: string) => void) {}

  private ensure(): Worker {
    this.worker ??= new Worker(new URL('./pyodide.worker.ts', import.meta.url), { type: 'module' })
    return this.worker
  }

  run(code: string, tests: string, timeoutMs: number): Promise<RunOutcome> {
    const worker = this.ensure()
    const id = ++this.seq
    return new Promise((resolve, reject) => {
      // First run also downloads the runtime, so allow extra time for it.
      const timer = setTimeout(() => {
        this.dispose()
        reject(new Error(`Quá thời gian ${Math.round(timeoutMs / 1000)} giây — có thể có vòng lặp vô hạn. Worker đã được khởi động lại.`))
      }, timeoutMs + (this.seq === 1 ? 60_000 : 0))
      worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const m = e.data
        if (m.type === 'progress') this.onProgress(m.message)
        if (m.type === 'ready') this.onProgress('Python đã sẵn sàng.')
        if (m.type === 'result' && m.id === id) {
          clearTimeout(timer)
          resolve({ results: m.results, stdout: m.stdout })
        }
        if (m.type === 'error' && (m.id === id || m.id === null)) {
          clearTimeout(timer)
          reject(new Error(m.message))
        }
      }
      worker.postMessage({ type: 'run', id, code, tests } satisfies WorkerRequest)
    })
  }

  dispose() {
    this.worker?.terminate()
    this.worker = null
  }
}
