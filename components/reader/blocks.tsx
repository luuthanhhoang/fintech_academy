import type { ReactNode } from 'react'
import { getContent } from '@/lib/content/server'

/** Visual style per callout kind (labels and honesty notes come from site.yaml → callouts). */
const STYLE: Record<string, string> = {
  note: 'border-accent bg-accent-soft',
  warning: 'border-warn bg-warn-soft',
  dev: 'border-good bg-good-soft',
  example: 'border-rule bg-paper-2',
  story: 'border-ink-3 bg-paper-2 italic-none',
  field: 'border-warn bg-warn-soft/60',
}

export function Callout({ kind = 'note', title, children }: { kind?: string; title?: string; children: ReactNode }) {
  const labels = getContent().config.site.callouts
  const c = labels[kind] ?? labels.note
  return (
    <aside className={`my-6 rounded-r-md border-l-4 px-4 py-3 font-sans text-[0.95rem] ${STYLE[kind] ?? STYLE.note}`}>
      <p className="mb-1 text-xs font-semibold text-ink-2">
        {c?.label}
        {title ? ` · ${title}` : ''}
      </p>
      <div className="[&>p]:my-1">{children}</div>
      {c?.disclaimer && <p className="mt-2 text-[11px] text-ink-3">{c.disclaimer}</p>}
    </aside>
  )
}

/** Side remark, always inline: the lesson now has a right rail, so a floating margin note would overlap it. */
export function Sidenote({ children }: { children: ReactNode }) {
  return (
    <span className="my-2 block border-l-2 border-rule pl-3 font-sans text-sm text-ink-3">
      {children}
    </span>
  )
}

export function Figure({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <figure className="my-8">
      <div>{children}</div>
      <figcaption className="mt-2 font-sans text-sm text-ink-3">{caption}</figcaption>
    </figure>
  )
}
