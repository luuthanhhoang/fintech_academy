'use client'

import { Html } from '@react-three/drei'
import { createContext, useContext, type ComponentProps, type RefObject } from 'react'

/**
 * Labels render into a container we own (beside the canvas) instead of the canvas parent, so unmounting the
 * scene never races React over DOM nodes.
 */
export const LabelPortal = createContext<RefObject<HTMLDivElement | null> | null>(null)

export function Label(props: ComponentProps<typeof Html>) {
  const portal = useContext(LabelPortal)
  return <Html {...props} portal={portal?.current ? (portal as RefObject<HTMLElement>) : undefined} />
}
