'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mulberry32 } from '@/lib/finance/random'
import { isHdriKey } from '@/lib/registry/keys'
import type { BlendedLook } from '@/lib/world/looks'
import { lightningFlash } from './fx-state'
import { useHdri } from './hdri'

export interface SkyState {
  sunDir: [number, number, number]
  sunElevation: number
  moonDir: [number, number, number]
  daylight: number
  clouds: number
  fog: number
  look: BlendedLook
}

/** Look colours are authored as sRGB hex; convert to the linear working space. */
const srgb = (c: readonly [number, number, number], into = new THREE.Color()) => into.setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace)

const skyVertex = `varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`
const skyFragment = `
uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uGround; uniform vec3 uSun; uniform vec3 uSunDir;
uniform float uOvercast; uniform float uFlash;
varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 sky = mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.5));
  sky = mix(sky, uGround, smoothstep(0.0, -0.25, h));
  vec3 sd = normalize(uSunDir);
  float s = max(dot(d, sd), 0.0);
  float clear = 1.0 - uOvercast;
  // Forward scattering: broad glow near the sun, stronger close to the horizon at sunrise/sunset.
  float horizonBoost = 1.0 + 2.5 * (1.0 - smoothstep(0.0, 0.35, abs(sd.y)));
  sky += uSun * (pow(s, 6.0) * 0.22 * horizonBoost + pow(s, 64.0) * 0.5) * clear;
  sky += uSun * smoothstep(0.9994, 0.9997, s) * 12.0 * clear * step(-0.02, sd.y);
  float grey = dot(sky, vec3(0.299, 0.587, 0.114));
  sky = mix(sky, vec3(grey) * vec3(0.92, 0.95, 1.0), uOvercast * 0.75);
  sky += vec3(0.75, 0.8, 1.0) * uFlash;
  gl_FragColor = vec4(sky, 1.0);
}`

function SkyDome({ look, sunDir, overcast }: { look: BlendedLook; sunDir: [number, number, number]; overcast: number }) {
  const uniforms = useMemo(
    () => ({
      uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uGround: { value: new THREE.Color() },
      uSun: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3() }, uOvercast: { value: 0 }, uFlash: { value: 0 },
    }),
    [],
  )
  useEffect(() => {
    srgb(look.zenith, uniforms.uZenith.value)
    srgb(look.horizon, uniforms.uHorizon.value)
    srgb(look.ground, uniforms.uGround.value)
    srgb(look.sun, uniforms.uSun.value)
    uniforms.uSunDir.value.set(...sunDir)
    uniforms.uOvercast.value = overcast
  }, [look, sunDir, overcast, uniforms])
  useFrame(({ camera }) => {
    uniforms.uFlash.value = lightningFlash.value * 0.6
    dome.current?.position.copy(camera.position)
  })
  const dome = useRef<THREE.Mesh>(null)
  return (
    <mesh ref={dome} scale={5000} frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[1, 48, 24]} />
      <shaderMaterial uniforms={uniforms} vertexShader={skyVertex} fragmentShader={skyFragment} side={THREE.BackSide} depthWrite={false} fog={false} />
    </mesh>
  )
}

const starVertex = `attribute float aSeed; uniform float uTime; varying float vTw;
void main(){ vTw = 0.6 + 0.4 * sin(uTime * (1.5 + aSeed * 3.0) + aSeed * 40.0); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; gl_PointSize = 1.0 + aSeed * 2.2; }`
const starFragment = `uniform float uOpacity; varying float vTw; void main(){ vec2 c = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.0, length(c)); gl_FragColor = vec4(vec3(1.0, 0.97, 0.92), a * vTw * uOpacity); }`

function Stars({ opacity }: { opacity: number }) {
  const ref = useRef<THREE.Points>(null)
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uOpacity: { value: 0 } }), [])
  const geometry = useMemo(() => {
    const rand = mulberry32(7)
    const n = 3200
    const pos = new Float32Array(n * 3)
    const seed = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      // Denser band to suggest the Milky Way.
      const band = rand() < 0.45
      const a = rand() * Math.PI * 2
      const u = band ? (rand() - 0.5) * 0.25 + Math.sin(a) * 0.35 : rand() * 2 - 1
      const r = Math.sqrt(Math.max(0, 1 - u * u))
      pos.set([Math.cos(a) * r * 4000, Math.abs(u) * 4000 + 40, Math.sin(a) * r * 4000], i * 3)
      seed[i] = rand() ** 3
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    return g
  }, [])
  useFrame(({ camera, clock }) => {
    uniforms.uTime.value = clock.elapsedTime
    uniforms.uOpacity.value = opacity
    ref.current?.position.copy(camera.position)
  })
  if (opacity < 0.02) return null
  return (
    <points ref={ref} geometry={geometry} frustumCulled={false} renderOrder={-1}>
      <shaderMaterial uniforms={uniforms} vertexShader={starVertex} fragmentShader={starFragment} transparent depthWrite={false} fog={false} />
    </points>
  )
}

