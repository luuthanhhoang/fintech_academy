'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Scatter } from '@/lib/world/layout'
import type { Plant } from '@/lib/world/plants'
import { treeGeometry, withSway, type TreeKind } from './tree-geometry'

const LEAF: Record<TreeKind, string[]> = {
  pine: ['#2f5d3a', '#386b43', '#28513a'],
  broadleaf: ['#4f8a3a', '#5f9a42', '#457a35', '#6aa04a'],
  palm: ['#5b9a3c', '#6aa748'],
  bamboo: ['#7fa64a', '#6e9a40'],
  shrub: ['#557f37', '#6a8f3e', '#4a7034'],
}

const swayTime = { value: 0 }
const swayWind = { value: 0.3 }

function Instanced({ kind, items, color }: { kind: TreeKind; items: { position: [number, number, number]; scale: number; rotation: number }[]; color: (i: number) => string }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const geometry = useMemo(() => treeGeometry(kind), [kind])
  const material = useMemo(() => withSway(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), swayTime, swayWind), [])
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const d = new THREE.Object3D()
    const c = new THREE.Color()
    items.forEach((it, i) => {
      d.position.set(...it.position)
      d.rotation.set(0, it.rotation, 0)
      d.scale.setScalar(it.scale)
      d.updateMatrix()
      m.setMatrixAt(i, d.matrix)
      m.setColorAt(i, c.set(color(i)))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    m.computeBoundingSphere()
  }, [items, color])
  if (items.length === 0) return null
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow receiveShadow />
}

/** Scattered trees and shrubs; all sway with the weather's wind. */
export function Vegetation({ trees, shrubs, wind }: { trees: Scatter[]; shrubs: Scatter[]; wind: number }) {
  useEffect(() => {
    swayWind.value = 0.15 + wind * 1.4
  }, [wind])
  useFrame((_, dt) => {
    swayTime.value += dt
  })
  const byKind = useMemo(() => {
    const out: Record<TreeKind, Scatter[]> = { pine: [], broadleaf: [], palm: [], bamboo: [], shrub: [] }
    for (const t of [...trees, ...shrubs]) out[t.kind].push(t)
    return out
  }, [trees, shrubs])
  return (
    <>
      {(Object.keys(byKind) as TreeKind[]).map((k) => (
        <Instanced key={k} kind={k} items={byKind[k]} color={(i) => LEAF[k][i % LEAF[k].length]!} />
      ))}
    </>
  )
}

/** Your forest: one tree per focus segment; withered ones are grey-brown. */
export function FocusForest({ plants }: { plants: Plant[] }) {
  const pines = useMemo(() => plants.filter((p) => p.kind === 'pine').map((p) => ({ ...p, rotation: p.minutes })), [plants])
  const broad = useMemo(() => plants.filter((p) => p.kind === 'broadleaf').map((p) => ({ ...p, rotation: p.minutes })), [plants])
  const paint = (list: Plant[]) => (i: number) => (list[i]?.withered ? '#8a7a62' : '#3f9a4a')
  return (
    <>
      <Instanced kind="pine" items={pines} color={paint(pines)} />
      <Instanced kind="broadleaf" items={broad} color={paint(broad)} />
    </>
  )
}
