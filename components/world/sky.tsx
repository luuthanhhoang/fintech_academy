'use client'

import { Sky as SkyShader } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mulberry32 } from '@/lib/finance/random'
import { lightningFlash } from './fx-state'

export interface SkyState {
  sunDir: [number, number, number]
  sunElevation: number
  moonDir: [number, number, number]
  daylight: number
  clouds: number
  fog: number
}

const DAY_FOG = new THREE.Color('#c9d6df')
const NIGHT_FOG = new THREE.Color('#0d1424')
const OVERCAST = new THREE.Color('#8a949c')

function Stars({ opacity }: { opacity: number }) {
  const geometry = useMemo(() => {
    const rand = mulberry32(7)
    const pos = new Float32Array(2400 * 3)
    for (let i = 0; i < 2400; i++) {
      const u = rand() * 2 - 1
      const a = rand() * Math.PI * 2
      const r = Math.sqrt(1 - u * u)
      pos.set([Math.cos(a) * r * 1500, Math.abs(u) * 1500, Math.sin(a) * r * 1500], i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])
  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial color="#ffffff" size={1.6} sizeAttenuation={false} transparent opacity={opacity} depthWrite={false} fog={false} />
    </points>
  )
}

const moonVertex = `varying vec3 vN; void main(){ vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position,1.0); }`
const moonFragment = `uniform vec3 uSun; varying vec3 vN; void main(){ float l = max(dot(vN, normalize(uSun)), 0.0); vec3 c = vec3(0.93,0.92,0.86) * (0.04 + l); gl_FragColor = vec4(c, 1.0); }`

/** Moon lit from the real sun direction, so its visible phase matches the date. */
function Moon({ dir, sunDir }: { dir: [number, number, number]; sunDir: [number, number, number] }) {
  const uniforms = useMemo(() => ({ uSun: { value: new THREE.Vector3() } }), [])
  useEffect(() => {
    uniforms.uSun.value.set(...sunDir)
  }, [sunDir, uniforms])
  if (dir[1] < -0.05) return null
  return (
    <mesh position={[dir[0] * 1400, dir[1] * 1400, dir[2] * 1400]}>
      <sphereGeometry args={[34, 32, 16]} />
      <shaderMaterial uniforms={uniforms} vertexShader={moonVertex} fragmentShader={moonFragment} fog={false} />
    </mesh>
  )
}

/** Sky dome, stars, moon, sun/moon lights and fog — all driven by the real clock and the weather. */
export function SkyAndLight({ sky }: { sky: SkyState }) {
  const { scene } = useThree()
  const sun = useRef<THREE.DirectionalLight>(null)
  const flashLight = useRef<THREE.AmbientLight>(null)
  const { sunDir, moonDir, daylight, clouds, fog } = sky
  const overcast = Math.min(0.85, clouds * 0.8)
  useEffect(() => {
    const c = NIGHT_FOG.clone().lerp(DAY_FOG, daylight).lerp(OVERCAST.clone().multiplyScalar(0.3 + daylight * 0.7), overcast * 0.6)
    scene.fog = new THREE.Fog(c, 60 + (1 - fog) * 200, 2600 - fog * 2100)
  }, [scene, daylight, fog, overcast])
  useFrame(({ camera }) => {
    if (flashLight.current) flashLight.current.intensity = 0.06 + lightningFlash.value * 3
    const l = sun.current
    if (!l) return
    l.target.position.set(camera.position.x, 0, camera.position.z)
    l.position.set(camera.position.x + sunDir[0] * 400, Math.max(30, sunDir[1] * 400), camera.position.z + sunDir[2] * 400)
    l.target.updateMatrixWorld()
  })
  const warm = new THREE.Color('#ffb070').lerp(new THREE.Color('#fff6e8'), Math.min(1, Math.max(0, sky.sunElevation * 4)))
  return (
    <>
      <SkyShader distance={4500} sunPosition={sunDir} turbidity={4 + clouds * 8} rayleigh={0.6 + (1 - daylight) * 2} mieCoefficient={0.005} mieDirectionalG={0.8} />
      <mesh scale={4000}>
        <sphereGeometry args={[1, 24, 12]} />
        <meshBasicMaterial color={OVERCAST.clone().multiplyScalar(0.25 + daylight * 0.75)} transparent opacity={overcast} side={THREE.BackSide} fog={false} depthWrite={false} />
      </mesh>
      <Stars opacity={(1 - daylight) * (1 - overcast)} />
      <Moon dir={moonDir} sunDir={sunDir} />
      <directionalLight
        ref={sun}
        castShadow
        intensity={daylight * (1 - overcast * 0.65) * 2.4}
        color={warm}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-160}
        shadow-camera-right={160}
        shadow-camera-top={160}
        shadow-camera-bottom={-160}
        shadow-camera-far={1200}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[moonDir[0] * 400, Math.max(40, moonDir[1] * 400), moonDir[2] * 400]} intensity={(1 - daylight) * 0.35} color="#9fb4ff" />
      <hemisphereLight args={['#bcd3ff', '#4a5a3a', 0.25 + daylight * 0.55]} />
      <ambientLight ref={flashLight} intensity={0.06} color="#dfe8ff" />
    </>
  )
}
