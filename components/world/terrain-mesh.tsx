'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { groundColor, groundPalette } from '@/lib/world/colors'
import { createNoise } from '@/lib/world/noise'
import type { Terrain } from '@/lib/world/terrain'

/** Height-field mesh with per-vertex colours (sand, grass by region, mud, rock, snow). */
export function TerrainMesh({ terrain }: { terrain: Terrain }) {
  const geometry = useMemo(() => {
    const { size, resolution } = terrain.map
    const g = new THREE.PlaneGeometry(size, size, resolution, resolution)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position as THREE.BufferAttribute
    const colors = new Float32Array(pos.count * 3)
    const palette = groundPalette(terrain.map)
    const jitter = createNoise(terrain.map.seed + 99)
    for (let i = 0; i < pos.count; i++) pos.setY(i, terrain.height(pos.getX(i), pos.getZ(i)))
    g.computeVertexNormals()
    const normal = g.attributes.normal as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const ny = Math.max(0.05, normal.getY(i))
      const slope = Math.sqrt(1 - ny * ny) / ny
      colors.set(groundColor(terrain.map, palette, pos.getY(i), slope, terrain.regionWeights(x, z), jitter(x / 9, z / 9)), i * 3)
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return g
  }, [terrain])
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.95} metalness={0} />
    </mesh>
  )
}