const moonVertex = `varying vec3 vN; void main(){ vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position,1.0); }`
const moonFragment = `uniform vec3 uSun; varying vec3 vN; void main(){ float l = max(dot(vN, normalize(uSun)), 0.0); vec3 c = vec3(1.0,0.97,0.9) * (0.03 + l * 2.2); gl_FragColor = vec4(c, 1.0); }`

/** Moon lit from the real sun direction, so its visible phase matches the date (bright enough to bloom). */
function Moon({ dir, sunDir }: { dir: [number, number, number]; sunDir: [number, number, number] }) {
  const group = useRef<THREE.Group>(null)
  const uniforms = useMemo(() => ({ uSun: { value: new THREE.Vector3() } }), [])
  useEffect(() => {
    uniforms.uSun.value.set(...sunDir)
  }, [sunDir, uniforms])
  useFrame(({ camera }) => group.current?.position.copy(camera.position))
  if (dir[1] < -0.05) return null
  return (
    <group ref={group}>
      <mesh position={[dir[0] * 3000, dir[1] * 3000, dir[2] * 3000]}>
        <sphereGeometry args={[55, 32, 16]} />
        <shaderMaterial uniforms={uniforms} vertexShader={moonVertex} fragmentShader={moonFragment} fog={false} />
      </mesh>
    </group>
  )
}

/** Image-based lighting from a CC0 HDRI (lighting and reflections only; the sky is our own shader). */
function Environment({ look }: { look: BlendedLook }) {
  const { scene, gl } = useThree()
  const key = isHdriKey(look.dominant.hdri) ? look.dominant.hdri : 'park'
  const tex = useHdri(key)
  useEffect(() => {
    if (tex) scene.environment = tex
  }, [tex, scene])
  useEffect(() => {
    scene.environmentIntensity = look.envIntensity
    gl.toneMappingExposure = look.exposure
  }, [look, scene, gl])
  return null
}

/** Sky, stars, moon, sun/moon lights, IBL and fog — driven by the real clock, the art-direction looks and the weather. */
export function SkyAndLight({ sky, shadowMapSize }: { sky: SkyState; shadowMapSize: number }) {
  const { scene } = useThree()
  const sun = useRef<THREE.DirectionalLight>(null)
  const flashLight = useRef<THREE.AmbientLight>(null)
  const { sunDir, moonDir, daylight, clouds, fog, look } = sky
  const overcast = Math.min(0.9, clouds * 0.85)
  useEffect(() => {
    const c = srgb(look.fog)
    const grey = c.r * 0.3 + c.g * 0.59 + c.b * 0.11
    c.lerp(new THREE.Color(grey, grey, grey * 1.04), overcast * 0.6)
    scene.fog = new THREE.FogExp2(c, 0.00045 + fog * 0.0045 + overcast * 0.0006)
  }, [scene, look, fog, overcast])
  useFrame(({ camera }) => {
    if (flashLight.current) flashLight.current.intensity = lightningFlash.value * 4
    const l = sun.current
    if (!l) return
    const src = sunDir[1] > -0.02 ? sunDir : moonDir
    l.target.position.set(camera.position.x, 0, camera.position.z)
    l.position.set(camera.position.x + src[0] * 500, Math.max(40, src[1] * 500), camera.position.z + src[2] * 500)
    l.target.updateMatrixWorld()
  })
  const night = sunDir[1] <= -0.02
  return (
    <>
      <Environment look={look} />
      <SkyDome look={look} sunDir={sunDir} overcast={overcast} />
      <Stars opacity={(1 - daylight) * (1 - overcast)} />
      <Moon dir={moonDir} sunDir={sunDir} />
      <directionalLight
        ref={sun}
        castShadow
        intensity={(night ? look.sunIntensity : look.sunIntensity * Math.max(0.15, daylight)) * (1 - overcast * 0.7)}
        color={srgb(look.sun)}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-left={-170}
        shadow-camera-right={170}
        shadow-camera-top={170}
        shadow-camera-bottom={-170}
        shadow-camera-far={1400}
        shadow-bias={-0.0003}
        shadow-normalBias={0.04}
      />
      <hemisphereLight args={[srgb(look.horizon), srgb(look.ground), 0.45 + overcast * 0.35]} />
      <ambientLight ref={flashLight} intensity={0} color="#dfe8ff" />
    </>
  )
}
