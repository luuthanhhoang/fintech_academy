'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'

export interface LabelAnchor {
  id: string
  at: [number, number, number]
  /** Lower comes first when two labels would overlap. */
  priority: number
  /** Approximate size on screen, in CSS pixels. */
  w: number
  h: number
}

const Visible = createContext<ReadonlySet<string> | null>(null)

/** Is this label allowed to show (no overlap with a more important one)? True outside a <LabelDeclutter>. */
export function useLabelVisible(id: string): boolean {
  const set = useContext(Visible)
  return set ? set.has(id) : true
}

const same = (a: ReadonlySet<string>, b: ReadonlySet<string>) => a.size === b.size && [...a].every((x) => b.has(x))
const v = new THREE.Vector3()

/**
 * Decides which labels fit: anchors are projected to the screen a few times a second and accepted greedily by
 * priority then distance, skipping any whose rectangle overlaps one already accepted (and anything off screen/behind).
 */
export function LabelDeclutter({ anchors, children }: { anchors: LabelAnchor[]; children: ReactNode }) {
  const { camera, size } = useThree()
  const [shown, setShown] = useState<ReadonlySet<string>>(new Set())
  const t = useRef(0)
  useFrame(({ clock }) => {
    if (clock.elapsedTime - t.current < 0.3) return
    t.current = clock.elapsedTime
    const rects: { x0: number; y0: number; x1: number; y1: number }[] = []
    const next = new Set<string>()
    const items = anchors
      .map((a) => ({ a, d: camera.position.distanceToSquared(v.set(...a.at)) }))
      .sort((p, q) => p.a.priority - q.a.priority || p.d - q.d)
    for (const { a } of items) {
      v.set(...a.at).project(camera)
      if (v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05) continue
      const x = ((v.x + 1) / 2) * size.width
      const y = ((1 - v.y) / 2) * size.height
      const r = { x0: x - a.w / 2, x1: x + a.w / 2, y0: y - a.h / 2, y1: y + a.h / 2 }
      if (rects.some((o) => r.x0 < o.x1 && r.x1 > o.x0 && r.y0 < o.y1 && r.y1 > o.y0)) continue
      rects.push(r)
      next.add(a.id)
    }
    setShown((prev) => (same(prev, next) ? prev : next))
  })
  return <Visible.Provider value={shown}>{children}</Visible.Provider>
}
