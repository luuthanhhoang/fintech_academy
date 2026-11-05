import { z } from 'zod'
import { IdSchema, IsoDateSchema, LocalizedSchema, RubricItemSchema, VerificationStatusSchema } from './common'

export const DevMappingSchema = z.strictObject({
  finance: z.string().min(1),
  dev: z.string().min(1),
  explanation: z.string().min(1),
})
export type DevMapping = z.infer<typeof DevMappingSchema>

/** A real-world figure. Rendered through <Fact id/>; hidden value when not verified. */
export const FactSchema = z.strictObject({
  id: IdSchema,
  text: z.string().min(1),
  value: z.string().optional(),
  sourceId: IdSchema,
  asOf: IsoDateSchema,
  status: VerificationStatusSchema,
})
export type Fact = z.infer<typeof FactSchema>

export const LessonFrontmatterSchema = z.strictObject({
  id: IdSchema,
  track: IdSchema,
  stage: IdSchema,
  order: z.number().int().nonnegative(),
  title: LocalizedSchema,
  summary: z.string().min(1),
  concepts: z.array(IdSchema).min(1),
  estMinutes: z.number().int().positive(),
  whyQuestion: z.string().min(1),
  devMapping: z.array(DevMappingSchema).min(1),
  simulators: z.array(IdSchema).default([]),
  labs: z.array(IdSchema).default([]),
  cases: z.array(IdSchema).default([]),
  sources: z.array(IdSchema).default([]),
  facts: z.array(FactSchema).default([]),
  lastVerified: IsoDateSchema,
  status: VerificationStatusSchema,
  selfExplain: z.strictObject({ prompt: z.string().min(1), rubric: z.array(RubricItemSchema).min(1) }),
})
export type LessonFrontmatter = z.infer<typeof LessonFrontmatterSchema>

export const PlannedLessonSchema = z.strictObject({
  id: IdSchema,
  stage: IdSchema,
  order: z.number().int().nonnegative(),
  title: LocalizedSchema,
  concepts: z.array(IdSchema).min(1),
})
export const PlannedFileSchema = z.strictObject({ track: IdSchema, lessons: z.array(PlannedLessonSchema) })
export type PlannedLesson = z.infer<typeof PlannedLessonSchema> & { track: string; status: 'planned' }
