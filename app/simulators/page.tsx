import Link from 'next/link'
import { getContent } from '@/lib/content/server'
import { SyntheticBadge } from '@/components/ui/badges'
import { PageTitle } from '@/components/ui/primitives'
import { hubItems } from '@/components/workshop/hub-items'
import { ItemList } from '@/components/workshop/item-list'

export const metadata = { title: 'Mô phỏng' }

export default function SimulatorsPage() {
  const b = getContent()
  const items = hubItems(b, 'simulators').map((it, i) => ({
    ...it,
    badge: b.simulators[i]!.dataKind !== 'formula' ? <SyntheticBadge label={b.config.site.syntheticLabel} /> : undefined,
  }))
  return (
    <>
      <PageTitle eyebrow={<Link href="/workshop/" className="hover:underline">← Thực hành</Link>} title="Mô phỏng" lead="Kéo tham số và xem kết quả đổi theo. Mỗi mô phỏng có phần “thử phá nó” với tham số cực đoan, kèm giải thích vì sao kết quả như vậy." />
      <ItemList items={items} />
    </>
  )
}
