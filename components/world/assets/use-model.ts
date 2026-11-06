'use client'

import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { ModelAsset } from '@/lib/content/schema/assets'

/** Models are served from public/models (CC0, see NOTICE.txt there); meshopt-compressed, decoded in-browser. */
export const modelUrl = (m: ModelAsset) => `/models/${m.file}`

const scales = new WeakMap<THREE.Object3D, number>()

/** Scale that makes the model's height (or length) match its real size in metres. */
export function realScale(scene: THREE.Object3D, m: ModelAsset): number {
  const cached = scales.get(scene)
  if (cached !== undefined) return cached
  scene.updateMatrixWorld(true)
  const size = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3())
  const dim = m.size.axis === 'height' ? size.y : Math.max(size.x, size.z)
  const s = dim > 1e-6 ? m.size.metres / dim : 1
  scales.set(scene, s)
  return s
}

/** Unlit (KHR_materials_unlit) materials ignore the sun; the village needs everything lit and shadowed. */
export function litMaterial(src: THREE.Material): THREE.MeshStandardMaterial {
  if (src instanceof THREE.MeshStandardMaterial) {
    src.envMapIntensity = 0.6
    return src
  }
  const b = src as THREE.MeshBasicMaterial
  return new THREE.MeshStandardMaterial({ color: b.color?.clone() ?? new THREE.Color(1, 1, 1), map: b.map ?? null, roughness: 0.85, metalness: 0, transparent: b.transparent, alphaTest: b.alphaTest, side: b.side })
}

/** Loads one model (suspends until ready). */
export function useModel(m: ModelAsset) {
  const gltf = useGLTF(modelUrl(m), false, true)
  return { scene: gltf.scene, animations: gltf.animations, scale: realScale(gltf.scene, m) }
}

/** Starts downloading models before they are needed (e.g. the player and villagers). */
export function preloadModels(models: readonly ModelAsset[]) {
  for (const m of models) useGLTF.preload(modelUrl(m), false, true)
}

/** Geometry of every mesh in a model, in metres, with its (lit) material — the input for instancing. */
export interface ModelPart { geometry: THREE.BufferGeometry; material: THREE.MeshStandardMaterial; paint: boolean }

export function modelParts(scene: THREE.Object3D, m: ModelAsset): ModelPart[] {
  const scale = realScale(scene, m)
  scene.updateMatrixWorld(true)
  const root = new THREE.Matrix4().makeScale(scale, scale, scale)
  const parts: ModelPart[] = []
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    const geometry = toFloat(mesh.geometry).applyMatrix4(new THREE.Matrix4().multiplyMatrices(root, mesh.matrixWorld))
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    const material = litMaterial(mats[0]!)
    parts.push({ geometry, material, paint: m.paint.includes(mats[0]!.name) })
  })
  return parts
}

/** Quantised (int16 / int8 normalised) attributes cannot be transformed in place: copy them to float. */
function toFloat(src: THREE.BufferGeometry): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry()
  for (const [name, attr] of Object.entries(src.attributes)) {
    const a = attr as THREE.BufferAttribute
    const out = new Float32Array(a.count * a.itemSize)
    for (let i = 0; i < a.count; i++) for (let k = 0; k < a.itemSize; k++) out[i * a.itemSize + k] = a.getComponent(i, k)
    g.setAttribute(name, new THREE.BufferAttribute(out, a.itemSize))
  }
  if (src.index) g.setIndex(Array.from(src.index.array))
  if (!g.attributes.normal) g.computeVertexNormals()
  return g
}
