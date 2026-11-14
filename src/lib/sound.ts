/*
 * All sounds are synthesised with Web Audio — no audio files to ship or lose.
 *  gong()    – start of the discussion minute
 *  warning() – 10 seconds left
 *  finish()  – time is up
 */
let ctx: AudioContext | null = null

function ac(): AudioContext | null {
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** Browsers only allow audio after a click/key press in that window. */
export function unlockAudio() {
  const c = ac()
  if (c && c.state === 'suspended') void c.resume()
}
export const audioReady = () => !!ctx && ctx.state === 'running'

if (typeof window !== 'undefined') {
  const once = () => unlockAudio()
  window.addEventListener('pointerdown', once, { passive: true })
  window.addEventListener('keydown', once)
}

function tone(freq: number, start: number, dur: number, peak: number, type: OscillatorType = 'sine', out?: AudioNode) {
  const c = ac()!
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(peak, start + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(g).connect(out ?? c.destination)
  osc.start(start)
  osc.stop(start + dur + 0.05)
}

function master(volume: number) {
  const c = ac()!
  const g = c.createGain()
  g.gain.value = Math.max(0, Math.min(1, volume))
  const comp = c.createDynamicsCompressor()
  g.connect(comp).connect(c.destination)
  return g
}

export function gong(volume = 0.8) {
  const c = ac()
  if (!c) return
  const out = master(volume)
  const t = c.currentTime + 0.02
  // inharmonic partials of a bronze gong
  const partials: [number, number, number][] = [
    [98, 0.55, 5.5],
    [147.5, 0.32, 4.6],
    [196.8, 0.26, 4.2],
    [264.1, 0.18, 3.4],
    [331.6, 0.12, 2.8],
    [419.2, 0.08, 2.2],
    [587.3, 0.05, 1.5],
  ]
  partials.forEach(([f, a, d]) => tone(f, t, d, a, 'sine', out))
  // mallet strike
  const len = Math.floor(c.sampleRate * 0.06)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3
  const src = c.createBufferSource()
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 900
  const ng = c.createGain()
  ng.gain.value = 0.35
  src.buffer = buf
  src.connect(lp).connect(ng).connect(out)
  src.start(t)
}

export function warning(volume = 0.8) {
  const c = ac()
  if (!c) return
  const out = master(volume)
  const t = c.currentTime + 0.02
  tone(880, t, 0.35, 0.35, 'triangle', out)
  tone(1760, t, 0.25, 0.06, 'sine', out)
}

export function finish(volume = 0.8) {
  const c = ac()
  if (!c) return
  const out = master(volume)
  const t = c.currentTime + 0.02
  ;[0, 0.32, 0.64].forEach((dt, i) => {
    const f = i === 2 ? 523.25 : 659.25
    tone(f, t + dt, i === 2 ? 1.2 : 0.28, 0.4, 'triangle', out)
    tone(f * 2, t + dt, i === 2 ? 0.8 : 0.2, 0.07, 'sine', out)
  })
}
