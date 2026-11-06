'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { isTreeKind, type TreeKind } from '@/lib/registry/keys'
import type { Scatter } from '@/lib/world/layout'
import type { Plant } from '@/lib/world/plants'
import { TREE_LODS, treeGeometry, withSway } from './tree-geometry'

const swayTime = { value: 0 }
const swayWind = { value: 0.3 }
const BARK = new THREE.Color('#6a5038').convertSRGBToLinear()

/** Distance (m) up to which each LOD is used, and beyond which instances are not drawn at all. */
const LOD_RANGE = [75, 230, 950]
const REBUCKET_MS = 450
const MOVE_EPS2 = 36

interface Item { position: [number, number, number]; scale: number; rotation: number }

/**
 * One species rendered with distance-based level of detail: every instance is assigned to the near/mid/far mesh by its
 * distance to the camera (re-bucketed every ~0.45 s when the camera moved). Far crowns are low-poly, trunks and shadows
 * are dropped at the far level, so triangle count stays bounded no matter how many trees exist.
 */
function Instanced({ kind, items, color }: { kind: TreeKind; items: Item[]; color: (i: number) => THREE.Color }) {
  const trunks = useRef<(THREE.InstancedMesh | null)[]>([])
  const crowns = useRef<(THREE.InstancedMesh | null)[]>([])
  const last = useRef({ x: Infinity, z: Infinity, t: 0 })
  const geos = useMemo(() => Array.from({ length: TREE_LODS }, (_, l) => treeGeometry(kind, l)), [kind])
  const still = kind === 'rock'
  const fronds = kind === 'palm' || kind === 'areca' || kind === 'banana'
  const crownMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: still ? 0.95 : 0.9, envMapIntensity: 0.5, side: fronds ? THREE.DoubleSide : THREE.FrontSide })
    return still ? m : withSway(m, swayTime, swayWind, 9, 0.3)
  }, [still, fronds])
  const trunkMat = useMemo(() => withSway(new THREE.MeshStandardMaterial({ color: BARK, roughness: 0.95 }), swayTime, swayWind, 14), [])
  // Matrices and colours are computed once; bucketing only copies them into the per-level instance buffers.
  const data = useMemo(() => {
    const d = new THREE.Object3D()
    const m = new Float32Array(items.length * 16)
    const c = new Float32Array(items.length * 3)
    items.forEach((it, i) => {
      d.position.set(...it.position)
      d.rotation.set(0, it.rotation, 0)
      d.scale.setScalar(it.scale)
      d.updateMatrix()
      d.matrix.toArray(m, i * 16)
      const col = color(i)
      c.set([col.r, col.g, col.b], i * 3)
    })
    return { m, c }
  }, [items, color])

  const bucket = (cx: number, cz: number) => {
    const counts = new Array<number>(TREE_LODS).fill(0)
    const level = new Int8Array(items.length)
    items.forEach((it, i) => {
      const dx = it.position[0] - cx
      const dz = it.position[2] - cz
      const d2 = dx * dx + dz * dz
      let l = -1
      for (let k = 0; k < TREE_LODS; k++) if (d2 < LOD_RANGE[k]! ** 2) { l = k; break }
      level[i] = l
      if (l >= 0) counts[l]!++
    })
    const cursor = new Array<number>(TREE_LODS).fill(0)
    for (let i = 0; i < items.length; i++) {
      const l = level[i]!
      if (l < 0) continue
      const at = cursor[l]!++
      for (const set of [trunks.current[l], crowns.current[l]]) {
        if (!set) continue
        ;(set.instanceMatrix.array as Float32Array).set(data.m.subarray(i * 16, i * 16 + 16), at * 16)
      }
      const col = crowns.current[l]?.instanceColor
      if (col) (col.array as Float32Array).set(data.c.subarray(i * 3, i * 3 + 3), at * 3)
    }
    for (let l = 0; l < TREE_LODS; l++) {
      for (const set of [trunks.current[l], crowns.current[l]]) {
        if (!set) continue
        set.count = counts[l]!
        set.instanceMatrix.needsUpdate = true
        set.boundingSphere = null
      }
      const col = crowns.current[l]?.instanceColor
      if (col) col.needsUpdate = true
    }
  }

  useLayoutEffect(() => {
    // New items: force a re-bucket on the next frame.
    last.current = { x: Infinity, z: Infinity, t: 0 }
    for (const set of crowns.current) if (set && !set.instanceColor) set.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(items.length * 3), 3)
  }, [items])

  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime * 1000
    if (t - last.current.t < REBUCKET_MS) return
    const dx = camera.position.x - last.current.x
    const dz = camera.position.z - last.current.z
    if (dx * dx + dz * dz < MOVE_EPS2 && last.current.t !== 0) return
    last.current = { x: camera.position.x, z: camera.position.z, t }
    bucket(camera.position.x, camera.position.z)
  })

  if (items.length === 0) return null
  return (
    <group>
      {geos.map((g, l) => (
        <group key={l}>
          {!still && l < 2 && <instancedMesh ref={(el) => void (trunks.current[l] = el)} args={[g.trunk, trunkMat, items.length]} count={0} castShadow={l === 0} frustumCulled={false} />}
          <instancedMesh ref={(el) => void (crowns.current[l] = el)} args={[g.crown, crownMat, items.length]} count={0} castShadow={l < 2} receiveShadow={l < 2} frustumCulled={false} />
        </group>
      ))}
    </group>
  )
}

