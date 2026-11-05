/** Parses a user-pasted price CSV: header row of asset names; optional first date column; one row per period. */

export interface PriceTable {
  assets: string[]
  prices: number[][]
  rows: number
}

export type CsvResult = { ok: true; table: PriceTable } | { ok: false; error: string }

const DATE_LIKE = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$|^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/

function splitLine(line: string): string[] {
  const sep = line.includes(';') && !line.includes(',') ? ';' : line.includes('\t') ? '\t' : ','
  return line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''))
}

export function parsePriceCsv(text: string): CsvResult {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length < 3) return { ok: false, error: 'Cần ít nhất 1 dòng tiêu đề và 2 dòng giá.' }
  const header = splitLine(lines[0] as string)
  const firstRow = splitLine(lines[1] as string)
  const hasDate = DATE_LIKE.test(firstRow[0] ?? '') || Number.isNaN(Number(firstRow[0]))
  const assets = hasDate ? header.slice(1) : header
  if (assets.length < 2) return { ok: false, error: 'Cần ít nhất 2 cột tài sản.' }
  const prices = assets.map(() => [] as number[])
  for (let r = 1; r < lines.length; r++) {
    const cells = splitLine(lines[r] as string)
    const values = hasDate ? cells.slice(1) : cells
    if (values.length !== assets.length) return { ok: false, error: `Dòng ${r + 1}: có ${values.length} giá trị, cần ${assets.length}.` }
    for (let i = 0; i < values.length; i++) {
      const v = Number(values[i])
      if (!Number.isFinite(v) || v <= 0) return { ok: false, error: `Dòng ${r + 1}, cột "${assets[i]}": "${values[i]}" không phải giá dương.` }
      prices[i]!.push(v)
    }
  }
  return { ok: true, table: { assets, prices, rows: lines.length - 1 } }
}
