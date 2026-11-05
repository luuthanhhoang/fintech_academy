import { z } from 'zod'
import { IdSchema, LocalizedSchema } from './common'

export const LabMetaSchema = z.strictObject({
  id: IdSchema,
  title: LocalizedSchema,
  summary: z.string().min(1),
  concepts: z.array(IdSchema).min(1),
  instructions: z.string().min(1),
  timeoutMs: z.number().int().positive().default(10000),
})
export type LabMeta = z.infer<typeof LabMetaSchema>
export type Lab = LabMeta & { starter: string; tests: string; solution: string }
