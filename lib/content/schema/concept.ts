import { z } from 'zod'
import { IdSchema, LocalizedSchema } from './common'

export const ConceptSchema = z.strictObject({
  id: IdSchema,
  name: LocalizedSchema,
  short: z.string().min(1),
  prerequisites: z.array(IdSchema).default([]),
  tags: z.array(z.string().min(1)).default([]),
  difficulty: z.number().int().min(1).max(5),
})

/** One file per stage: track/stage are declared once and applied to every concept. */
export const ConceptFileSchema = z.strictObject({
  track: IdSchema,
  stage: IdSchema,
  concepts: z.array(ConceptSchema).min(1),
})

export type ConceptInput = z.infer<typeof ConceptSchema>
export type Concept = ConceptInput & { track: string; stage: string }
