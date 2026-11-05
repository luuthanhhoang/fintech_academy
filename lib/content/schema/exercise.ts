import { z } from 'zod'
import { IdSchema } from './common'

export const ExerciseSchema = z.strictObject({
  id: IdSchema,
  conceptId: IdSchema,
  prompt: z.string().min(1),
  hint: z.string().optional(),
  solution: z.string().min(1),
  /** Optional simulator to open with a parameter preset while solving. */
  simulator: z
    .object({ id: IdSchema, params: z.record(z.string(), z.number()).default({}) })
    .optional(),
})
export type Exercise = z.infer<typeof ExerciseSchema>

export const ExerciseFileSchema = z.strictObject({ exercises: z.array(ExerciseSchema).min(1) })
