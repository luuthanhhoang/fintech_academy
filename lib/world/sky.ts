/**
 * Sun and moon from the real date and your local clock (simple astronomical approximations — good to a few
 * degrees, enough to light a scene; not for navigation). World axes: +x east, +y up, +z south.
 */

const RAD = Math.PI / 180
/** Mean synodic month in days. */
export const SYNODIC_MONTH = 29.530588853
/** Reference new moon: 2000-01-06 18:14 UTC (Julian day 2451550.26). */
const NEW_MOON_JD = 2451550.26

export type TimeOfDay = 'auto' | 'dawn' | 'day' | 'dusk' | 'night'
const PRESET_HOURS: Record<Exclude<TimeOfDay, 'auto'>, number> = { dawn: 6.2, day: 12.5, dusk: 17.9, night: 22.5 }

export function julianDay(d: Date): number {
  return d.getTime() / 86_400_000 + 2440587.5
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0)
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000)
}

/** Local hour (0–24) for the scene, honouring a preset. */
export function sceneHour(now: Date, time: TimeOfDay): number {
  return time === 'auto' ? now.getHours() + now.getMinutes() / 60 : PRESET_HOURS[time]
}

function direction(elevation: number, azimuth: number): [number, number, number] {
  // azimuth measured from north, clockwise (east = 90°).
  const c = Math.cos(elevation)
  return [c * Math.sin(azimuth), Math.sin(elevation), -c * Math.cos(azimuth)]
}

function horizontal(latitude: number, declination: number, hourAngle: number) {
  const phi = latitude * RAD
  const sinEl = Math.sin(phi) * Math.sin(declination) + Math.cos(phi) * Math.cos(declination) * Math.cos(hourAngle)
  const el = Math.asin(Math.max(-1, Math.min(1, sinEl)))
  const az = Math.atan2(Math.sin(hourAngle), Math.cos(hourAngle) * Math.sin(phi) - Math.tan(declination) * Math.cos(phi)) + Math.PI
  return { el, az }
}

export function solarDeclination(d: Date): number {
  return -23.44 * RAD * Math.cos(((2 * Math.PI) / 365) * (dayOfYear(d) + 10))
}

/** Unit vector towards the sun and its elevation in radians. */
export function sunPosition(d: Date, hour: number, latitude: number) {
  const { el, az } = horizontal(latitude, solarDeclination(d), (hour - 12) * 15 * RAD)
  return { elevation: el, direction: direction(el, az) }
}

/** Moon age in days since the last new moon, illuminated fraction (0–1) and whether it is waxing. */
export function moonPhase(d: Date) {
  const age = (((julianDay(d) - NEW_MOON_JD) % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH
  const angle = (age / SYNODIC_MONTH) * 2 * Math.PI
  return { age, illumination: (1 - Math.cos(angle)) / 2, waxing: age < SYNODIC_MONTH / 2 }
}

export function moonPhaseName(age: number): string {
  const f = age / SYNODIC_MONTH
  if (f < 0.034 || f > 0.966) return 'Trăng non'
  if (f < 0.216) return 'Trăng lưỡi liềm đầu tháng'
  if (f < 0.284) return 'Bán nguyệt đầu tháng'
  if (f < 0.466) return 'Trăng khuyết dần tròn'
  if (f < 0.534) return 'Trăng tròn'
  if (f < 0.716) return 'Trăng tròn dần khuyết'
  if (f < 0.784) return 'Bán nguyệt cuối tháng'
  return 'Trăng lưỡi liềm cuối tháng'
}

/** The moon lags the sun by its phase angle (≈ 12.2° per day); declination approximated by the sun's. */
export function moonPosition(d: Date, hour: number, latitude: number) {
  const { age } = moonPhase(d)
  const lag = (age / SYNODIC_MONTH) * 24
  const { el, az } = horizontal(latitude, solarDeclination(d), (hour - lag - 12) * 15 * RAD)
  return { elevation: el, direction: direction(el, az) }
}

/** 0 at night, 1 in full day, smooth through twilight (sun elevation −8°…+10°). */
export function daylight(sunElevation: number): number {
  const t = Math.min(1, Math.max(0, (sunElevation / RAD + 8) / 18))
  return t * t * (3 - 2 * t)
}
