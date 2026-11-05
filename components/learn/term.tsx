'use client'

import Link from 'next/link'
import { useId, useState, type ReactNode } from 'react'

/** Inline glossary term: tap/hover shows the concept's short definition with a link to its page. */
export function Term({ concept, children }: { concept: { id: string; name: { vi: string; en: string }; short: string }; children?: ReactNode }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <span className="relative inline" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className="cursor-help border-b border-dotted border-accent text-inherit">
        {children ?? concept.name.vi}
      </button>
      {open && (
        <span id={id} role="tooltip" className="absolute left-0 top-full z-30 mt-1 block w-72 rounded-md border border-rule bg-paper p-3 font-sans text-sm shadow-lg">
          <span className="block font-medium">
            {concept.name.vi} <span className="text-ink-3">({concept.name.en})</span>
          </span>
          <span className="mt-1 block text-ink-2">{concept.short}</span>
          <Link href={`/concepts/${concept.id}/`} className="mt-2 block text-xs text-accent underline">
            Mở khái niệm →
          </Link>
        </span>
      )}
    </span>
  )
}
