import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      'max-lines': ['error', { max: 500, skipBlankLines: false, skipComments: false }],
    },
  },
  {
    // three.js scene objects (geometries, materials, uniforms) are imperative and are mutated per frame inside
    // useFrame — the standard react-three-fiber pattern. The React-compiler immutability rules do not apply there.
    files: ['components/world/**/*.{ts,tsx}'],
    rules: { 'react-hooks/immutability': 'off' },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', '.generated/**', 'public/**']),
])
