/** Blends the four art-direction looks (night, dawn, day, dusk) by sun elevation (pure). */
import type { Look } from '../content/schema/graphics'
import { hexToRgb, type Rgb } from './colors'
import { smoothstep } from './noise'

export interface BlendedLook {
  /** The look with the largest weight (chooses the environment map). */
  dominant: Look
  envIntensity: number
  exposure: number
  sunIntensity: number
  saturation: number
  contrast: number
  sun: Rgb
  zenith: Rgb
  horizon: Rgb
  ground: Rgb
  fog: Rgb
}

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * @param elevation sun elevation in radians
 * @param hour local scene hour (before noon → dawn look, after → dusk look)
 */
export function blendLook(looks: readonly Look[], elevation: number, hour: number): BlendedLook {
  const by = (id: Look['id']) => looks.find((l) => l.id === id)!
  const night = by('night')
  const twilight = hour < 12 ? by('dawn') : by('dusk')
  const day = by('day')
  const deg = (elevation * 180) / Math.PI
  const t1 = smoothstep(-10, -2, deg)
  const t2 = smoothstep(4, 18, deg)
  const w = { night: (1 - t1) * (1 - t2), twilight: t1 * (1 - t2), day: t2 }
  const color = (k: 'sun' | 'zenith' | 'horizon' | 'ground' | 'fog') => mix(mix(hexToRgb(night[k]), hexToRgb(twilight[k]), t1), hexToRgb(day[k]), t2)
  const num = (k: 'envIntensity' | 'exposure' | 'sunIntensity' | 'saturation' | 'contrast') => lerp(lerp(night[k], twilight[k], t1), day[k], t2)
  const dominant = w.day >= w.twilight && w.day >= w.night ? day : w.twilight >= w.night ? twilight : night
  return {
    dominant,
    envIntensity: num('envIntensity'), exposure: num('exposure'), sunIntensity: num('sunIntensity'), saturation: num('saturation'), contrast: num('contrast'),
    sun: color('sun'), zenith: color('zenith'), horizon: color('horizon'), ground: color('ground'), fog: color('fog'),
  }
}
