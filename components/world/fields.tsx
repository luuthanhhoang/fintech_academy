'use client'

import type { ThreeEvent } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Lot } from '@/lib/world/layout'
import { clumpGeometry } from './ground-cover'
import { selectionId, type HealthMap, type SelectionId } from './scene-types'

const W = 12
const D = 8
const lin = (hex: string) => new THREE.Color(hex).convertSRGBToLinear()
const GREEN = lin('#5f9e32')
const GOLD = lin('#c9b04a')
const SEEDLING = lin('#9cc45a')

/** Raised earth bunds around a plot (merged into one geometry). */
function bundGeometry() {
  const parts = [
    new THREE.BoxGeometry(W + 0.8, 0.5, 0.6).translate(0, 0.15, D / 2),
    new THREE.BoxGeometry(W + 0.8, 0.5, 0.6).translate(0, 0.15, -D / 2),
    new THREE.BoxGeometry(0.6, 0.5, D).translate(W / 2, 0.15, 0),
    new THREE.BoxGeometry(0.6, 0.5, D).translate(-W / 2, 0.15, 0),
  ]
  return mergeGeometries(parts.map((g) => g.toNonIndexed()))
}

const RICE = { cols: 8, rows: 5 }
const TEA = { cols: 6, rows: 3 }

/** Concept plots: flooded paddies or tea rows. Crop height and colour come from your memory of the concept. */
export function Fields({ lots, health, onSelect }: { lots: Lot[]; health: HealthMap; onSelect: (id: SelectionId) => void }) {
  const water = useRef<THREE.InstancedMesh>(null)
  const soil = useRef<THREE.InstancedMesh>(null)
  const bunds = useRef<THREE.InstancedMesh>(null)
  const rice = useRef<THREE.InstancedMesh>(null)
  const tea = useRef<THREE.InstancedMesh>(null)
  const bundGeo = useMemo(() => bundGeometry(), [])
  const riceGeo = useMemo(() => clumpGeometry(), [])
  const paddies = useMemo(() => lots.filter((l) => l.plotKind === 'paddy'), [lots])
  const teas = useMemo(() => lots.filter((l) => l.plotKind === 'tea'), [lots])

  useLayoutEffect(() => {
    const d = new THREE.Object3D()
    const o = new THREE.Object3D()
    const place = (l: Lot, y = 0) => {
      d.position.set(l.plot[0], l.plot[1] + y, l.plot[2])
      d.rotation.set(0, l.rotation, 0)
      d.scale.set(1, 1, 1)
      d.updateMatrix()
      return d.matrix.clone()
    }
    lots.forEach((l, i) => bunds.current?.setMatrixAt(i, place(l)))
    paddies.forEach((l, i) => water.current?.setMatrixAt(i, place(l, 0.18)))
    teas.forEach((l, i) => soil.current?.setMatrixAt(i, place(l, 0.12)))
    const crop = (list: Lot[], grid: { cols: number; rows: number }, ref: React.RefObject<THREE.InstancedMesh | null>, tall: number) => {
      list.forEach((l, li) => {
        const h = health.get(l.conceptId)
        const growth = h?.growth ?? 0
        const color = growth < 0.1 ? SEEDLING : h?.weeds ? GOLD : GREEN.clone().lerp(SEEDLING, Math.max(0, 0.6 - growth))
        const base = place(l)
        for (let k = 0; k < grid.cols * grid.rows; k++) {
          const cx = ((k % grid.cols) - (grid.cols - 1) / 2) * ((W - 1.5) / grid.cols)
          const cz = (Math.floor(k / grid.cols) - (grid.rows - 1) / 2) * ((D - 1.5) / grid.rows)
          o.position.set(cx + ((k * 13) % 7) / 20, 0.15, cz)
          o.rotation.set(0, k * 1.3, 0)
          const s = 0.4 + growth * tall
          o.scale.set(tall > 1 ? s * 0.9 : 1.2, s, tall > 1 ? s * 0.9 : 1.2)
          o.updateMatrix()
          const idx = li * grid.cols * grid.rows + k
          ref.current?.setMatrixAt(idx, base.clone().multiply(o.matrix))
          ref.current?.setColorAt(idx, color)
        }
      })
    }
    crop(paddies, RICE, rice, 1.1)
    crop(teas, TEA, tea, 1.4)
    for (const m of [water.current, soil.current, bunds.current, rice.current, tea.current]) {
      if (!m) continue
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
      m.computeBoundingSphere()
    }
  }, [lots, paddies, teas, health])

  const click = (list: Lot[], per: number) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const l = e.instanceId === undefined ? undefined : list[Math.floor(e.instanceId / per)]
    if (l) onSelect(selectionId('lot', l.conceptId))
  }
  return (
    <group>
      <instancedMesh ref={bunds} args={[bundGeo, undefined, lots.length]} receiveShadow castShadow onClick={click(lots, 1)}>
        <meshStandardMaterial color="#6e5a3c" roughness={1} />
      </instancedMesh>
      {paddies.length > 0 && (
        <instancedMesh ref={water} args={[undefined, undefined, paddies.length]} receiveShadow onClick={click(paddies, 1)}>
          <boxGeometry args={[W, 0.1, D]} />
          <meshStandardMaterial color="#6d7a4e" roughness={0.18} metalness={0.05} />
        </instancedMesh>
      )}
      {teas.length > 0 && (
        <instancedMesh ref={soil} args={[undefined, undefined, teas.length]} receiveShadow onClick={click(teas, 1)}>
          <boxGeometry args={[W, 0.2, D]} />
          <meshStandardMaterial color="#6b4e33" roughness={1} />
        </instancedMesh>
      )}
      {paddies.length > 0 && (
        <instancedMesh ref={rice} args={[riceGeo, undefined, paddies.length * RICE.cols * RICE.rows]} castShadow onClick={click(paddies, RICE.cols * RICE.rows)}>
          <meshStandardMaterial color="#ffffff" roughness={0.8} side={THREE.DoubleSide} />
        </instancedMesh>
      )}
      {teas.length > 0 && (
        <instancedMesh ref={tea} args={[undefined, undefined, teas.length * TEA.cols * TEA.rows]} castShadow onClick={click(teas, TEA.cols * TEA.rows)}>
          <icosahedronGeometry args={[0.7, 1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.85} />
        </instancedMesh>
      )}
    </group>
  )
}
