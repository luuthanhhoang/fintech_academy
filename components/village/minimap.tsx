'use client'

import { useEffect, useRef } from 'react'
import type { WorldLayout } from '@/lib/world/layout'
import type { Terrain } from '@/lib/world/terrain'
import type { HealthMap, SelectionId } from '@/components/world/scene-types'
import { playerPose } from '@/components/world/walk-state'
import { Map2D } from './map-2d'

/** Corner map of the whole village with a live marker for you; tap a place on it to go there. */
export function Minimap({ terrain, layout, health, names, onPick }: { terrain: Terrain; layout: WorldLayout; health: HealthMap; names: ReadonlyMap<string, string>; onPick: (id: SelectionId) => void }) {
  const dot = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let id = 0
    const size = terrain.map.size
    const tick = () => {
      const el = dot.current
      if (el) {
        el.style.left = `${(playerPose.x / size + 0.5) * 100}%`
        el.style.top = `${(playerPose.z / size + 0.5) * 100}%`
        el.style.transform = `translate(-50%, -50%) rotate(${Math.PI - playerPose.yaw}rad)`
        el.style.opacity = playerPose.active ? '1' : '0'
      }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [terrain])
  return (
    <div className="pointer-events-auto relative h-44 w-44 overflow-hidden rounded-2xl border-2 border-paper/80 shadow-xl max-sm:h-32 max-sm:w-32">
      <Map2D terrain={terrain} layout={layout} health={health} names={names} onSelect={onPick} />
      <span ref={dot} aria-hidden="true" className="pointer-events-none absolute h-0 w-0 border-x-[6px] border-b-[12px] border-x-transparent border-b-[#e0303a] drop-shadow" />
    </div>
  )
}
