import type { WorkedExample } from '@/lib/content/schema/learning'
import { MdxContent } from '@/components/reader/mdx-content'
import { WorkedExampleView } from './worked-example-view'

const NONE = {}

/** Server wrapper: compiles each step's Markdown/KaTeX at build time, then hands nodes to the client view. */
export async function WorkedExampleBlock({ example }: { example: WorkedExample }) {
  const md = (s: string) => <MdxContent source={s} components={NONE} />
  return (
    <WorkedExampleView
      id={example.id}
      conceptId={example.conceptId}
      title={example.title}
      problem={md(example.problem)}
      takeaway={md(example.takeaway)}
      steps={example.steps.map(({ text, ...rest }) => ({ ...rest, body: md(text) }))}
    />
  )
}
