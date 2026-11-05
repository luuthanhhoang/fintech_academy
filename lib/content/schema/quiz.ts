import { z } from 'zod'
import { IdSchema, RubricItemSchema } from './common'

const base = {
  id: IdSchema,
  conceptId: IdSchema,
  prompt: z.string().min(1),
  explanation: z.string().min(1),
}

export const McqItemSchema = z.strictObject({
  ...base,
  type: z.literal('mcq'),
  options: z.array(z.strictObject({ id: IdSchema, text: z.string().min(1) })).min(2),
  correct: z.array(IdSchema).min(1),
})

export const NumericItemSchema = z.strictObject({
  ...base,
  type: z.literal('numeric'),
  answer: z.number(),
  tolerance: z.strictObject({ kind: z.enum(['abs', 'rel']), value: z.number().nonnegative() }),
  unit: z.string().optional(),
})

export const OrderingItemSchema = z.strictObject({
  ...base,
  type: z.literal('ordering'),
  /** Items listed in the correct order; UI shuffles them deterministically. */
  items: z.array(z.strictObject({ id: IdSchema, text: z.string().min(1) })).min(2),
})

export const ExplainItemSchema = z.strictObject({
  ...base,
  type: z.literal('explain'),
  rubric: z.array(RubricItemSchema).min(1),
  modelAnswer: z.string().min(1),
})

export const QuizItemSchema = z.discriminatedUnion('type', [
  McqItemSchema,
  NumericItemSchema,
  OrderingItemSchema,
  ExplainItemSchema,
])
export type QuizItem = z.infer<typeof QuizItemSchema>
export type QuizItemType = QuizItem['type']

export const QuizFileSchema = z.strictObject({ items: z.array(QuizItemSchema).min(1) })
