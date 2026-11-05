/**
 * Component keys that content may reference. Typed registries (simulators.tsx) must implement every key,
 * and the content validator rejects simulator metadata whose componentKey is not listed here.
 */
export const SIMULATOR_KEYS = ['tvm', 'inflation', 'bond', 'orderbook', 'options', 'portfolio', 'dcf'] as const
export type SimulatorKey = (typeof SIMULATOR_KEYS)[number]

/** Parameter keys each simulator body reads; the validator requires the YAML to declare exactly these. */
export const SIMULATOR_PARAMS: Record<SimulatorKey, readonly string[]> = {
  tvm: ['principal', 'ratePct', 'years', 'compoundsPerYear', 'contribution'],
  inflation: ['amount', 'nominalPct', 'inflationPct', 'years'],
  bond: ['face', 'couponPct', 'ytmPct', 'years', 'freq'],
  orderbook: ['mid', 'spreadTicks', 'tick', 'levels', 'baseQty', 'seed', 'orderQty'],
  options: ['strike1', 'premium1', 'strike2', 'premium2', 'qty'],
  portfolio: ['rho', 'periods', 'seed', 'riskFreePct'],
  dcf: ['baseFcf', 'growthPct', 'years', 'discountPct', 'terminalGrowthPct', 'netDebt', 'shares'],
}

export function isSimulatorKey(key: string): key is SimulatorKey {
  return (SIMULATOR_KEYS as readonly string[]).includes(key)
}

/** Icon names that content (e.g. nav in site.yaml) may reference. */
export const ICON_KEYS = ['sun', 'map', 'cards', 'chart', 'code', 'alert', 'spark', 'pulse', 'gear', 'info'] as const
export type IconKey = (typeof ICON_KEYS)[number]

/** Actions that shortcuts.yaml may bind. */
export const SHORTCUT_ACTIONS = ['open-search', 'show-help', 'toggle-theme', 'go'] as const
export type ShortcutAction = (typeof SHORTCUT_ACTIONS)[number]

/** Tutor provider kinds that tutor.yaml may reference (implemented in lib/tutor/registry.ts). */
export const PROVIDER_KINDS = ['anthropic', 'openai-compatible'] as const
export type ProviderKind = (typeof PROVIDER_KINDS)[number]
