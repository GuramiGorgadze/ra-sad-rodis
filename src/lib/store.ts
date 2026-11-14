import { create } from 'zustand'
import { emptyScores, idleTimer, makeDefaultGame, makeDefaultShow } from './defaults'
import { buildSequence, findStep, getBlock, getStage, stepKey, type Step } from './sequence'
import type { Game, ID, Scores, Show } from './types'

/*
 * All windows (projector, control panel, editor, preview) share state through localStorage.
 * A write in one window fires a `storage` event in every other window of the same browser,
 * which we apply straight into the store. Three separate keys keep editor typing and
 * live scoring from overwriting each other.
 */
const KEYS = { game: 'rsr:game:v1', scores: 'rsr:scores:v1', show: 'rsr:show:v1' } as const
type Slice = keyof typeof KEYS

export interface State {
  game: Game
  scores: Scores
  show: Show & { anchor: string | null }
  storageError: string | null
}

function load<T>(key: string, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch {
    /* ignore corrupt data */
  }
  return fallback()
}

const game0 = load<Game>(KEYS.game, makeDefaultGame)
const scores0 = load<Scores>(KEYS.scores, emptyScores)
const show0 = load<State['show']>(KEYS.show, () => ({ ...makeDefaultShow(game0), anchor: null }))

export const useStore = create<State>(() => ({ game: game0, scores: scores0, show: show0, storageError: null }))

const lastWritten: Record<string, string> = {}

function persist(slice: Slice, value: unknown) {
  const key = KEYS[slice]
  const raw = JSON.stringify(value)
  if (lastWritten[key] === raw) return
  lastWritten[key] = raw
  try {
    localStorage.setItem(key, raw)
    if (useStore.getState().storageError) useStore.setState({ storageError: null })
  } catch (e) {
    useStore.setState({ storageError: String(e) })
  }
}

// Write the starting state right away, so a second window opened later gets the same
// (randomly generated) ids instead of inventing its own default game.
for (const k of Object.keys(KEYS) as Slice[]) {
  if (localStorage.getItem(KEYS[k]) == null) persist(k, useStore.getState()[k])
  else lastWritten[KEYS[k]] = localStorage.getItem(KEYS[k])!
}

useStore.subscribe((s, p) => {
  if (s.game !== p.game) persist('game', s.game)
  if (s.scores !== p.scores) persist('scores', s.scores)
  if (s.show !== p.show) persist('show', s.show)
})

/* Updates that came from another window or from the server must not be saved back again. */
let remote = false
export const isRemoteUpdate = () => remote
export function applyRemote(patch: Partial<State>) {
  remote = true
  try {
    useStore.setState(patch)
  } finally {
    remote = false
  }
}

window.addEventListener('storage', (e) => {
  if (e.key === null) {
    // localStorage.clear() in another window
    location.reload()
    return
  }
  const slice = (Object.keys(KEYS) as Slice[]).find((k) => KEYS[k] === e.key)
  if (!slice || e.newValue == null) return
  lastWritten[e.key] = e.newValue
  try {
    applyRemote({ [slice]: JSON.parse(e.newValue) } as Partial<State>)
  } catch {
    /* ignore */
  }
})

/* ───────────── helpers ───────────── */

const clone = <T,>(v: T): T => structuredClone(v)

export function updateGame(fn: (g: Game) => void) {
  const g = clone(useStore.getState().game)
  fn(g)
  useStore.setState({ game: g })
}

export function updateScores(fn: (s: Scores) => void) {
  const s = clone(useStore.getState().scores)
  fn(s)
  useStore.setState({ scores: s })
}

export function setShow(patch: Partial<State['show']>) {
  useStore.setState((st) => ({ show: { ...st.show, ...patch } }))
}

export function replaceAll(game: Game, scores: Scores) {
  useStore.setState({ game, scores, show: { ...makeDefaultShow(game), anchor: null } })
}

/* ───────────── navigation ───────────── */

export function sequence(): Step[] {
  return buildSequence(useStore.getState().game)
}

function questionTimer(stageId: ID | null, blockId: ID | null, qIndex: number) {
  const b = getBlock(useStore.getState().game, stageId, blockId)
  return b?.questions[qIndex]?.timer ?? 60
}

/** Show a step on the projector. */
export function goTo(step: Pick<Step, 'scene' | 'stageId' | 'blockId' | 'qIndex'>, opts: { anchor?: boolean } = {}) {
  const { show, game } = useStore.getState()
  // coming back to the same question (e.g. from a blank screen) keeps its running timer
  const sameQuestion = step.scene === 'question' && show.blockId === step.blockId && show.qIndex === step.qIndex
  const timer = sameQuestion
    ? show.timer
    : { ...idleTimer, id: show.timer.id, duration: questionTimer(step.stageId, step.blockId, step.qIndex) }
  const stage = getStage(game, step.stageId)
  const reveal = step.scene === 'results' && game.settings.stepwiseResults ? 0 : -1
  setShow({
    scene: step.scene,
    stageId: step.stageId,
    blockId: step.blockId,
    qIndex: step.qIndex,
    timer,
    reveal: step.scene === 'results' && stage ? reveal : -1,
    anchor: opts.anchor === false ? show.anchor : stepKey(step),
    quick: false,
    ...(step.scene === 'break' && show.scene !== 'break'
      ? { breakEndsAt: game.settings.breakMinutes > 0 ? Date.now() + game.settings.breakMinutes * 60_000 : null }
      : {}),
  })
}

