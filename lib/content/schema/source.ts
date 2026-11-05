import { z } from 'zod'
import { IdSchema, IsoDateSchema } from './common'

export const SourceSchema = z.strictObject({
  id: IdSchema,
  title: z.string().min(1),
  url: z.url(),
  publisher: z.string().min(1),
  /** Date the source was actually checked while authoring. */
  accessed: IsoDateSchema,
  note: z.string().optional(),
})
export type Source = z.infer<typeof SourceSchema>

export const SourceFileSchema = z.strictObject({ sources: z.array(SourceSchema) })
