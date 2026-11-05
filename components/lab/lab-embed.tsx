'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Lab } from '@/lib/content/schema/lab'
import { Button } from '@/components/ui/primitives'
import { LabWorkbench } from './lab-runner'

/** Lab embedded in a lesson; Python only loads after the learner opens it. */
export function LabEmbed({ lab }: { lab: Lab }) {
  const [open, setOpen] = useState(false)
  return (
    <figure className="my-8 rounded-xl border border-rule p-4 font-sans">
      <figcaption className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-ink-3">Code lab (Python)</span>
        <span className="font-medium">{lab.title.vi}</span>
        <Link href={`/labs/${lab.id}/`} className="ml-auto text-xs text-accent underline">
          Mở trang lab
        </Link>
      </figcaption>
      <p className="mt-2 text-sm text-ink-2">{lab.summary}</p>
      {open ? (
        <div className="mt-3">
          <p className="mb-2 whitespace-pre-line text-sm">{lab.instructions}</p>
          <LabWorkbench lab={lab} />
        </div>
      ) : (
        <Button variant="primary" className="mt-3" onClick={() => setOpen(true)}>
          Mở lab tại đây
        </Button>
      )}
    </figure>
  )
}
