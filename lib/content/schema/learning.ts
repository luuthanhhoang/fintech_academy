/** Schemas for v2 learning blocks: worked examples, diagrams, scenarios, applications, learning methods. */
import { z } from 'zod'
import { IdSchema, LocalizedSchema } from './common'

export const ToleranceSchema = z.strictObject({ kind: z.enum(['abs', 'rel']), value: z.number().nonnegative() })

/** A step either just explains, or is "faded": the learner must produce the number before it is revealed. */
export const ExampleStepSchema = z.strictObject({
  text: z.string().min(1),
  faded: z.boolean().default(false),
  prompt: z.string().optional(),
  answer: z.number().optional(),
  tolerance: ToleranceSchema.optional(),
  unit: z.string().optional(),
})
export type ExampleStep = z.infer<typeof ExampleStepSchema>

export const WorkedExampleSchema = z.strictObject({
  id: IdSchema,
  title: z.string().min(1),
  conceptId: IdSchema,
  problem: z.string().min(1),
  steps: z.array(ExampleStepSchema).min(2),
  takeaway: z.string().min(1),
})
export type WorkedExample = z.infer<typeof WorkedExampleSchema>
export const ExampleFileSchema = z.strictObject({ examples: z.array(WorkedExampleSchema).min(1) })

const SequenceDiagramSchema = z.strictObject({
  id: IdSchema,
  kind: z.literal('sequence'),
  title: z.string().min(1),
  caption: z.string().min(1),
  actors: z.array(z.strictObject({ id: IdSchema, label: z.string().min(1) })).min(2),
  steps: z
    .array(z.strictObject({ from: IdSchema, to: IdSchema, label: z.string().min(1), note: z.string().optional() }))
    .min(1),
})

const FlowDiagramSchema = z.strictObject({
  id: IdSchema,
  kind: z.literal('flow'),
  title: z.string().min(1),
  caption: z.string().min(1),
  direction: z.enum(['LR', 'TB']).default('LR'),
  nodes: z.array(z.strictObject({ id: IdSchema, label: z.string().min(1), tone: z.enum(['default', 'accent', 'warn', 'good']).default('default') })).min(2),
  edges: z.array(z.strictObject({ from: IdSchema, to: IdSchema, label: z.string().optional() })).min(1),
})

export const DiagramSchema = z.discriminatedUnion('kind', [SequenceDiagramSchema, FlowDiagramSchema])
export type Diagram = z.infer<typeof DiagramSchema>
export type SequenceDiagram = z.infer<typeof SequenceDiagramSchema>
export type FlowDiagram = z.infer<typeof FlowDiagramSchema>
export const DiagramFileSchema = z.strictObject({ diagrams: z.array(DiagramSchema).min(1) })

export const ApplicationSchema = z.strictObject({
  id: IdSchema,
  title: z.string().min(1),
  context: z.string().min(1),
  task: z.string().min(1),
  deliverable: z.string().min(1),
})
export type Application = z.infer<typeof ApplicationSchema>

const ChoiceSchema = z.strictObject({
  id: IdSchema,
  label: z.string().min(1),
  next: IdSchema,
  feedback: z.string().min(1),
  quality: z.enum(['good', 'risky', 'bad']),
})

const ScenarioNodeSchema = z
  .strictObject({
    id: IdSchema,
    text: z.string().min(1),
    choices: z.array(ChoiceSchema).min(2).optional(),
    ending: z.strictObject({ verdict: z.enum(['good', 'mixed', 'bad']), debrief: z.string().min(1) }).optional(),
  })
  .refine((n) => Boolean(n.choices) !== Boolean(n.ending), 'mỗi nút phải có đúng một trong hai: choices hoặc ending')
export type ScenarioNode = z.infer<typeof ScenarioNodeSchema>
export type ScenarioChoice = z.infer<typeof ChoiceSchema>

export const ScenarioSchema = z.strictObject({
  id: IdSchema,
  title: LocalizedSchema,
  role: z.string().min(1),
  summary: z.string().min(1),
  concepts: z.array(IdSchema).min(1),
  /** Scenarios are hypothetical by construction; real facts mentioned must cite sources. */
  hypotheticalNote: z.string().min(1),
  relatedCase: IdSchema.optional(),
  sourceIds: z.array(IdSchema).default([]),
  start: IdSchema,
  nodes: z.array(ScenarioNodeSchema).min(2),
})
export type Scenario = z.infer<typeof ScenarioSchema>

export const LearningMethodSchema = z.strictObject({
  id: IdSchema,
  name: LocalizedSchema,
  summary: z.string().min(1),
  evidence: z.string().min(1),
  caveat: z.string().min(1),
  sourceIds: z.array(IdSchema).min(1),
  features: z.array(z.strictObject({ label: z.string().min(1), href: z.string().startsWith('/') })).min(1),
})
export type LearningMethod = z.infer<typeof LearningMethodSchema>
export const MethodsConfigSchema = z.strictObject({ intro: z.string().min(1), methods: z.array(LearningMethodSchema).min(1) })

export const PracticeConfigSchema = z.strictObject({
  size: z.number().int().positive(),
  weakShare: z.number().min(0).max(1),
  minConcepts: z.number().int().positive(),
})
export type PracticeConfig = z.infer<typeof PracticeConfigSchema>
