'use client'

import Link from 'next/link'
import { Fragment } from 'react'
import type { TurnResult } from '@/lib/tutor/session'

const CITE = /(\[[\p{L}\p{N}:#_-]+\])/gu

/** Renders the answer with citations turned into links to the cited passage; flags ungrounded answers. */
export function TutorAnswer({ turn, insufficientText }: { turn: TurnResult; insufficientText: string }) {
  const byId = new Map(turn.passages.map((p) => [p.id, p]))
  const grounded = turn.citations.grounded
  return (
    <div className="space-y-2">
      {!grounded && (
        <p role="alert" className="rounded-md border border-warn bg-warn-soft p-2 text-sm">
          ⚠ Câu trả lời không có trích dẫn hợp lệ tới kho nội dung, nên không được coi là căn cứ. {insufficientText}
        </p>
      )}
      <div className={`whitespace-pre-wrap text-sm leading-relaxed ${grounded ? '' : 'opacity-60'}`}>
        {turn.text.split(CITE).map((part, i) => {
          const id = part.startsWith('[') ? part.slice(1, -1) : null
          const p = id ? byId.get(id) : undefined
          return p ? (
            <Link key={i} href={p.href} className="mx-0.5 rounded bg-accent-soft px-1 text-xs text-accent" title={`${p.source} — ${p.title}`}>
              {p.title}
            </Link>
          ) : (
            <Fragment key={i}>{part}</Fragment>
          )
        })}
      </div>
      {turn.citations.invalid.length > 0 && <p className="text-xs text-bad">Trích dẫn không tồn tại trong đoạn được cung cấp (bị bỏ qua): {turn.citations.invalid.join(', ')}</p>}
      {turn.toolLog.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-ink-2">Phép tính qua công cụ ({turn.toolLog.length})</summary>
          <ul className="mt-1 space-y-1">
            {turn.toolLog.map((t, i) => (
              <li key={i} className={`rounded p-1.5 font-mono ${t.ok ? 'bg-paper-2' : 'bg-bad-soft'}`}>
                {t.name}({JSON.stringify(t.input)}) → {JSON.stringify(t.output)}
              </li>
            ))}
          </ul>
        </details>
      )}
      {turn.passages.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-ink-2">Đoạn nội dung đã truy xuất ({turn.passages.length})</summary>
          <ul className="mt-1 list-disc pl-4">
            {turn.passages.map((p) => (
              <li key={p.id}>
                <Link href={p.href} className="text-accent underline">{p.source} — {p.title}</Link> <span className="font-mono text-ink-3">[{p.id}]</span>
              </li>
            ))}
          </ul>
        </details>
      )}
      {turn.stop === 'refusal' && <p className="text-xs text-warn">Nhà cung cấp đã từ chối trả lời yêu cầu này.</p>}
      {turn.stop === 'max_tokens' && <p className="text-xs text-warn">Câu trả lời bị cắt do giới hạn token.</p>}
    </div>
  )
}
