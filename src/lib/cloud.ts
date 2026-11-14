import { create } from 'zustand'
import { makeDefaultShow } from './defaults'
import { applyRemote, isRemoteUpdate, setShow, useStore } from './store'
import type { Game, Scores } from './types'

/*
 * Online saving (MERN mode).
 * When the page is served by our Express server, teams, questions, answers, scores and
 * pictures are saved to MongoDB automatically. Opened as a plain file (ra-sad-rodis.html)
 * or from a static host, the app stays in "local" mode and keeps everything in the browser.
 * The live screen state (current slide, timer) is never sent to the server.
 */

type Mode = 'checking' | 'local' | 'cloud'
type Status = 'idle' | 'saving' | 'saved' | 'error'
type Role = 'app' | 'screen' | 'preview'

interface CloudState {
  mode: Mode
  needLogin: boolean
  status: Status
  savedAt: number | null
}
export const useCloud = create<CloudState>(() => ({ mode: 'checking', needLogin: false, status: 'idle', savedAt: null }))

const KEY = 'rsr:key'
const REVS = 'rsr:revs'
const PENDING_IMAGES = 'rsr:pending-images'

const getKey = () => localStorage.getItem(KEY) ?? ''
export const isCloud = () => useCloud.getState().mode === 'cloud'

/* ───────────── HTTP ───────────── */

export class AuthError extends Error {}

export async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`api${path}`, {
    ...init,
    headers: { ...(init.headers ?? {}), 'x-admin-key': getKey() },
  })
  if (res.status === 401) {
    useCloud.setState({ needLogin: true })
    throw new AuthError('wrong-password')
  }
  if (!res.ok) throw new Error(`${res.status}`)
  return res
}

