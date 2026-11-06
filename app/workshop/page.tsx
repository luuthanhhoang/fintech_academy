import Link from 'next/link'
import { getContent } from '@/lib/content/server'
import { SyntheticBadge } from '@/components/ui/badges'
import { Icon } from '@/components/ui/icons'
import { PageTitle } from '@/components/ui/primitives'
import { DailyPanel } from '@/components/workshop/daily-panel'
import { hubItems } from '@/components/workshop/hub-items'
import { ItemList } from '@/components/workshop/item-list'

export const metadata = { title: 'Thực hành' }

const LIST_KINDS = ['simulators', 'labs', 'cases', 'scenarios'] as const

/** Every way to practise in one place: the two daily habits first, then simulators, labs, cases and scenarios. */
export default function WorkshopPage() {
  const b = getContent()
  const w = b.config.site.workshop
  const section = (kind: string) => w.sections.find((s) => s.kind === kind)
  const review = section('review')
  const practice = section('practice')
  return (
    <>
      <PageTitle title={w.title} lead={w.intro} />
      {review && practice && <DailyPanel review={review} practice={practice} />}
      {LIST_KINDS.map((kind) => {
        const s = section(kind)
        if (!s) return null
        const items = hubItems(b, kind).map((it, i) => ({
          ...it,
          badge: kind === 'simulators' && b.simulators[i]!.dataKind !== 'formula' ? <SyntheticBadge label={b.config.site.syntheticLabel} /> : undefined,
        }))
        return (
          <section key={kind} aria-labelledby={`ws-${kind}`} className="mt-16">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 id={`ws-${kind}`} className="flex items-center gap-2.5 font-display text-2xl font-bold">
                  <Icon name={s.icon} width={22} height={22} className="text-accent" />
                  {s.title} <span className="num text-lg font-medium text-ink-3">{items.length}</span>
                </h2>
                <p className="mt-1 max-w-[65ch] text-ink-2">{s.desc}</p>
              </div>
              <Link href={s.href} className="text-sm font-medium text-accent hover:underline">
                Mở trang {s.title.toLowerCase()}
              </Link>
            </div>
            <ItemList items={items} />
          </section>
        )
      })}
    </>
  )
}
