/** Procedural low-poly vegetation geometries (vertex-coloured, merged so each kind is one instanced mesh). */
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

function colored(g: THREE.BufferGeometry, hex: string, at: [number, number, number], rot: [number, number, number] = [0, 0, 0]) {
  const geo = g.index ? g.toNonIndexed() : g
  geo.rotateX(rot[0])
  geo.rotateY(rot[1])
  geo.rotateZ(rot[2])
  geo.translate(...at)
  const c = new THREE.Color(hex)
  const n = geo.attributes.position!.count
  const colors = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) colors.set([c.r, c.g, c.b], i * 3)
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.deleteAttribute('uv')
  return geo
}

const merge = (parts: THREE.BufferGeometry[]) => {
  const g = mergeGeometries(parts)
  g.computeVertexNormals()
  return g
}

export type TreeKind = 'pine' | 'broadleaf' | 'palm' | 'bamboo' | 'shrub'

export function treeGeometry(kind: TreeKind, leaf = '#ffffff', bark = '#6b4a2f'): THREE.BufferGeometry {
  switch (kind) {
    case 'pine':
      return merge([
        colored(new THREE.CylinderGeometry(0.25, 0.4, 3, 6), bark, [0, 1.5, 0]),
        colored(new THREE.ConeGeometry(2.6, 4.2, 7), leaf, [0, 4.4, 0]),
        colored(new THREE.ConeGeometry(2.0, 3.6, 7), leaf, [0, 6.4, 0]),
        colored(new THREE.ConeGeometry(1.3, 3, 7), leaf, [0, 8.2, 0]),
      ])
    case 'broadleaf':
      return merge([
        colored(new THREE.CylinderGeometry(0.3, 0.45, 3.4, 6), bark, [0, 1.7, 0]),
        colored(new THREE.IcosahedronGeometry(2.6, 1), leaf, [0, 5, 0]),
        colored(new THREE.IcosahedronGeometry(1.9, 1), leaf, [1.4, 4.3, 0.6]),
        colored(new THREE.IcosahedronGeometry(1.7, 1), leaf, [-1.2, 4.6, -0.8]),
      ])
    case 'palm': {
      const parts = [0, 1, 2, 3].map((i) => colored(new THREE.CylinderGeometry(0.22, 0.3, 2.2, 6), bark, [i * 0.25, 1.1 + i * 2.1, 0], [0, 0, -0.08 * i]))
      for (let k = 0; k < 7; k++) parts.push(colored(new THREE.ConeGeometry(0.5, 4.2, 3), leaf, [1 + Math.cos((k / 7) * Math.PI * 2) * 1.6, 8.6, Math.sin((k / 7) * Math.PI * 2) * 1.6], [Math.PI / 2.4, (k / 7) * Math.PI * 2, 0]))
      return merge(parts)
    }
    case 'bamboo': {
      const parts: THREE.BufferGeometry[] = []
      for (let k = 0; k < 6; k++) {
        const a = k * 1.05
        const h = 6 + (k % 3)
        parts.push(colored(new THREE.CylinderGeometry(0.09, 0.12, h, 5), '#8aa04a', [Math.cos(a) * 0.6, h / 2, Math.sin(a) * 0.6]))
        parts.push(colored(new THREE.IcosahedronGeometry(0.9, 0), leaf, [Math.cos(a) * 0.9, h, Math.sin(a) * 0.9]))
      }
      return merge(parts)
    }
    case 'shrub':
      return merge([colored(new THREE.IcosahedronGeometry(1, 1), leaf, [0, 0.7, 0]), colored(new THREE.IcosahedronGeometry(0.7, 1), leaf, [0.7, 0.5, 0.3])])
  }
}

/** Adds wind sway to a standard material: displacement grows with height and the wind uniform. */
export function withSway(material: THREE.MeshStandardMaterial, time: { value: number }, wind: { value: number }) {
  material.onBeforeCompile = (shader) => {
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
         float k = pow(max(position.y, 0.0) / 9.0, 2.0) * uWind;
         transformed.x += sin(uTime * 1.7 + ip.x * 0.13 + ip.z * 0.07) * k * 0.9;
         transformed.z += cos(uTime * 1.3 + ip.z * 0.11) * k * 0.5;`,
      )
  }
  return material
}
