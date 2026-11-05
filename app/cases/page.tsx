import Link from 'next/link'
import { getContent } from '@/lib/content/server'
import { StatusBadge } from '@/components/ui/badges'
import { PageTitle } from '@/components/ui/primitives'

export const metadata = { title: 'Case study' }

export default function CasesPage() {
  const { cases } = getContent()
  return (
    <>
      <PageTitle eyebrow="Sự cố thật, dữ kiện có nguồn" title="Case study" en="Case studies" />
      <ul className="grid gap-4 font-sans md:grid-cols-2">
        {cases.map((c) => (
          <li key={c.id}>
            <Link href={`/cases/${c.id}/`} className="block h-full rounded-xl border border-rule p-5 hover:bg-paper-2">
              <p className="num text-xs text-ink-3">{c.period}</p>
              <h2 className="font-serif text-xl font-semibold">{c.title.vi}</h2>
              <p className="mt-2 text-sm text-ink-2">{c.summary}</p>
              <span className="mt-3 inline-block"><StatusBadge status={c.status} /></span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
