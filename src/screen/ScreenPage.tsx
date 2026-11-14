import { AnimatePresence, motion } from 'motion/react'
import { Maximize, Minimize, SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Kbd } from '../components/bits'
import { Mark, TableMotif } from '../components/Ring'
import { mt } from '../lib/defaults'
import { preloadImage } from '../lib/media'
import { buildSequence, findStep, getBlock, stageLabel } from '../lib/sequence'
import { next, prev, resume, showScene, toggleTimer, useStore } from '../lib/store'
import { useTimerSounds } from '../lib/timer'
import {
  AnswerScene,
  BlockScene,
  BreakScene,
  QuestionScene,
  RecapScene,
  ResultsScene,
  TeamsScene,
  TitleScene,
  type SceneProps,
} from './Scenes'

const SCENES: Record<string, (p: SceneProps) => React.ReactNode> = {
  title: TitleScene,
  teams: TeamsScene,
  block: BlockScene,
  question: QuestionScene,
  answer: AnswerScene,
  recap: RecapScene,
  results: ResultsScene,
  break: BreakScene,
  blank: () => null,
}

const CHROME = new Set(['question', 'answer', 'recap', 'results', 'teams', 'block'])

function useFullscreen() {
  const [fs, setFs] = useState(!!document.fullscreenElement)
  useEffect(() => {
    const f = () => setFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', f)
    return () => document.removeEventListener('fullscreenchange', f)
  }, [])
  const toggle = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen?.().catch(() => {})
  }
  return [fs, toggle] as const
}

export default function ScreenPage({ preview = false }: { preview?: boolean }) {
  const game = useStore((s) => s.game)
  const scores = useStore((s) => s.scores)
  const show = useStore((s) => s.show)
  const [fs, toggleFs] = useFullscreen()
  const [awake, setAwake] = useState(true)
  useTimerSounds(preview ? 'preview' : 'screen')

  // hide cursor + toolbar when the mouse is still
  useEffect(() => {
    if (preview) return
    let t = window.setTimeout(() => setAwake(false), 3500)
    const wake = () => {
      setAwake(true)
      clearTimeout(t)
      t = window.setTimeout(() => setAwake(false), 2500)
    }
    window.addEventListener('mousemove', wake)
    return () => {
      clearTimeout(t)
      window.removeEventListener('mousemove', wake)
    }
  }, [preview])

  // keyboard & presentation clicker
  useEffect(() => {
    if (preview) return
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const k = e.key
      const t = e.target as HTMLElement
      if (t.closest?.('button, a')) t.blur()
      if (['ArrowRight', 'PageDown', 'Enter', 'ArrowDown'].includes(k)) next()
      else if (['ArrowLeft', 'PageUp', 'ArrowUp', 'Backspace'].includes(k)) prev()
      else if (k === ' ' || k === 't' || k === 'T') toggleTimer()
      else if (k === 'f' || k === 'F') toggleFs()
      else if (k === 'b' || k === 'B' || k === '.') {
        if (useStore.getState().show.scene === 'blank') resume()
        else showScene('blank')
      } else if (k === 'r' || k === 'R') showScene('results')
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [preview, toggleFs])

  // preload pictures of the current and the next few steps
  const seq = useMemo(() => buildSequence(game), [game])
  useEffect(() => {
    const i = Math.max(0, findStep(seq, show))
    for (const s of seq.slice(i, i + 4)) {
      const q = getBlock(game, s.stageId, s.blockId)?.questions[s.qIndex]
      if (!q) continue
      if (s.scene === 'question') preloadImage(q.image)
      if (s.scene === 'answer') preloadImage(q.answerImage)
    }
  }, [seq, show, game])

  const Scene = SCENES[show.scene] ?? SCENES.blank
  const sceneKey =
    show.scene === 'question' || show.scene === 'answer'
      ? `${show.scene}-${show.blockId}-${show.qIndex}`
      : `${show.scene}-${show.stageId}-${show.blockId}`
  const chrome = CHROME.has(show.scene)
  const motifStrong = show.scene === 'title' || show.scene === 'break' || show.scene === 'blank'

  return (
    <div
      className="grain fixed inset-0 overflow-hidden bg-[var(--bg-stage)] select-none"
      style={{ cursor: awake || preview ? 'default' : 'none' }}
    >
      {/* light */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'var(--screen-spot)' }} />
      {/* the round table, slowly turning */}
      <motion.div
        className="pointer-events-none absolute top-1/2 left-1/2 aspect-square h-[150vmax] -translate-x-1/2 -translate-y-1/2"
        style={{
          maskImage: 'radial-gradient(circle at center, transparent 9%, black 30%)',
          WebkitMaskImage: 'radial-gradient(circle at center, transparent 9%, black 30%)',
        }}
        animate={{ opacity: motifStrong ? 0.085 : 0.045, scale: motifStrong ? 1 : 1.08 }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <TableMotif className="animate-spin-slow size-full" />
      </motion.div>
      <div className="pointer-events-none absolute inset-0" style={{ background: 'var(--screen-vignette)' }} />

      {/* top chrome */}
      <AnimatePresence>
        {chrome && (
          <motion.header
            initial={{ opacity: 0, y: '-1vh' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-x-[4.5vw] top-[3.6vh] z-10 flex items-center justify-between"
          >
            <div className="flex items-center gap-[1.2vh]">
              <Mark className="size-[3.6vh]" />
              <span className="caps text-[1.6vh] text-stone-400">{mt(game.settings.eventTitle || 'რა? სად? როდის?')}</span>
            </div>
            <span className="caps text-[1.6vh] text-brass-400/85">{stageLabel(game, show.stageId, show.blockId)}</span>
          </motion.header>
        )}
      </AnimatePresence>

      {/* scene */}
      <AnimatePresence initial={false}>
        <motion.main
          key={sceneKey}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.012 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.992, transition: { duration: 0.35, ease: 'easeIn' } }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Scene state={{ game, scores, show }} />
        </motion.main>
      </AnimatePresence>

      {/* operator toolbar — only appears when the mouse moves */}
      {!preview && (
        <motion.div
          animate={{ opacity: awake ? 1 : 0, y: awake ? 0 : 12 }}
          transition={{ duration: 0.3 }}
          className="absolute right-5 bottom-5 z-20 flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-900/85 px-3 py-2 font-sans text-sm text-stone-300 shadow-2xl backdrop-blur"
          style={{ pointerEvents: awake ? 'auto' : 'none' }}
        >
          <span className="hidden items-center gap-1.5 md:flex">
            <Kbd>←</Kbd>
            <Kbd>→</Kbd> ნავიგაცია
          </span>
          <span className="hidden items-center gap-1.5 md:flex">
            <Kbd>Space</Kbd> ტაიმერი
          </span>
          <span className="hidden items-center gap-1.5 lg:flex">
            <Kbd>B</Kbd> შავი ეკრანი
          </span>
          <a
            href="#/control"
            target="_blank"
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-stone-300 transition-colors hover:bg-ink-800 hover:text-parchment-100"
          >
            <SlidersHorizontal className="size-4" aria-hidden /> პულტი
          </a>
          <button
            onClick={toggleFs}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-brass-400 px-3 py-1.5 font-semibold text-ink-950 transition-colors hover:bg-brass-300"
          >
            {fs ? <Minimize className="size-4" aria-hidden /> : <Maximize className="size-4" aria-hidden />}
            {fs ? 'გამოსვლა' : 'სრული ეკრანი'} <Kbd>F</Kbd>
          </button>
        </motion.div>
      )}
    </div>
  )
}
