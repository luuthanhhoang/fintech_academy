/** Small shared helpers for the book generator: HTML escaping, Vietnamese number/date formatting. */

export const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const VI = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 6 })
export const fmtNum = (n: number): string => VI.format(n)

/** 2026-11-07 → 07/11/2026 */
export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export const pad2 = (n: number): string => String(n).padStart(2, '0')

/** Capitalised ASCII letter for an option id such as "a" → "A". */
export const optLetter = (id: string): string => id.toUpperCase()

export function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const VERDICT_VI: Record<string, string> = { good: 'Tốt', mixed: 'Trung bình', bad: 'Xấu' }
export const QUALITY_VI: Record<string, string> = { good: 'Hợp lý', risky: 'Rủi ro', bad: 'Sai hướng' }
