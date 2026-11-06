'use client'

import { useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import type * as THREE from 'three'
import type { ModelAsset } from '@/lib/content/schema/assets'
import type { Lot } from '@/lib/world/layout'
import type { Road } from '@/lib/world/roads'
import { StaticModel } from './assets/static-model'

/** Cars cruise at this speed (m/s); they are simulated only near the camera. */
const CAR_SPEED = 9
const SEE = 260

/** One car going round and round the road: out on one lane, back on the other. */
function Car({ road, model, offset, night }: { road: Road; model: ModelAsset; offset: number; night: boolean }) {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock, camera }) => {
    const el = g.current
    if (!el) return
    const L = road.line.length
    const lap = (clock.elapsedTime * CAR_SPEED + offset * L * 2) % (L * 2)
    const forward = lap < L
    const t = forward ? lap / L : 2 - lap / L
    const [x, z] = road.line.at(t)
    const [tx, tz] = road.line.tangent(t)
    const side = forward ? 1 : -1
    const px = x - tz * side * road.width * 0.24
    const pz = z + tx * side * road.width * 0.24
    el.visible = (camera.position.x - px) ** 2 + (camera.position.z - pz) ** 2 < SEE ** 2
    if (!el.visible) return
    el.position.set(px, road.deckAt(t) + 0.05, pz)
    el.rotation.y = Math.atan2(tx * side, tz * side)
  })
  return (
    <group ref={g}>
      <Suspense fallback={null}>
        <StaticModel model={model} />
      </Suspense>
      {night && <pointLight position={[0, 0.8, 2.6]} intensity={6} distance={14} color="#fff1c8" />}
    </group>
  )
}

export function Traffic({ road, models, count, night }: { road: Road; models: ModelAsset[]; count: number; night: boolean }) {
  return (
    <group>
      {Array.from({ length: count }, (_, i) => <Car key={i} road={road} model={models[i % models.length]!} offset={i / count} night={night} />)}
    </group>
  )
}

/** A tractor ploughing a paddy: drives up and down the plot, turning at each end. */
function Tractor({ lot, model, seed }: { lot: Lot; model: ModelAsset; seed: number }) {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const el = g.current
    if (!el) return
    const k = Math.sin(clock.elapsedTime * 0.25 + seed)
    const dir = Math.cos(clock.elapsedTime * 0.25 + seed) >= 0 ? 1 : -1
    const ax = Math.cos(lot.rotation)
    const az = -Math.sin(lot.rotation)
    el.position.set(lot.plot[0] + ax * k * 4.5, lot.plot[1] + 0.2, lot.plot[2] + az * k * 4.5)
    el.rotation.y = lot.rotation + (dir > 0 ? Math.PI / 2 : -Math.PI / 2)
  })
  return (
    <group ref={g}>
      <Suspense fallback={null}>
        <StaticModel model={model} />
      </Suspense>
    </group>
  )
}

export function Tractors({ lots, model, count }: { lots: Lot[]; model: ModelAsset; count: number }) {
  const chosen = useMemo(() => {
    const paddies = lots.filter((l) => l.plotKind === 'paddy')
    const step = Math.max(1, Math.floor(paddies.length / Math.max(1, count)))
    return paddies.filter((_, i) => i % step === 1).slice(0, count)
  }, [lots, count])
  return (
    <group>
      {chosen.map((l, i) => <Tractor key={l.conceptId} lot={l} model={model} seed={i * 1.9} />)}
    </group>
  )
}
