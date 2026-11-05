/**
 * The set of JSX components allowed inside lesson MDX, and which lesson field each `id` attribute
 * must reference. Shared by the validator (build time) and the MDX renderer (components map).
 */
export const MDX_COMPONENT_REFS = {
  Simulator: 'simulators',
  Lab: 'labs',
  Case: 'cases',
  Quiz: 'quiz',
  Fact: 'facts',
  Callout: null,
  Sidenote: null,
  Figure: null,
} as const

export type MdxComponentName = keyof typeof MDX_COMPONENT_REFS
export type MdxRefField = NonNullable<(typeof MDX_COMPONENT_REFS)[MdxComponentName]>

export function isMdxComponentName(name: string): name is MdxComponentName {
  return Object.hasOwn(MDX_COMPONENT_REFS, name)
}
