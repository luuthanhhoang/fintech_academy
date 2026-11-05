'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { groundColor, groundPalette } from '@/lib/world/colors'
import type { HeightGrid } from '@/lib/world/grid'
import { createNoise } from '@/lib/world/noise'
import type { Terrain } from '@/lib/world/terrain'
import { makeTerrainMaterial } from './terrain-material'

/** Height-field mesh built from the shared grid, coloured per vertex and detailed in the shader. */
export function TerrainMesh({ terrain, grid, pathMask, pathRes, wet }: { terrain: Terrain; grid: HeightGrid; pathMask: Uint8Array; pathRes: number; wet: number }) {
  const geometry = useMemo(() => {
    const { size, resolution } = terrain.map
    const g = new THREE.PlaneGeometry(size, size, resolution, resolution)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position as THREE.BufferAttribute
    // PlaneGeometry rotated -90° about x lays rows from z = -size/2 to +size/2, matching the grid's row order.
    for (let i = 0; i < pos.count; i++) pos.setY(i, grid.heights[i]!)
    g.computeVertexNormals()
    const normal = g.attributes.normal as THREE.BufferAttribute
    const colors = new Float32Array(pos.count * 3)
    const palette = groundPalette(terrain.map)
    const jitter = createNoise(terrain.map.seed + 99)
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const ny = Math.max(0.05, normal.getY(i))
      const slope = Math.sqrt(1 - ny * ny) / ny
      const c = groundColor(terrain.map, palette, pos.getY(i), slope, terrain.regionWeights(x, z), jitter(x / 9, z / 9))
      const lin = new THREE.Color().setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace)
      colors.set([lin.r, lin.g, lin.b], i * 3)
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return g
  }, [terrain, grid])
  const uniforms = useMemo(() => {
    const tex = new THREE.DataTexture(pathMask, pathRes, pathRes, THREE.RedFormat, THREE.UnsignedByteType)
    tex.magFilter = THREE.LinearFilter
    tex.minFilter = THREE.LinearFilter
    tex.needsUpdate = true
    return {
      uPath: { value: tex as THREE.Texture | null }, uMapSize: { value: terrain.map.size }, uWet: { value: 0 },
      uDry: { value: new THREE.Color('#b9a45a').convertSRGBToLinear() }, uDirt: { value: new THREE.Color('#8a6f4e').convertSRGBToLinear() },
    }
  }, [pathMask, pathRes, terrain])
  const material = useMemo(() => makeTerrainMaterial(uniforms), [uniforms])
  useEffect(() => {
    uniforms.uWet.value = wet
  }, [wet, uniforms])
  return <mesh geometry={geometry} material={material} receiveShadow />
}
