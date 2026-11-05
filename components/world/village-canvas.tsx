'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import type { Region, Weather, WorldView } from '@/lib/content/schema/world'
import type { Pos, WorldLayout } from '@/lib/world/layout'
import type { Plant } from '@/lib/world/plants'
import type { Terrain } from '@/lib/world/terrain'
import { CameraRig } from './camera-rig'
import { LabelPortal } from './label-portal'
import { Guides, Villagers } from './people'
import { Places, SelectionMarker } from './places'
import { Railway, Train } from './rail-train'
import type { HealthMap, SelectionId } from './scene-types'
import { SkyAndLight, type SkyState } from './sky'
import { TerrainMesh } from './terrain-mesh'
import { FocusForest, Vegetation } from './vegetation'
import { VillageLots } from './village-lots'
import { Fish, Water } from './water'
import { WeatherFx } from './weather'

export interface VillageSceneProps {
  terrain: Terrain
  layout: WorldLayout
  regions: Region[]
  health: HealthMap
  plants: Plant[]
  weather: Weather
  sky: SkyState
  view: WorldView
  anchor: Pos | 'train'
  selected: { at: Pos; label: string } | null
  fishCount: number
  getTrainT: () => number
  onSelect: (id: SelectionId | null) => void
  onStrike: (distance: number) => void
}

function SceneContent(p: VillageSceneProps & { night: boolean; labels: boolean }) {
  const pond = p.terrain.lakes.find((l) => l.kind === 'pond')
  return (
    <>
      <SkyAndLight sky={p.sky} />
      <TerrainMesh terrain={p.terrain} />
      <Water terrain={p.terrain} wind={p.weather.wind} />
      {pond && <Fish center={pond.center} radius={pond.radius} surface={pond.surface} count={p.fishCount} />}
      <Railway terrain={p.terrain} />
      <Train terrain={p.terrain} getT={p.getTrainT} night={p.night} />
      <VillageLots lots={p.layout.lots} regions={p.regions} health={p.health} night={p.night} onSelect={p.onSelect} />
      <Places layout={p.layout} regions={p.regions} night={p.night} labels={p.labels} onSelect={p.onSelect} />
      <Villagers terrain={p.terrain} waypoints={p.layout.waypoints} />
      <Guides guides={p.layout.guides} map={p.terrain.map} onSelect={p.onSelect} labels={p.labels} />
      <Vegetation trees={p.layout.trees} shrubs={p.layout.shrubs} wind={p.weather.wind} />
      <FocusForest plants={p.plants} />
      <WeatherFx weather={p.weather} daylight={p.sky.daylight} sunDir={p.sky.sunDir} size={p.terrain.map.size} onStrike={p.onStrike} />
      {p.selected && <SelectionMarker at={p.selected.at} label={p.selected.label} />}
      <CameraRig view={p.view} anchor={p.anchor} focus={p.selected?.at ?? null} />
    </>
  )
}

/** The whole 3D village. All state comes in as props; the scene only renders and reports clicks. */
export default function VillageCanvas(p: VillageSceneProps) {
  const night = p.sky.daylight < 0.3
  const labels = p.view.anchor.kind === 'overview'
  const labelRoot = useRef<HTMLDivElement>(null)
  return (
    <LabelPortal.Provider value={labelRoot}>
      <div className="relative h-full w-full">
        <Canvas
          shadows
          dpr={[1, 1.75]}
          camera={{ position: [380, 330, 520], fov: 55, near: 0.3, far: 9000 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          onPointerMissed={() => p.onSelect(null)}
        >
          <Suspense fallback={null}>
            <SceneContent {...p} night={night} labels={labels} />
          </Suspense>
        </Canvas>
        <div ref={labelRoot} className="pointer-events-none absolute inset-0 overflow-hidden" />
      </div>
    </LabelPortal.Provider>
  )
}
