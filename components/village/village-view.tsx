'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import { journeyProgress, type ActiveFocus } from '@/lib/focus/machine'
import { describePlace } from '@/lib/world/describe'
import type { WorldLayout } from '@/lib/world/layout'
import { idleT, journeyRoute, resolveAnchor, routeT } from '@/lib/world/views'
import type { TimeOfDay } from '@/lib/world/sky'
import { useFocus } from '@/components/focus/focus-provider'
import { parseSelection, type SelectionId } from '@/components/world/scene-types'
import { FishingPanel } from './fishing-panel'
import { FocusHud } from './focus-hud'
import { JourneyPanel } from './journey-panel'
import { Map2D, MapLegend } from './map-2d'
import { Panel } from './panel'
import { PlacePanel } from './place-panel'
import { QuestDock } from './quest-dock'
import { ViewDock } from './view-dock'
import { Toolbar } from './toolbar'
import { useSceneState } from './use-scene-state'
import { useVillageAudio } from './use-village-audio'
import { initialQuality, rememberQuality, useClock, useFlowers, useVillageLearner, useWebGL, useWorld } from './use-village-data'

const VillageCanvas = dynamic(() => import('@/components/world/village-canvas'), { ssr: false, loading: () => <p className="p-6 text-sm text-ink-3">Đang dựng làng 3D…</p> })
const CELEBRATE_MS = 90_000
/** How close the camera flies to a selected place, by kind. */
const FLY_DISTANCE: Record<string, number> = { guide: 6, lot: 26, landmark: 38, station: 55, feature: 40, lake: 60 }

function routeFor(catalog: Catalog, layout: WorldLayout, active: ActiveFocus) {
  const conceptId = active.tasks.flatMap((t) => t?.conceptIds ?? [])[0]
  const stage = catalog.concepts.find((c) => c.id === conceptId)?.stage
  const start = layout.stations.find((s) => s.id === stage) ?? layout.stations.find((s) => s.regionId === active.regionId) ?? null
  return journeyRoute(layout.stations, start?.id ?? null, active.segments)
}

