import type { Source } from '@/lib/content/schema/source'
import type { VerificationStatus } from '@/lib/content/schema/common'
import { StatusBadge } from '@/components/ui/badges'

export function SourcesList({ sources, lastVerified, status }: { sources: Source[]; lastVerified: string; status: VerificationStatus }) {
  return (
    <section aria-labelledby="sources" className="mt-12 border-t border-rule pt-6 font-sans">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="sources" className="font-serif text-xl font-semibold">
          Nguồn (Sources)
        </h2>
        <StatusBadge status={status} />
        <span className="text-xs text-ink-3">Kiểm tra lần cuối: {lastVerified}</span>
      </div>
      {sources.length === 0 ? (
        <p className="mt-3 text-sm text-ink-3">Bài này không chứa số liệu thực tế cần nguồn.</p>
      ) : (
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
          {sources.map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2">
                {s.title}
              </a>
              <span className="text-ink-3"> — {s.publisher}. Truy cập {s.accessed}.</span>
              {s.note && <span className="block text-xs text-ink-3">{s.note}</span>}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
