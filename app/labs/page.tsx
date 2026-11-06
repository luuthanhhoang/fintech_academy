import Link from 'next/link'
import { getContent } from '@/lib/content/server'
import { PageTitle } from '@/components/ui/primitives'
import { hubItems } from '@/components/workshop/hub-items'
import { ItemList } from '@/components/workshop/item-list'

export const metadata = { title: 'Code lab' }

export default function LabsPage() {
  return (
    <>
      <PageTitle eyebrow={<Link href="/workshop/" className="hover:underline">← Thực hành</Link>} title="Code lab" lead="Viết Python ngay trong trình duyệt, bấm chạy test và xem mình đúng tới đâu. Python chỉ tải về khi bạn mở một lab." />
      <ItemList items={hubItems(getContent(), 'labs')} />
    </>
  )
}