export function VillageView({ catalog }: { catalog: Catalog }) {
  const w = catalog.world
  const params = useSearchParams()
  const world = useWorld(catalog)
  const learner = useVillageLearner(catalog, world)
  const focus = useFocus()
  const webgl = useWebGL()
  const now = useClock(30_000)
  const [viewPick, setViewPick] = useState(() => params.get('view') ?? (focus.active?.viewId ?? w.defaultView))
  const [weatherPick, setWeatherPick] = useState(w.weather.defaultWeather)
  const [time, setTime] = useState<TimeOfDay>(() => (['auto', 'golden', 'dawn', 'day', 'dusk', 'night'].find((t) => t === params.get('time')) as TimeOfDay | undefined) ?? 'golden')
  const [selected, setSelected] = useState<SelectionId | null>(() => params.get('place'))
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
  const anchor = useMemo(() => resolveAnchor(view, world.layout, world.terrain), [view, world])
  const sel = parseSelection(selected)
  const info = sel ? describePlace(sel, catalog, world.layout, world.terrain, learner.health) : null
  const scene = useSceneState(catalog, view, weatherPick, time, info?.scenario ?? false, celebrating, now)
  const audio = useVillageAudio(w.music.pieces, scene.ambience)
  const chime = useRef(audio.chime)
  useEffect(() => {
    chime.current = audio.chime
  }, [audio.chime])

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
  const names = useMemo(() => new Map(catalog.concepts.map((c) => [c.id, c.name.vi])), [catalog])
  const setView = (id: string) => {
    setViewPick(id)
    setSelected(null)
  }

  return (
    <div className="relative h-[calc(100dvh-var(--topbar)-3.75rem)] w-full overflow-hidden bg-[#0d1424] lg:h-[calc(100dvh-var(--topbar))]">
      {mode === '3d' && webgl ? (
        <VillageCanvas
          terrain={world.terrain} grid={world.grid} pathMask={world.pathMask} pathRes={world.pathRes} graphics={w.graphics} quality={quality} flowers={flowers} grassMask={world.grassMask} grassRes={world.grassRes}
          layout={world.layout} regions={w.map.regions} health={learner.health} plants={learner.plants}
          weather={scene.weather} sky={scene.sky} view={view} anchor={anchor} selected={selectedAt} fishCount={Math.min(30, learner.dueCount)}
          getTrainT={getTrainT} onSelect={setSelected} onStrike={(d) => void audio.thunder(d)} onPerfDecline={pinned ? undefined : stepDown}
        />
      ) : (
        <Map2D terrain={world.terrain} layout={world.layout} health={learner.health} names={names} onSelect={setSelected} />
      )}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-3 top-3 flex max-h-[calc(100%-5.5rem)] flex-col gap-2 overflow-y-auto">
          <button type="button" onClick={() => setQuestOpen((o) => !o)} aria-expanded={questOpen} className="pointer-events-auto self-start rounded-full border border-rule bg-paper/90 px-3 py-1.5 font-sans text-xs shadow backdrop-blur lg:hidden">
            {questOpen ? 'Ẩn nhiệm vụ' : 'Nhiệm vụ hôm nay'}
          </button>
          <div className={`${questOpen ? 'block' : 'hidden'} lg:block`}>
            {active ? null : <QuestDock catalog={catalog} journeyOpen={journeyOpen} onJourney={() => setJourneyOpen(true)} />}
          </div>
          {mode === '2d' && <Panel className="w-72"><MapLegend /></Panel>}
        </div>
        <div className="absolute right-3 top-3 flex max-h-[calc(100%-5.5rem)] w-[min(20rem,calc(100%-1.5rem))] flex-col items-end gap-2 overflow-y-auto max-sm:bottom-16 max-sm:top-auto max-sm:max-h-[55%]">
          <div className="pointer-events-auto">
            <button type="button" onClick={() => setToolsOpen((o) => !o)} aria-expanded={toolsOpen} className="rounded-full border border-rule bg-paper/90 px-3 py-1.5 font-sans text-xs shadow backdrop-blur">
              ⚙ Cảnh · giờ · âm thanh
            </button>
          </div>
          {toolsOpen && (
            <Toolbar
              world={w} quality={quality.id} onQuality={(id) => (rememberQuality(id), setQualityId(id))} weatherId={view.weather ?? weatherPick} weatherLocked={Boolean(view.weather)} time={time} audio={audio.prefs} mode={mode} webgl={webgl !== false} skyNote={scene.note}
              onWeather={setWeatherPick} onTime={setTime} onToggleAudio={() => void audio.toggle()} onAudio={audio.update} onMode={setModePick}
            />
          )}
          {active && <FocusHud stationNames={route.map((s) => `Ga ${s.id.toUpperCase()} · ${s.title}`)} />}
          {!active && journeyOpen && <JourneyPanel catalog={catalog} sessions={learner.sessions} focusTrack={learner.focusTrack} preselect={params.get('journey')} onStarted={(v) => (setJourneyOpen(false), setView(v))} />}
          {view.mode === 'review' && <FishingPanel catalog={catalog} dueCount={learner.dueCount} onClose={() => setView(w.defaultView)} />}
          {info && <PlacePanel info={info} onClose={() => setSelected(null)} />}
        </div>
        {notice && (
          <p role="status" className="pointer-events-auto absolute left-1/2 top-3 w-[min(32rem,calc(100%-1.5rem))] -translate-x-1/2 rounded-xl border border-rule bg-paper/95 px-3 py-2 text-center font-sans text-xs shadow-lg">
            {notice} <button type="button" onClick={() => setNotice(null)} className="ml-1 underline">Đóng</button>
          </p>
        )}
        <ViewDock views={w.views} current={view.id} onPick={setView} />
      </div>
    </div>
  )
}
