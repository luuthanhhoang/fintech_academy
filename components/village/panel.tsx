'use client'

import type { ReactNode } from 'react'

/** Translucent overlay panel used on top of the 3D canvas. */
export function Panel({ title, onClose, children, className = '' }: { title?: string; onClose?: () => void; children: ReactNode; className?: string }) {
  return (
    <section className={`pointer-events-auto rounded-xl border border-rule bg-paper/95 p-3 font-sans text-sm text-ink shadow-lg backdrop-blur ${className}`}>
      {(title || onClose) && (
        <header className="mb-2 flex items-start justify-between gap-2">
          {title && <h2 className="font-display text-base font-semibold leading-tight">{title}</h2>}
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Đóng" className="-mr-1 -mt-1 rounded px-2 py-1 text-ink-3 hover:bg-paper-2">
              ✕
            </button>
          )}
        </header>
      )}
      {children}
    </section>
  )
}

export function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="flex flex-col gap-0.5 text-[11px] text-ink-3">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-rule bg-paper px-2 py-1 text-xs text-ink">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
