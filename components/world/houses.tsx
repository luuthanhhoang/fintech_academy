'use client'

import type { ThreeEvent } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Region } from '@/lib/content/schema/world'
import { hashString } from '@/lib/util/date'
import type { Lot } from '@/lib/world/layout'
import { houseParts, HOUSE } from './house-geometry'
import { useVillageMaterials } from './materials'
import { selectionId, type HealthMap, type SelectionId } from './scene-types'

const pick = (arr: readonly string[], key: string) => arr[hashString(key) % arr.length]!
const lin = (hex: string) => new THREE.Color(hex).convertSRGBToLinear()

type Part = 'plaster' | 'tiles' | 'wood' | 'brick' | 'glass'
const PARTS: Part[] = ['plaster', 'tiles', 'wood', 'brick', 'glass']

/** Concept houses: one instance per part type for all lots; mastered concepts glow warmly at night (with a red lantern). */
export function Houses({ lots, regions, health, night, onSelect }: { lots: Lot[]; regions: Region[]; health: HealthMap; night: boolean; onSelect: (id: SelectionId) => void }) {
  const mats = useVillageMaterials()
  const parts = useMemo(() => houseParts(), [])
  const refs = useRef<Partial<Record<Part, THREE.InstancedMesh | null>>>({})
  const extras = useRef<{ jar: THREE.InstancedMesh | null; hay: THREE.InstancedMesh | null; lantern: THREE.InstancedMesh | null }>({ jar: null, hay: null, lantern: null })
  const regionOf = useMemo(() => new Map(regions.map((r) => [r.id, r])), [regions])
  // Window glow uses the per-instance colour, so only lit (mastered) houses shine at night.
  const glassMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2, metalness: 0.1 })
    const glow = night ? 3.2 : 0.15
    m.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         #ifdef USE_INSTANCING_COLOR
         totalEmissiveRadiance += vColor * ${glow.toFixed(2)};
         #endif`,
      )
    }
    m.customProgramCacheKey = () => `glass-${glow}`
    return m
  }, [night])
  const lit = useMemo(() => lots.filter((l) => health.get(l.conceptId)?.lit), [lots, health])

  useLayoutEffect(() => {
    const d = new THREE.Object3D()
    const windowOn = lin('#ffbf6b')
    const windowOff = lin('#1a1f24')
    lots.forEach((l, i) => {
      const r = regionOf.get(l.regionId)
      d.position.set(...l.house)
      d.rotation.set(0, l.rotation, 0)
      d.scale.setScalar(0.9 + (hashString(l.conceptId) % 20) / 100)
      d.updateMatrix()
      const colors: Record<Part, THREE.Color> = {
        plaster: lin(pick(r?.palette.wall ?? ['#e6d9bd'], l.conceptId)),
        tiles: lin(pick(r?.palette.roof ?? ['#a8543a'], `${l.conceptId}r`)),
        wood: new THREE.Color(1, 1, 1),
        brick: new THREE.Color(1, 1, 1),
        glass: health.get(l.conceptId)?.lit ? windowOn : windowOff,
      }
      for (const p of PARTS) {
        const m = refs.current[p]
        if (!m) continue
        m.setMatrixAt(i, d.matrix)
        m.setColorAt(i, colors[p])
      }
      const k = hashString(l.conceptId)
      const side = k % 2 ? 1 : -1
      const local = (x: number, y: number, z: number, s = 1) => {
        const o = new THREE.Object3D()
        o.position.set(x, y, z)
        o.scale.setScalar(s)
        o.updateMatrix()
        return d.matrix.clone().multiply(o.matrix)
      }
      extras.current.jar?.setMatrixAt(i, local(side * (HOUSE.w / 2 + 0.6), 0.55, HOUSE.d / 2 + 0.8, 0.9 + (k % 5) / 10))
      extras.current.hay?.setMatrixAt(i, local(-side * (HOUSE.w / 2 + 2.2), 1.5, -1.5, k % 3 === 0 ? 1 : 0.0001))
    })
    lit.forEach((l, i) => {
      d.position.set(...l.house)
      d.rotation.set(0, l.rotation, 0)
      d.updateMatrix()
      const o = new THREE.Object3D()
      o.position.set(1.4, 3.05, HOUSE.d / 2 + 1.95)
      o.updateMatrix()
      extras.current.lantern?.setMatrixAt(i, d.matrix.clone().multiply(o.matrix))
    })
    for (const m of [...PARTS.map((p) => refs.current[p]), extras.current.jar, extras.current.hay, extras.current.lantern]) {
      if (!m) continue
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
      m.computeBoundingSphere()
    }
  }, [lots, lit, regionOf, health])

  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const lot = e.instanceId === undefined ? undefined : lots[e.instanceId]
    if (lot) onSelect(selectionId('lot', lot.conceptId))
  }
  const material = (p: Part) => (p === 'glass' ? glassMat : mats[p])
  return (
    <group>
      {PARTS.map((p) => (
        <instancedMesh key={p} ref={(el) => void (refs.current[p] = el)} args={[parts[p], material(p), lots.length]} castShadow={p !== 'glass'} receiveShadow onClick={click} />
      ))}
      <instancedMesh ref={(el) => void (extras.current.jar = el)} args={[undefined, undefined, lots.length]} castShadow>
        <sphereGeometry args={[0.5, 14, 10]} />
        <meshStandardMaterial color="#6b4a32" roughness={0.45} />
      </instancedMesh>
      <instancedMesh ref={(el) => void (extras.current.hay = el)} args={[undefined, mats.thatch, lots.length]} castShadow>
        <coneGeometry args={[1.6, 3.2, 14, 3]} />
      </instancedMesh>
      {lit.length > 0 && (
        <instancedMesh ref={(el) => void (extras.current.lantern = el)} args={[undefined, undefined, lit.length]}>
          <sphereGeometry args={[0.28, 12, 10]} />
          <meshStandardMaterial color="#c0262d" emissive="#ff3b2f" emissiveIntensity={night ? 4 : 0.4} />
        </instancedMesh>
      )}
    </group>
  )
}
