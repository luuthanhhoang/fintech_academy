import { z } from 'zod'
import { IdSchema, LocalizedSchema } from './common'

export const StageSchema = z.strictObject({
  id: IdSchema,
  order: z.number().int().nonnegative(),
  title: LocalizedSchema,
  summary: z.string().min(1),
})
export type Stage = z.infer<typeof StageSchema>

export const TrackSchema = z.strictObject({
  id: IdSchema,
  order: z.number().int().nonnegative(),
  title: LocalizedSchema,
  summary: z.string().min(1),
  stages: z.array(StageSchema).min(1),
})
export type Track = z.infer<typeof TrackSchema>
