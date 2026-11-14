import { motion } from 'motion/react'
import { Caps, CountUp, StoredImage } from '../components/bits'
import { Mark, SectorRing, TimerArc } from '../components/Ring'
import { KIND_LABEL, mt, qCount } from '../lib/defaults'
import { standings } from '../lib/scoring'
import { getBlock, getStage, questionNumber, questionsPlayed } from '../lib/sequence'
import type { State } from '../lib/store'
import { formatClock, timeLeft, useNow } from '../lib/timer'
import type { Block, Question, Stage } from '../lib/types'

const EASE = [0.16, 1, 0.3, 1] as const

export interface SceneProps {
  state: Pick<State, 'game' | 'scores' | 'show'>
}

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: '2.4vh' },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: EASE },
})

/* ───────────────────────── Title ───────────────────────── */

function Wordmark({ text }: { text: string }) {
  const words = mt(text).split(/\s+/)
  return (
    <h1 className="flex flex-wrap items-baseline justify-center gap-x-[0.38em] font-display text-[min(10.5vh,8.4vw)] font-semibold leading-[1.05] tracking-[0.04em] text-parchment-100">
      {words.map((w, i) => (
        <motion.span key={i} {...rise(0.25 + i * 0.18)} className="whitespace-nowrap">
          {[...w].map((ch, j) =>
            ch === '?' || ch === '!' ? (
              <span key={j} className="text-brass">
                {ch}
              </span>
            ) : (
              ch
            ),
          )}
        </motion.span>
      ))}
    </h1>
  )
}

export function TitleScene({ state }: SceneProps) {
  const { game, show } = state
  const stage = getStage(game, show.stageId)
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-[6vw] text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.7, rotate: -40 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 1.4, ease: EASE }}
      >
        <Mark className="mb-[4vh] size-[11vh] drop-shadow-[0_0_3vh_rgba(227,182,92,0.35)]" />
      </motion.div>
      <Wordmark text={game.settings.eventTitle || 'რა? სად? როდის?'} />
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.1, delay: 0.8, ease: EASE }}
        className="my-[4vh] h-px w-[30vw] bg-gradient-to-r from-transparent via-brass-400/70 to-transparent"
      />
      {game.settings.eventSubtitle && (
        <motion.p {...rise(0.95)} className="balance max-w-[70vw] font-sans text-[2.8vh] text-stone-300">
          {game.settings.eventSubtitle}
        </motion.p>
      )}
      {stage && (
        <motion.div {...rise(1.15)} className="mt-[3vh]">
          <Caps className="text-[3.4vh] text-brass-300">{stage.title}</Caps>
        </motion.div>
      )}
    </div>
  )
}

/* ───────────────────────── Teams ───────────────────────── */

