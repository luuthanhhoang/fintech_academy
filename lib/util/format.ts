/** Number formatting (vi-VN locale). Pure helpers shared by simulators, stats and tutor tool output. */
const nf = (digits: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: digits, minimumFractionDigits: 0 })

export function fmtNum(x: number | null | undefined, digits = 2): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return '—'
  return nf(digits).format(x)
}

export function fmtPct(x: number | null | undefined, digits = 2): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return '—'
  return `${nf(digits).format(x * 100)}%`
}

export function fmtDuration(ms: number): string {
  const min = Math.round(ms / 60000)
  if (min < 60) return `${min} phút`
  return `${Math.floor(min / 60)} giờ ${min % 60} phút`
}

/** "2026-11-06" → "6/11/2026" (Vietnamese day/month/year); other strings pass through unchanged. */
export function fmtDay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? `${Number(m[3])}/${Number(m[2])}/${m[1]}` : iso
}
