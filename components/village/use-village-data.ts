'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import { db } from '@/lib/db/dexie'
import { plotHealth, type PlotHealth } from '@/lib/world/health'
import { grassMask, scatterGroundCover } from '@/lib/world/grass'
import { sampleGrid } from '@/lib/world/grid'
import { buildWorldLayout } from '@/lib/world/layout'
import { pathSegments, rasterisePaths } from '@/lib/world/paths'
import { roadSegments } from '@/lib/world/roads'
import { plantsFromSessions } from '@/lib/world/plants'
import { createTerrain } from '@/lib/world/terrain'
import { useDueCards, useMastery } from '@/components/data/use-learner'

const PATH_RES = 1024
const PATH_WIDTH = 1.6
const GRASS_RES = 256

/** Terrain, layout, height grid and footpath mask are deterministic from content, computed once per catalog. */
export function useWorld(catalog: Catalog) {
  return useMemo(() => {
    const terrain = createTerrain(catalog.world.map)
    const layout = buildWorldLayout(catalog, terrain)
    const grid = sampleGrid(terrain)
    const size = catalog.world.map.size
    const pathMask = rasterisePaths(pathSegments(layout), size, PATH_RES, PATH_WIDTH)
    // The road is drawn as its own mesh; it joins the mask so grass and flowers keep off it.
    const roadMask = rasterisePaths(roadSegments(layout.road), size, PATH_RES, layout.road.width)
    for (let i = 0; i < pathMask.length; i++) pathMask[i] = Math.max(pathMask[i]!, roadMask[i]!)
    const grass = grassMask(terrain, grid, layout, GRASS_RES)
    return { terrain, layout, grid, pathMask, pathRes: PATH_RES, grassMask: grass, grassRes: GRASS_RES }
  }, [catalog])
}

/** Wildflowers for the chosen quality preset (grass itself follows the camera; see GrassField). */
export function useFlowers(catalog: Catalog, world: ReturnType<typeof useWorld>, flowers: number) {
  return useMemo(
    () => scatterGroundCover(world.terrain, world.grid, world.layout, flowers, catalog.world.graphics.grass.patchRadius * 1.6, catalog.world.map.seed + 22),
    [catalog, world, flowers],
  )
}

const QUALITY_KEY = 'village:quality'

/** Remembers the viewer's quality choice on this device (a per-viewer convenience). */
export function rememberQuality(id: string) {
  try {
    window.localStorage.setItem(QUALITY_KEY, id)
  } catch {
    /* storage unavailable */
  }
}

/** Initial quality: the remembered choice, else the light preset on narrow screens or few CPU cores. */
export function initialQuality(catalog: Catalog): string {
  const g = catalog.world.graphics
  try {
    const saved = window.localStorage.getItem(QUALITY_KEY)
    if (saved && g.quality.some((q) => q.id === saved)) return saved
  } catch {
    /* storage unavailable */
  }
  const light = window.innerWidth < 820 || (navigator.hardwareConcurrency ?? 8) <= 4
  return light ? g.lightQuality : g.defaultQuality
}

/** Learner state as the village shows it: plot health, the focus forest, due cards (fish), focus records. */
export function useVillageLearner(catalog: Catalog, world: ReturnType<typeof useWorld>) {
  const mastery = useMastery(catalog)
  const due = useDueCards()
  const sessions = useLiveQuery(() => db().focusSessions.orderBy('startedAt').toArray(), [])
  const focusTrack = useLiveQuery(async () => {
    const v = (await db().settings.get('focusTrack'))?.value
    return typeof v === 'string' ? v : null
  }, [])
  const health = useMemo(() => {
    const out = new Map<string, PlotHealth>()
    if (mastery.status !== 'ready') return out
    for (const c of catalog.concepts) out.set(c.id, plotHealth(mastery.states.get(c.id) ?? 'locked', mastery.scores.get(c.id), catalog.config.mastery.unlockAt))
    return out
  }, [mastery, catalog])
  const plants = useMemo(() => (sessions ? plantsFromSessions(sessions, catalog, world.layout, world.terrain) : []), [sessions, catalog, world])
  return { health, plants, sessions: sessions ?? [], dueCount: due?.length ?? 0, focusTrack: focusTrack ?? null, ready: mastery.status === 'ready' && sessions !== undefined }
}

/** Current time, refreshed every `ms` (the sky only needs minute resolution). */
export function useClock(ms: number) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), ms)
    return () => window.clearInterval(id)
  }, [ms])
  return now
}

/** WebGL availability (false on very old devices or when blocked); null until checked. */
export function useWebGL() {
  const [ok, setOk] = useState<boolean | null>(null)
  useEffect(() => {
    let supported = false
    try {
      const c = document.createElement('canvas')
      supported = !!(c.getContext('webgl2') ?? c.getContext('webgl'))
    } catch {
      supported = false
    }
    const id = window.setTimeout(() => setOk(supported), 0)
    return () => window.clearTimeout(id)
  }, [])
  return ok
}
