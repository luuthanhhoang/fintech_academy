import * as THREE from 'three'
import { NOISE_GLSL } from './glsl'

export interface TerrainUniforms {
  uPath: { value: THREE.Texture | null }
  uMapSize: { value: number }
  uWet: { value: number }
  uDry: { value: THREE.Color }
  uDirt: { value: THREE.Color }
}

/**
 * Standard PBR terrain with world-space detail: colour variation and dry patches, footpaths from a mask texture,
 * a procedural bump for micro relief, and wetness (darker, glossier) when it rains.
 */
export function makeTerrainMaterial(u: TerrainUniforms) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 })
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;')
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vWPos; uniform sampler2D uPath; uniform float uMapSize; uniform float uWet; uniform vec3 uDry; uniform vec3 uDirt;
         ${NOISE_GLSL}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         vec2 wp = vWPos.xz;
         float big = fbm3(wp * 0.012);
         float mid = fbm3(wp * 0.09);
         float fine = vnoise(wp * 1.3);
         vec3 c = diffuseColor.rgb * (0.82 + 0.28 * big + 0.12 * mid + 0.06 * fine);
         float green = clamp((c.g - max(c.r, c.b)) * 6.0, 0.0, 1.0);
         c = mix(c, uDry * (0.85 + 0.2 * mid), green * smoothstep(0.58, 0.8, big) * 0.55);
         float path = texture2D(uPath, wp / uMapSize + 0.5).r;
         c = mix(c, uDirt * (0.8 + 0.3 * mid + 0.1 * fine), smoothstep(0.2, 0.8, path) * 0.75);
         c *= 1.0 - uWet * 0.32;
         diffuseColor.rgb = c;`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
         roughnessFactor = mix(roughnessFactor, 0.32, uWet * 0.75);`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
         {
           float hb = vnoise(vWPos.xz * 0.45) * 0.6 + vnoise(vWPos.xz * 1.9) * 0.25;
           vec3 dpdx = dFdx(-vViewPosition); vec3 dpdy = dFdy(-vViewPosition);
           float dhx = dFdx(hb); float dhy = dFdy(hb);
           vec3 r1 = cross(dpdy, normal); vec3 r2 = cross(normal, dpdx);
           float det = dot(dpdx, r1);
           vec3 grad = sign(det) * (dhx * r1 + dhy * r2);
           normal = normalize(abs(det) * normal - grad * 0.12);
         }`,
      )
  }
  return m
}
