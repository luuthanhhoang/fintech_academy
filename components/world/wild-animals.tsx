'use client'

import { useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef, useState } from 'react'
import type * as THREE from 'three'
import type { Action, ModelAsset } from '@/lib/content/schema/assets'
import { mulberry32 } from '@/lib/finance/random'
import type { HeightGrid } from '@/lib/world/grid'
import type { Animal } from '@/lib/world/wildlife'
import { Character } from './assets/character'
import { playerPose } from './walk-state'

/** Animals are simulated and drawn only within this distance of the camera. */
const SEE = 180
const SPEED = { walk: 1.1, run: 7 }
const angleTo = (from: number, to: number) => Math.atan2(Math.sin(to - from), Math.cos(to - from))

/** One wild animal: grazes, ambles around its home tree, bolts away when you come within `flee` metres. */
function Wild({ animal, model, grid, flee }: { animal: Animal; model: ModelAsset; grid: HeightGrid; flee: number }) {
  const g = useRef<THREE.Group>(null)
  const rand = useMemo(() => mulberry32(Math.round(animal.seed * 1000)), [animal.seed])
  const s = useRef({ x: animal.home[0], z: animal.home[2], yaw: animal.seed, tx: animal.home[0], tz: animal.home[2], wait: 0, action: 'eat' as Action, shown: false })
  const [action, setAction] = useState<Action>('eat')
  const [shown, setShown] = useState(false)
  useFrame(({ camera }, dt) => {
    const el = g.current
    const st = s.current
    if (!el) return
    const show = (camera.position.x - st.x) ** 2 + (camera.position.z - st.z) ** 2 < SEE ** 2
    el.visible = show
    if (show !== st.shown) {
      st.shown = show
      setShown(show)
    }
    if (!show) return
    const px = st.x - playerPose.x
    const pz = st.z - playerPose.z
    const pd = Math.hypot(px, pz)
    let next: Action
    if (playerPose.active && pd < flee * 2.2) {
      // Bolt directly away from you, a good distance.
      st.tx = st.x + (px / (pd || 1)) * 25
      st.tz = st.z + (pz / (pd || 1)) * 25
      st.wait = 0
      next = 'run'
    } else if (st.wait > 0) {
      st.wait -= dt
      next = st.action === 'eat' || st.action === 'idle' ? st.action : 'eat'
    } else if (Math.hypot(st.tx - st.x, st.tz - st.z) < 0.5) {
      st.wait = 3 + rand() * 8
      st.tx = animal.home[0] + (rand() - 0.5) * 30
      st.tz = animal.home[2] + (rand() - 0.5) * 30
      next = rand() < 0.6 ? 'eat' : 'idle'
    } else next = st.action === 'run' ? 'run' : 'walk'
    if (next === 'walk' || next === 'run') {
      const dx = st.tx - st.x
      const dz = st.tz - st.z
      const d = Math.hypot(dx, dz) || 1
      const v = Math.min(d / dt, SPEED[next])
      st.x += (dx / d) * v * dt
      st.z += (dz / d) * v * dt
      st.yaw += angleTo(st.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 6)
      if (next === 'run' && d < 1) next = 'idle'
    }
    el.position.set(st.x, grid.at(st.x, st.z), st.z)
    el.rotation.y = st.yaw
    if (next !== st.action) {
      st.action = next
      setAction(next)
    }
  })
  return (
    <group ref={g}>
      <Suspense fallback={null}>
        <Character model={model} action={action} active={shown} />
      </Suspense>
    </group>
  )
}

/** Deer, foxes… placed by lib/world/wildlife from assets.yaml cast.wildlife. */
export function WildAnimals({ animals, models, grid, flee }: { animals: Animal[]; models: ReadonlyMap<string, ModelAsset>; grid: HeightGrid; flee: number }) {
  return (
    <group>
      {animals.map((a, i) => {
        const model = models.get(a.model)
        return model ? <Wild key={i} animal={a} model={model} grid={grid} flee={flee} /> : null
      })}
    </group>
  )
}
