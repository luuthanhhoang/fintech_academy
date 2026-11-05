/** Messages exchanged with the Pyodide worker. */
export interface TestResult {
  name: string
  ok: boolean
  error?: string
}

export type WorkerRequest = { type: 'run'; id: number; code: string; tests: string }

export type WorkerResponse =
  | { type: 'ready' }
  | { type: 'progress'; message: string }
  | { type: 'result'; id: number; results: TestResult[]; stdout: string }
  | { type: 'error'; id: number | null; message: string }

/** Python harness: loads the learner's code, then runs every test_* defined in tests.py (in definition order). */
export const PY_HARNESS = String.raw`
import json, traceback
_results = []
_ns = {}
try:
    exec(compile(USER_CODE, "solution.py", "exec"), _ns)
except Exception:
    _results.append({"name": "nạp code (load)", "ok": False, "error": traceback.format_exc(limit=3)})
else:
    _before = set(_ns.keys())
    exec(compile(TEST_CODE, "tests.py", "exec"), _ns)
    for _name in [k for k in _ns.keys() if k not in _before and k.startswith("test_") and callable(_ns[k])]:
        try:
            _ns[_name]()
            _results.append({"name": _name, "ok": True})
        except AssertionError as e:
            _results.append({"name": _name, "ok": False, "error": str(e) or "AssertionError"})
        except Exception:
            _results.append({"name": _name, "ok": False, "error": traceback.format_exc(limit=2)})
json.dumps(_results)
`

export function summarize(results: readonly TestResult[]): { passed: number; total: number; allPassed: boolean } {
  const passed = results.filter((r) => r.ok).length
  return { passed, total: results.length, allPassed: results.length > 0 && passed === results.length }
}