/** Index of the current step, or of the step we will return to. */
export function currentIndex(seq = sequence()) {
  const { show } = useStore.getState()
  const exact = show.quick ? -1 : findStep(seq, show)
  if (exact >= 0) return { index: exact, exact: true }
  const anchor = seq.findIndex((s) => s.key === show.anchor)
  return { index: anchor, exact: false }
}

export function next() {
  const seq = sequence()
  const { show, game } = useStore.getState()
  // reveal results row by row first
  if (show.scene === 'results' && show.reveal >= 0) {
    const stage = getStage(game, show.stageId)
    if (stage && show.reveal < stage.teamIds.length) {
      setShow({ reveal: show.reveal + 1 })
      return
    }
  }
  const { index, exact } = currentIndex(seq)
  if (!exact && index >= 0) return goTo(seq[index])
  const target = seq[Math.min(seq.length - 1, index + 1)]
  if (target) goTo(target)
}

/** Leave a quick screen and go back to the run-of-show position. */
export function resume() {
  const seq = sequence()
  const { index } = currentIndex(seq)
  if (index >= 0) goTo(seq[index])
}

export function prev() {
  const seq = sequence()
  const { index, exact } = currentIndex(seq)
  if (!exact && index >= 0) return goTo(seq[index])
  const target = seq[Math.max(0, index - 1)]
  if (target) goTo(target)
}

/** Quick scenes (results, break, blank...) that don't move the run-of-show position. */
export function showScene(scene: Show['scene']) {
  const { show, game } = useStore.getState()
  const stageId = show.stageId ?? game.stages[0]?.id ?? null
  const patch: Partial<State['show']> = { scene, stageId, quick: true }
  if (scene === 'results') patch.reveal = game.settings.stepwiseResults ? 0 : -1
  if (scene === 'question' || scene === 'answer') {
    patch.blockId = show.blockId ?? getStage(game, stageId)?.blocks[0]?.id ?? null
  }
  setShow(patch)
}

/* ───────────── timer ───────────── */

export function startTimer(seconds?: number) {
  const { show } = useStore.getState()
  const duration = seconds ?? show.timer.duration ?? 60
  setShow({ timer: { id: show.timer.id + 1, duration, endsAt: Date.now() + duration * 1000, pausedLeft: null } })
}

export function pauseTimer() {
  const t = useStore.getState().show.timer
  if (t.endsAt == null) return
  setShow({ timer: { ...t, endsAt: null, pausedLeft: Math.max(0, t.endsAt - Date.now()) } })
}

export function resumeTimer() {
  const t = useStore.getState().show.timer
  if (t.pausedLeft == null) return
  setShow({ timer: { ...t, endsAt: Date.now() + t.pausedLeft, pausedLeft: null } })
}

export function toggleTimer() {
  const t = useStore.getState().show.timer
  if (t.endsAt != null && t.endsAt > Date.now()) pauseTimer()
  else if (t.pausedLeft != null && t.pausedLeft > 0) resumeTimer()
  else startTimer()
}

export function addTime(seconds: number) {
  const t = useStore.getState().show.timer
  if (t.endsAt != null) {
    const base = Math.max(t.endsAt, Date.now())
    setShow({ timer: { ...t, endsAt: base + seconds * 1000, duration: t.duration + seconds } })
  } else if (t.pausedLeft != null) {
    setShow({ timer: { ...t, pausedLeft: t.pausedLeft + seconds * 1000, duration: t.duration + seconds } })
  } else {
    startTimer(seconds)
  }
}

export function resetTimer() {
  const t = useStore.getState().show.timer
  setShow({ timer: { ...t, endsAt: null, pausedLeft: null } })
}

export function startBreak(minutes: number) {
  setShow({ scene: 'break', quick: true, breakEndsAt: minutes > 0 ? Date.now() + minutes * 60_000 : null })
}

/* ───────────── scoring ───────────── */

export function setMark(stageId: ID, qid: ID, teamId: ID, value: boolean) {
  updateScores((s) => {
    s.marks[stageId] ??= {}
    s.marks[stageId][qid] ??= {}
    if (value) s.marks[stageId][qid][teamId] = true
    else delete s.marks[stageId][qid][teamId]
  })
}

export function bumpAdjust(stageId: ID, teamId: ID, delta: number) {
  updateScores((s) => {
    s.adjust[stageId] ??= {}
    s.adjust[stageId][teamId] = (s.adjust[stageId][teamId] ?? 0) + delta
    if (s.adjust[stageId][teamId] === 0) delete s.adjust[stageId][teamId]
  })
}
