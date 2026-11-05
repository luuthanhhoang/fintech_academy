/** Minimal dense matrix helpers for small portfolio problems. */
export type Matrix = number[][]
export type Vector = number[]

export function matVec(m: Matrix, v: Vector): Vector {
  return m.map((row) => row.reduce((acc, x, j) => acc + x * (v[j] as number), 0))
}

export function dot(a: Vector, b: Vector): number {
  return a.reduce((acc, x, i) => acc + x * (b[i] as number), 0)
}

/** Gauss–Jordan inverse with partial pivoting. Returns null for singular matrices. */
export function invert(m: Matrix): Matrix | null {
  const n = m.length
  const a = m.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))])
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) if (Math.abs(a[r]![col]!) > Math.abs(a[pivot]![col]!)) pivot = r
    if (Math.abs(a[pivot]![col]!) < 1e-14) return null
    ;[a[col], a[pivot]] = [a[pivot]!, a[col]!]
    const pv = a[col]![col]!
    for (let j = 0; j < 2 * n; j++) a[col]![j]! /= pv
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = a[r]![col]!
      for (let j = 0; j < 2 * n; j++) a[r]![j]! -= f * a[col]![j]!
    }
  }
  return a.map((row) => row.slice(n))
}

/** Cholesky decomposition (lower triangular). Returns null if not positive definite. */
export function cholesky(m: Matrix): Matrix | null {
  const n = m.length
  const L: Matrix = Array.from({ length: n }, () => Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = m[i]![j]!
      for (let k = 0; k < j; k++) sum -= L[i]![k]! * L[j]![k]!
      if (i === j) {
        if (sum <= 0) return null
        L[i]![j] = Math.sqrt(sum)
      } else L[i]![j] = sum / L[j]![j]!
    }
  }
  return L
}
