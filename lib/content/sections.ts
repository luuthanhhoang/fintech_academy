/** Splits lesson MDX into H2/H3 sections (heading slug + plain text) for search, tutor retrieval and TOC. */
import GithubSlugger from 'github-slugger'
import { parseMdx } from './mdx-ast'

interface Node {
  type: string
  value?: string
  depth?: number
  children?: Node[]
}

export interface Section {
  slug: string
  heading: string
  depth: number
  text: string
}

const LEAF_TYPES = new Set(['text', 'inlineCode', 'code', 'math', 'inlineMath'])

function textOf(node: Node): string {
  if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') return ''
  if (node.value !== undefined && LEAF_TYPES.has(node.type)) {
    if (node.type === 'inlineMath') return '$' + node.value + '$'
    if (node.type === 'math') return '$$' + node.value + '$$'
    return node.value
  }
  return (node.children ?? []).map(textOf).join(node.type === 'list' ? '\n' : '')
}

/** Headings (depth 2–3) with slugs identical to rehype-slug's output. */
export function lessonSections(body: string): Section[] {
  const tree = parseMdx(body) as unknown as Node
  const slugger = new GithubSlugger()
  const sections: Section[] = [{ slug: '', heading: '', depth: 1, text: '' }]
  for (const node of tree.children ?? []) {
    if (node.type === 'heading' && (node.depth === 2 || node.depth === 3)) {
      const heading = textOf(node)
      sections.push({ slug: slugger.slug(heading), heading, depth: node.depth, text: '' })
      continue
    }
    if (node.type === 'heading') slugger.slug(textOf(node))
    const current = sections[sections.length - 1] as Section
    const t = textOf(node).trim()
    if (t) current.text += (current.text ? '\n' : '') + t
  }
  return sections.filter((s) => s.heading || s.text)
}
