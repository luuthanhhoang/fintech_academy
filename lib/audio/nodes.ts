/** Small Web Audio helpers shared by instruments and ambience. */

const noiseCache = new WeakMap<BaseAudioContext, Record<string, AudioBuffer>>()

/** Looping noise buffers: white, pink (−3 dB/oct) or brown (−6 dB/oct). */
export function noiseBuffer(ctx: BaseAudioContext, color: 'white' | 'pink' | 'brown'): AudioBuffer {
  const cache = noiseCache.get(ctx) ?? {}
  const hit = cache[color]
  if (hit) return hit
  const len = ctx.sampleRate * 4
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  let b0 = 0, b1 = 0, b2 = 0, last = 0
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1
    if (color === 'white') data[i] = w * 0.5
    else if (color === 'pink') {
      b0 = 0.99765 * b0 + w * 0.099046
      b1 = 0.963 * b1 + w * 0.2965164
      b2 = 0.57 * b2 + w * 1.0526913
      data[i] = (b0 + b1 + b2 + w * 0.1848) * 0.12
    } else {
      last = (last + 0.02 * w) / 1.02
      data[i] = last * 3.2
    }
  }
  noiseCache.set(ctx, { ...cache, [color]: buf })
  return buf
}

export function noiseSource(ctx: BaseAudioContext, color: 'white' | 'pink' | 'brown'): AudioBufferSourceNode {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx, color)
  src.loop = true
  src.loopStart = Math.random() * 3
  return src
}

export function filter(ctx: BaseAudioContext, type: BiquadFilterType, frequency: number, q = 0.7): BiquadFilterNode {
  const f = ctx.createBiquadFilter()
  f.type = type
  f.frequency.value = frequency
  f.Q.value = q
  return f
}

export function gain(ctx: BaseAudioContext, value: number): GainNode {
  const g = ctx.createGain()
  g.gain.value = value
  return g
}

/** Low-frequency oscillator modulating an AudioParam around its current value. */
export function lfo(ctx: BaseAudioContext, target: AudioParam, rate: number, depth: number): OscillatorNode {
  const osc = ctx.createOscillator()
  osc.frequency.value = rate
  const g = gain(ctx, depth)
  osc.connect(g).connect(target)
  osc.start()
  return osc
}

/** Attack/decay envelope on a gain param. */
export function envelope(param: AudioParam, t: number, peak: number, attack: number, release: number) {
  param.cancelScheduledValues(t)
  param.setValueAtTime(0.0001, t)
  param.linearRampToValueAtTime(peak, t + attack)
  param.exponentialRampToValueAtTime(0.0001, t + attack + release)
}

export function chain(...nodes: AudioNode[]): AudioNode {
  for (let i = 0; i < nodes.length - 1; i++) nodes[i]!.connect(nodes[i + 1]!)
  return nodes[nodes.length - 1]!
}
