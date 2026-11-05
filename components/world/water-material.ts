import * as THREE from 'three'
import type { HeightGrid } from '@/lib/world/grid'
import { NOISE_GLSL } from './glsl'

/** Shared clock for every water surface (advanced once per frame by <Water/>). */
export const waterTime = { value: 0 }

export interface WaterLook {
  shallow: string
  deep: string
  foam: string
  clarity: number
}

const vertex = `
uniform float uTime; uniform float uAmp;
varying vec3 vWPos;
#include <fog_pars_vertex>
${NOISE_GLSL}
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  wp.y += uAmp * (sin(dot(wp.xz, vec2(0.08, 0.06)) + uTime * 1.1) * 0.5 + sin(dot(wp.xz, vec2(-0.05, 0.11)) + uTime * 1.6) * 0.3);
  vWPos = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`

const fragment = `
uniform float uTime; uniform sampler2D uGround; uniform float uGridN; uniform float uMapSize;
uniform vec3 uShallow; uniform vec3 uDeep; uniform vec3 uFoam; uniform float uClarity;
uniform vec3 uSunDir; uniform vec3 uSun; uniform vec3 uZenith; uniform vec3 uHorizon; uniform float uRain; uniform float uRipple;
varying vec3 vWPos;
#include <fog_pars_fragment>
${NOISE_GLSL}
float groundAt(vec2 xz){
  vec2 uv = xz / uMapSize + 0.5;
  // Beyond the mapped terrain lies open sea.
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return -60.0;
  vec2 g = clamp((xz / uMapSize + 0.5) * (uGridN - 1.0), vec2(0.0), vec2(uGridN - 1.001));
  vec2 i = floor(g); vec2 f = g - i;
  float a = texture2D(uGround, (i + 0.5) / uGridN).r;
  float b = texture2D(uGround, (i + vec2(1.5, 0.5)) / uGridN).r;
  float c = texture2D(uGround, (i + vec2(0.5, 1.5)) / uGridN).r;
  float d = texture2D(uGround, (i + 1.5) / uGridN).r;
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float waveH(vec2 p){
  return fbm3(p * 0.35 + vec2(uTime * 0.08, uTime * 0.05)) * 0.6 + vnoise(p * 1.4 - vec2(uTime * 0.25, -uTime * 0.12)) * 0.3
       + uRain * vnoise(p * 6.0 + uTime * 3.0) * 0.4;
}
void main(){
  float depth = max(vWPos.y - groundAt(vWPos.xz), 0.0);
  float e = 0.25;
  float hx = waveH(vWPos.xz + vec2(e, 0.0)) - waveH(vWPos.xz - vec2(e, 0.0));
  float hz = waveH(vWPos.xz + vec2(0.0, e)) - waveH(vWPos.xz - vec2(0.0, e));
  vec3 n = normalize(vec3(-hx * uRipple, 1.0, -hz * uRipple));
  vec3 V = normalize(cameraPosition - vWPos);
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(n, V), 0.0), 5.0);
  vec3 R = reflect(-V, n);
  vec3 sky = mix(uHorizon, uZenith, pow(clamp(R.y, 0.0, 1.0), 0.6));
  vec3 body = mix(uShallow, uDeep, 1.0 - exp(-depth / uClarity));
  float spec = pow(max(dot(R, normalize(uSunDir)), 0.0), 220.0) * 9.0 * step(0.0, uSunDir.y);
  float foamN = vnoise(vWPos.xz * 0.9 + uTime * 0.35) * 0.6 + vnoise(vWPos.xz * 2.7 - uTime * 0.2) * 0.4;
  float foam = (1.0 - smoothstep(0.05, 0.9, depth)) * smoothstep(0.35, 0.75, foamN);
  vec3 col = mix(body, sky, fres * 0.85) + uSun * spec;
  col = mix(col, uFoam, foam * 0.75);
  float alpha = clamp(0.35 + depth * 0.55 + fres * 0.5, 0.0, 0.98);
  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`

/** Water with depth colour from the terrain grid, shore foam, sky reflection (Fresnel), sun glint and rain ripples. */
export function makeWaterMaterial(grid: HeightGrid, look: WaterLook, ripple: number, amp: number) {
  const tex = new THREE.DataTexture(grid.heights, grid.n, grid.n, THREE.RedFormat, THREE.FloatType)
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter
  tex.needsUpdate = true
  const lin = (hex: string) => new THREE.Color(hex).convertSRGBToLinear()
  const uniforms = THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    {
      uGround: { value: tex }, uGridN: { value: grid.n }, uMapSize: { value: grid.size }, uClarity: { value: look.clarity },
      uShallow: { value: lin(look.shallow) }, uDeep: { value: lin(look.deep) }, uFoam: { value: lin(look.foam) },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSun: { value: new THREE.Color(1, 1, 1) },
      uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uRain: { value: 0 }, uRipple: { value: ripple }, uAmp: { value: amp },
    },
  ])
  uniforms.uTime = waterTime
  uniforms.uGround!.value = tex
  return new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false, fog: true })
}
