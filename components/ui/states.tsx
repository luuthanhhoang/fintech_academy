import type { ReactNode } from 'react'

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-rule p-6 text-center">
      <p className="font-serif text-lg">{title}</p>
      {children && <div className="mt-1 text-sm text-ink-3">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ title = 'Đã xảy ra lỗi', error, retry }: { title?: string; error: unknown; retry?: () => void }) {
  const message = error instanceof Error ? error.message : String(error)
  return (
    <div role="alert" className="rounded-lg border border-bad bg-bad-soft p-4 text-sm">
      <p className="font-medium text-bad">{title}</p>
      <p className="mt-1 text-ink-2">{message}</p>
      {retry && (
        <button type="button" onClick={retry} className="mt-3 text-accent underline">
          Thử lại
        </button>
      )}
    </div>
  )
}

export function Skeleton({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`animate-pulse space-y-2 ${className}`} aria-busy="true" aria-label="Đang tải">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="h-3 rounded bg-paper-2" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  )
}