export function TeamsScene({ state }: SceneProps) {
  const { game, show } = state
  const stage = getStage(game, show.stageId)
  const teams = (stage?.teamIds ?? []).map((id) => game.teams.find((t) => t.id === id)).filter(Boolean) as {
    id: string
    name: string
  }[]
  const n = teams.length
  const cols = n <= 1 ? 1 : n <= 4 ? 2 : n <= 6 ? 3 : 4
  const big = n <= 4
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-[6vw] pt-[8vh] pb-[6vh]">
      <motion.div {...rise(0.1)} className="mb-[1.4vh]">
        <Caps className="text-[2.2vh] text-stone-400">{stage?.title ?? ''}</Caps>
      </motion.div>
      <motion.h2 {...rise(0.2)} className="mb-[6vh] font-display text-[8vh] font-semibold tracking-[0.12em] text-brass">
        {mt('გუნდები')}
      </motion.h2>
      <div className="grid w-full max-w-[88vw] gap-[2.2vh]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {teams.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: '3vh', scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.4 + i * 0.09, ease: EASE }}
            className={`relative flex flex-col justify-between overflow-hidden rounded-[1.2vh] border border-brass-400/15 bg-gradient-to-b from-ink-800/90 to-ink-900/80 px-[2.4vh] py-[2.2vh] ${big ? 'min-h-[20vh]' : 'min-h-[17vh]'}`}
          >
            <span className="num text-[4vh] leading-none text-brass-400/80">{String(i + 1).padStart(2, '0')}</span>
            <span
              className={`balance mt-[2vh] font-display font-semibold leading-[1.15] text-parchment-100 ${big ? 'text-[5vh]' : 'text-[3.4vh]'}`}
            >
              {t.name}
            </span>
            <span className="pointer-events-none absolute -right-[3vh] -top-[3vh] size-[12vh] rounded-full bg-brass-400/[0.06] blur-[2vh]" />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ───────────────────────── Block intro ───────────────────────── */

export function BlockScene({ state }: SceneProps) {
  const { game, show } = state
  const stage = getStage(game, show.stageId)
  const block = getBlock(game, show.stageId, show.blockId)
  if (!stage || !block) return null
  const timer = block.questions[0]?.timer ?? 60
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-[6vw] text-center">
      <motion.div {...rise(0.1)}>
        <Caps className="text-[2.4vh] text-stone-400">{stage.title}</Caps>
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, letterSpacing: '0.4em' }}
        animate={{ opacity: 1, letterSpacing: '0.14em' }}
        transition={{ duration: 1.2, delay: 0.2, ease: EASE }}
        className="mt-[3vh] font-display text-[min(13vh,10vw)] font-bold leading-none text-brass"
      >
        {mt(block.title || KIND_LABEL[block.kind])}
      </motion.h2>
      <motion.p {...rise(0.7)} className="mt-[5vh] font-sans text-[3.2vh] text-stone-300">
        {qCount(block.questions.length)} · {timer} წამი {block.kind === 'regular' ? 'თითო კითხვაზე' : 'თითოეულზე'}
      </motion.p>
      {block.kind === 'superblitz' && (
        <motion.p {...rise(0.9)} className="mt-[1.6vh] font-sans text-[2.4vh] text-stone-400">
          პასუხობს ერთი მოთამაშე
        </motion.p>
      )}
    </div>
  )
}

/* ───────────────────────── Question ───────────────────────── */

function TimerReadout({ state, size }: SceneProps & { size: 'lg' | 'md' }) {
  const t = state.show.timer
  const now = useNow(t.endsAt != null)
  const left = timeLeft(t, now)
  const box = size === 'lg' ? 'h-[13vh]' : 'h-[11vh]'
  if (left == null)
    return (
      <div className={`${box} flex items-center justify-center`}>
        <motion.p {...rise(0.9)} className="font-display text-[3.4vh] font-medium text-parchment-100/80">
          ყურადღება, კითხვა!
        </motion.p>
      </div>
    )
  if (left <= 0)
    return (
      <div className={`${box} flex items-center justify-center`}>
        <motion.p
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14 }}
          className="font-display text-[7.5vh] font-bold tracking-[0.18em] text-ember"
        >
          {mt('დრო!')}
        </motion.p>
      </div>
    )
  const secs = Math.ceil(left / 1000)
  const warn = secs <= 10
  const paused = t.endsAt == null
  return (
    <div className={`${box} flex items-center justify-center gap-[2vh]`}>
      <span
        className={`num leading-none ${size === 'lg' ? 'text-[11vh]' : 'text-[9vh]'} ${warn ? 'text-ember' : 'text-brass'} ${warn && !paused ? 'animate-pulse-ember' : ''} ${paused ? 'opacity-50' : ''}`}
      >
        {secs > 60 ? formatClock(left) : secs}
      </span>
      {paused && <Caps className="text-[2.2vh] text-stone-400">პაუზა</Caps>}
    </div>
  )
}