/** Scattered trees, shrubs and rocks by species (data: map.yaml vegetation); everything sways with the wind. */
export function Vegetation({ trees, shrubs, wind, leaves, density }: { trees: Scatter[]; shrubs: Scatter[]; wind: number; leaves: Record<string, string[]>; density: number }) {
  useEffect(() => {
    swayWind.value = 0.12 + wind * 1.3
  }, [wind])
  useFrame((_, dt) => {
    swayTime.value += dt
  })
  const byKind = useMemo(() => {
    const out = new Map<TreeKind, Scatter[]>()
    const all = [...trees, ...shrubs]
    all.forEach((t, i) => {
      // Deterministic thinning for lower quality presets.
      const keep = ((i * 2654435761) >>> 0) % 1000 < density * 1000
      if (!isTreeKind(t.kind) || !keep) return
      out.set(t.kind, [...(out.get(t.kind) ?? []), t])
    })
    return out
  }, [trees, shrubs, density])
  const palettes = useMemo(() => {
    const p = new Map<string, THREE.Color[]>()
    for (const [k, list] of Object.entries(leaves)) p.set(k, list.map((c) => new THREE.Color(c).convertSRGBToLinear()))
    return p
  }, [leaves])
  const colorFns = useMemo(() => {
    const m = new Map<TreeKind, (i: number) => THREE.Color>()
    for (const k of byKind.keys()) {
      const pal = palettes.get(k) ?? [new THREE.Color(0.3, 0.5, 0.2)]
      m.set(k, (i) => pal[(i * 7) % pal.length]!)
    }
    return m
  }, [byKind, palettes])
  return (
    <>
      {[...byKind.entries()].map(([k, items]) => (
        <Instanced key={k} kind={k} items={items} color={colorFns.get(k)!} />
      ))}
    </>
  )
}

/** Your forest: one tree per focus segment; withered ones are grey-brown and bare-looking. */
export function FocusForest({ plants }: { plants: Plant[] }) {
  const pines = useMemo(() => plants.filter((p) => p.kind === 'pine').map((p) => ({ ...p, rotation: p.minutes })), [plants])
  const broad = useMemo(() => plants.filter((p) => p.kind === 'broadleaf').map((p) => ({ ...p, rotation: p.minutes })), [plants])
  const green = useMemo(() => new THREE.Color('#4f9a3e').convertSRGBToLinear(), [])
  const dead = useMemo(() => new THREE.Color('#8a7556').convertSRGBToLinear(), [])
  const paintPines = useMemo(() => (i: number) => (pines[i]?.withered ? dead : green), [pines, green, dead])
  const paintBroad = useMemo(() => (i: number) => (broad[i]?.withered ? dead : green), [broad, green, dead])
  return (
    <>
      <Instanced kind="pine" items={pines} color={paintPines} />
      <Instanced kind="broadleaf" items={broad} color={paintBroad} />
    </>
  )
}
