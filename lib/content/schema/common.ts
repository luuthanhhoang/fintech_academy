import { z } from 'zod'

/** Kebab-case identifier used for every content entity. */
export const IdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'id phải là kebab-case')

export const LocalizedSchema = z.strictObject({ vi: z.string().min(1), en: z.string().min(1) })
export type Localized = z.infer<typeof LocalizedSchema>

export const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'ngày phải có dạng YYYY-MM-DD')

export const VerificationStatusSchema = z.enum(['draft', 'verified', 'needs_verification'])
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>

export const RubricItemSchema = z.strictObject({ id: IdSchema, criterion: z.string().min(1) })
export type RubricItem = z.infer<typeof RubricItemSchema>

export const TrackIdSchema = IdSchema
