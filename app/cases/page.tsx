import Link from 'next/link'
import { getContent } from '@/lib/content/server'
import { StatusBadge } from '@/components/ui/badges'
import { PageTitle } from '@/components/ui/primitives'
import { hubItems } from '@/components/workshop/hub-items'
import { ItemList } from '@/components/workshop/item-list'

export const metadata = { title: 'Case study' }

export default function CasesPage() {
  const b = getContent()
  const items = hubItems(b, 'cases').map((it, i) => ({ ...it, note: b.cases[i]!.period, badge: <StatusBadge status={b.cases[i]!.status} /> }))
  return (
    <>
      <PageTitle eyebrow={<Link href="/workshop/" className="hover:underline">← Thực hành</Link>} title="Case study" lead="Sự cố thật, kể lại theo dòng thời gian, mỗi dữ kiện đều có nguồn. Đọc như hồ sơ điều tra rồi tự hỏi: mình sẽ làm gì?" />
      <ItemList items={items} />
    </>
  )
}
