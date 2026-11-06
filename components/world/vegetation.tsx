'use client'

import { useFrame } from '@react-three/fiber'
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { ModelAsset } from '@/lib/content/schema/assets'
import { isTreeKind, type TreeKind } from '@/lib/registry/keys'
import type { Scatter } from '@/lib/world/layout'
import type { Plant } from '@/lib/world/plants'
import { modelParts, useModel } from './assets/use-model'
import { TREE_LODS, treeGeometry, withSway } from './tree-geometry'

/** Tree kind → models that draw it (assets.yaml vegetation). */
export type SpeciesModels = ReadonlyMap<string, ModelAsset[]>

const swayTime = { value: 0 }
const swayWind = { value: 0.3 }
const BARK = new THREE.Color('#6a5038').convertSRGBToLinear()

/** Distance (m) up to which each LOD is used, and beyond which instances are not drawn at all. */
const LOD_RANGE = [75, 230, 950]
const REBUCKET_MS = 450
const MOVE_EPS2 = 36

interface Item { position: [number, number, number]; scale: number; rotation: number }
/** One mesh of a level: tinted parts take the per-instance colour (leaves), the rest keep their own (bark). */
interface Part { geometry: THREE.BufferGeometry; material: THREE.Material; tinted: boolean; shadow: boolean }

/**
 * Instances of one plant shape with distance-based level of detail: every instance is assigned to the near/mid/far
 * level by its distance to the camera (re-bucketed every ~0.45 s when the camera moved). Each level is a list of
 * parts (trunk, crown…), so triangle count and shadow casters stay bounded no matter how many plants exist.
 */
function Instanced({ levels, items, color }: { levels: Part[][]; items: Item[]; color: (i: number) => THREE.Color }) {
  const meshes = useRef<(THREE.InstancedMesh | null)[][]>([])
  const last = useRef({ x: Infinity, z: Infinity, t: 0 })
  // Matrices and colours are computed once; bucketing only copies them into the per-level instance buffers.
  const data = useMemo(() => {
    const d = new THREE.Object3D()
    const m = new Float32Array(items.length * 16)
    const c = new Float32Array(items.length * 3)
    items.forEach((it, i) => {
      d.position.set(...it.position)
      d.rotation.set(0, it.rotation, 0)
      d.scale.setScalar(it.scale)
      d.updateMatrix()
      d.matrix.toArray(m, i * 16)
      const col = color(i)
      c.set([col.r, col.g, col.b], i * 3)
    })
    return { m, c }
  }, [items, color])

  const bucket = (cx: number, cz: number) => {
    const n = levels.length
    const counts = new Array<number>(n).fill(0)
    const level = new Int8Array(items.length)
    items.forEach((it, i) => {
      const dx = it.position[0] - cx
      const dz = it.position[2] - cz
      const d2 = dx * dx + dz * dz
      let l = -1
      for (let k = 0; k < n; k++) if (d2 < LOD_RANGE[k]! ** 2) { l = k; break }
      level[i] = l
      if (l >= 0) counts[l]!++
    })
    const cursor = new Array<number>(n).fill(0)
    for (let i = 0; i < items.length; i++) {
      const l = level[i]!
      if (l < 0) continue
      const at = cursor[l]!++
      for (const set of meshes.current[l] ?? []) {
        if (!set) continue
        ;(set.instanceMatrix.array as Float32Array).set(data.m.subarray(i * 16, i * 16 + 16), at * 16)
        if (set.instanceColor) (set.instanceColor.array as Float32Array).set(data.c.subarray(i * 3, i * 3 + 3), at * 3)
      }
    }
    for (let l = 0; l < n; l++) {
      for (const set of meshes.current[l] ?? []) {
        if (!set) continue
        set.count = counts[l]!
        set.instanceMatrix.needsUpdate = true
        if (set.instanceColor) set.instanceColor.needsUpdate = true
        set.boundingSphere = null
      }
    }
  }

  useLayoutEffect(() => {
    // New items: force a re-bucket on the next frame; tinted parts need a colour buffer.
    last.current = { x: Infinity, z: Infinity, t: 0 }
    levels.forEach((parts, l) =>
      parts.forEach((p, k) => {
        const set = meshes.current[l]?.[k]
        if (set && p.tinted && !set.instanceColor) set.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(items.length * 3), 3)
      }),
    )
  }, [items, levels])

  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime * 1000
    if (t - last.current.t < REBUCKET_MS) return
    const dx = camera.position.x - last.current.x
    const dz = camera.position.z - last.current.z
    if (dx * dx + dz * dz < MOVE_EPS2 && last.current.t !== 0) return
    last.current = { x: camera.position.x, z: camera.position.z, t }
    bucket(camera.position.x, camera.position.z)
  })

  if (items.length === 0) return null
  return (
    <group>
      {levels.map((parts, l) => (
        <group key={l}>
          {parts.map((p, k) => (
            <instancedMesh
              key={k}
              ref={(el) => {
                ;(meshes.current[l] ??= [])[k] = el
              }}
              args={[p.geometry, p.material, items.length]}
              count={0}
              castShadow={p.shadow}
              receiveShadow={l < 2}
              frustumCulled={false}
            />
          ))}
        </group>
      ))}
    </group>
  )
}

