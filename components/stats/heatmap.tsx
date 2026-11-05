import { fmtNum } from '@/lib/util/format'

/** Calendar heatmap of study minutes (one hue, light → dark), with a text list for screen readers. */
export function ActivityHeatmap({ days }: { days: { day: string; minutes: number; reviews: number; active: boolean }[] }) {
  const max = Math.max(1, ...days.map((d) => d.minutes))
  const level = (m: number) => (m <= 0 ? 0 : Math.min(4, Math.ceil((m / max) * 4)))
  const shades = ['var(--paper-2)', 'color-mix(in oklab, var(--chart-1) 30%, var(--paper))', 'color-mix(in oklab, var(--chart-1) 55%, var(--paper))', 'color-mix(in oklab, var(--chart-1) 78%, var(--paper))', 'var(--chart-1)']
  return (
    <div className="mt-3">
      <div className="grid grid-flow-col grid-rows-7 gap-[3px] overflow-x-auto" aria-hidden="true">
        {days.map((d) => (
          <span key={d.day} title={`${d.day}: ${fmtNum(d.minutes, 0)} phút, ${d.reviews} lượt ôn`} className="h-3 w-3 rounded-[2px]" style={{ background: d.active && d.minutes === 0 ? shades[1] : shades[level(d.minutes)], outline: d.active ? '1px solid var(--rule)' : undefined }} />
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-3">Ô đậm hơn = nhiều phút học hơn. Ô có viền = ngày có hoạt động (kể cả ôn thẻ/quiz).</p>
      <ul className="sr-only">
        {days.filter((d) => d.active).map((d) => (
          <li key={d.day}>{d.day}: {fmtNum(d.minutes, 0)} phút, {d.reviews} lượt ôn</li>
        ))}
      </ul>
    </div>
  )
}
