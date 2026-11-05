import Link from 'next/link'
import { getContent } from '@/lib/content/server'
import { PageTitle } from '@/components/ui/primitives'

export const metadata = { title: 'Tình huống nhập vai' }

export default function ScenariosPage() {
  const { scenarios, concepts } = getContent()
  return (
    <>
      <PageTitle eyebrow="Ra quyết định có phân nhánh" title="Tình huống nhập vai" en="Scenarios" lead="Đặt mình vào vai kỹ sư, chọn hành động, xem hệ quả và phần phân tích. Mọi tình huống là giả định; nếu có liên hệ sự cố thật, dữ kiện thật nằm ở case study có nguồn." />
      <ul className="grid gap-4 font-sans md:grid-cols-2">
        {scenarios.map((s) => (
          <li key={s.id}>
            <Link href={`/scenarios/${s.id}/`} className="block h-full rounded-xl border border-rule p-5 hover:bg-paper-2">
              <h2 className="font-serif text-xl font-semibold">{s.title.vi}</h2>
              <p className="text-sm text-ink-3">{s.title.en}</p>
              <p className="mt-2 text-sm text-ink-2">{s.summary}</p>
              <p className="mt-3 text-xs text-ink-3">Khái niệm: {s.concepts.map((c) => concepts.find((x) => x.id === c)?.name.vi ?? c).join(', ')}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
