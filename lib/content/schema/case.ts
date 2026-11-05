import { z } from 'zod'
import { IdSchema, IsoDateSchema, LocalizedSchema, RubricItemSchema, VerificationStatusSchema } from './common'

export const TimelineEventSchema = z.strictObject({
  date: z.string().min(4),
  event: z.string().min(1),
  sourceIds: z.array(IdSchema).min(1, 'mỗi sự kiện phải có nguồn'),
  status: VerificationStatusSchema,
})

export const CaseSchema = z.strictObject({
  id: IdSchema,
  title: LocalizedSchema,
  period: z.string().min(1),
  summary: z.string().min(1),
  concepts: z.array(IdSchema).min(1),
  timeline: z.array(TimelineEventSchema).min(1),
  rootCauses: z.array(z.strictObject({ text: z.string().min(1), sourceIds: z.array(IdSchema).min(1) })).min(1),
  questions: z
    .array(z.strictObject({ id: IdSchema, prompt: z.string().min(1), rubric: z.array(RubricItemSchema).min(1) }))
    .min(1),
  controls: z.array(z.strictObject({ control: z.string().min(1), devAnalogy: z.string().min(1) })).min(1),
  lastVerified: IsoDateSchema,
  status: VerificationStatusSchema,
})
export type CaseStudy = z.infer<typeof CaseSchema>
export type TimelineEvent = z.infer<typeof TimelineEventSchema>
