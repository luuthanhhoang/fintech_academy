'use client'

import Link from 'next/link'
import { createContext, useContext, type MouseEvent, type ReactNode } from 'react'

/** Opens a site page inside the village (the in-world reader) instead of leaving the 3D world. */
export type OpenInWorld = (href: string, label: string) => void

export const WorldReaderContext = createContext<OpenInWorld | null>(null)

/**
 * A link that, inside the village, opens its page in the in-world reader. Modifier clicks (new tab) and links
 * outside the village behave like normal links.
 */
export function WorldLink({ href, label, className, children }: { href: string; label: string; className?: string; children: ReactNode }) {
  const open = useContext(WorldReaderContext)
  const click = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!open || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    open(href, label)
  }
  return (
    <Link href={href} onClick={click} className={className}>
      {children}
    </Link>
  )
}
