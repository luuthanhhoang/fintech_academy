import Link from 'next/link'
import { getContent } from '@/lib/content/server'
import { SyntheticBadge } from '@/components/ui/badges'
import { PageTitle } from '@/components/ui/primitives'

export const metadata = { title: 'Mô phỏng' }

export default function SimulatorsPage() {
  const { simulators, lessons, config } = getContent()
  return (
    <>
      <PageTitle eyebrow="Logic thuần trong lib/finance, có unit test" title="Mô phỏng" en="Simulators" lead="Mỗi mô phỏng có phần “Thử phá nó” với tham số cực đoan và giải thích kết quả." />
      <ul className="grid gap-4 font-sans md:grid-cols-2">
        {simulators.map((s) => (
          <li key={s.id}>
            <Link href={`/simulators/${s.id}/`} className="block h-full rounded-xl border border-rule p-5 hover:bg-paper-2">
              <h2 className="font-serif text-xl font-semibold">{s.title.vi}</h2>
              <p className="text-sm text-ink-3">{s.title.en}</p>
              <p className="mt-2 text-sm text-ink-2">{s.summary}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-3">
                {s.dataKind !== 'formula' && <SyntheticBadge label={config.site.syntheticLabel} />}
                <span>Dùng trong: {lessons.filter((l) => l.simulators.includes(s.id)).map((l) => l.title.vi).join(', ')}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
