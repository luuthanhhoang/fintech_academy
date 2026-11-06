/**
 * Queueing formulas for capacity planning (pure). M/M/c with Poisson arrivals (rate λ) and exponential service
 * (rate μ per server); c = 1 gives M/M/1. Times are in seconds.
 */

export interface QueueStats {
  /** Utilisation per server ρ = λ / (c μ). */
  rho: number
  stable: boolean
  /** Probability an arriving request has to wait (Erlang C; equals ρ for c = 1). */
  pWait: number
  /** Mean time waiting in queue. */
  wq: number
  /** Mean time in system (wait + service). */
  w: number
  /** Mean number in system, by Little's law L = λW. */
  l: number
  /** 99th percentile of the time spent waiting in queue. */
  p99Wait: number
}

/** Erlang C: probability of waiting in an M/M/c queue with offered load a = λ/μ. */
export function erlangC(c: number, a: number): number {
  const rho = a / c
  if (rho >= 1) return 1
  let term = 1
  let sum = 1
  for (let k = 1; k < c; k++) {
    term *= a / k
    sum += term
  }
  const top = (term * a) / c / (1 - rho)
  return top / (sum + top)
}

export function mmc(lambda: number, mu: number, c = 1): QueueStats {
  const rho = lambda / (c * mu)
  if (!(rho < 1) || lambda <= 0 || mu <= 0) {
    return { rho, stable: lambda <= 0, pWait: lambda <= 0 ? 0 : 1, wq: lambda <= 0 ? 0 : Infinity, w: lambda <= 0 ? 1 / mu : Infinity, l: lambda <= 0 ? 0 : Infinity, p99Wait: lambda <= 0 ? 0 : Infinity }
  }
  const pWait = erlangC(c, lambda / mu)
  const drain = c * mu - lambda
  const wq = pWait / drain
  const w = wq + 1 / mu
  // P(Wq > t) = C·e^(−(cμ−λ)t)  ⇒  t₉₉ = ln(C / 0.01) / (cμ − λ) when C > 1%.
  const p99Wait = pWait <= 0.01 ? 0 : Math.log(pWait / 0.01) / drain
  return { rho, stable: true, pWait, wq, w, l: lambda * w, p99Wait }
}

/** M/M/1 response time is exponential with rate μ − λ, so its p-quantile is −ln(1 − p)/(μ − λ). */
export function mm1ResponsePercentile(lambda: number, mu: number, p: number): number {
  return lambda >= mu ? Infinity : -Math.log(1 - p) / (mu - lambda)
}

/** Mean and p99 waiting time across utilisation levels, for a fixed service time and server count. */
export function utilisationCurve(mu: number, c: number, from = 0.05, to = 0.97, steps = 40) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const rho = from + ((to - from) * i) / steps
    const s = mmc(rho * c * mu, mu, c)
    return { rho, w: s.w, p99Wait: s.p99Wait }
  })
}
