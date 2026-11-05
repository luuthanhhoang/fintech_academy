/** Citation checking: the tutor must cite passage ids it was given, in the form [id]. */
const CITE = /\[([\p{L}\p{N}:#_-]+)\]/gu

export function extractCitations(text: string): string[] {
  return [...new Set([...text.matchAll(CITE)].map((m) => m[1] as string))]
}

export interface CitationCheck {
  valid: string[]
  invalid: string[]
  grounded: boolean
}

export function checkCitations(text: string, allowedIds: ReadonlySet<string>, insufficientText: string): CitationCheck {
  const cited = extractCitations(text)
  const valid = cited.filter((c) => allowedIds.has(c))
  const invalid = cited.filter((c) => !allowedIds.has(c))
  const saysInsufficient = text.trim().startsWith(insufficientText.slice(0, 20))
  return { valid, invalid, grounded: valid.length > 0 || saysInsufficient }
}
