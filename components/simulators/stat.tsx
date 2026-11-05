import type { ReactNode } from 'react'

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-md border border-rule px-3 py-2">
      <p className="text-xs text-ink-3">{label}</p>
      <p className="num text-lg">{value}</p>
      {hint && <p className="text-xs text-ink-3">{hint}</p>}
    </div>
  )
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{children}</div>
}

export function Warning({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mb-3 rounded-md border border-bad bg-bad-soft px-3 py-2 text-sm text-bad">
      ⚠ {children}
    </p>
  )
}
