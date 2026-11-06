'use client'

import type { ThreeEvent } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import type * as THREE from 'three'
import type { AssetsFile, ModelAsset } from '@/lib/content/schema/assets'
import { hashString } from '@/lib/util/date'
import type { Lot, Pos, Station, WorldLayout } from '@/lib/world/layout'
import { InstancedModel, StaticModel, type Placement } from './assets/static-model'
import { selectionId, type HealthMap, type SelectionId } from './scene-types'

type Models = ReadonlyMap<string, ModelAsset>

/** Town lots: a shop-house per concept (model by hash); a lantern over the door once the concept is mastered. */
function TownHouse({ lot, model, lit, night, onSelect }: { lot: Lot; model: ModelAsset; lit: boolean; night: boolean; onSelect: (id: SelectionId) => void }) {
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onSelect(selectionId('lot', lot.conceptId))
  }
  return (
    <group position={lot.house} rotation-y={lot.rotation} onClick={click}>
      <Suspense fallback={null}>
        <StaticModel model={model} />
      </Suspense>
      {lit && (
        <mesh position={[0, 3.4, 4.6]}>
          <sphereGeometry args={[0.28, 12, 10]} />
          <meshStandardMaterial color="#ffcf7a" emissive="#ff9a2a" emissiveIntensity={night ? 4 : 1.2} toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}

export function TownHouses({ lots, models, health, night, onSelect }: { lots: Lot[]; models: ModelAsset[]; health: HealthMap; night: boolean; onSelect: (id: SelectionId) => void }) {
  return (
    <group>
      {lots.map((l) => (
        <TownHouse key={l.conceptId} lot={l} model={models[hashString(l.conceptId) % models.length]!} lit={Boolean(health.get(l.conceptId)?.lit)} night={night} onSelect={onSelect} />
      ))}
    </group>
  )
}

/** A short fence behind every village house (instanced: one draw call per fence part). */
function fencePlacements(lots: Lot[]): Placement[] {
  return lots.flatMap((l) => {
    const back: [number, number] = [-Math.sin(l.rotation), -Math.cos(l.rotation)]
    const side: [number, number] = [Math.cos(l.rotation), -Math.sin(l.rotation)]
    return [-2, 0, 2].map((k) => ({
      position: [l.house[0] + back[0] * 5.5 + side[0] * k, l.house[1], l.house[2] + back[1] * 5.5 + side[1] * k] as [number, number, number],
      rotation: l.rotation + Math.PI / 2,
    }))
  })
}

/** Goods stacked on each platform: barrels and crates waiting for the train. */
function goodsPlacements(stations: Station[], count: number): Placement[][] {
  const out: Placement[][] = Array.from({ length: count }, () => [])
  stations.forEach((s, i) => {
    const rot = Math.atan2(s.tangent[0], s.tangent[1])
    const [nx, nz] = [Math.cos(rot), -Math.sin(rot)]
    for (let k = 0; k < 3; k++) {
      const along = (k - 1) * 3.2 + ((i * 7) % 3) * 0.4
      out[(i + k) % count]!.push({
        position: [s.position[0] + nx * 5 + s.tangent[0] * along, s.position[1] + 1, s.position[2] + nz * 5 + s.tangent[1] * along],
        rotation: rot + k,
      })
    }
  })
  return out
}

function Campfire({ at, models }: { at: Pos; models: ModelAsset[] }) {
  const light = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    if (light.current) light.current.intensity = 9 + Math.sin(clock.elapsedTime * 13) * 2 + Math.sin(clock.elapsedTime * 7.3) * 1.5
  })
  return (
    <group position={at}>
      {models.map((m, i) => (
        <group key={m.id} position={[i * 3.4 - 1.7, 0, i ? 1.2 : -1]} rotation-y={i * 0.8}>
          <Suspense fallback={null}>
            <StaticModel model={m} />
          </Suspense>
        </group>
      ))}
      <pointLight ref={light} position={[1.7, 1, 1.2]} distance={16} color="#ffa040" />
      <Sparkles position={[1.7, 1.4, 1.2]} scale={[0.8, 2, 0.8]} count={18} size={4} speed={1.2} color="#ffb347" />
    </group>
  )
}

/** Town houses, fences, station goods and the lakeside camp, all from assets.yaml. */
export function TownAndProps({ layout, assets, models, health, night, onSelect }: { layout: WorldLayout; assets: AssetsFile; models: Models; health: HealthMap; night: boolean; onSelect: (id: SelectionId) => void }) {
  const c = assets.cast
  const get = (id: string) => models.get(id)!
  const town = useMemo(() => layout.lots.filter((l) => l.regionId === c.town.region), [layout.lots, c.town.region])
  const village = useMemo(() => layout.lots.filter((l) => l.regionId !== c.town.region), [layout.lots, c.town.region])
  const fences = useMemo(() => fencePlacements(village), [village])
  const goods = useMemo(() => goodsPlacements(layout.stations, c.stationGoods.length), [layout.stations, c.stationGoods.length])
  const camp = layout.features.find((f) => f.id === c.camp.feature)
  return (
    <group>
      <TownHouses lots={town} models={c.town.models.map(get)} health={health} night={night} onSelect={onSelect} />
      <Suspense fallback={null}>
        <InstancedModel model={get(c.fence)} items={fences} shadows={false} />
        {c.stationGoods.map((id, i) => <InstancedModel key={id} model={get(id)} items={goods[i]!} />)}
      </Suspense>
      {camp && <Campfire at={camp.position} models={c.camp.models.map(get)} />}
    </group>
  )
}
