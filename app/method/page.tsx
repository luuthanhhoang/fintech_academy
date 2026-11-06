import Link from 'next/link'
import { getContent, sourcesById } from '@/lib/content/server'
import { Card, PageTitle } from '@/components/ui/primitives'

export const metadata = { title: 'Phương pháp học' }

export default function MethodPage() {
  const { methods } = getContent().config
  return (
    <>
      <PageTitle eyebrow="Của bạn" title="Cách học ở đây" lead={methods.intro} />
      <div className="space-y-5 font-sans">
        {methods.methods.map((m) => (
          <Card key={m.id} as="article">
            <h2 id={m.id} className="scroll-mt-20 font-display text-2xl font-semibold">
              {m.name.vi} <span className="font-sans text-base font-normal text-ink-3">({m.name.en})</span>
            </h2>
            <p className="mt-2">{m.summary}</p>
            <p className="mt-3 text-sm"><span className="font-medium">Bằng chứng:</span> {m.evidence}</p>
            <p className="mt-2 text-sm text-ink-2"><span className="font-medium text-ink">Giới hạn:</span> {m.caveat}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="text-ink-3">Dùng trên site:</span>
              {m.features.map((f) => <Link key={f.href + f.label} href={f.href} className="text-accent underline">{f.label}</Link>)}
            </div>
            <ul className="mt-3 space-y-1 border-t border-rule pt-2 text-xs text-ink-3">
              {sourcesById(m.sourceIds).map((s) => (
                <li key={s.id}>
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-accent underline">{s.title}</a> — {s.publisher}. Truy cập {s.accessed}.{s.note ? ` ${s.note}` : ''}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </>
  )
}
