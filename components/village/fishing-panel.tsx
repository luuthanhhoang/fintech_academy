'use client'

import type { Catalog } from '@/lib/content/catalog'
import { WhyLink } from '@/components/learn/why-link'
import { ReviewSession } from '@/components/review/review-session'
import { Panel } from './panel'

/** At the pond, each fish is a review card that is due; answering brings it in. */
export function FishingPanel({ catalog, dueCount, onClose }: { catalog: Catalog; dueCount: number; onClose: () => void }) {
  return (
    <Panel title="Câu cá bên ao" onClose={onClose} className="max-h-[70dvh] w-full overflow-y-auto sm:w-96">
      <p className="mb-2 text-xs text-ink-3">
        {dueCount > 0 ? `${dueCount} con cá trong ao = ${dueCount} thẻ đến hạn theo lịch FSRS.` : 'Ao đang yên — chưa có thẻ nào đến hạn.'}
      </p>
      <ReviewSession catalog={catalog} />
      <div className="mt-2 flex gap-3">
        <WhyLink method="retrieval-practice" />
        <WhyLink method="spaced-repetition" label="Vì sao ôn ngắt quãng?" />
      </div>
    </Panel>
  )
}
