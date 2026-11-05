/**
 * Vietnamese rural house parts, grouped by material and merged so every house is a handful of instances:
 * plaster (walls + gables), tiles (curved-end roof + porch roof + ridge), wood (columns, door, frames, porch floor),
 * brick (plinth + front yard), glass (windows). The house faces +z.
 */
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const HOUSE = { w: 7.2, d: 5.2, h: 3.1, roof: 2.4, overhang: 0.7 }

function box(w: number, h: number, d: number, x: number, y: number, z: number, uvScale = 1) {
  const g = new THREE.BoxGeometry(w, h, d)
  const uv = g.attributes.uv as THREE.BufferAttribute
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.max(w, d) / (3 * uvScale), uv.getY(i) * h / (3 * uvScale))
  g.translate(x, y, z)
  return g.index ? g.toNonIndexed() : g
}

/** One roof slope with tile UVs and upturned ends (the curled corners typical of village roofs). */
function slope(w: number, run: number, rise: number, side: 1 | -1, curl: number) {
  const segX = 14
  const segS = 5
  const g = new THREE.PlaneGeometry(w, Math.hypot(run, rise), segX, segS)
  const p = g.attributes.position as THREE.BufferAttribute
  const uv = g.attributes.uv as THREE.BufferAttribute
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const s = (p.getY(i) + Math.hypot(run, rise) / 2) / Math.hypot(run, rise)
    const end = Math.pow(Math.abs(x) / (w / 2), 6)
    const y = rise * (1 - s) + curl * end * (0.4 + 0.6 * s) + Math.sin(s * Math.PI) * -0.08
    p.setXYZ(i, x, y, side * run * s)
    uv.setXY(i, (x + w / 2) / 1.6, s * Math.hypot(run, rise) / 1.2)
  }
  g.computeVertexNormals()
  return g.index ? g.toNonIndexed() : g
}

function gable(w: number, d: number, rise: number, x: number, base: number) {
  const shape = new THREE.Shape([new THREE.Vector2(-d / 2, 0), new THREE.Vector2(d / 2, 0), new THREE.Vector2(0, rise)])
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false })
  g.rotateY(Math.PI / 2)
  g.translate(x - 0.1, base, 0)
  g.deleteAttribute('uv')
  const uv = new Float32Array((g.attributes.position as THREE.BufferAttribute).count * 2)
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return g.index ? g.toNonIndexed() : g
}

export function houseParts() {
  const { w, d, h, roof, overhang } = HOUSE
  const run = d / 2 + overhang
  const front = d / 2
  const porch = 1.8
  const plaster = mergeGeometries([box(w, h, d, 0, 0.45 + h / 2, 0), gable(w, d, roof * 0.78, -w / 2 + 0.15, 0.45 + h), gable(w, d, roof * 0.78, w / 2 - 0.05, 0.45 + h)])
  const tiles = mergeGeometries([
    ...[1, -1].map((side) => {
      const s = slope(w + overhang * 2, run, roof, side as 1 | -1, 0.55)
      s.translate(0, 0.45 + h - overhang * (roof / run) * 0.6, 0)
      return s
    }),
    (() => {
      const s = slope(w * 0.9, porch + 0.4, 0.8, 1, 0.25)
      s.translate(0, 0.45 + h - 0.35, front)
      return s
    })(),
    box(w + overhang * 2.2, 0.22, 0.34, 0, 0.45 + h + roof + 0.05, 0),
  ])
  const columns = [-w * 0.42, -w * 0.14, w * 0.14, w * 0.42].map((x) => {
    const c = new THREE.CylinderGeometry(0.12, 0.14, h - 0.3, 8)
    c.translate(x, 0.45 + (h - 0.3) / 2, front + porch)
    return c.index ? c.toNonIndexed() : c
  })
  const wood = mergeGeometries([
    ...columns,
    box(1.2, 2.1, 0.12, 0, 0.45 + 1.05, front + 0.03),
    ...[-2.2, 2.2].map((x) => box(1.3, 1.2, 0.14, x, 0.45 + 1.75, front + 0.02)),
    box(w * 0.92, 0.18, porch + 0.2, 0, 0.5, front + porch / 2),
  ])
  const brick = mergeGeometries([box(w + 0.5, 0.45, d + 0.5, 0, 0.22, 0), box(w * 1.1, 0.08, 4.2, 0, 0.04, front + porch + 2.4)])
  const glass = mergeGeometries([-2.2, 2.2].map((x) => box(1.0, 0.9, 0.05, x, 0.45 + 1.75, front + 0.1)))
  return { plaster, tiles, wood, brick, glass }
}
