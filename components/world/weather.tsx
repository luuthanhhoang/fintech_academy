'use client'

import { Cloud, Clouds } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Weather } from '@/lib/content/schema/world'
import { mulberry32 } from '@/lib/finance/random'
import { lightningFlash } from './fx-state'
import { useCloudTexture } from './hdri'

const BOX = { x: 90, y: 50, z: 90 }

function Rain({ intensity, wind }: { intensity: number; wind: number }) {
  const count = Math.round(6000 * intensity)
  const ref = useRef<THREE.LineSegments>(null)
  const geometry = useMemo(() => {
    const rand = mulberry32(3)
    const pos = new Float32Array(count * 6)
    for (let i = 0; i < count; i++) {
      const x = (rand() - 0.5) * BOX.x
      const y = rand() * BOX.y
      const z = (rand() - 0.5) * BOX.z
      pos.set([x, y, z, x, y - 0.9, z], i * 6)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [count])
  useFrame(({ camera }, dt) => {
    const seg = ref.current
    if (!seg) return
    seg.position.set(camera.position.x, camera.position.y - BOX.y / 2, camera.position.z)
    const a = geometry.attributes.position as THREE.BufferAttribute
    const arr = a.array as Float32Array
    const fall = 32 * dt
    const drift = wind * 6 * dt
    for (let i = 0; i < count; i++) {
      const o = i * 6
      let y = arr[o + 1]! - fall
      let x = arr[o]! + drift
      if (y < 0) y += BOX.y
      if (x > BOX.x / 2) x -= BOX.x
      arr[o] = x
      arr[o + 1] = y
      arr[o + 3] = x - wind * 0.35
      arr[o + 4] = y - 0.9
    }
    a.needsUpdate = true
  })
  if (count === 0) return null
  return (
    <lineSegments ref={ref} geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial color="#aebfcf" transparent opacity={0.45} />
    </lineSegments>
  )
}

function flakeTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 32
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 32, 32)
  return new THREE.CanvasTexture(c)
}

function Snow({ intensity, wind }: { intensity: number; wind: number }) {
  const count = Math.round(5000 * intensity)
  const ref = useRef<THREE.Points>(null)
  const flake = useMemo(() => flakeTexture(), [])
  const geometry = useMemo(() => {
    const rand = mulberry32(5)
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) pos.set([(rand() - 0.5) * BOX.x, rand() * BOX.y, (rand() - 0.5) * BOX.z], i * 3)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [count])
  useFrame(({ camera, clock }, dt) => {
    const p = ref.current
    if (!p) return
    p.position.set(camera.position.x, camera.position.y - BOX.y / 2, camera.position.z)
    const a = geometry.attributes.position as THREE.BufferAttribute
    const arr = a.array as Float32Array
    for (let i = 0; i < count; i++) {
      const o = i * 3
      arr[o + 1] = arr[o + 1]! - 1.6 * dt
      arr[o] = arr[o]! + (Math.sin(clock.elapsedTime + i) * 0.6 + wind * 3) * dt
      if (arr[o + 1]! < 0) arr[o + 1] = BOX.y
      if (arr[o]! > BOX.x / 2) arr[o] = arr[o]! - BOX.x
    }
    a.needsUpdate = true
  })
  if (count === 0) return null
  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <pointsMaterial map={flake} color="#ffffff" size={0.14} transparent opacity={0.95} depthWrite={false} />
    </points>
  )
}

/**
 * Volumetric-looking clouds (drei <Clouds/>, CC0 cloud sprite) lit by the scene, so sunsets colour them.
 * Count comes from the quality preset; cover and darkness from the weather.
 */
function VolumeClouds({ cover, wind, daylight, size, max }: { cover: number; wind: number; daylight: number; size: number; max: number }) {
  const texture = useCloudTexture()
  const group = useRef<THREE.Group>(null)
  const seeds = useMemo(() => {
    const rand = mulberry32(11)
    return Array.from({ length: max }, (_, i) => ({ x: (rand() - 0.5) * size * 1.8, y: 150 + rand() * 80, z: (rand() - 0.5) * size * 1.8, seed: i + 1, vol: 30 + rand() * 30 }))
  }, [max, size])
  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    g.position.x = (g.position.x + wind * 6 * dt + size) % (size * 2) - size
  })
  const n = Math.round(max * Math.min(1, 0.25 + cover))
  if (!texture || n === 0) return null
  const grey = 1 - cover * 0.55
  const tone = new THREE.Color().setScalar(Math.max(0.25, grey * (0.4 + 0.6 * daylight)))
  return (
    <group ref={group}>
      <Clouds texture={texture} material={THREE.MeshLambertMaterial} limit={max * 40} frustumCulled={false}>
        {seeds.slice(0, n).map((c) => (
          <Cloud key={c.seed} seed={c.seed} position={[c.x, c.y, c.z]} bounds={[70, 12, 40]} segments={22} volume={c.vol} smallestVolume={0.4} growth={6} speed={0.05} fade={400} opacity={0.85} color={tone} />
        ))}
      </Clouds>
    </group>
  )
}

