import * as THREE from 'three'

/** Shared clock uniform for every water surface (updated once per frame by <WaterClock/>). */
export const waterTime = { value: 0 }

/**
 * Standard PBR material with Gerstner-like sine waves added in the vertex shader (so lighting and fog still
 * work). Geometry must already be in world orientation (y up).
 */
export function makeWaterMaterial(opts: { color: string; amplitude: number; scale: number; opacity?: number }) {
  const amp = { value: opts.amplitude }
  const m = new THREE.MeshStandardMaterial({
    color: opts.color, roughness: 0.18, metalness: 0.05, transparent: opts.opacity !== undefined, opacity: opts.opacity ?? 1,
  })
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = waterTime
    shader.uniforms.uAmp = amp
    const waves = `
      uniform float uTime; uniform float uAmp;
      float wv(vec2 p) {
        float s = ${opts.scale.toFixed(4)};
        return uAmp * (sin(dot(p, vec2(0.8, 0.6)) * s + uTime * 1.1) * 0.5
          + sin(dot(p, vec2(-0.4, 0.9)) * s * 1.7 + uTime * 1.7) * 0.3
          + sin(dot(p, vec2(0.95, -0.3)) * s * 3.1 + uTime * 2.3) * 0.2);
      }`
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${waves}`)
      .replace(
        '#include <beginnormal_vertex>',
        `vec4 wp0 = modelMatrix * vec4(position, 1.0);
         float e = 0.6;
         float hx = wv(wp0.xz + vec2(e, 0.0)) - wv(wp0.xz - vec2(e, 0.0));
         float hz = wv(wp0.xz + vec2(0.0, e)) - wv(wp0.xz - vec2(0.0, e));
         vec3 objectNormal = normalize(vec3(-hx / (2.0 * e), 1.0, -hz / (2.0 * e)));
         #ifdef USE_TANGENT
         vec3 objectTangent = vec3(tangent.xyz);
         #endif`,
      )
      .replace('#include <begin_vertex>', 'vec3 transformed = vec3(position); transformed.y += wv(wp0.xz);')
  }
  return { material: m, amplitude: amp }
}
