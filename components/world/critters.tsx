'use client'

import { useFrame } from '@react-three/fiber'
import { Suspense, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { Action, ModelAsset } from '@/lib/content/schema/assets'
import type { WorldMap } from '@/lib/content/schema/world'
import { mulberry32 } from '@/lib/finance/random'
import type { HeightGrid } from '@/lib/world/grid'
import type { Lot } from '@/lib/world/layout'
import { Character } from './assets/character'
import { Label } from './label-portal'
import { playerPose } from './walk-state'

const angleTo = (from: number, to: number) => Math.atan2(Math.sin(to - from), Math.cos(to - from))
/** Small animals are simulated only within this distance of the camera. */
const SIM_RANGE = 160

/** Your dog: trots after you, gallops to catch up, sits (showing its name) when you stop. */
export function Companion({ grid, map, model }: { grid: HeightGrid; map: WorldMap; model: ModelAsset }) {
  const g = useRef<THREE.Group>(null)
  const s = useRef({ x: 0, z: 0, yaw: 0, still: 0, speed: 0, placed: false, action: 'idle' as Action })
  const [action, setAction] = useState<Action>('idle')
  const c = map.player.companion
  useFrame((_, dt) => {
    const el = g.current
    if (!el || !playerPose.active) return
    const st = s.current
    if (!st.placed || Math.hypot(playerPose.x - st.x, playerPose.z - st.z) > 40) {
      Object.assign(st, { x: playerPose.x - 1.5, z: playerPose.z - 1.5, placed: true })
    }
    // Aim for a spot behind-left of you.
    const gx = playerPose.x - Math.sin(playerPose.yaw) * c.follow - Math.cos(playerPose.yaw) * 0.9
    const gz = playerPose.z - Math.cos(playerPose.yaw) * c.follow + Math.sin(playerPose.yaw) * 0.9
    const dx = gx - st.x
    const dz = gz - st.z
    const d = Math.hypot(dx, dz)
    st.speed = d > 0.4 ? Math.min(d * 2.2, 12) : 0
    if (st.speed > 0) {
      st.x += (dx / d) * st.speed * dt
      st.z += (dz / d) * st.speed * dt
      st.yaw += angleTo(st.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 8)
      st.still = 0
    } else st.still += dt
    el.position.set(st.x, grid.at(st.x, st.z), st.z)
    el.rotation.y = st.yaw
    const next: Action = st.speed > 4 ? 'run' : st.speed > 0.2 ? 'walk' : st.still > 2.5 ? 'sit' : 'idle'
    if (next !== st.action) {
      st.action = next
      setAction(next)
    }
  })
  return (
    <group ref={g}>
      <Suspense fallback={null}>
        <Character model={model} action={action} />
      </Suspense>
      {action === 'sit' && (
        <Label position={[0, 1.1, 0]} center zIndexRange={[15, 5]}>
          <span className="pointer-events-none whitespace-nowrap rounded-full bg-paper/90 px-2 py-0.5 font-sans text-[11px] text-ink shadow">🐕 {c.name}</span>
        </Label>
      )}
    </group>
  )
}

interface Hen { home: [number, number]; x: number; z: number; yaw: number; hop: number; seed: number; tx: number; tz: number; wait: number }
/** Chicken parts as [offset, scale, colour key] in the hen's local frame. */
const HEN_PARTS: { at: [number, number, number]; scale: [number, number, number]; color: 'body' | 'red' | 'beak' }[] = [
  { at: [0, 0.22, 0], scale: [0.2, 0.18, 0.26], color: 'body' },
  { at: [0, 0.4, 0.17], scale: [0.09, 0.1, 0.09], color: 'body' },
  { at: [0, 0.5, 0.17], scale: [0.025, 0.05, 0.06], color: 'red' },
  { at: [0, 0.39, 0.27], scale: [0.03, 0.025, 0.05], color: 'beak' },
  { at: [0, 0.32, -0.22], scale: [0.06, 0.12, 0.08], color: 'body' },
]

/** Flocks of hens around houses: peck and wander, scatter flapping when you come close. */
export function Chickens({ grid, lots, map }: { grid: HeightGrid; lots: Lot[]; map: WorldMap }) {
  const w = map.wildlife
  const mesh = useRef<THREE.InstancedMesh>(null)
  const hens = useMemo(() => {
    const rand = mulberry32(map.seed + 61)
    const step = Math.max(1, Math.floor(lots.length / Math.max(1, w.chickenFlocks)))
    return lots.filter((_, i) => i % step === 0).slice(0, w.chickenFlocks).flatMap((l) =>
      Array.from({ length: w.flockSize }, (): Hen => {
        const hx = l.house[0] + (rand() - 0.5) * 8
        const hz = l.house[2] + (rand() - 0.5) * 8
        return { home: [hx, hz], x: hx, z: hz, yaw: rand() * 6, hop: 0, seed: rand() * 10, tx: hx, tz: hz, wait: rand() * 3 }
      }),
    )
  }, [lots, map.seed, w.chickenFlocks, w.flockSize])
  const count = hens.length * HEN_PARTS.length
  const rand = useMemo(() => mulberry32(map.seed + 62), [map.seed])
  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    const pal = { body: ['#f2ede2', '#b5763e', '#7a4a2a'], red: ['#d0302a'], beak: ['#e8a32c'] }
    const col = new THREE.Color()
    hens.forEach((h, i) => HEN_PARTS.forEach((p, k) => {
      const list = pal[p.color]
      m.setColorAt(i * HEN_PARTS.length + k, col.set(list[Math.floor(h.seed) % list.length]!))
    }))
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [hens])
  const tmp = useMemo(() => ({ base: new THREE.Matrix4(), part: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), v: new THREE.Vector3(), s: new THREE.Vector3() }), [])
  useFrame(({ clock, camera }, dt) => {
    const m = mesh.current
    if (!m) return
    const t = clock.elapsedTime
    hens.forEach((h, i) => {
      if ((camera.position.x - h.x) ** 2 + (camera.position.z - h.z) ** 2 > SIM_RANGE ** 2) return
      const pdx = h.x - playerPose.x
      const pdz = h.z - playerPose.z
      const pd = Math.hypot(pdx, pdz)
      let speed = 0
      if (playerPose.active && pd < w.fleeRadius) {
        speed = 5
        h.tx = h.x + (pdx / (pd || 1)) * 6
        h.tz = h.z + (pdz / (pd || 1)) * 6
        h.hop = Math.min(1, h.hop + dt * 6)
      } else {
        h.hop = Math.max(0, h.hop - dt * 3)
        h.wait -= dt
        if (h.wait <= 0) {
          h.wait = 2 + rand() * 4
          h.tx = h.home[0] + (rand() - 0.5) * 10
          h.tz = h.home[1] + (rand() - 0.5) * 10
        }
        speed = Math.hypot(h.tx - h.x, h.tz - h.z) > 0.3 ? 0.9 : 0
      }
      if (speed > 0) {
        const dx = h.tx - h.x
        const dz = h.tz - h.z
        const d = Math.hypot(dx, dz) || 1
        h.x += (dx / d) * speed * dt
        h.z += (dz / d) * speed * dt
        h.yaw += angleTo(h.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 10)
      }
      const peck = speed === 0 ? Math.max(0, Math.sin(t * 5 + h.seed)) * 0.5 : 0
      const y = grid.at(h.x, h.z) + h.hop * Math.abs(Math.sin(t * 16 + h.seed)) * 0.5
      tmp.base.compose(tmp.v.set(h.x, y, h.z), tmp.q.setFromEuler(tmp.e.set(0, h.yaw, 0)), tmp.s.set(1, 1, 1))
      HEN_PARTS.forEach((p, k) => {
        const head = k >= 1 && k <= 3
        tmp.part.compose(tmp.v.set(p.at[0], p.at[1] - (head ? peck * 0.18 : 0), p.at[2] + (head ? peck * 0.06 : 0)), tmp.q.identity(), tmp.s.set(...p.scale))
        m.setMatrixAt(i * HEN_PARTS.length + k, tmp.part.premultiply(tmp.base))
      })
    })
    m.instanceMatrix.needsUpdate = true
  })
  if (count === 0) return null
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} castShadow frustumCulled={false}>
      <sphereGeometry args={[1, 10, 8]} />
      <meshStandardMaterial roughness={0.85} />
    </instancedMesh>
  )
}

