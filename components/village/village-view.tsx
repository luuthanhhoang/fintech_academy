'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import { journeyProgress, type ActiveFocus } from '@/lib/focus/machine'
import { villagerLine } from '@/lib/world/chatter'
import { describePlace } from '@/lib/world/describe'
import type { Pos, WorldLayout } from '@/lib/world/layout'
import { idleT, journeyRoute, resolveAnchor, routeT } from '@/lib/world/views'
import type { TimeOfDay } from '@/lib/world/sky'
import { useFocus } from '@/components/focus/focus-provider'
import { parseSelection, type SelectionId } from '@/components/world/scene-types'
import { walkInput } from '@/components/world/walk-state'
import { arrivalPoint } from '@/lib/world/walk'
import { FishingPanel } from './fishing-panel'
import { FocusHud } from './focus-hud'
import { JourneyPanel } from './journey-panel'
import { Map2D, MapLegend } from './map-2d'
import { Minimap } from './minimap'
import { Panel } from './panel'
import { PlacePanel } from './place-panel'
import { QuestDock } from './quest-dock'
import { SkyBar, TIMES } from './sky-bar'
import { Toolbar } from './toolbar'
import { TravelDock, type TravelTarget } from './travel-dock'
import { useSceneState } from './use-scene-state'
import { useVillageAudio } from './use-village-audio'
import { initialQuality, rememberQuality, useClock, useFlowers, useVillageLearner, useWebGL, useWorld } from './use-village-data'
import { useWalk } from './use-walk'
import { InteractPrompt, Joystick, WalkHint } from './walk-controls'
import { WorldReaderContext } from './world-link'
import { WorldReader, type ReaderPage } from './world-reader'

const VillageCanvas = dynamic(() => import('@/components/world/village-canvas'), { ssr: false, loading: () => <p className="p-6 text-sm text-ink-3">Đang dựng làng 3D…</p> })
const CELEBRATE_MS = 90_000
/** How close the camera flies to a selected place, by kind (overview mode). */
const FLY_DISTANCE: Record<string, number> = { guide: 6, lot: 26, landmark: 38, station: 55, feature: 40, lake: 60, school: 40, bus: 18 }

function routeFor(catalog: Catalog, layout: WorldLayout, active: ActiveFocus) {
  const conceptId = active.tasks.flatMap((t) => t?.conceptIds ?? [])[0]
  const stage = catalog.concepts.find((c) => c.id === conceptId)?.stage
  const start = layout.stations.find((s) => s.id === stage) ?? layout.stations.find((s) => s.regionId === active.regionId) ?? null
  return journeyRoute(layout.stations, start?.id ?? null, active.segments)
}

function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const id = window.setTimeout(() => setCoarse(mq.matches), 0)
    return () => window.clearTimeout(id)
  }, [])
  return coarse
}