function NumberRing({ state, stage, block, className }: SceneProps & { stage: Stage; block: Block; className: string }) {
  const { show } = state
  const t = show.timer
  const now = useNow(t.endsAt != null)
  const left = timeLeft(t, now)
  const num = questionNumber(stage, block.id, show.qIndex)
  const kindLabel = block.kind === 'regular' ? 'კითხვა' : block.title || KIND_LABEL[block.kind]
  return (
    <div className={`relative aspect-square ${className}`}>
      <SectorRing count={block.questions.length} current={show.qIndex} className="absolute inset-0 size-full" />
      {left != null && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0">
          <TimerArc fraction={left / (t.duration * 1000)} warn={left <= 10_000} className="size-full" />
        </motion.div>
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span {...rise(0.15)} className="mb-[3%] text-[0.042em] leading-none">
          <Caps className="text-brass-400">{kindLabel}</Caps>
        </motion.span>
        <motion.span
          initial={{ opacity: 0, scale: 0.82 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
          className="num num-display text-brass leading-[0.86]"
          style={{ fontSize: num >= 10 ? '0.44em' : '0.5em' }}
        >
          {num}
        </motion.span>
        <motion.span {...rise(0.3)} className="num mt-[4%] text-[0.035em] leading-none tracking-[0.2em] text-stone-400">
          {show.qIndex + 1} / {block.questions.length}
        </motion.span>
      </div>
    </div>
  )
}

export function QuestionScene({ state }: SceneProps) {
  const { game, show } = state
  const stage = getStage(game, show.stageId)
  const block = getBlock(game, show.stageId, show.blockId)
  const q: Question | undefined = block?.questions[show.qIndex]
  if (!stage || !block || !q) return <Missing />
  if (!q.image)
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-[6vh]">
        {/* font-size on the wrapper drives everything inside the ring */}
        <div style={{ fontSize: 'min(64vh, 70vw)' }}>
          <NumberRing state={state} stage={stage} block={block} className="h-[min(64vh,70vw)]" />
        </div>
        <TimerReadout state={state} size="lg" />
      </div>
    )
  return (
    <div className="absolute inset-0 grid grid-cols-[minmax(0,32fr)_minmax(0,68fr)] items-center gap-[3vw] px-[4.5vw] pt-[9vh] pb-[5vh]">
      <div className="flex flex-col items-center">
        <div style={{ fontSize: 'min(27vw, 52vh)' }}>
          <NumberRing state={state} stage={stage} block={block} className="h-[min(27vw,52vh)]" />
        </div>
        <TimerReadout state={state} size="md" />
      </div>
      <div className="flex h-[82vh] min-h-0 items-center justify-center">
        <StoredImage
          id={q.image}
          className="max-h-full max-w-full rounded-[1vh] shadow-[0_3vh_9vh_rgba(0,0,0,0.65)] ring-1 ring-brass-400/25"
        />
      </div>
    </div>
  )
}

/* ───────────────────────── Answer ───────────────────────── */

function answerSize(text: string, withImage: boolean) {
  const n = text.length
  const s = n <= 14 ? 12 : n <= 28 ? 9 : n <= 60 ? 6.6 : n <= 120 ? 5 : 3.9
  return `${withImage ? s * 0.72 : s}vh`
}

export function AnswerScene({ state }: SceneProps) {
  const { game, show } = state
  const stage = getStage(game, show.stageId)
  const block = getBlock(game, show.stageId, show.blockId)
  const q = block?.questions[show.qIndex]
  if (!stage || !block || !q) return <Missing />
  const num = questionNumber(stage, block.id, show.qIndex)
  const text = q.answerText.trim()
  const hasImg = !!q.answerImage

  const header = (
    <motion.div {...rise(0.05)} className="flex items-center justify-center gap-[2vw]">
      <span className="h-px w-[8vw] bg-gradient-to-r from-transparent to-brass-400/60" />
      <span className="flex items-baseline gap-[1.2vw]">
        <Caps className="text-[2.4vh] text-stone-400">{block.kind === 'regular' ? 'კითხვა' : block.title}</Caps>
        <span className="num text-[3.6vh] leading-none text-brass">{num}</span>
        <span className="text-[2.4vh] text-ink-500">·</span>
        <Caps className="text-[2.4vh] text-brass-300">პასუხი</Caps>
      </span>
      <span className="h-px w-[8vw] bg-gradient-to-l from-transparent to-brass-400/60" />
    </motion.div>
  )

  const answerText = text ? (
    <motion.h2
      initial={{ opacity: 0, y: '2vh', letterSpacing: '0.06em' }}
      animate={{ opacity: 1, y: 0, letterSpacing: '0em' }}
      transition={{ duration: 1, delay: 0.25, ease: EASE }}
      className={`balance font-display font-semibold leading-[1.12] text-parchment-50 ${hasImg ? 'text-left' : 'text-center'}`}
      style={{ fontSize: answerSize(text, hasImg) }}
    >
      {text}
    </motion.h2>
  ) : !hasImg ? (
    <p className="font-display text-[6vh] text-stone-400">—</p>
  ) : null

  const comment = q.comment.trim() ? (
    <motion.p
      {...rise(0.7)}
      className={`balance max-w-[62ch] font-sans text-[2.7vh] leading-[1.5] text-stone-300 ${hasImg ? 'text-left' : 'text-center'}`}
    >
      {q.comment}
    </motion.p>
  ) : null

  return (
    <div className="absolute inset-0 flex flex-col px-[6vw] pt-[11vh] pb-[6vh]">
      {header}
      {hasImg ? (
        <div
          className={`mt-[4vh] grid min-h-0 flex-1 items-center gap-[4vw] ${text || comment ? 'grid-cols-[minmax(0,55fr)_minmax(0,45fr)]' : 'grid-cols-1'}`}
        >
          <div className="flex h-full min-h-0 items-center justify-center">
            <StoredImage
              id={q.answerImage}
              className="max-h-[70vh] max-w-full rounded-[1vh] shadow-[0_3vh_9vh_rgba(0,0,0,0.65)] ring-1 ring-brass-400/25"
            />
          </div>
          {(text || comment) && (
            <div className="flex flex-col gap-[3vh]">
              {answerText}
              {text && <Underline align="left" />}
              {comment}
            </div>
          )}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[3.5vh] pb-[4vh]">
          {answerText}
          <Underline align="center" />
          {comment}
        </div>
      )}
    </div>
  )
}

function Underline({ align }: { align: 'left' | 'center' }) {
  return (
    <motion.span
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 1, delay: 0.55, ease: EASE }}
      style={{ originX: align === 'left' ? 0 : 0.5 }}
      className={`block h-[0.35vh] w-[12vh] rounded-full bg-gradient-to-r from-brass-500 via-brass-300 to-brass-500 ${align === 'center' ? 'mx-auto' : ''}`}
    />
  )
}

