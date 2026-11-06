'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { AssetsFile } from '@/lib/content/schema/assets'
import type { Graphics, QualityPreset } from '@/lib/content/schema/graphics'
import type { Region, Weather, WorldView } from '@/lib/content/schema/world'
import type { GroundCover } from '@/lib/world/grass'
import type { HeightGrid } from '@/lib/world/grid'
import type { Pos, WorldLayout } from '@/lib/world/layout'
import type { Plant } from '@/lib/world/plants'
import type { Terrain } from '@/lib/world/terrain'
import type { Reachable } from '@/lib/world/walk'
import { wildlifeHomes } from '@/lib/world/wildlife'
import { Wildlife } from './animals'
import { CameraRig } from './camera-rig'
import { Butterflies, Chickens, Companion } from './critters'
import { Fields } from './fields'
import { GrassField } from './grass-field'
import { Flowers } from './ground-cover'
import { Houses } from './houses'
import { LabelDeclutter, type LabelAnchor } from './label-declutter'
import { LabelPortal } from './label-portal'
import { Guides, Villagers } from './people'
import { PerfGovernor, StatsProbe } from './perf'
import { Places, SelectionMarker } from './places'
import { Player } from './player'
import { PostFX } from './post'
import { Railway, Train } from './rail-train'
import { Roads } from './roads'
import type { HealthMap, SelectionId } from './scene-types'
import { Schools } from './school'
import { TownAndProps } from './town'
import { Tractors, Traffic } from './traffic'
import { WildAnimals } from './wild-animals'
import { SkyAndLight, type SkyState } from './sky'
import { TerrainMesh } from './terrain-mesh'
import { FocusForest, Vegetation } from './vegetation'
import { Fish, Shore, Water } from './water'
import { WeatherFx } from './weather'

export interface VillageSceneProps {
  /** 3D model assets and who/what uses them (content/world/assets.yaml). */
  assets: AssetsFile
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
  /** Places you can walk up to and enter (walk mode). */
  reachables: Reachable[]
  onNear: (r: Reachable | null) => void
  /** What a villager at (x, z) says about the nearest plot. */
  say: (x: number, z: number) => string | null
  /** Called when the frame rate stays low; the page steps the quality preset down. Omitted when quality is pinned. */
  onPerfDecline?: () => void
}