export function VillageView({ catalog }: { catalog: Catalog }) {
  const w = catalog.world
  const params = useSearchParams()
  const world = useWorld(catalog)
  const learner = useVillageLearner(catalog, world)
  const focus = useFocus()
  const webgl = useWebGL()
  const coarse = useCoarsePointer()
  const now = useClock(30_000)
  const [viewPick, setViewPick] = useState(() => params.get('view') ?? (focus.active?.viewId ?? w.defaultView))
  const [weatherPick, setWeatherPick] = useState(w.weather.defaultWeather)
  const [time, setTime] = useState<TimeOfDay>(() => TIMES.find((t) => t.value === params.get('time'))?.value ?? 'day')
  const [selected, setSelected] = useState<SelectionId | null>(() => params.get('place'))
  const [reader, setReader] = useState<ReaderPage | null>(null)
  const [modePick, setModePick] = useState<'3d' | '2d' | null>(null)
  const [journeyOpen, setJourneyOpen] = useState(() => params.has('journey'))
  const [celebrating, setCelebrating] = useState(false)
  const [qualityId, setQualityId] = useState(() => {
    const asked = params.get('quality')
    if (asked) rememberQuality(asked)
    return asked ?? initialQuality(catalog)
  })
  const [toolsOpen, setToolsOpen] = useState(false)
  const [questOpen, setQuestOpen] = useState(false)

  const view = w.views.find((v) => v.id === viewPick) ?? w.views[0]!
  const walking = view.mode === 'walk'
  const quality = w.graphics.quality.find((q) => q.id === qualityId) ?? w.graphics.quality[0]!
  // Quality steps down by itself when the frame rate stays low — unless the URL pins it (?quality=…).
  const pinned = params.has('quality')
  const [notice, setNotice] = useState<string | null>(null)
  const stepDown = useCallback(() => {
    const order = w.graphics.quality
    const next = order[order.findIndex((q) => q.id === qualityId) + 1]
    if (!next) return
    rememberQuality(next.id)
    setQualityId(next.id)
    setNotice(`Đã tự giảm đồ hoạ xuống mức “${next.label}” để giữ độ mượt. Bạn có thể đổi lại trong ⚙.`)
  }, [w.graphics.quality, qualityId])
  const flowers = useFlowers(catalog, world, quality.flowers)
  const mode = webgl === false ? '2d' : (modePick ?? '3d')
  const anchor = useMemo(() => resolveAnchor(view, world.layout, world.terrain, learner.health), [view, world, learner.health])
  const sel = parseSelection(selected)
  const info = sel ? describePlace(sel, catalog, world.layout, world.terrain, learner.health) : null
  const scene = useSceneState(catalog, view, weatherPick, time, info?.scenario ?? false, celebrating, now)
  const audio = useVillageAudio(w.music.pieces, scene.ambience)
  const chime = useRef(audio.chime)
  useEffect(() => {
    chime.current = audio.chime
  }, [audio.chime])
  const walk = useWalk(catalog, world.layout, world.terrain, walking && mode === '3d', setSelected)

  const subscribe = focus.subscribe
  useEffect(
    () =>
      subscribe((e) => {
        if (e.type === 'segment-complete' || e.type === 'break-over') chime.current()
        if (e.type === 'journey-complete') {
          setCelebrating(true)
          window.setTimeout(() => setCelebrating(false), CELEBRATE_MS)
        }
      }),
    [subscribe],
  )

  const active = focus.active
  const activeRef = useRef(active)
  useEffect(() => {
    activeRef.current = active
  }, [active])
  // The route only depends on the journey's tasks; recomputing it is cheap (a few dozen stations).
  const route = active ? routeFor(catalog, world.layout, active) : []
  const routeRef = useRef(route)
  useEffect(() => {
    routeRef.current = route
  })
  const getTrainT = useCallback(() => {
    const a = activeRef.current
    return a ? routeT(routeRef.current, journeyProgress(a, Date.now())) : idleT(performance.now() / 1000)
  }, [])

  const selectedAt = info && sel ? { at: info.at, label: info.title, zoom: FLY_DISTANCE[sel.kind] ?? 48 } : null
  const say = useCallback((x: number, z: number) => villagerLine(world.layout.lots, learner.health, walk.names, w.map.people.chatter, x, z), [world.layout.lots, learner.health, walk.names, w.map.people.chatter])
  const setView = (id: string) => {
    setViewPick(id)
    setSelected(null)
    setReader(null)
  }
  const openInWorld = useCallback((href: string, label: string) => setReader({ href, label }), [])
  /** Walking: arrive next to the place and open its panel. Otherwise: fly the camera there. */
  const goTo = (id: SelectionId) => {
    const p = parseSelection(id)
    const at = p ? describePlace(p, catalog, world.layout, world.terrain, learner.health)?.at : null
    if (at) walk.travel(at)
    setSelected(id)
  }
  // Arriving from a page (?place=lot:…, e.g. "Về làng" on a lesson): stand in front of that place.
  const arrived = useRef(false)
  useEffect(() => {
    if (arrived.current || !walking || !info) return
    arrived.current = true
    walkInput.teleport = { at: arrivalPoint(world.terrain, info.at[0], info.at[2], 8), face: [info.at[0], info.at[2]] }
  }, [walking, info, world.terrain])
  const travel = (t: TravelTarget) => goTo(`${t.kind}:${t.id}`)
  const ride = (at: Pos) => {
    if (!walk.travel(at, 4)) return
    setSelected(null)
  }

  return (
    <WorldReaderContext.Provider value={openInWorld}>
      <div className="relative h-[calc(100dvh-var(--topbar)-3.75rem)] w-full overflow-hidden bg-[#0d1424] md:h-[calc(100dvh-var(--topbar))]">
        {mode === '3d' && webgl ? (
          <VillageCanvas
            assets={w.assets} terrain={world.terrain} grid={world.grid} pathMask={world.pathMask} pathRes={world.pathRes} graphics={w.graphics} quality={quality} flowers={flowers} grassMask={world.grassMask} grassRes={world.grassRes}
            layout={world.layout} regions={w.map.regions} health={learner.health} plants={learner.plants}
            weather={scene.weather} sky={scene.sky} view={view} anchor={anchor} selected={selectedAt} fishCount={Math.min(30, learner.dueCount)}
            getTrainT={getTrainT} onSelect={setSelected} onStrike={(d) => void audio.thunder(d)} onPerfDecline={pinned ? undefined : stepDown}
            reachables={walk.reachables} onNear={walk.setNear} say={say}
          />
        ) : (
          <Map2D terrain={world.terrain} layout={world.layout} health={learner.health} names={walk.names} onSelect={setSelected} />
        )}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-3 top-3 flex max-h-[calc(100%-6rem)] flex-col gap-2 overflow-y-auto">
            <button type="button" onClick={() => setQuestOpen((o) => !o)} aria-expanded={questOpen} className="pointer-events-auto self-start rounded-full border border-rule bg-paper/90 px-3 py-1.5 font-sans text-xs shadow backdrop-blur lg:hidden">
              {questOpen ? 'Ẩn nhiệm vụ' : 'Nhiệm vụ hôm nay'}
            </button>
            <div className={`${questOpen ? 'block' : 'hidden'} lg:block`}>
              {active ? null : <QuestDock catalog={catalog} journeyOpen={journeyOpen} onJourney={() => setJourneyOpen(true)} />}
            </div>
            {mode === '2d' && <Panel className="w-72"><MapLegend /></Panel>}
            {mode === '3d' && walking && !coarse && <Minimap terrain={world.terrain} layout={world.layout} health={learner.health} names={walk.names} onPick={goTo} />}
          </div>
          <div className="absolute left-1/2 top-3 -translate-x-1/2 max-md:hidden">
            <SkyBar time={time} onTime={setTime} weather={w.weather.presets} weatherId={view.weather ?? weatherPick} locked={Boolean(view.weather)} onWeather={setWeatherPick} />
          </div>
          <div className="absolute right-3 top-3 flex max-h-[calc(100%-6rem)] w-[min(20rem,calc(100%-1.5rem))] flex-col items-end gap-2 overflow-y-auto max-sm:max-h-[60%]">
            <div className="pointer-events-auto">
              <button type="button" onClick={() => setToolsOpen((o) => !o)} aria-expanded={toolsOpen} className="rounded-full border border-rule bg-paper/90 px-3 py-1.5 font-sans text-xs shadow backdrop-blur">
                ⚙ Đồ hoạ · âm thanh
              </button>
            </div>
            {toolsOpen && (
              <>
                <div className="md:hidden">
                  <SkyBar time={time} onTime={setTime} weather={w.weather.presets} weatherId={view.weather ?? weatherPick} locked={Boolean(view.weather)} onWeather={setWeatherPick} />
                </div>
                <Toolbar
                  world={w} quality={quality.id} onQuality={(id) => (rememberQuality(id), setQualityId(id))} audio={audio.prefs} mode={mode} webgl={webgl !== false} skyNote={scene.note}
                  onToggleAudio={() => void audio.toggle()} onAudio={audio.update} onMode={setModePick}
                />
              </>
            )}
            {active && <FocusHud stationNames={route.map((s) => `Ga ${s.id.toUpperCase()} · ${s.title}`)} />}
            {!active && journeyOpen && <JourneyPanel catalog={catalog} sessions={learner.sessions} focusTrack={learner.focusTrack} preselect={params.get('journey')} onStarted={(v) => (setJourneyOpen(false), setView(v))} />}
            {view.mode === 'review' && <FishingPanel catalog={catalog} dueCount={learner.dueCount} onClose={() => setView(w.defaultView)} />}
            {info && !reader && <PlacePanel info={info} onClose={() => setSelected(null)} onRide={ride} />}
          </div>
          {notice && (
            <p role="status" className="pointer-events-auto absolute left-1/2 top-20 w-[min(32rem,calc(100%-1.5rem))] -translate-x-1/2 rounded-xl border border-rule bg-paper/95 px-3 py-2 text-center font-sans text-xs shadow-lg">
              {notice} <button type="button" onClick={() => setNotice(null)} className="ml-1 underline">Đóng</button>
            </p>
          )}
          <div className="absolute inset-x-0 bottom-[4.5rem] flex flex-col items-center gap-2 px-3 max-sm:bottom-auto max-sm:top-14">
            {walk.near && !reader && !selected && <InteractPrompt near={walk.near} onEnter={() => setSelected(`${walk.near!.kind}:${walk.near!.id}`)} />}
            {walking && mode === '3d' && !walk.moved && !coarse && <WalkHint />}
          </div>
          {walking && mode === '3d' && coarse && (
            <div className="absolute bottom-20 left-3">
              <Joystick />
            </div>
          )}
          <TravelDock
            catalog={catalog} layout={world.layout} views={w.views} current={view} dueCount={learner.dueCount} focusing={Boolean(active)}
            onView={setView} onFocus={() => setJourneyOpen(true)} onTravel={travel}
          />
          {reader && <WorldReader page={reader} onClose={() => setReader(null)} />}
        </div>
      </div>
    </WorldReaderContext.Provider>
  )
}
