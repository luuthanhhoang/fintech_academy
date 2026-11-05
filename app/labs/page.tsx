import Link from 'next/link'
import { getContent } from '@/lib/content/server'
import { PageTitle } from '@/components/ui/primitives'

export const metadata = { title: 'Code lab' }

export default function LabsPage() {
  const { labs } = getContent()
  return (
    <>
      <PageTitle eyebrow="Python chạy trong trình duyệt (Pyodide)" title="Code lab" en="Labs" lead="Viết code, bấm chạy test, hệ thống tự chấm. Python chỉ được tải khi bạn mở lab." />
      <ul className="grid gap-4 font-sans md:grid-cols-2">
        {labs.map((l) => (
          <li key={l.id}>
            <Link href={`/labs/${l.id}/`} className="block h-full rounded-xl border border-rule p-5 hover:bg-paper-2">
              <h2 className="font-serif text-xl font-semibold">{l.title.vi}</h2>
              <p className="text-sm text-ink-3">{l.title.en}</p>
              <p className="mt-2 text-sm text-ink-2">{l.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
