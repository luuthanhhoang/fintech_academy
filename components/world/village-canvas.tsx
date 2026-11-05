'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import * as THREE from 'three'
import type { Graphics, QualityPreset } from '@/lib/content/schema/graphics'
import type { Region, Weather, WorldView } from '@/lib/content/schema/world'
import type { GroundCover } from '@/lib/world/grass'
import type { HeightGrid } from '@/lib/world/grid'
import type { Pos, WorldLayout } from '@/lib/world/layout'
import type { Plant } from '@/lib/world/plants'
import type { Terrain } from '@/lib/world/terrain'
import { Wildlife } from './animals'
import { CameraRig } from './camera-rig'
import { Fields } from './fields'
import { GrassField } from './grass-field'
import { Flowers } from './ground-cover'
import { Houses } from './houses'
import { LabelPortal } from './label-portal'
import { Guides, Villagers } from './people'
import { Places, SelectionMarker } from './places'
import { PostFX } from './post'
import { Railway, Train } from './rail-train'
import type { HealthMap, SelectionId } from './scene-types'
import { SkyAndLight, type SkyState } from './sky'
import { TerrainMesh } from './terrain-mesh'
import { FocusForest, Vegetation } from './vegetation'
import { Fish, Shore, Water } from './water'
import { WeatherFx } from './weather'

export interface VillageSceneProps {
  terrain: Terrain
  grid: HeightGrid
  pathMask: Uint8Array
  pathRes: number
  layout: WorldLayout
  regions: Region[]
  graphics: Graphics
  quality: QualityPreset
  flowers: GroundCover
  grassMask: Uint8Array
  grassRes: number
  health: HealthMap
  plants: Plant[]
  weather: Weather
  sky: SkyState
  view: WorldView
  anchor: Pos | 'train'
  selected: { at: Pos; label: string; zoom: number } | null
  fishCount: number
  getTrainT: () => number
  onSelect: (id: SelectionId | null) => void
  onStrike: (distance: number) => void
}

function SceneContent(p: VillageSceneProps & { night: boolean; labels: boolean }) {
  const pond = p.terrain.lakes.find((l) => l.kind === 'pond')
  const g = p.graphics
  const close = p.view.anchor.kind !== 'overview' && p.view.anchor.kind !== 'train'
  const focus = p.selected?.at ?? (close && p.anchor !== 'train' ? ([p.anchor[0] + p.view.look[0], p.anchor[1] + p.view.look[1], p.anchor[2] + p.view.look[2]] as Pos) : null)
  return (
    <>
      <SkyAndLight sky={p.sky} shadowMapSize={p.quality.shadowMapSize} />
      <TerrainMesh terrain={p.terrain} grid={p.grid} pathMask={p.pathMask} pathRes={p.pathRes} wet={p.weather.rain} />
      <Water terrain={p.terrain} grid={p.grid} look={p.sky.look} sunDir={p.sky.sunDir} water={g.water} wind={p.weather.wind} rain={p.weather.rain} />
      <Shore terrain={p.terrain} />
      {pond && <Fish center={pond.center} radius={pond.radius} surface={pond.surface} count={p.fishCount} />}
      <Railway terrain={p.terrain} />
      <Train terrain={p.terrain} getT={p.getTrainT} night={p.night} />
      <Houses lots={p.layout.lots} regions={p.regions} health={p.health} night={p.night} onSelect={p.onSelect} />
      <Fields lots={p.layout.lots} health={p.health} onSelect={p.onSelect} />
      <Places layout={p.layout} regions={p.regions} night={p.night} labels={p.labels} onSelect={p.onSelect} />
      <Villagers terrain={p.terrain} waypoints={p.layout.waypoints} />
      <Guides guides={p.layout.guides} map={p.terrain.map} onSelect={p.onSelect} labels={p.labels} />
      <Vegetation trees={p.layout.trees} shrubs={p.layout.shrubs} wind={p.weather.wind} leaves={p.terrain.map.vegetation.leaves} density={p.quality.vegetation} />
      <GrassField grid={p.grid} mask={p.grassMask} maskRes={p.grassRes} pathMask={p.pathMask} pathRes={p.pathRes} count={p.quality.grass} base={g.grass.base} tip={g.grass.tip} dry={g.grass.dry} height={g.grass.height} wind={p.weather.wind} />
      <Flowers cover={p.flowers} colors={g.flowers} />
      <FocusForest plants={p.plants} />
      <Wildlife terrain={p.terrain} lots={p.layout.lots} daylight={p.sky.daylight} fireflies={p.quality.flowers / 10} />
      <WeatherFx weather={p.weather} daylight={p.sky.daylight} sunDir={p.sky.sunDir} size={p.terrain.map.size} clouds={p.quality.clouds} onStrike={p.onStrike} />
      {p.selected && <SelectionMarker at={p.selected.at} label={p.selected.label} />}
      <CameraRig view={p.view} anchor={p.anchor} focus={p.selected?.at ?? null} zoom={p.selected?.zoom} />
      <PostFX quality={p.quality} look={p.sky.look} focus={close ? focus : null} />
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
          shadows={{ type: THREE.PCFSoftShadowMap }}
          dpr={p.quality.dpr}
          camera={{ position: [380, 330, 520], fov: 50, near: 0.3, far: 12000 }}
          gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
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