function SceneContent(p: VillageSceneProps & { night: boolean; labels: boolean }) {
  const pond = p.terrain.lakes.find((l) => l.kind === 'pond')
  const g = p.graphics
  const close = p.view.anchor.kind !== 'overview' && p.view.anchor.kind !== 'train' && p.view.mode !== 'walk'
  // Labels compete for screen space: guides first (they invite a conversation), then stations nearest to the camera.
  const anchors: LabelAnchor[] = [
    ...p.layout.guides.map((g) => ({ id: `guide:${g.guide.id}`, at: [g.position[0], g.position[1] + 4, g.position[2]] as [number, number, number], priority: 0, w: 96, h: 24 })),
    ...p.layout.stations.map((s) => ({ id: `station:${s.id}`, at: [s.position[0], s.position[1] + 8, s.position[2]] as [number, number, number], priority: 1, w: 190, h: 26 })),
  ]
  const walk = p.view.mode === 'walk'
  const a = p.assets
  const cast = a.cast
  const models = useMemo(() => new Map(a.models.map((m) => [m.id, m])), [a.models])
  const get = (id: string) => models.get(id)!
  const list = (ids: readonly string[]) => ids.map(get)
  const species = useMemo(() => new Map(Object.entries(a.vegetation).map(([k, ids]) => [k, ids.map((id) => models.get(id)!)])), [a.vegetation, models])
  const villageLots = useMemo(() => p.layout.lots.filter((l) => l.regionId !== cast.town.region), [p.layout.lots, cast.town.region])
  const animals = useMemo(() => wildlifeHomes(p.layout, p.terrain, p.terrain.map, cast.wildlife), [p.layout, p.terrain, cast.wildlife])
  const homes = useMemo(() => {
    const out: Record<string, Pos[]> = {}
    for (const l of p.layout.lots) (out[l.regionId] ??= []).push(l.house)
    return out
  }, [p.layout.lots])
  const focus = p.selected?.at ?? (close && p.anchor !== 'train' ? ([p.anchor[0] + p.view.look[0], p.anchor[1] + p.view.look[1], p.anchor[2] + p.view.look[2]] as Pos) : null)
  return (
    <>
      <SkyAndLight sky={p.sky} shadowMapSize={p.quality.shadowMapSize} shadowEvery={p.quality.shadowEvery} />
      <StatsProbe />
      {p.onPerfDecline && <PerfGovernor onDecline={p.onPerfDecline} />}
      <TerrainMesh terrain={p.terrain} grid={p.grid} pathMask={p.pathMask} pathRes={p.pathRes} wet={p.weather.rain} />
      <Water terrain={p.terrain} grid={p.grid} look={p.sky.look} sunDir={p.sky.sunDir} water={g.water} wind={p.weather.wind} rain={p.weather.rain} />
      <Shore terrain={p.terrain} />
      {pond && <Fish center={pond.center} radius={pond.radius} surface={pond.surface} count={p.fishCount} />}
      <Railway terrain={p.terrain} />
      <Train terrain={p.terrain} getT={p.getTrainT} night={p.night} wind={p.weather.wind} />
      <Roads road={p.layout.road} busStops={p.layout.busStops} map={p.terrain.map} bus={get(cast.bus)} night={p.night} onSelect={p.onSelect} />
      <Traffic road={p.layout.road} models={list(cast.traffic)} count={Math.round(cast.trafficCount * p.quality.people)} night={p.night} />
      <Tractors lots={p.layout.lots} model={get(cast.tractor)} count={cast.tractors} />
      <Schools schools={p.layout.schools} kids={list(cast.kids)} kidScale={cast.kidScale} kidCount={Math.round(p.terrain.map.civic.kids * p.quality.people)} daylight={p.sky.daylight} night={p.night} onSelect={p.onSelect} />
      <TownAndProps layout={p.layout} assets={a} models={models} health={p.health} night={p.night} onSelect={p.onSelect} />
      <Houses lots={villageLots} regions={p.regions} health={p.health} night={p.night} onSelect={p.onSelect} />
      <Fields lots={p.layout.lots} health={p.health} onSelect={p.onSelect} />
      <LabelDeclutter anchors={anchors}>
        <Places layout={p.layout} regions={p.regions} night={p.night} labels={p.labels} onSelect={p.onSelect} />
        <Villagers terrain={p.terrain} waypoints={p.layout.waypoints} homes={homes} models={list(cast.villagers)} density={p.quality.people} night={p.night} say={p.say} />
        <Guides guides={p.layout.guides} models={list(cast.guides)} onSelect={p.onSelect} labels={p.labels} />
      </LabelDeclutter>
      <Vegetation trees={p.layout.trees} shrubs={p.layout.shrubs} wind={p.weather.wind} leaves={p.terrain.map.vegetation.leaves} density={p.quality.vegetation} models={species} />
      <GrassField grid={p.grid} mask={p.grassMask} maskRes={p.grassRes} pathMask={p.pathMask} pathRes={p.pathRes} count={p.quality.grass} base={g.grass.base} tip={g.grass.tip} dry={g.grass.dry} height={g.grass.height} wind={p.weather.wind} />
      <Flowers cover={p.flowers} colors={g.flowers} />
      <FocusForest plants={p.plants} models={species} />
      <WildAnimals animals={animals.filter((_, i) => i < animals.length * Math.max(0.35, p.quality.people))} models={models} grid={p.grid} flee={p.terrain.map.wildlife.fleeRadius} />
      <Chickens grid={p.grid} lots={p.layout.lots} map={p.terrain.map} />
      {walk && p.anchor !== 'train' && (
        <>
          <Player terrain={p.terrain} grid={p.grid} layout={p.layout} player={p.terrain.map.player} spawn={p.anchor} reachables={p.reachables} model={get(cast.player)} onNear={p.onNear} />
          <Companion grid={p.grid} map={p.terrain.map} model={get(cast.companion)} />
          <Butterflies map={p.terrain.map} grid={p.grid} daylight={p.sky.daylight} />
        </>
      )}
      <Wildlife terrain={p.terrain} lots={p.layout.lots} daylight={p.sky.daylight} fireflies={p.quality.flowers / 10} />
      <WeatherFx weather={p.weather} daylight={p.sky.daylight} sunDir={p.sky.sunDir} size={p.terrain.map.size} clouds={p.quality.clouds} onStrike={p.onStrike} />
      {p.selected && !walk && <SelectionMarker at={p.selected.at} label={p.selected.label} />}
      <CameraRig view={p.view} anchor={p.anchor} focus={p.selected?.at ?? null} zoom={p.selected?.zoom} limits={p.terrain.map.player.camera} />
      <PostFX quality={p.quality} look={p.sky.look} focus={close ? focus : null} />
    </>
  )
}

/** The whole 3D village. All state comes in as props; the scene only renders and reports clicks. */
export default function VillageCanvas(p: VillageSceneProps) {
  const night = p.sky.daylight < 0.3
  const labels = p.view.anchor.kind === 'overview' || p.view.mode === 'walk'
  const labelRoot = useRef<HTMLDivElement>(null)
  return (
    <LabelPortal.Provider value={labelRoot}>
      <div className="relative h-full w-full">
        <Canvas
          shadows={{ type: THREE.PCFSoftShadowMap }}
          dpr={p.quality.dpr}
          camera={{ position: [260, 120, 360], fov: 50, near: 0.3, far: 12000 }}
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
