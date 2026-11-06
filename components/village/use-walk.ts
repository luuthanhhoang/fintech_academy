'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import type { Pos, WorldLayout } from '@/lib/world/layout'
import type { Terrain } from '@/lib/world/terrain'
import { arrivalPoint, reachablesFor, type Reachable } from '@/lib/world/walk'
import { bindWalkKeys, playerPose, walkInput } from '@/components/world/walk-state'

const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))

/**
 * Walking in the village from the HUD side: keyboard binding, the place you stand next to, E to enter it,
 * fast travel (bus, station list, minimap) and whether you have moved yet (to retire the help line).
 */
export function useWalk(catalog: Catalog, layout: WorldLayout, terrain: Terrain, walking: boolean, enter: (id: string) => void) {
  const names = useMemo(() => new Map(catalog.concepts.map((c) => [c.id, c.name.vi])), [catalog])
  const reachables = useMemo(() => reachablesFor(layout, names), [layout, names])
  const [near, setNear] = useState<Reachable | null>(null)
  const [moved, setMoved] = useState(false)

  useEffect(() => {
    if (!walking) return
    const unbind = bindWalkKeys()
    const onKey = (e: KeyboardEvent) => {
      if (typing(e.target)) return
      if (!moved && (walkInput.x || walkInput.z)) setMoved(true)
      if (e.code === 'KeyE' && near) {
        e.preventDefault()
        enter(`${near.kind}:${near.id}`)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      unbind()
      window.removeEventListener('keydown', onKey)
    }
  }, [walking, near, enter, moved])

  /** Jump next to a place (walking) — returns false when not walking so the caller can fly the camera instead. */
  const travel = useCallback(
    (at: Pos, clearance = 8) => {
      if (!walking || !playerPose.active) return false
      walkInput.teleport = { at: arrivalPoint(terrain, at[0], at[2], clearance), face: [at[0], at[2]] }
      setMoved(true)
      return true
    },
    [walking, terrain],
  )

  return { names, reachables, near: walking ? near : null, setNear, travel, moved }
}
