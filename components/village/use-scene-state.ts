'use client'

import { useMemo } from 'react'
import type { Catalog } from '@/lib/content/catalog'
import type { WorldView } from '@/lib/content/schema/world'
import { ambienceLevels, resolveWeather } from '@/lib/world/atmosphere'
import { blendLook } from '@/lib/world/looks'
import { moonPhase, moonPhaseName, moonPosition, daylight as daylightOf, sceneHour, sunPosition, type TimeOfDay } from '@/lib/world/sky'
import type { SkyState } from '@/components/world/sky'

/** Weather, sky and ambience for the current view, picks and events. */
export function useSceneState(catalog: Catalog, view: WorldView, picked: string, time: TimeOfDay, atScenario: boolean, celebrating: boolean, now: Date) {
  const w = catalog.world
  const weather = resolveWeather({ presets: w.weather.presets, picked, view, atScenario: atScenario ? w.weather.scenario : null, celebrating: celebrating ? w.weather.celebration : null })
  const effectiveTime = time !== 'auto' ? time : view.time
  const minute = Math.floor(now.getTime() / 60_000)
  const { sky, note } = useMemo(() => {
    const date = new Date(minute * 60_000)
    const hour = sceneHour(date, effectiveTime)
    const lat = w.map.location.latitude
    const sun = sunPosition(date, hour, lat)
    const moon = moonPosition(date, hour, lat)
    const phase = moonPhase(date)
    const s: SkyState = {
      sunDir: sun.direction, sunElevation: sun.elevation, moonDir: moon.direction, daylight: daylightOf(sun.elevation), clouds: weather.clouds, fog: weather.fog,
      look: blendLook(w.graphics.looks, sun.elevation, hour),
    }
    const text = `Mặt Trời và Mặt Trăng tính theo ${effectiveTime === 'auto' ? 'giờ trên máy bạn' : 'thời điểm đã chọn'} ở ${w.map.location.label}. Hôm nay: ${moonPhaseName(phase.age)} (ước lượng ${Math.round(phase.illumination * 100)}% sáng).`
    return { sky: s, note: text }
  }, [minute, effectiveTime, w.map.location, w.graphics.looks, weather.clouds, weather.fog])
  const ambience = useMemo(() => ambienceLevels(weather, view, sky.daylight), [weather, view, sky.daylight])
  return { weather, sky, note, ambience }
}
