import type { DevMapping } from '@/lib/content/schema/lesson'

export function DevMappingTable({ items }: { items: DevMapping[] }) {
  return (
    <section aria-labelledby="anh-xa-dev" className="my-10 font-sans">
      <h2 id="anh-xa-dev" className="font-display text-2xl font-semibold" style={{ scrollMarginTop: '5rem' }}>
        Ánh xạ sang ngôn ngữ dev
      </h2>
      <dl className="mt-4 divide-y divide-rule rounded-lg border border-rule">
        {items.map((m, i) => (
          <div key={i} className="grid gap-1 p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-baseline sm:gap-3">
            <dt className="font-medium">{m.finance}</dt>
            <span aria-hidden="true" className="hidden text-ink-3 sm:block">≈</span>
            <dd className="font-mono text-sm text-accent">{m.dev}</dd>
            <dd className="text-sm text-ink-2 sm:col-span-3">{m.explanation}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
