'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { mulberry32 } from '@/lib/finance/random'
import type { HeightGrid } from '@/lib/world/grid'
import { NOISE_GLSL } from './glsl'

const RADIUS = 38

/** One clump: five curved, tapered blades of height 1. */
function clump() {
  return mergeGeometries(
    [0, 1.26, 2.51, 3.77, 5.03].map((rot, k) => {
      const levels = 4
      const pos: number[] = []
      for (let i = 0; i < levels; i++) {
        const t = i / (levels - 1)
        const w = 0.045 * (1 - t) + 0.003
        const bend = t * t * 0.22
        pos.push(-w, t, bend, w, t, bend)
      }
      const idx: number[] = []
      for (let i = 0; i < levels - 1; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
      g.setIndex(idx)
      g.rotateY(rot)
      g.translate(Math.cos(rot * 3) * 0.08 * (k % 3), 0, Math.sin(rot * 3) * 0.08 * (k % 3))
      return g.toNonIndexed()
    }),
  )
}

const HEIGHT_FN = `
float groundAt(vec2 xz){
  vec2 g = clamp((xz / uMapSize + 0.5) * (uGridN - 1.0), vec2(0.0), vec2(uGridN - 1.001));
  vec2 i = floor(g); vec2 f = g - i;
  float a = texture2D(uGround, (i + 0.5) / uGridN).r;
  float b = texture2D(uGround, (i + vec2(1.5, 0.5)) / uGridN).r;
  float c = texture2D(uGround, (i + vec2(0.5, 1.5)) / uGridN).r;
  float d = texture2D(uGround, (i + 1.5) / uGridN).r;
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}`

export interface GrassFieldProps {
  grid: HeightGrid
  mask: Uint8Array
  maskRes: number
  pathMask: Uint8Array
  pathRes: number
  count: number
  base: string
  tip: string
  dry: string
  height: number
  wind: number
}

/**
 * Dense grass that follows the camera: instances are anchored in world space on a wrapping tile around the
 * viewer, lifted onto the terrain in the vertex shader and masked away from water, paths and buildings.
 */
export function GrassField(p: GrassFieldProps) {
  const geometry = useMemo(() => {
    const g = new THREE.InstancedBufferGeometry()
    const base = clump()
    g.setAttribute('position', base.getAttribute('position'))
    const up = new Float32Array(base.getAttribute('position').count * 3)
    for (let i = 1; i < up.length; i += 3) up[i] = 1
    g.setAttribute('normal', new THREE.BufferAttribute(up, 3))
    const rand = mulberry32(77)
    const inst = new Float32Array(p.count * 3)
    for (let i = 0; i < p.count; i++) inst.set([rand(), rand(), rand()], i * 3)
    g.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 3))
    g.instanceCount = p.count
    return g
  }, [p.count])
  const uniforms = useMemo(() => {
    const tex = (data: Uint8Array | Float32Array, n: number, float: boolean) => {
      const t = new THREE.DataTexture(data, n, n, THREE.RedFormat, float ? THREE.FloatType : THREE.UnsignedByteType)
      t.magFilter = float ? THREE.NearestFilter : THREE.LinearFilter
      t.minFilter = float ? THREE.NearestFilter : THREE.LinearFilter
      t.needsUpdate = true
      return t
    }
    const lin = (h: string) => new THREE.Color(h).convertSRGBToLinear()
    return {
      uTime: { value: 0 }, uWind: { value: 0.3 }, uR: { value: RADIUS }, uH: { value: p.height },
      uGround: { value: tex(p.grid.heights, p.grid.n, true) }, uGridN: { value: p.grid.n }, uMapSize: { value: p.grid.size },
      uMask: { value: tex(p.mask, p.maskRes, false) }, uPath: { value: tex(p.pathMask, p.pathRes, false) },
      uBase: { value: lin(p.base) }, uTip: { value: lin(p.tip) }, uDry: { value: lin(p.dry) },
    }
  }, [p.grid, p.mask, p.maskRes, p.pathMask, p.pathRes, p.height, p.base, p.tip, p.dry])
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 1, envMapIntensity: 0.35 })
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms)
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
           attribute vec3 aInst;
           uniform float uTime; uniform float uWind; uniform float uR; uniform float uH;
           uniform sampler2D uGround; uniform float uGridN; uniform float uMapSize; uniform sampler2D uMask; uniform sampler2D uPath;
           varying float vH; varying float vDry;
           ${NOISE_GLSL}
           ${HEIGHT_FN}`,
        )
        .replace(
          '#include <begin_vertex>',
          `float span = uR * 2.0;
           vec2 origin = cameraPosition.xz - uR;
           vec2 wxz = origin + mod(aInst.xy * span - origin, span);
           vec2 uv = wxz / uMapSize + 0.5;
           float grow = texture2D(uMask, uv).r * (1.0 - smoothstep(0.2, 0.6, texture2D(uPath, uv).r));
           float dist = distance(cameraPosition, vec3(wxz.x, groundAt(wxz), wxz.y));
           float fade = 1.0 - smoothstep(uR * 0.55, uR * 0.95, dist);
           float patchy = 0.55 + 0.9 * fbm3(wxz * 0.12);
           float hgt = uH * (0.55 + aInst.z * 0.8) * patchy * grow * fade;
           vH = position.y;
           vDry = smoothstep(0.62, 0.8, fbm3(wxz * 0.035 + 7.0));
           float a = aInst.z * 37.0;
           vec3 local = vec3(position.x * cos(a) - position.z * sin(a), position.y * hgt, position.x * sin(a) + position.z * cos(a));
           float gust = sin(uTime * 1.6 + wxz.x * 0.17 + wxz.y * 0.11) * 0.7 + sin(uTime * 3.4 + wxz.x * 0.9) * 0.2;
           local.x += gust * uWind * position.y * position.y * hgt * 0.5;
           local.z += gust * uWind * position.y * position.y * hgt * 0.25;
           vec3 transformed = local + vec3(wxz.x, groundAt(wxz) - 0.04, wxz.y);`,
        )
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uBase; uniform vec3 uTip; uniform vec3 uDry; varying float vH; varying float vDry;')
        .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = mix(mix(uBase, uTip, vH), uDry * mix(0.7, 1.05, vH), vDry * 0.7) * mix(0.55, 1.0, vH);')
        .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);')
    }
    return m
  }, [uniforms])
  useEffect(() => {
    uniforms.uWind.value = 0.25 + p.wind * 1.3
  }, [p.wind, uniforms])
  useFrame((_, dt) => {
    uniforms.uTime.value += dt
  })
  if (p.count === 0) return null
  return <mesh geometry={geometry} material={material} frustumCulled={false} receiveShadow />
}