/* ───────────────────────── Recap (all answers of a round) ───────────────────────── */

export function RecapScene({ state }: SceneProps) {
  const { game, show } = state
  const stage = getStage(game, show.stageId)
  const block = getBlock(game, show.stageId, show.blockId)
  if (!stage || !block) return <Missing />
  const qs = block.questions
  const n = qs.length
  const cols = n <= 4 ? 1 : 2
  const rows = Math.ceil(n / cols)
  const fs = Math.min(4.6, 58 / rows / 2.1)
  return (
    <div className="absolute inset-0 flex flex-col px-[6vw] pt-[10vh] pb-[5vh]">
      <motion.div {...rise(0.05)} className="mb-[4vh] flex items-end justify-between gap-[4vw] border-b border-brass-400/20 pb-[2vh]">
        <h2 className="font-display text-[6vh] font-semibold leading-none tracking-[0.12em] text-brass">{mt('პასუხები')}</h2>
        <Caps className="pb-[0.6vh] text-[2.2vh] text-stone-400">{`${stage.title} · ${block.title || KIND_LABEL[block.kind]}`}</Caps>
      </motion.div>
      <div
        className="grid min-h-0 flex-1 grid-flow-col gap-x-[5vw]"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0,1fr))` }}
      >
        {qs.map((q, i) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: '-2vw' }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.25 + i * 0.07, ease: EASE }}
            className="flex min-h-0 items-center gap-[2vw] border-b border-ink-700/70"
          >
            <span className="num w-[1.6em] shrink-0 text-right leading-none text-brass-400" style={{ fontSize: `${fs * 1.15}vh` }}>
              {questionNumber(stage, block.id, i)}
            </span>
            {q.answerImage && (
              <span className="relative shrink-0 overflow-hidden rounded-[0.6vh] ring-1 ring-brass-400/25" style={{ height: `${fs * 1.6}vh`, width: `${fs * 1.6}vh` }}>
                <StoredImage id={q.answerImage} fit="cover" className="size-full" />
              </span>
            )}
            <span className="line-clamp-2 font-display font-medium leading-[1.2] text-parchment-100" style={{ fontSize: `${fs}vh` }}>
              {q.answerText.trim() || (q.answerImage ? '' : '—')}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ───────────────────────── Results ───────────────────────── */

function pointsPlayed(stage: Stage, blockId: string | null, qIndex: number) {
  let sum = 0
  for (const b of stage.blocks) {
    const upto = b.id === blockId ? qIndex + 1 : b.questions.length
    for (const q of b.questions.slice(0, upto)) sum += q.points || 0
    if (b.id === blockId) break
  }
  return sum
}

const placeColor = (p: number) =>
  p === 1 ? 'text-brass' : p === 2 ? 'text-silver-300' : p === 3 ? 'text-bronze-400' : 'text-stone-400'

export function ResultsScene({ state }: SceneProps) {
  const { game, scores, show } = state
  const stage = getStage(game, show.stageId)
  if (!stage) return <Missing />
  const rows = standings(game, scores, stage.id)
  const played = questionsPlayed(stage, show.blockId, show.qIndex)
  const max = Math.max(1, pointsPlayed(stage, show.blockId, show.qIndex), ...rows.map((r) => r.score))
  const n = rows.length
  const revealed = show.reveal < 0 ? n : show.reveal
  const rowH = Math.min(12, 70 / Math.max(n, 1))
  const allAtOnce = show.reveal < 0

  if (n === 1) {
    const r = rows[0]
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[6vw] text-center">
        <motion.div {...rise(0.05)}>
          <Caps className="text-[2.4vh] text-stone-400">{`${stage.title} · ${played} კითხვის შემდეგ`}</Caps>
        </motion.div>
        <motion.h2 {...rise(0.2)} className="mt-[3vh] font-display text-[7vh] font-semibold text-parchment-100">
          {r.name}
        </motion.h2>
        {revealed > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: EASE }}
            className="mt-[2vh] flex items-baseline gap-[2vw]"
          >
            <span className="num text-[34vh] leading-[0.9] text-brass">
              <CountUp value={r.score} delay={0.5} duration={1400} />
            </span>
            <span className="num text-[8vh] text-stone-400">/ {pointsPlayed(stage, show.blockId, show.qIndex)}</span>
          </motion.div>
        )}
        <Caps className="mt-[2vh] text-[2.4vh] text-brass-400/80">ქულა</Caps>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col px-[6vw] pt-[10vh] pb-[5vh]">
      <motion.div {...rise(0.05)} className="mb-[3vh] flex items-end justify-between gap-[4vw] border-b border-brass-400/20 pb-[2vh]">
        <h2 className="font-display text-[6vh] font-semibold leading-none tracking-[0.12em] text-brass">{mt('შედეგები')}</h2>
        <Caps className="pb-[0.6vh] text-[2.2vh] text-stone-400">{`${stage.title} · ${played} კითხვის შემდეგ`}</Caps>
      </motion.div>
      <div className="flex min-h-0 flex-1 flex-col justify-center">
        {rows.map((r, i) => {
          const visible = i >= n - revealed
          const order = n - 1 - i
          const delay = allAtOnce ? 0.3 + order * 0.13 : 0.05
          const leader = r.place === 1
          return (
            <div key={r.teamId} style={{ height: `${rowH}vh` }} className="relative">
              {visible && (
                <motion.div
                  initial={{ opacity: 0, x: '-3vw' }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, delay, ease: EASE }}
                  className={`absolute inset-x-0 inset-y-[8%] grid grid-cols-[minmax(0,7fr)_minmax(0,40fr)_minmax(0,40fr)_minmax(0,11fr)] items-center gap-[2vw] rounded-[1vh] px-[1.6vw] ${leader ? 'bg-gradient-to-r from-brass-400/[0.14] via-brass-400/[0.04] to-transparent ring-1 ring-brass-400/25' : ''}`}
                >
                  <span className={`num text-right leading-none ${placeColor(r.place)}`} style={{ fontSize: `${rowH * 0.6}vh` }}>
                    {r.place}
                  </span>
                  <span
                    className={`truncate font-display font-semibold ${leader ? 'text-parchment-50' : 'text-parchment-100/90'}`}
                    style={{ fontSize: `${Math.min(5, rowH * 0.42)}vh` }}
                  >
                    {r.name}
                  </span>
                  <span className="relative h-[28%] max-h-[1.6vh] overflow-hidden rounded-full bg-ink-700/70">
                    <motion.span
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: r.score / max }}
                      transition={{ duration: 1.1, delay: delay + 0.2, ease: EASE }}
                      style={{ originX: 0 }}
                      className={`absolute inset-0 rounded-full ${leader ? 'bg-gradient-to-r from-brass-600 via-brass-400 to-brass-200' : 'bg-gradient-to-r from-brass-800 to-brass-500'}`}
                    />
                  </span>
                  <span className={`num text-right leading-none ${leader ? 'text-brass' : 'text-parchment-100'}`} style={{ fontSize: `${rowH * 0.62}vh` }}>
                    <CountUp value={r.score} delay={delay + 0.2} />
                  </span>
                </motion.div>
              )}
              {!visible && <div className="absolute inset-x-0 inset-y-[8%] rounded-[1vh] border border-dashed border-ink-700/60" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ───────────────────────── Break ───────────────────────── */

export function BreakScene({ state }: SceneProps) {
  const ends = state.show.breakEndsAt
  const now = useNow(ends != null && ends > Date.now(), 250)
  const left = ends != null ? Math.max(0, ends - now) : null
  const at = ends != null ? new Date(ends) : null
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-[6vw] text-center">
      <motion.h2
        initial={{ opacity: 0, letterSpacing: '0.45em' }}
        animate={{ opacity: 1, letterSpacing: '0.16em' }}
        transition={{ duration: 1.2, ease: EASE }}
        className="font-display text-[min(10vh,9vw)] font-bold leading-none text-brass"
      >
        {mt('შესვენება')}
      </motion.h2>
      {left != null && left > 0 ? (
        <>
          <motion.div {...rise(0.4)} className="num mt-[5vh] text-[24vh] leading-none text-parchment-100">
            {formatClock(left)}
          </motion.div>
          {at && (
            <motion.p {...rise(0.6)} className="mt-[4vh] font-sans text-[3vh] text-stone-300">
              გავაგრძელებთ <span className="num text-brass-300">{`${at.getHours()}:${String(at.getMinutes()).padStart(2, '0')}`}</span>-ზე
            </motion.p>
          )}
        </>
      ) : (
        <motion.p {...rise(0.4)} className="mt-[5vh] font-display text-[4.4vh] text-parchment-100/85">
          მალე გავაგრძელებთ
        </motion.p>
      )}
    </div>
  )
}

/* ───────────────────────── misc ───────────────────────── */

function Missing() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <p className="font-sans text-[3vh] text-stone-400">კითხვა ვერ მოიძებნა</p>
    </div>
  )
}
