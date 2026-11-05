import { parse } from 'yaml'

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

/** Splits an MDX file into its YAML frontmatter object and the remaining body. */
/** Throws on invalid YAML; callers attach the file path. */
export function splitFrontmatter(source: string): { data: unknown; body: string } {
  const match = FRONTMATTER.exec(source)
  if (!match) return { data: {}, body: source }
  return { data: parse(match[1] ?? ''), body: source.slice(match[0].length) }
}
