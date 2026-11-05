'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import type { SimulatorKey } from '@/lib/registry/keys'
import { Skeleton } from '@/components/ui/states'
import type { SimBodyProps } from './types'

const loading = () => <Skeleton lines={5} />

/** componentKey → lazily loaded simulator body. Typed so every key in SIMULATOR_KEYS must be implemented. */
export const SIMULATOR_REGISTRY: Record<SimulatorKey, ComponentType<SimBodyProps>> = {
  tvm: dynamic(() => import('./bodies/tvm').then((m) => m.TvmSim), { ssr: false, loading }),
  inflation: dynamic(() => import('./bodies/inflation').then((m) => m.InflationSim), { ssr: false, loading }),
  bond: dynamic(() => import('./bodies/bond').then((m) => m.BondSim), { ssr: false, loading }),
  orderbook: dynamic(() => import('./bodies/orderbook').then((m) => m.OrderBookSim), { ssr: false, loading }),
  options: dynamic(() => import('./bodies/options').then((m) => m.OptionsSim), { ssr: false, loading }),
  portfolio: dynamic(() => import('./bodies/portfolio').then((m) => m.PortfolioSim), { ssr: false, loading }),
  dcf: dynamic(() => import('./bodies/dcf').then((m) => m.DcfSim), { ssr: false, loading }),
}
