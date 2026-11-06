/**
 * Procedural vegetation: each kind has a trunk geometry and a crown geometry (instanced separately so bark is not
 * tinted by leaf colour). Crowns are noise-displaced and carry baked ambient occlusion in vertex colours.
 */
import * as THREE from 'three'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { TreeKind } from '@/lib/registry/keys'
import { createNoise } from '@/lib/world/noise'

const noise = createNoise(4242)
type G = THREE.BufferGeometry

function clean(g: G): G {
  const out = g.index ? g.toNonIndexed() : g
  out.deleteAttribute('uv')
  return out
}

function at(g: G, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, s: [number, number, number] = [1, 1, 1]): G {
  g.scale(...s)
  g.rotateX(rx)
  g.rotateY(ry)
  g.rotateZ(rz)
  g.translate(x, y, z)
  return clean(g)
}

/** Lumpy blob: icosphere displaced along its normal by noise. */
/** Detail levels dropped for the level being built (0 = nearest/most detailed). */
let detailDrop = 0

function blob(r: number, detail: number, amp: number, seed: number): G {
  const raw = new THREE.IcosahedronGeometry(r, Math.max(0, detail - detailDrop))
  raw.deleteAttribute('normal')
  raw.deleteAttribute('uv')
  // Weld vertices so displacement keeps the surface closed and normals come out smooth.
  const g = mergeVertices(raw)
  const p = g.attributes.position as THREE.BufferAttribute
  const v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    const n = noise(v.x * 0.9 + seed, v.y * 0.9 + v.z * 0.7) * 0.7 + noise(v.x * 2.3 - seed, v.z * 2.3 + v.y) * 0.3
    v.multiplyScalar(1 + n * amp)
    p.setXYZ(i, v.x, v.y, v.z)
  }
  g.computeVertexNormals()
  return g
}

/** Bakes ambient occlusion: darker low and inside the crown, lighter on top and outside. */
function bakeAO(g: G, warmTop = true): G {
  g.computeBoundingBox()
  const box = g.boundingBox!
  const c = box.getCenter(new THREE.Vector3())
  const p = g.attributes.position as THREE.BufferAttribute
  const n = g.attributes.normal as THREE.BufferAttribute
  const col = new Float32Array(p.count * 3)
  const v = new THREE.Vector3()
  const nn = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    nn.fromBufferAttribute(n, i)
    const t = (v.y - box.min.y) / Math.max(0.001, box.max.y - box.min.y)
    const out = Math.max(0, nn.dot(v.clone().sub(c).normalize()))
    const ao = 0.55 + 0.35 * t + 0.2 * out
    col.set(warmTop ? [ao * (1 + t * 0.08), ao, ao * (1 - t * 0.12)] : [ao, ao, ao], i * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return g
}

function trunk(h: number, r0: number, r1: number, lean = 0): G {
  return at(new THREE.CylinderGeometry(r1, r0, h, 7, 4), 0, h / 2, 0, 0, 0, lean)
}

/** A frond: a strip that arches out and droops, used for palms, areca and banana leaves. */
function frond(length: number, width: number, droop: number, segs = 8): G {
  const g = new THREE.PlaneGeometry(width, length, 2, segs)
  const p = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) + length / 2
    const t = y / length
    const x = p.getX(i) * (1 - t * 0.7)
    p.setXYZ(i, x, Math.sin(t * 1.4) * length * 0.35 - droop * t * t * length, y * 0.9 + Math.abs(x) * -0.25)
  }
  g.computeVertexNormals()
  return g
}

function radial(make: (i: number) => G, count: number, y: number, tilt = 0): G[] {
  return Array.from({ length: count }, (_, i) => at(make(i), 0, y, 0, tilt, (i / count) * Math.PI * 2 + i * 0.3))
}

