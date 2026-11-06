import { z } from 'zod'
import { IdSchema } from './common'

export const NavLinkSchema = z.strictObject({
  href: z.string().startsWith('/'),
  label: z.string().min(1),
  en: z.string().min(1),
  icon: z.string().min(1),
  /** One-line hint shown under the label in dropdown menus. */
  desc: z.string().min(1).optional(),
  /** Shown as a tab in the bottom bar on small screens. */
  mobile: z.boolean().default(false),
})
export const NavGroupSchema = z.strictObject({
  label: z.string().min(1),
  icon: z.string().min(1),
  items: z.array(NavLinkSchema).min(2),
  mobile: z.boolean().default(false),
})
/** A top-level entry is a link or a dropdown group of links. */
export const NavItemSchema = z.union([NavLinkSchema, NavGroupSchema])
export type NavLink = z.infer<typeof NavLinkSchema>
export type NavGroup = z.infer<typeof NavGroupSchema>
export type NavItem = z.infer<typeof NavItemSchema>
export const isNavGroup = (n: NavItem): n is NavGroup => 'items' in n

export const SiteConfigSchema = z.strictObject({
  name: z.string().min(1),
  tagline: z.string().min(1),
  disclaimer: z.string().min(1),
  syntheticLabel: z.string().min(1),
  /** Labels (and an honesty note where needed) for MDX <Callout kind="…"> blocks. */
  callouts: z.record(z.string(), z.strictObject({ label: z.string().min(1), disclaimer: z.string().min(1).optional() })),
  nav: z.array(NavItemSchema).min(1),
})
export type SiteConfig = z.infer<typeof SiteConfigSchema>

export const ShortcutSchema = z.strictObject({
  action: IdSchema,
  keys: z.string().min(1),
  description: z.string().min(1),
  /** Optional navigation target for "go to" style actions. */
  href: z.string().startsWith('/').optional(),
})
export const ShortcutsConfigSchema = z.strictObject({ shortcuts: z.array(ShortcutSchema).min(1) })
export type Shortcut = z.infer<typeof ShortcutSchema>

export const MasteryConfigSchema = z.strictObject({
  weights: z.strictObject({ quiz: z.number().min(0).max(1), retention: z.number().min(0).max(1) }),
  quizHalfLifeDays: z.number().positive(),
  unlockAt: z.number().min(0).max(1),
  masteredAt: z.number().min(0).max(1),
  minQuizAttempts: z.number().int().nonnegative(),
  plannedPrerequisitesBlock: z.boolean(),
})
export type MasteryConfig = z.infer<typeof MasteryConfigSchema>

export const SrsConfigSchema = z.strictObject({
  requestRetention: z.number().gt(0).lt(1),
  maximumIntervalDays: z.number().int().positive(),
  enableFuzz: z.boolean(),
})
export type SrsConfig = z.infer<typeof SrsConfigSchema>

export const TodayBlockSchema = z.strictObject({
  id: z.enum(['reviews', 'lesson', 'practice', 'interleave', 'case', 'explain']),
  title: z.string().min(1),
  description: z.string().min(1),
})
export const TodayConfigSchema = z.strictObject({
  maxReviews: z.number().int().positive(),
  interleaveSize: z.number().int().positive(),
  blocks: z.array(TodayBlockSchema).min(1),
  idleTimeoutSeconds: z.number().int().positive(),
})
export type TodayConfig = z.infer<typeof TodayConfigSchema>
export type TodayBlockId = z.infer<typeof TodayBlockSchema>['id']

export const SearchConfigSchema = z.strictObject({
  fields: z.array(z.string().min(1)).min(1),
  boost: z.record(z.string(), z.number().positive()),
  fuzzy: z.number().min(0).max(1),
  prefix: z.boolean(),
  resultLimit: z.number().int().positive(),
  kindLabels: z.record(z.string(), z.string()),
})
export type SearchConfig = z.infer<typeof SearchConfigSchema>

export const ProviderPresetSchema = z.strictObject({
  id: IdSchema,
  label: z.string().min(1),
  kind: z.string().min(1),
  baseURL: z.url().optional(),
  models: z.array(z.string().min(1)),
  docsUrl: z.url(),
  browserNote: z.string().min(1),
})
export type ProviderPreset = z.infer<typeof ProviderPresetSchema>

export const TutorModeSchema = z.strictObject({
  id: IdSchema,
  label: z.string().min(1),
  description: z.string().min(1),
  system: z.string().min(1),
  /** Extra context the mode injects besides retrieved passages. */
  needs: z.array(z.enum(['weakConcepts', 'rubric'])).default([]),
  placeholder: z.string().min(1),
})
export type TutorMode = z.infer<typeof TutorModeSchema>

export const TutorConfigSchema = z.strictObject({
  providers: z.array(ProviderPresetSchema).min(1),
  retrieval: z.strictObject({ topK: z.number().int().positive(), minScore: z.number().nonnegative() }),
  maxTokens: z.number().int().positive(),
  maxToolRounds: z.number().int().positive(),
  baseSystem: z.string().min(1),
  insufficientText: z.string().min(1),
  keyWarning: z.string().min(1),
  modes: z.array(TutorModeSchema).min(1),
})
export type TutorConfig = z.infer<typeof TutorConfigSchema>
