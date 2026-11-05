'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import type { Lab } from '@/lib/content/schema/lab'
import { getSetting, logPractice, setSetting } from '@/lib/db/repos/activity'
import { summarize, type TestResult } from '@/lib/lab/protocol'
import { LabRunner } from '@/lib/lab/runner'
import { Button } from '@/components/ui/primitives'
import { Skeleton } from '@/components/ui/states'

const CodeEditor = dynamic(() => import('./code-editor'), { ssr: false, loading: () => <Skeleton lines={8} /> })

const draftKey = (id: string) => `lab-draft:${id}`

export function LabWorkbench({ lab }: { lab: Lab }) {
  const [code, setCode] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<TestResult[] | null>(null)
  const [stdout, setStdout] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showSolution, setShowSolution] = useState(false)
  const runner = useRef<LabRunner | null>(null)

  useEffect(() => {
    getSetting<string | null>(draftKey(lab.id), null).then((d) => setCode(d ?? lab.starter))
    return () => runner.current?.dispose()
  }, [lab])

  const update = (v: string) => {
    setCode(v)
    void setSetting(draftKey(lab.id), v)
  }

  const run = async () => {
    if (code === null) return
    runner.current ??= new LabRunner(setStatus)
    setRunning(true)
    setError(null)
    setResults(null)
    try {
      const out = await runner.current.run(code, lab.tests, lab.timeoutMs)
      setResults(out.results)
      setStdout(out.stdout)
      const s = summarize(out.results)
      await logPractice({ kind: 'lab', refId: lab.id, conceptIds: lab.concepts, result: s.allPassed ? 'passed' : 'failed', detail: `${s.passed}/${s.total}` })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      runner.current = null
    } finally {
      setRunning(false)
    }
  }

  const s = results ? summarize(results) : null
  return (
    <div className="font-sans">
      {code === null ? <Skeleton lines={8} /> : <CodeEditor value={code} onChange={update} label={`Trình soạn code cho lab ${lab.title.vi}`} />}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={run} disabled={running || code === null}>
          {running ? 'Đang chạy…' : '▶ Chạy test'}
        </Button>
        <Button variant="ghost" onClick={() => update(lab.starter)}>
          Khôi phục code khởi đầu
        </Button>
        <Button variant="ghost" onClick={() => setShowSolution((v) => !v)} aria-expanded={showSolution}>
          {showSolution ? 'Ẩn lời giải' : 'Xem lời giải'}
        </Button>
        <span role="status" className="text-xs text-ink-3">{status}</span>
      </div>
      {error && <p role="alert" className="mt-3 rounded-md bg-bad-soft p-3 text-sm text-bad">{error}</p>}
      {s && (
        <div className="mt-4" role="status">
          <p className={`font-medium ${s.allPassed ? 'text-good' : 'text-bad'}`}>
            {s.allPassed ? '✓ Đạt toàn bộ' : '✗ Chưa đạt'}: {s.passed}/{s.total} test
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {results?.map((r) => (
              <li key={r.name} className={`rounded px-2 py-1 ${r.ok ? 'bg-good-soft' : 'bg-bad-soft'}`}>
                <span className="font-mono">{r.ok ? '✓' : '✗'} {r.name}</span>
                {r.error && <pre className="mt-1 whitespace-pre-wrap text-xs text-ink-2">{r.error}</pre>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {stdout && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-ink-2">Output (print)</summary>
          <pre className="mt-1 max-h-48 overflow-auto rounded bg-paper-2 p-2 text-xs">{stdout}</pre>
        </details>
      )}
      {showSolution && <pre className="mt-3 max-h-96 overflow-auto rounded-md border border-rule bg-paper-2 p-3 text-xs">{lab.solution}</pre>}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-ink-2">Xem file test (tests.py)</summary>
        <pre className="mt-1 max-h-72 overflow-auto rounded bg-paper-2 p-2 text-xs">{lab.tests}</pre>
      </details>
    </div>
  )
}
