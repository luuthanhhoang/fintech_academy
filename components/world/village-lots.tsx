'use client'

import type { ThreeEvent } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Region } from '@/lib/content/schema/world'
import { hashString } from '@/lib/util/date'
import type { Lot } from '@/lib/world/layout'
import { selectionId, type HealthMap, type SelectionId } from './scene-types'

const SOIL = new THREE.Color('#6b5236')
const PADDY_WATER = new THREE.Color('#7a8a5c')
const CROP = new THREE.Color('#5fa83a')
const DRY = new THREE.Color('#c7b25a')
const TUFTS = 12

type Mat = { position: [number, number, number]; rotation?: number; scale: [number, number, number]; color: THREE.Color }

function useInstances(ref: React.RefObject<THREE.InstancedMesh | null>, items: readonly Mat[]) {
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const d = new THREE.Object3D()
    items.forEach((it, i) => {
      d.position.set(...it.position)
      d.rotation.set(0, it.rotation ?? 0, 0)
      d.scale.set(...it.scale)
      d.updateMatrix()
      m.setMatrixAt(i, d.matrix)
      m.setColorAt(i, it.color)
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    m.computeBoundingSphere()
  }, [ref, items])
}

const pick = (arr: readonly string[], key: string) => arr[hashString(key) % arr.length]!

/** Concept lots: a house (lit at night when mastered) and a plot whose crop reflects your memory of it. */
export function VillageLots({ lots, regions, health, night, onSelect }: { lots: Lot[]; regions: Region[]; health: HealthMap; night: boolean; onSelect: (id: SelectionId) => void }) {
  const walls = useRef<THREE.InstancedMesh>(null)
  const roofs = useRef<THREE.InstancedMesh>(null)
  const windows = useRef<THREE.InstancedMesh>(null)
  const plots = useRef<THREE.InstancedMesh>(null)
  const crops = useRef<THREE.InstancedMesh>(null)
  const weeds = useRef<THREE.InstancedMesh>(null)
  const regionOf = useMemo(() => new Map(regions.map((r) => [r.id, r])), [regions])

  const data = useMemo(() => {
    const wall: Mat[] = []
    const roof: Mat[] = []
    const win: Mat[] = []
    const plot: Mat[] = []
    const crop: Mat[] = []
    const weed: Mat[] = []
    for (const l of lots) {
      const r = regionOf.get(l.regionId)
      const h = health.get(l.conceptId)
      const [x, y, z] = l.house
      wall.push({ position: [x, y + 1.6, z], rotation: l.rotation, scale: [6, 3.2, 5], color: new THREE.Color(pick(r?.palette.wall ?? ['#e6d9bd'], l.conceptId)) })
      roof.push({ position: [x, y + 4.6, z], rotation: l.rotation + Math.PI / 4, scale: [5.4, 2.8, 4.6], color: new THREE.Color(pick(r?.palette.roof ?? ['#a8543a'], `${l.conceptId}r`)) })
      const fx = Math.sin(l.rotation) * 2.52
      const fz = Math.cos(l.rotation) * 2.52
      const lit = h?.lit ?? false
      const glass = new THREE.Color(lit ? (night ? '#ffcf6b' : '#6d7f8a') : '#28323a')
      for (const off of [-1.6, 1.6]) {
        const ox = Math.cos(l.rotation) * off
        const oz = -Math.sin(l.rotation) * off
        win.push({ position: [x + fx + ox, y + 1.9, z + fz + oz], rotation: l.rotation, scale: [1, 1, 1], color: glass })
      }
      const [px, py, pz] = l.plot
      plot.push({ position: [px, py + 0.12, pz], rotation: l.rotation, scale: [11, 0.25, 7], color: l.plotKind === 'paddy' ? PADDY_WATER.clone() : SOIL.clone() })
      const growth = h?.growth ?? 0
      const tone = CROP.clone().lerp(DRY, h?.weeds ? 0.65 : 0)
      for (let k = 0; k < TUFTS; k++) {
        const cx = ((k % 4) - 1.5) * 2.4
        const cz = (Math.floor(k / 4) - 1) * 2
        const rx = px + Math.cos(l.rotation) * cx + Math.sin(l.rotation) * cz
        const rz = pz - Math.sin(l.rotation) * cx + Math.cos(l.rotation) * cz
        const s = 0.15 + growth * (l.plotKind === 'tea' ? 1.0 : 0.9)
        crop.push({ position: [rx, py + 0.25 + s * 0.5, rz], scale: [l.plotKind === 'tea' ? s * 1.1 : 0.45, s, l.plotKind === 'tea' ? s * 1.1 : 0.45], color: tone })
        if (h?.weeds && k % 3 === 0) weed.push({ position: [rx + 0.9, py + 0.5, rz + 0.7], scale: [0.5, 0.7, 0.5], color: new THREE.Color('#6b5a2a') })
      }
    }
    return { wall, roof, win, plot, crop, weed }
  }, [lots, regionOf, health, night])

  useInstances(walls, data.wall)
  useInstances(roofs, data.roof)
  useInstances(windows, data.win)
  useInstances(plots, data.plot)
  useInstances(crops, data.crop)
  useInstances(weeds, data.weed)

  const click = (per: number) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const lot = e.instanceId === undefined ? undefined : lots[Math.floor(e.instanceId / per)]
    if (lot) onSelect(selectionId('lot', lot.conceptId))
  }
  return (
    <group>
      <instancedMesh ref={walls} args={[undefined, undefined, data.wall.length]} castShadow receiveShadow onClick={click(1)}>
        <boxGeometry />
        <meshStandardMaterial roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={roofs} args={[undefined, undefined, data.roof.length]} castShadow onClick={click(1)}>
        <coneGeometry args={[1, 1, 4]} />
        <meshStandardMaterial roughness={0.8} flatShading />
      </instancedMesh>
      <instancedMesh ref={windows} args={[undefined, undefined, data.win.length]}>
        <planeGeometry args={[1.1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={plots} args={[undefined, undefined, data.plot.length]} receiveShadow onClick={click(1)}>
        <boxGeometry />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={crops} args={[undefined, undefined, data.crop.length]} castShadow onClick={click(TUFTS)}>
        <icosahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>
      {data.weed.length > 0 && (
        <instancedMesh ref={weeds} args={[undefined, undefined, data.weed.length]}>
          <coneGeometry args={[0.6, 1.2, 5]} />
          <meshStandardMaterial roughness={1} />
        </instancedMesh>
      )}
    </group>
  )
}
