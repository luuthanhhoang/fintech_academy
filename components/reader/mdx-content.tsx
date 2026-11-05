import { evaluate } from '@mdx-js/mdx'
import type { ComponentProps, ComponentType } from 'react'
import * as runtime from 'react/jsx-runtime'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

type MdxComponents = Record<string, ComponentType<never>>

/** Compiles lesson MDX at build time (static export) and renders it with the given component map. */
export async function MdxContent({ source, components }: { source: string; components: MdxComponents }) {
  const { default: Content } = await evaluate(source, {
    ...runtime,
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeSlug, [rehypeKatex, { strict: 'ignore' }]],
  })
  return <Content components={components as ComponentProps<typeof Content>['components']} />
}