function boltGeometry(rand: () => number, x: number, z: number, groundY: number) {
  const pts: number[] = []
  let px = x
  let pz = z
  let py = 240
  while (py > groundY) {
    const nx = px + (rand() - 0.5) * 18
    const nz = pz + (rand() - 0.5) * 18
    const ny = py - 10 - rand() * 18
    pts.push(px, py, pz, nx, Math.max(groundY, ny), nz)
    ;[px, py, pz] = [nx, ny, nz]
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  return g
}

/** Lightning: random strikes at the preset rate (per minute) near the camera; reports distance for thunder. */
function Lightning({ rate, onStrike }: { rate: number; onStrike: (distance: number) => void }) {
  const ref = useRef<THREE.LineSegments>(null)
  const life = useRef(0)
  const rand = useMemo(() => mulberry32(Math.round(rate * 1000) + 17), [rate])
  useEffect(() => () => void (lightningFlash.value = 0), [])
  useFrame(({ camera }, dt) => {
    const bolt = ref.current
    if (!bolt) return
    life.current -= dt
    lightningFlash.value = Math.max(0, life.current * 4) * (rand() > 0.3 ? 1 : 0.4)
    bolt.visible = life.current > 0
    if (life.current <= 0 && rand() < (rate / 60) * dt) {
      const d = 0.15 + rand() * 0.85
      const a = rand() * Math.PI * 2
      const x = camera.position.x + Math.cos(a) * d * 700
      const z = camera.position.z + Math.sin(a) * d * 700
      bolt.geometry.dispose()
      bolt.geometry = boltGeometry(rand, x, z, 0)
      life.current = 0.25
      onStrike(d)
    }
  })
  return (
    <lineSegments ref={ref} visible={false} frustumCulled={false}>
      <bufferGeometry />
      <lineBasicMaterial color="#e8f0ff" fog={false} />
    </lineSegments>
  )
}

const rainbowFrag = `varying vec2 vUv; uniform float uOpacity;
vec3 hue(float h){ return clamp(abs(mod(h*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0); }
void main(){ float b = smoothstep(0.0,0.25,vUv.y)*smoothstep(0.75,0.5,vUv.y); vec3 c = hue(0.8 - vUv.y*1.1);
gl_FragColor = vec4(c, b * uOpacity); }`
const rainbowVert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`

/** A rainbow arc standing opposite the sun (as real rainbows do). */
function Rainbow({ sunDir }: { sunDir: [number, number, number] }) {
  const uniforms = useMemo(() => ({ uOpacity: { value: 0.45 } }), [])
  const angle = Math.atan2(sunDir[0], sunDir[2])
  return (
    <group rotation-y={angle}>
      <mesh position={[0, -40, -900]}>
        <torusGeometry args={[420, 16, 8, 96, Math.PI]} />
        <shaderMaterial uniforms={uniforms} vertexShader={rainbowVert} fragmentShader={rainbowFrag} transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </mesh>
    </group>
  )
}

export function WeatherFx({ weather, daylight, sunDir, size, clouds, onStrike }: { weather: Weather; daylight: number; sunDir: [number, number, number]; size: number; clouds: number; onStrike: (d: number) => void }) {
  return (
    <>
      <Rain intensity={weather.rain} wind={weather.wind} />
      <Snow intensity={weather.snow} wind={weather.wind} />
      <VolumeClouds cover={weather.clouds} wind={weather.wind} daylight={daylight} size={size} max={clouds} />
      {weather.lightning > 0 && <Lightning rate={weather.lightning} onStrike={onStrike} />}
      {weather.rainbow && daylight > 0.3 && <Rainbow sunDir={sunDir} />}
    </>
  )
}