const json = (body: unknown): RequestInit => ({
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

/* ───────────── revisions (shared by all windows of this browser) ───────────── */

type Revs = { game: number; scores: number }
const readRevs = (): Revs => {
  try {
    return { game: 0, scores: 0, ...JSON.parse(localStorage.getItem(REVS) ?? '{}') }
  } catch {
    return { game: 0, scores: 0 }
  }
}
const writeRevs = (patch: Partial<Revs>) => localStorage.setItem(REVS, JSON.stringify({ ...readRevs(), ...patch }))

/* ───────────── pictures ───────────── */

const pendingImages = (): string[] => JSON.parse(localStorage.getItem(PENDING_IMAGES) ?? '[]')
const setPendingImages = (ids: string[]) => localStorage.setItem(PENDING_IMAGES, JSON.stringify([...new Set(ids)]))

export async function uploadImage(id: string, blob: Blob) {
  if (!isCloud()) return
  try {
    await api(`/images/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': blob.type || 'image/png' },
      body: blob,
    })
    setPendingImages(pendingImages().filter((x) => x !== id))
  } catch (e) {
    setPendingImages([...pendingImages(), id])
    if (!(e instanceof AuthError)) useCloud.setState({ status: 'error' })
  }
}

export async function downloadImage(id: string): Promise<Blob | null> {
  if (!isCloud()) return null
  try {
    return await (await api(`/images/${encodeURIComponent(id)}`)).blob()
  } catch {
    return null
  }
}

export function removeImageOnline(id: string) {
  if (isCloud()) api(`/images/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {})
}

export async function removeAllImagesOnline() {
  if (isCloud()) await api('/images', { method: 'DELETE' }).catch(() => {})
}

function usedImageIds(game: Game) {
  const ids: string[] = []
  for (const st of game.stages)
    for (const b of st.blocks)
      for (const q of b.questions) {
        if (q.image) ids.push(q.image)
        if (q.answerImage) ids.push(q.answerImage)
      }
  return ids
}

async function flushPendingImages() {
  const { getImage } = await import('./media')
  for (const id of pendingImages()) {
    const blob = await getImage(id, { localOnly: true })
    if (blob) await uploadImage(id, blob)
    else setPendingImages(pendingImages().filter((x) => x !== id))
  }
}

/** Download every picture of the game now, so the show never waits for the internet. */
async function cacheAllImages() {
  const { getImage } = await import('./media')
  for (const id of usedImageIds(useStore.getState().game)) await getImage(id).catch(() => null)
}

/* ───────────── saving ───────────── */

const timers: Partial<Record<'game' | 'scores', number>> = {}
const dirty = { game: false, scores: false }

function schedule(slice: 'game' | 'scores') {
  dirty[slice] = true
  useCloud.setState({ status: 'saving' })
  clearTimeout(timers[slice])
  timers[slice] = window.setTimeout(() => void push(slice), 700)
}

async function push(slice: 'game' | 'scores') {
  const st = useStore.getState()
  dirty[slice] = false
  try {
    if (slice === 'game') await flushPendingImages()
    const res = await api(`/${slice}`, json(slice === 'game' ? { game: st.game } : { scores: st.scores }))
    const { rev } = (await res.json()) as { rev: number }
    writeRevs({ [slice]: rev })
    if (!dirty.game && !dirty.scores) useCloud.setState({ status: 'saved', savedAt: Date.now() })
  } catch (e) {
    dirty[slice] = true
    useCloud.setState({ status: 'error' })
    if (!(e instanceof AuthError)) timers[slice] = window.setTimeout(() => void push(slice), 5000)
  }
}

/* ───────────── loading ───────────── */

async function pull(initial: boolean) {
  const res = await api('/state')
  const s = (await res.json()) as { game: Game | null; gameRev: number; scores: Scores | null; scoresRev: number }
  const known = readRevs()
  if (!s.game) {
    // empty database: upload what this browser already has (first start)
    if (initial) {
      const { getImage } = await import('./media')
      for (const id of usedImageIds(useStore.getState().game)) {
        const blob = await getImage(id, { localOnly: true })
        if (blob) await uploadImage(id, blob)
      }
      await push('game')
      await push('scores')
    }
    return
  }
  const patch: Partial<{ game: Game; scores: Scores }> = {}
  if (s.gameRev !== known.game && !dirty.game) patch.game = s.game
  if (s.scores && s.scoresRev !== known.scores && !dirty.scores) patch.scores = s.scores
  if (patch.game || patch.scores) applyRemote(patch)
  // the projector must not point at a stage that no longer exists
  if (patch.game && !patch.game.stages.some((st) => st.id === useStore.getState().show.stageId))
    setShow({ ...makeDefaultShow(patch.game), anchor: null, quick: false })
  writeRevs({ ...(patch.game ? { game: s.gameRev } : {}), ...(patch.scores ? { scores: s.scoresRev } : {}) })
  if (initial || patch.game) void cacheAllImages()
  useCloud.setState({ status: 'saved', savedAt: useCloud.getState().savedAt ?? Date.now() })
}

async function poll() {
  if (!isCloud() || useCloud.getState().needLogin) return
  try {
    const revs = (await (await api('/revs')).json()) as { gameRev: number; scoresRev: number }
    const known = readRevs()
    if ((revs.gameRev !== known.game && !dirty.game) || (revs.scoresRev !== known.scores && !dirty.scores)) await pull(false)
  } catch {
    /* offline — try again later */
  }
}

/* ───────────── start ───────────── */

let started = false
let subscribed = false
let currentRole: Role = 'app'

export async function initCloud(role: Role) {
  currentRole = role
  if (role === 'preview') return useCloud.setState({ mode: 'local' })
  let health: { ok: boolean; auth: boolean } | null = null
  try {
    if (location.protocol.startsWith('http')) {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 8000)
      const r = await fetch('api/health', { signal: ctrl.signal })
      clearTimeout(t)
      if (r.ok && r.headers.get('content-type')?.includes('json')) health = await r.json()
    }
  } catch {
    health = null
  }
  if (!health?.ok) return useCloud.setState({ mode: 'local' })

  useCloud.setState({ mode: 'cloud' })
  try {
    await pull(true)
    useCloud.setState({ needLogin: false })
  } catch (e) {
    if (e instanceof AuthError) return // login screen shows; login() calls initCloud again
    useCloud.setState({ status: 'error' })
  }

  if (!subscribed) {
    subscribed = true
    useStore.subscribe((s, p) => {
      if (!isCloud() || isRemoteUpdate() || useCloud.getState().needLogin) return
      if (s.game !== p.game) schedule('game')
      if (s.scores !== p.scores) schedule('scores')
    })
  }
  if (!started && role === 'app') {
    started = true
    window.setInterval(poll, 15_000)
    window.addEventListener('focus', () => void poll())
    window.addEventListener('beforeunload', (e) => {
      if (dirty.game || dirty.scores) e.preventDefault()
    })
  }
}

export async function login(password: string, role: Role): Promise<'ok' | 'wrong' | 'wait' | 'offline'> {
  try {
    const r = await fetch('api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (r.status === 429) return 'wait'
    if (!r.ok) return 'wrong'
  } catch {
    return 'offline'
  }
  localStorage.setItem(KEY, password)
  useCloud.setState({ needLogin: false })
  await initCloud(role)
  return 'ok'
}

export function logout() {
  localStorage.removeItem(KEY)
  useCloud.setState({ needLogin: true })
}

// another window logged in → this one follows
window.addEventListener('storage', (e) => {
  if (e.key === KEY && e.newValue && useCloud.getState().needLogin) {
    useCloud.setState({ needLogin: false })
    void initCloud(currentRole)
  }
})
