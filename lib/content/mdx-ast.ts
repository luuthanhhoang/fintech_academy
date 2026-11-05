/** Parses lesson MDX into an mdast tree to extract component references, headings and prose text. */
import { createProcessor } from '@mdx-js/mdx'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

interface AstNode {
  type: string
  name?: string | null
  value?: string
  depth?: number
  attributes?: { type: string; name?: string; value?: unknown }[]
  children?: AstNode[]
}

export interface MdxRef {
  component: string
  id: string | null
}

export interface Heading {
  depth: number
  text: string
}

const processor = createProcessor({ remarkPlugins: [remarkGfm, remarkMath] })

export function parseMdx(body: string): AstNode {
  return processor.parse(body) as unknown as AstNode
}

function walk(node: AstNode, visit: (n: AstNode) => boolean | void) {
  if (visit(node) === false) return
  for (const child of node.children ?? []) walk(child, visit)
}

export function extractRefs(tree: AstNode): MdxRef[] {
  const refs: MdxRef[] = []
  walk(tree, (n) => {
    if ((n.type === 'mdxJsxFlowElement' || n.type === 'mdxJsxTextElement') && n.name) {
      const idAttr = n.attributes?.find((a) => a.type === 'mdxJsxAttribute' && a.name === 'id')
      refs.push({ component: n.name, id: typeof idAttr?.value === 'string' ? idAttr.value : null })
    }
  })
  return refs
}

function plainText(node: AstNode): string {
  if (node.type === 'text' || node.type === 'inlineCode') return node.value ?? ''
  if (node.type === 'inlineMath') return node.value ?? ''
  return (node.children ?? []).map(plainText).join('')
}

export function extractHeadings(tree: AstNode): Heading[] {
  const out: Heading[] = []
  walk(tree, (n) => {
    if (n.type === 'heading' && n.depth) out.push({ depth: n.depth, text: plainText(n) })
  })
  return out
}

const NON_PROSE = new Set(['code', 'inlineCode', 'math', 'inlineMath', 'mdxJsxFlowElement', 'mdxJsxTextElement', 'mdxFlowExpression', 'mdxTextExpression'])

/** Prose text only: skips code, math and embedded components (those carry their own sourcing rules). */
export function extractProse(tree: AstNode): string {
  const parts: string[] = []
  walk(tree, (n) => {
    if (NON_PROSE.has(n.type)) return false
    if (n.type === 'text') parts.push(n.value ?? '')
  })
  return parts.join(' ')
}

/** MDX `{expressions}` are not allowed in content (they would execute JS); returns their source text. */
export function extractExpressions(tree: AstNode): string[] {
  const out: string[] = []
  walk(tree, (n) => {
    if (n.type === 'mdxFlowExpression' || n.type === 'mdxTextExpression') out.push(n.value ?? '')
  })
  return out
}
