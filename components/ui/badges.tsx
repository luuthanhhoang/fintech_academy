import type { VerificationStatus } from '@/lib/content/schema/common'

const STATUS: Record<VerificationStatus | 'planned', { label: string; en: string; cls: string; mark: string }> = {
  verified: { label: 'Đã kiểm chứng', en: 'verified', cls: 'border-good text-good bg-good-soft', mark: '✓' },
  needs_verification: { label: 'Cần kiểm chứng', en: 'needs verification', cls: 'border-warn text-warn bg-warn-soft', mark: '?' },
  draft: { label: 'Bản nháp', en: 'draft', cls: 'border-rule text-ink-3 bg-paper-2', mark: '✎' },
  planned: { label: 'Dự kiến', en: 'planned', cls: 'border-rule text-ink-3 bg-paper-2', mark: '○' },
}

export function StatusBadge({ status }: { status: VerificationStatus | 'planned' }) {
  const s = STATUS[status]
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[0.7rem] font-medium ${s.cls}`} title={s.en}>
      <span aria-hidden="true">{s.mark}</span>
      {s.label}
    </span>
  )
}

/** Mandatory label for any simulated / synthetic data (principle 2). */
export function SyntheticBadge({ label, note }: { label: string; note?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-warn bg-warn-soft px-1.5 py-0.5 text-[0.7rem] font-medium text-warn" title={note}>
      <span aria-hidden="true">◇</span>
      {label}
    </span>
  )
}

export function Tag({ children }: { children: string }) {
  return <span className="rounded bg-paper-2 px-1.5 py-0.5 text-[0.7rem] text-ink-2">{children}</span>
}