const build: Record<TreeKind, () => { trunk: G; crown: G }> = {
  broadleaf: () => ({
    trunk: mergeGeometries([trunk(4.2, 0.42, 0.24), at(new THREE.CylinderGeometry(0.1, 0.18, 2.4, 5), 0.7, 4.1, 0, 0, 0, -0.7), at(new THREE.CylinderGeometry(0.1, 0.16, 2.2, 5), -0.6, 4.3, 0.3, 0.3, 0, 0.8)]),
    crown: bakeAO(mergeGeometries([[0, 6.2, 0, 2.6], [1.7, 5.4, 0.6, 2], [-1.6, 5.6, -0.7, 2.1], [0.4, 5.2, -1.7, 1.8], [-0.5, 5.0, 1.6, 1.8], [0.2, 7.4, 0.3, 1.6]].map(([x, y, z, r], i) => at(blob(r!, 2, 0.28, i * 3.1), x!, y!, z!)))),
  }),
  flowering: () => ({
    trunk: mergeGeometries([trunk(3.6, 0.38, 0.22), at(new THREE.CylinderGeometry(0.09, 0.15, 3, 5), 1, 3.8, 0, 0, 0, -1), at(new THREE.CylinderGeometry(0.09, 0.15, 3, 5), -1, 3.8, 0, 0, 0, 1)]),
    crown: bakeAO(mergeGeometries([[0, 5, 0, 2.6], [2.2, 4.6, 0.4, 2], [-2.2, 4.7, -0.3, 2.1], [0.3, 4.6, 2, 1.9], [-0.3, 4.7, -2, 1.9]].map(([x, y, z, r], i) => at(blob(r!, 2, 0.32, i * 5.7), x!, y!, z!, 0, 0, 0, [1.15, 0.6, 1.15])))),
  }),
  pine: () => ({
    trunk: trunk(7, 0.38, 0.12),
    crown: bakeAO(mergeGeometries(Array.from({ length: 7 }, (_, i) => {
      const r = 3 - i * 0.38
      const cone = new THREE.ConeGeometry(r, 2.6, 10, 2, true)
      const p = cone.attributes.position as THREE.BufferAttribute
      for (let k = 0; k < p.count; k++) {
        const x = p.getX(k)
        const z = p.getZ(k)
        const j = 1 + noise(x * 2 + i, z * 2) * 0.22
        p.setXYZ(k, x * j, p.getY(k) - (Math.hypot(x, z) / r) * 0.5, z * j)
      }
      cone.computeVertexNormals()
      return at(cone, 0, 3 + i * 1.15, 0, 0, i * 0.7)
    }))),
  }),
  palm: () => {
    const segs = Array.from({ length: 8 }, (_, i) => at(new THREE.CylinderGeometry(0.2 - i * 0.008, 0.24 - i * 0.008, 1.3, 7), Math.pow(i / 8, 2) * 1.6, 0.65 + i * 1.2, 0, 0, 0, -0.06 - i * 0.025))
    return { trunk: mergeGeometries(segs), crown: bakeAO(mergeGeometries([...radial(() => frond(4.6, 1, 0.9), 11, 0), at(blob(0.45, 1, 0.1, 2), 0, -0.4, 0)].map((g) => at(g, 1.6, 9.8, 0))), false) }
  },
  areca: () => ({
    trunk: trunk(8.5, 0.16, 0.12),
    crown: bakeAO(mergeGeometries(radial(() => frond(3, 0.7, 0.6), 8, 0).map((g) => at(g, 0, 8.5, 0))), false),
  }),
  banana: () => ({
    trunk: mergeGeometries([trunk(2.2, 0.26, 0.2), at(new THREE.CylinderGeometry(0.15, 0.22, 1.8, 6), 0.6, 0.9, 0.3, 0, 0, -0.15)]),
    crown: bakeAO(mergeGeometries(radial(() => frond(3.2, 1.25, 0.8, 6), 7, 0).map((g) => at(g, 0, 2.1, 0))), false),
  }),
  bamboo: () => {
    const culms: G[] = []
    const leaves: G[] = []
    for (let i = 0; i < 12; i++) {
      const a = i * 2.4
      const h = 7 + (i % 4) * 1.1
      const lean = 0.08 + (i % 3) * 0.05
      culms.push(at(new THREE.CylinderGeometry(0.06, 0.08, h, 5, 6), Math.cos(a) * 0.5, h / 2, Math.sin(a) * 0.5, Math.sin(a) * lean, 0, -Math.cos(a) * lean))
      leaves.push(at(blob(0.9, 1, 0.45, i), Math.cos(a) * (0.5 + h * lean), h * 0.95, Math.sin(a) * (0.5 + h * lean), 0, 0, 0, [1.3, 0.55, 1.3]))
      leaves.push(at(blob(0.7, 1, 0.45, i + 50), Math.cos(a) * (0.5 + h * lean * 0.7), h * 0.72, Math.sin(a) * (0.5 + h * lean * 0.7), 0, 0, 0, [1.2, 0.5, 1.2]))
    }
    return { trunk: mergeGeometries(culms), crown: bakeAO(mergeGeometries(leaves)) }
  },
  shrub: () => ({
    trunk: trunk(0.4, 0.08, 0.05),
    crown: bakeAO(mergeGeometries([at(blob(1, 2, 0.3, 1), 0, 0.8, 0), at(blob(0.75, 2, 0.3, 2), 0.8, 0.55, 0.3), at(blob(0.7, 2, 0.3, 3), -0.6, 0.5, -0.4)])),
  }),
  rock: () => ({
    trunk: trunk(0.05, 0.01, 0.01),
    crown: bakeAO(at(blob(1.2, 2, 0.35, 9), 0, 0.3, 0, 0, 0, 0, [1.3, 0.7, 1]), false),
  }),
}

const cache = new Map<string, { trunk: G; crown: G }>()

/** Number of level-of-detail steps: 0 = full, 1 = one subdivision less, 2 = lowest. */
export const TREE_LODS = 3

export function treeGeometry(kind: TreeKind, lod = 0): { trunk: G; crown: G } {
  const key = `${kind}:${lod}`
  const hit = cache.get(key)
  if (hit) return hit
  detailDrop = lod
  const g = build[kind]()
  detailDrop = 0
  cache.set(key, g)
  return g
}

/** Adds wind sway to a standard material: displacement grows with height and the wind uniform. */
export function withSway(material: THREE.MeshStandardMaterial, time: { value: number }, wind: { value: number }, height = 9, translucency = 0) {
  material.customProgramCacheKey = () => `sway-${height}-${translucency}`
  material.onBeforeCompile = (shader) => {
    // Foliage lets light through: a little self-lit diffuse keeps shadowed crowns from going black.
    if (translucency > 0) {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         totalEmissiveRadiance += diffuseColor.rgb * ${translucency.toFixed(2)};`,
      )
    }
    shader.uniforms.uTime = time
    shader.uniforms.uWind = wind
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uWind;')
      .replace(
        '#include <begin_vertex>',
        `vec3 transformed = vec3(position);
         #ifdef USE_INSTANCING
         vec3 ip = instanceMatrix[3].xyz;
         #else
         vec3 ip = vec3(0.0);
         #endif
         float k = pow(max(position.y, 0.0) / ${height.toFixed(1)}, 2.0) * uWind;
         transformed.x += (sin(uTime * 1.6 + ip.x * 0.13 + ip.z * 0.07) + 0.35 * sin(uTime * 4.1 + position.y)) * k * 0.7;
         transformed.z += cos(uTime * 1.25 + ip.z * 0.11) * k * 0.4;`,
      )
  }
  return material
}
