'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { isTreeKind, type TreeKind } from '@/lib/registry/keys'
import type { Scatter } from '@/lib/world/layout'
import type { Plant } from '@/lib/world/plants'
import { treeGeometry, withSway } from './tree-geometry'

const swayTime = { value: 0 }
const swayWind = { value: 0.3 }
const BARK = new THREE.Color('#6a5038').convertSRGBToLinear()

interface Item { position: [number, number, number]; scale: number; rotation: number }

function Instanced({ kind, items, color }: { kind: TreeKind; items: Item[]; color: (i: number) => THREE.Color }) {
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const crownRef = useRef<THREE.InstancedMesh>(null)
  const geo = useMemo(() => treeGeometry(kind), [kind])
  const still = kind === 'rock'
  // Fronds are open strips and need both sides; blob crowns are closed and render single-sided.
  const fronds = kind === 'palm' || kind === 'areca' || kind === 'banana'
  const crownMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: still ? 0.95 : 0.9, envMapIntensity: 0.5, side: fronds ? THREE.DoubleSide : THREE.FrontSide })
    return still ? m : withSway(m, swayTime, swayWind, 9, 0.3)
  }, [still, fronds])
  const trunkMat = useMemo(() => withSway(new THREE.MeshStandardMaterial({ color: BARK, roughness: 0.95 }), swayTime, swayWind, 14), [])
  useLayoutEffect(() => {
    const d = new THREE.Object3D()
    items.forEach((it, i) => {
      d.position.set(...it.position)
      d.rotation.set(0, it.rotation, 0)
      d.scale.setScalar(it.scale)
      d.updateMatrix()
      trunkRef.current?.setMatrixAt(i, d.matrix)
      crownRef.current?.setMatrixAt(i, d.matrix)
      crownRef.current?.setColorAt(i, color(i))
    })
    for (const m of [trunkRef.current, crownRef.current]) {
      if (!m) continue
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
      m.computeBoundingSphere()
    }
  }, [items, color])
  if (items.length === 0) return null
  return (
    <group>
      {!still && <instancedMesh ref={trunkRef} args={[geo.trunk, trunkMat, items.length]} castShadow receiveShadow />}
      <instancedMesh ref={crownRef} args={[geo.crown, crownMat, items.length]} castShadow receiveShadow />
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
  return (
    <>
      {[...byKind.entries()].map(([k, items]) => {
        const pal = palettes.get(k) ?? [new THREE.Color(0.3, 0.5, 0.2)]
        return <Instanced key={k} kind={k} items={items} color={(i) => pal[(i * 7) % pal.length]!} />
      })}
    </>
  )
}

/** Your forest: one tree per focus segment; withered ones are grey-brown and bare-looking. */
export function FocusForest({ plants }: { plants: Plant[] }) {
  const pines = useMemo(() => plants.filter((p) => p.kind === 'pine').map((p) => ({ ...p, rotation: p.minutes })), [plants])
  const broad = useMemo(() => plants.filter((p) => p.kind === 'broadleaf').map((p) => ({ ...p, rotation: p.minutes })), [plants])
  const green = useMemo(() => new THREE.Color('#4f9a3e').convertSRGBToLinear(), [])
  const dead = useMemo(() => new THREE.Color('#8a7556').convertSRGBToLinear(), [])
  const paint = (list: Plant[]) => (i: number) => (list[i]?.withered ? dead : green)
  return (
    <>
      <Instanced kind="pine" items={pines} color={paint(pines)} />
      <Instanced kind="broadleaf" items={broad} color={paint(broad)} />
    </>
  )
}
