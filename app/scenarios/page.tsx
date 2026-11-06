import Link from 'next/link'
import { getContent } from '@/lib/content/server'
import { PageTitle } from '@/components/ui/primitives'
import { hubItems } from '@/components/workshop/hub-items'
import { ItemList } from '@/components/workshop/item-list'

export const metadata = { title: 'Tình huống nhập vai' }

export default function ScenariosPage() {
  const b = getContent()
  const name = new Map(b.concepts.map((c) => [c.id, c.name.vi]))
  const items = hubItems(b, 'scenarios').map((it, i) => ({ ...it, note: `Luyện: ${b.scenarios[i]!.concepts.map((c) => name.get(c) ?? c).join(', ')}` }))
  return (
    <>
      <PageTitle
        eyebrow={<Link href="/workshop/" className="hover:underline">← Thực hành</Link>}
        title="Tình huống nhập vai"
        lead="Bạn là người trực ca: chọn hành động, xem hệ quả và phần phân tích. Mọi tình huống là giả định; nếu liên hệ sự cố thật, dữ kiện thật nằm ở case study có nguồn."
      />
      <ItemList items={items} />
    </>
  )
}
