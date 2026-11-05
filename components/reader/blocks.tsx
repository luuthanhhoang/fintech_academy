import type { ReactNode } from 'react'

const CALLOUT: Record<string, { label: string; cls: string }> = {
  note: { label: 'Ghi chú', cls: 'border-accent bg-accent-soft' },
  warning: { label: 'Cảnh báo', cls: 'border-warn bg-warn-soft' },
  dev: { label: 'Góc nhìn dev', cls: 'border-good bg-good-soft' },
  example: { label: 'Ví dụ', cls: 'border-rule bg-paper-2' },
}

export function Callout({ kind = 'note', title, children }: { kind?: string; title?: string; children: ReactNode }) {
  const c = CALLOUT[kind] ?? (CALLOUT.note as { label: string; cls: string })
  return (
    <aside className={`my-6 rounded-r-md border-l-4 px-4 py-3 font-sans text-[0.95rem] ${c.cls}`}>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-2">{title ?? c.label}</p>
      <div className="[&>p]:my-1">{children}</div>
    </aside>
  )
}

/** Margin note on wide screens, inline aside on narrow screens. */
export function Sidenote({ children }: { children: ReactNode }) {
  return (
    <span className="my-2 block border-l-2 border-rule pl-3 font-sans text-sm text-ink-3 xl:float-right xl:clear-right xl:-mr-64 xl:w-56 xl:border-0 xl:pl-0">
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
