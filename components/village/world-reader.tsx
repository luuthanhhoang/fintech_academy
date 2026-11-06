'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export interface ReaderPage { href: string; label: string }

/**
 * The in-world reader: a lesson, simulator, lab, case or the tutor opens on a sheet over the village, so you stay
 * in the world (the 3D scene keeps running behind it; the camera frames the place you entered). Your progress
 * is saved in the same browser database, so houses and fields update as soon as you close it.
 */
export function WorldReader({ page, onClose }: { page: ReaderPage; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="pointer-events-auto absolute inset-y-2 right-2 z-20 flex w-[min(58rem,calc(100%-1rem))] flex-col overflow-hidden rounded-2xl border border-rule bg-paper shadow-2xl motion-safe:animate-[reader-in_.28s_ease-out] max-sm:inset-x-1 max-sm:inset-y-1 max-sm:w-auto">
      <header className="flex items-center gap-2 border-b border-rule bg-paper-2/70 px-3 py-2 font-sans">
        <button type="button" onClick={onClose} className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-paper shadow-sm hover:opacity-90">
          ← Về làng
        </button>
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{page.label}</p>
        <Link href={page.href} className="shrink-0 text-xs text-ink-3 underline" title="Mở toàn trang (rời làng)">
          Mở toàn trang
        </Link>
      </header>
      <iframe src={page.href} title={page.label} className="h-full w-full flex-1 bg-paper" />
    </div>
  )
}