/** A procedural species (bamboo, banana, areca… — kinds without a model): trunk + crown per level of detail. */
function ProceduralSpecies({ kind, items, color }: { kind: TreeKind; items: Item[]; color: (i: number) => THREE.Color }) {
  const still = kind === 'rock'
  const fronds = kind === 'palm' || kind === 'areca' || kind === 'banana'
  const levels = useMemo(() => {
    const crownMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: still ? 0.95 : 0.9, envMapIntensity: 0.5, side: fronds ? THREE.DoubleSide : THREE.FrontSide })
    const crown = still ? crownMat : withSway(crownMat, swayTime, swayWind, 9, 0.3)
    const trunk = withSway(new THREE.MeshStandardMaterial({ color: BARK, roughness: 0.95 }), swayTime, swayWind, 14)
    return Array.from({ length: TREE_LODS }, (_, l) => {
      const g = treeGeometry(kind, l)
      const parts: Part[] = []
      if (!still && l < 2) parts.push({ geometry: g.trunk, material: trunk, tinted: false, shadow: l === 0 })
      parts.push({ geometry: g.crown, material: crown, tinted: true, shadow: l < 2 })
      return parts
    })
  }, [kind, still, fronds])
  return <Instanced levels={levels} items={items} color={color} />
}

/** A species drawn with glTF models (assets.yaml vegetation): items are shared out between the listed models. */
function ModelSpecies({ models, items, color, still }: { models: ModelAsset[]; items: Item[]; color: (i: number) => THREE.Color; still: boolean }) {
  // Stable per-model item lists and colour functions, so instances are not rebuilt on every render.
  const split = useMemo(
    () => models.map((m, k) => ({ m, own: items.filter((_, i) => i % models.length === k), paint: (i: number) => color(i * models.length + k) })),
    [models, items, color],
  )
  return (
    <>
      {split.map(({ m, own, paint }) => (
        <Suspense key={m.id} fallback={null}>
          <OneModel model={m} items={own} color={paint} still={still} />
        </Suspense>
      ))}
    </>
  )
}

function OneModel({ model, items, color, still }: { model: ModelAsset; items: Item[]; color: (i: number) => THREE.Color; still: boolean }) {
  const { scene } = useModel(model)
  const levels = useMemo(() => {
    const parts = modelParts(scene, model).map((p) => {
      const base = p.paint ? new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, envMapIntensity: 0.5, flatShading: true }) : p.material.clone()
      if (!p.paint) {
        base.color.multiplyScalar(0.75)
        base.flatShading = true
      }
      const material = still ? base : withSway(base, swayTime, swayWind, model.size.metres, p.paint ? 0.25 : 0)
      return { geometry: p.geometry, material, tinted: p.paint }
    })
    return [parts.map((p) => ({ ...p, shadow: true })), parts.map((p) => ({ ...p, shadow: true })), parts.map((p) => ({ ...p, shadow: false }))]
  }, [scene, model, still])
  return <Instanced levels={levels} items={items} color={color} />
}

