'use client'

import type { ComponentType } from 'react'
import type { WorldModelKey } from '@/lib/registry/keys'
import { Archive, Bank, CommunalHouse, Granary, Market, Watchtower, Workshop } from './civic'
import type { ModelProps } from './parts'
import { Orchard, Ruin, SignalTower, Watermill } from './scenery'

/** Landmark model key → procedural component. Keys come from WORLD_MODEL_KEYS (validated in content). */
export const WORLD_MODELS: Record<WorldModelKey, ComponentType<ModelProps>> = {
  bank: Bank,
  granary: Granary,
  'communal-house': CommunalHouse,
  market: Market,
  watchtower: Watchtower,
  orchard: Orchard,
  watermill: Watermill,
  archive: Archive,
  workshop: Workshop,
  ruin: Ruin,
  'signal-tower': SignalTower,
}
