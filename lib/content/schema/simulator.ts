import { z } from 'zod'
import { IdSchema, LocalizedSchema } from './common'

export const SimParamSchema = z.strictObject({
  key: z.string().min(1),
  label: z.string().min(1),
  min: z.number(),
  max: z.number(),
  step: z.number().positive(),
  default: z.number(),
  unit: z.string().optional(),
})
export type SimParam = z.infer<typeof SimParamSchema>

export const BreakItSchema = z.strictObject({
  id: IdSchema,
  label: z.string().min(1),
  params: z.record(z.string(), z.number()),
  explanation: z.string().min(1),
})
export type BreakIt = z.infer<typeof BreakItSchema>

export const DataKindSchema = z.enum(['formula', 'synthetic', 'user-or-synthetic'])

export const SimulatorSchema = z.strictObject({
  id: IdSchema,
  componentKey: z.string().min(1),
  title: LocalizedSchema,
  summary: z.string().min(1),
  concepts: z.array(IdSchema).min(1),
  dataKind: DataKindSchema,
  /** How the synthetic data is produced (required when dataKind is not "formula"). */
  syntheticNote: z.string().optional(),
  params: z.array(SimParamSchema).min(1),
  howToRead: z.string().min(1),
  breakIt: z.array(BreakItSchema).min(1),
  /** Component-specific static configuration (validated by the component's own schema). */
  config: z.record(z.string(), z.unknown()).default({}),
})
export type Simulator = z.infer<typeof SimulatorSchema>