/** Model-backed kinds come from assets.yaml; every other kind keeps its procedural shape. */
function Species({ kind, items, color, models }: { kind: TreeKind; items: Item[]; color: (i: number) => THREE.Color; models: ModelAsset[] | undefined }) {
  if (models?.length) return <ModelSpecies models={models} items={items} color={color} still={kind === 'rock'} />
  return <ProceduralSpecies kind={kind} items={items} color={color} />
}

/** Scattered trees, shrubs and rocks by species (data: map.yaml vegetation); everything sways with the wind. */
export function Vegetation({ trees, shrubs, wind, leaves, density, models }: { trees: Scatter[]; shrubs: Scatter[]; wind: number; leaves: Record<string, string[]>; density: number; models: SpeciesModels }) {
  useEffect(() => {
    swayWind.value = 0.12 + wind * 1.3
  }, [wind])
  useFrame((_, dt) => {
    swayTime.value += dt
  })
  const byKind = useMemo(() => {
    const out = new Map<TreeKind, Scatter[]>()
    const all = [...trees, ...shrubs]
    all.forEach((t, i) => {
      // Deterministic thinning for lower quality presets.
      const keep = ((i * 2654435761) >>> 0) % 1000 < density * 1000
      if (!isTreeKind(t.kind) || !keep) return
      out.set(t.kind, [...(out.get(t.kind) ?? []), t])
    })
    return out
  }, [trees, shrubs, density])
  const palettes = useMemo(() => {
    const p = new Map<string, THREE.Color[]>()
    for (const [k, list] of Object.entries(leaves)) p.set(k, list.map((c) => new THREE.Color(c).convertSRGBToLinear()))
    return p
  }, [leaves])
  const colorFns = useMemo(() => {
    const m = new Map<TreeKind, (i: number) => THREE.Color>()
    for (const k of byKind.keys()) {
      const pal = palettes.get(k) ?? [new THREE.Color(0.3, 0.5, 0.2)]
      m.set(k, (i) => pal[(i * 7) % pal.length]!)
    }
    return m
  }, [byKind, palettes])
  return (
    <>
      {[...byKind.entries()].map(([k, items]) => (
        <Species key={k} kind={k} items={items} color={colorFns.get(k)!} models={models.get(k)} />
      ))}
    </>
  )
}

/** Your forest: one tree per focus segment; withered ones are grey-brown and bare-looking. */
export function FocusForest({ plants, models }: { plants: Plant[]; models: SpeciesModels }) {
  const pines = useMemo(() => plants.filter((p) => p.kind === 'pine').map((p) => ({ ...p, rotation: p.minutes })), [plants])
  const broad = useMemo(() => plants.filter((p) => p.kind === 'broadleaf').map((p) => ({ ...p, rotation: p.minutes })), [plants])
  const green = useMemo(() => new THREE.Color('#4f9a3e').convertSRGBToLinear(), [])
  const dead = useMemo(() => new THREE.Color('#8a7556').convertSRGBToLinear(), [])
  const paintPines = useMemo(() => (i: number) => (pines[i]?.withered ? dead : green), [pines, green, dead])
  const paintBroad = useMemo(() => (i: number) => (broad[i]?.withered ? dead : green), [broad, green, dead])
  return (
    <>
      <Species kind="pine" items={pines} color={paintPines} models={models.get('pine')} />
      <Species kind="broadleaf" items={broad} color={paintBroad} models={models.get('broadleaf')} />
    </>
  )
}
