/**
 * Heuristic detector for real-world figures in prose (percentages, currency amounts, years).
 * Used to fail the build when a lesson states figures but declares no sources.
 */
const PATTERNS: RegExp[] = [
  /\d[\d.,]*\s?%/,
  /\d[\d.,]*\s?(?:USD|VND|EUR|đồng|tỷ|triệu|nghìn tỷ|billion|million|trillion)\b/i,
  /\$\s?\d/,
  /\b(?:18|19|20)\d{2}\b/,
]

/** Vietnamese legal document numbers (e.g. 54/2019/QH14, 686/QĐ-BTC) are identifiers, not figures. */
const LEGAL_CODE = /\b\d+\/(?:\d{4}\/)?[A-ZĐ][A-ZĐa-z0-9-]*/g

export function findFigures(prose: string): string[] {
  const hits: string[] = []
  const text = prose.replace(LEGAL_CODE, '')
  for (const p of PATTERNS) {
    const m = p.exec(text)
    if (m) hits.push(m[0])
  }
  return hits
}