/** Butterflies fluttering around you by day (instanced wing pairs). */
export function Butterflies({ map, grid, daylight }: { map: WorldMap; grid: HeightGrid; daylight: number }) {
  const n = map.wildlife.butterflies
  const wings = useRef<THREE.InstancedMesh>(null)
  const flies = useMemo(() => {
    const rand = mulberry32(map.seed + 71)
    return Array.from({ length: n }, (_, i) => ({ ox: (rand() - 0.5) * 30, oz: (rand() - 0.5) * 30, seed: rand() * 10, color: map.wildlife.butterflyColors[i % map.wildlife.butterflyColors.length]! }))
  }, [n, map])
  useLayoutEffect(() => {
    const m = wings.current
    if (!m) return
    const c = new THREE.Color()
    flies.forEach((f, i) => {
      m.setColorAt(i * 2, c.set(f.color))
      m.setColorAt(i * 2 + 1, c.set(f.color))
    })
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [flies])
  const tmp = useMemo(() => ({ o: new THREE.Object3D() }), [])
  useFrame(({ clock }) => {
    const m = wings.current
    if (!m) return
    m.visible = daylight > 0.35 && playerPose.active
    if (!m.visible) return
    const t = clock.elapsedTime
    flies.forEach((f, i) => {
      // Each butterfly loiters on a lazy figure-eight around a spot near you; spots wrap so they stay close.
      const wrap = (v: number) => ((((v + 15) % 30) + 30) % 30) - 15
      const cx = playerPose.x + wrap(f.ox - playerPose.x)
      const cz = playerPose.z + wrap(f.oz - playerPose.z)
      const x = cx + Math.sin(t * 0.7 + f.seed) * 2.2
      const z = cz + Math.sin(t * 1.4 + f.seed) * 1.4
      const y = grid.at(x, z) + 0.8 + Math.sin(t * 2.3 + f.seed) * 0.35
      const flap = Math.sin(t * 22 + f.seed) * 1.1
      for (const side of [0, 1]) {
        const o = tmp.o
        o.position.set(x, y, z)
        o.rotation.set(0, t * 0.7 + f.seed, side ? flap : -flap)
        o.scale.set(0.12, 0.01, 0.1)
        o.translateX(side ? 0.5 : -0.5)
        o.updateMatrix()
        m.setMatrixAt(i * 2 + side, o.matrix)
      }
    })
    m.instanceMatrix.needsUpdate = true
  })
  if (n === 0) return null
  return (
    <instancedMesh ref={wings} args={[undefined, undefined, n * 2]} frustumCulled={false}>
      <boxGeometry />
      <meshStandardMaterial roughness={0.6} side={THREE.DoubleSide} />
    </instancedMesh>
  )
}
