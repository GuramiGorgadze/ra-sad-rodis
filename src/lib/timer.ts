import { useEffect, useRef, useState } from 'react'
import { finish, gong, warning } from './sound'
import { useStore } from './store'
import type { TimerState } from './types'

export function timeLeft(t: TimerState, now: number): number | null {
  if (t.endsAt != null) return Math.max(0, t.endsAt - now)
  if (t.pausedLeft != null) return t.pausedLeft
  return null
}

export const isRunning = (t: TimerState, now: number) => t.endsAt != null && t.endsAt > now

/** Re-renders every animation frame while `active` (or every `ms` when given). */
export function useNow(active: boolean, ms?: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) {
      setNow(Date.now())
      return
    }
    let raf = 0
    let iv = 0
    if (ms) iv = window.setInterval(() => setNow(Date.now()), ms)
    else {
      const loop = () => {
        setNow(Date.now())
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }
    return () => {
      cancelAnimationFrame(raf)
      clearInterval(iv)
    }
  }, [active, ms])
  return now
}

export function formatClock(ms: number) {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/* ─────────────────────────────────────────────
 * Sound: exactly one window plays the timer signals.
 * The control panel plays them when it's open (it always has a user click, so audio is
 * allowed). If no control panel is open, the projector window plays them.
 * ───────────────────────────────────────────── */

type Role = 'control' | 'screen' | 'preview'
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('rsr-presence') : null
let lastControlSeen = 0
channel?.addEventListener('message', (e) => {
  if (e.data?.role === 'control') lastControlSeen = Date.now()
})

export function useTimerSounds(role: Role) {
  const played = useRef({ id: -1, start: true, warn: true, end: true })

  useEffect(() => {
    if (role !== 'control' || !channel) return
    const ping = () => channel.postMessage({ role: 'control' })
    ping()
    const iv = window.setInterval(ping, 1000)
    return () => clearInterval(iv)
  }, [role])

  useEffect(() => {
    if (role === 'preview') return
    const iv = window.setInterval(() => {
      const { show, game } = useStore.getState()
      const t = show.timer
      const now = Date.now()
      const left = timeLeft(t, now)
      const p = played.current
      if (t.id !== p.id) {
        const elapsed = left == null ? Infinity : t.duration * 1000 - left
        played.current = {
          id: t.id,
          start: !(t.endsAt != null && elapsed < 1500),
          warn: left == null || left <= 10_000,
          end: left == null || left <= 0,
        }
        return tick()
      }
      tick()

      function tick() {
        const q = played.current
        if (t.endsAt == null || left == null) return
        const leader = role === 'control' || now - lastControlSeen > 2500
        const vol = game.settings.volume
        const fire = (cue: 'start' | 'warn' | 'end', fn: (v: number) => void) => {
          if (q[cue]) return
          q[cue] = true
          if (leader && game.settings.soundOn) fn(vol)
        }
        if (left > 10_500) q.warn = false
        if (left > 600) q.end = false
        fire('start', gong)
        if (left <= 10_000 && left > 0 && t.duration > 15) fire('warn', warning)
        if (left <= 0) fire('end', finish)
      }
    }, 80)
    return () => clearInterval(iv)
  }, [role])
}
