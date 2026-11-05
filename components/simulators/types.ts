import type { Simulator } from '@/lib/content/schema/simulator'

export type Values = Record<string, number>

export interface SimBodyProps {
  meta: Simulator
  values: Values
  syntheticLabel: string
}
