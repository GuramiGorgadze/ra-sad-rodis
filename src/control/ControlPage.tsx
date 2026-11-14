import { Check, ChevronLeft, ChevronRight, Coffee, ImageIcon, Pause, Play, Plus, RotateCcw, Square, Trophy, Type, Users, Volume2, VolumeX, ListChecks } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Caps, Kbd } from '../components/bits'
import { AppHeader, Button, Card, SectionTitle } from '../components/ui'
import { StoredImage } from '../components/bits'
import { buildSequence, getBlock, getStage, questionNumber } from '../lib/sequence'
import {
  addTime,
  currentIndex,
  next,
  pauseTimer,
  prev,
  resetTimer,
  resume,
  resumeTimer,
  setMark,
  setShow,
  showScene,
  startBreak,
  startTimer,
  toggleTimer,
  updateGame,
  useStore,
} from '../lib/store'
import { formatClock, timeLeft, useNow, useTimerSounds } from '../lib/timer'
import { unlockAudio } from '../lib/sound'
import { RunOfShow, SCENE_ICON, SCENE_NAME, ScreenPreview } from './parts'

export default function ControlPage() {
  useTimerSounds('control')
  const game = useStore((s) => s.game)
  const show = useStore((s) => s.show)
  const seq = useMemo(() => buildSequence(game), [game])
  const { index, exact } = useMemo(() => currentIndex(seq), [seq, show])
  const nextStep = exact ? seq[index + 1] : seq[index]

  // keyboard shortcuts (ignored while typing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [contenteditable="true"]') || e.ctrlKey || e.metaKey || e.altKey) return
      unlockAudio()
      const k = e.key
      // a focused button would also "click" on Space/Enter — drop focus so shortcuts stay predictable
      if (t.closest('button, a') && [' ', 'ArrowRight', 'ArrowLeft', 'PageDown', 'PageUp'].includes(k)) (t as HTMLElement).blur()
      if (k === 'ArrowRight' || k === 'PageDown') next()
      else if (k === 'ArrowLeft' || k === 'PageUp') prev()
      else if (k === ' ') toggleTimer()
      else if (k === 'b' || k === 'B') {
        if (useStore.getState().show.scene === 'blank') resume()
        else showScene('blank')
      }
      else if (k === 'r' || k === 'R') showScene('results')
      else if (/^[1-9]$/.test(k)) {
        const { game, show, scores } = useStore.getState()
        const stage = getStage(game, show.stageId)
        const q = getBlock(game, show.stageId, show.blockId)?.questions[show.qIndex]
        const tid = stage?.teamIds[Number(k) - 1]
        if (!stage || !q || !tid) return
        setMark(stage.id, q.id, tid, !scores.marks[stage.id]?.[q.id]?.[tid])
      } else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const soundOn = game.settings.soundOn
  return (
    <div className="flex h-full flex-col bg-ink-900">
      <AppHeader
        route="/control"
        right={
          <Button
            variant="ghost"
            onClick={() => {
              unlockAudio()
              updateGame((g) => (g.settings.soundOn = !g.settings.soundOn))
            }}
            aria-label={soundOn ? 'ხმის გამორთვა' : 'ხმის ჩართვა'}
            title={soundOn ? 'ხმა ჩართულია' : 'ხმა გამორთულია'}
          >
            {soundOn ? <Volume2 className="size-4 text-brass-400" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}
          </Button>
        }
      />
      <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_340px] xl:grid-cols-[290px_minmax(0,1fr)_380px]">
        {/* run of show */}
        <aside className="hidden min-h-0 border-r border-ink-700/70 lg:block" aria-label="თამაშის მსვლელობა">
          <RunOfShow />
        </aside>

        {/* stage */}
        <section className="scroll-thin flex min-h-0 flex-col gap-4 overflow-y-auto p-4 xl:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[13px] text-stone-400">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-ember-400 opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-ember-400" />
              </span>
              ეკრანზე ახლა: <span className="font-semibold text-parchment-100">{SCENE_NAME[show.scene]}</span>
            </div>
            <span className="text-[12.5px] text-stone-400">
              {index >= 0 ? index + 1 : '–'} / {seq.length}
            </span>
          </div>
          <ScreenPreview />
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
            <Button size="xl" onClick={prev} aria-label="წინა" className="w-24">
              <ChevronLeft className="size-6" aria-hidden />
            </Button>
            <Button size="xl" variant="primary" onClick={next} className="!justify-between">
              <span className="flex min-w-0 flex-col items-start leading-tight">
                <span className="text-[12px] font-semibold opacity-70">{exact ? 'შემდეგი' : 'დაბრუნება'}</span>
                <span className="truncate">{nextStep ? nextStep.label : 'დასასრული'}</span>
              </span>
              <span className="flex items-center gap-2">
                <Kbd>→</Kbd>
                <ChevronRight className="size-6" aria-hidden />
              </span>
            </Button>
          </div>
          <HostCard />
        </section>

        {/* tools */}
        <aside className="scroll-thin flex min-h-0 flex-col gap-4 overflow-y-auto border-l border-ink-700/70 p-4">
          <TimerCard />
          <ScoringCard />
          <ScreenCard />
        </aside>
      </main>
    </div>
  )
}

/* ───────────── host card: what the host needs to read ───────────── */

function HostCard() {
  const game = useStore((s) => s.game)
  const show = useStore((s) => s.show)
  const stage = getStage(game, show.stageId)
  const block = getBlock(game, show.stageId, show.blockId)
  const q = block?.questions[show.qIndex]
  const onQuestion = show.scene === 'question' || show.scene === 'answer'
  if (!stage || !block || !q || !onQuestion) {
    const Icon = SCENE_ICON[show.scene]
    return (
      <Card className="flex items-center gap-4 p-5">
        <span className="flex size-11 items-center justify-center rounded-xl bg-ink-800 text-brass-400 ring-1 ring-ink-700">
          <Icon className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-display font-semibold text-parchment-100">{SCENE_NAME[show.scene]}</p>
          <p className="text-[13px] text-stone-400">{stage?.title}</p>
        </div>
      </Card>
    )
  }
  const num = questionNumber(stage, block.id, show.qIndex)
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="num text-4xl leading-none text-brass">{num}</span>
        <Caps className="text-[12px] text-stone-400">{`${stage.title} · ${block.title}`}</Caps>
        <span className="ml-auto text-[12.5px] text-stone-400">
          {q.timer} წმ · {q.points} ქულა
        </span>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1.5 text-[12px] font-semibold tracking-wide text-stone-400">კითხვა (წამყვანისთვის)</p>
          {q.hostText.trim() ? (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-parchment-100">{q.hostText}</p>
          ) : (
            <p className="text-[13.5px] text-stone-400 italic">ტექსტი არ არის დამატებული.</p>
          )}
          {q.image && (
            <div className="mt-3 flex items-center gap-2 text-[12.5px] text-stone-400">
              <ImageIcon className="size-4 text-brass-400" aria-hidden /> კითხვას აქვს სურათი
              <StoredImage id={q.image} fit="cover" className="ml-1 h-10 w-16 rounded ring-1 ring-ink-700" />
            </div>
          )}
        </div>
        <div className="rounded-xl bg-ink-900 p-4 ring-1 ring-ink-700/80">
          <p className="mb-1.5 text-[12px] font-semibold tracking-wide text-sage-400">პასუხი</p>
          <p className="font-display text-lg font-semibold text-parchment-50">{q.answerText.trim() || (q.answerImage ? '(სურათი)' : '—')}</p>
          {q.comment.trim() && <p className="mt-2 text-[13.5px] leading-relaxed text-stone-300">{q.comment}</p>}
          {q.answerImage && <StoredImage id={q.answerImage} fit="cover" className="mt-3 h-20 w-32 rounded ring-1 ring-ink-700" />}
        </div>
      </div>
    </Card>
  )
}

/* ───────────── timer ───────────── */

function TimerCard() {
  const show = useStore((s) => s.show)
  const t = show.timer
  const now = useNow(t.endsAt != null)
  const left = timeLeft(t, now)
  const running = t.endsAt != null && (left ?? 0) > 0
  const paused = t.pausedLeft != null
  const block = useStore((s) => getBlock(s.game, s.show.stageId, s.show.blockId))
  const qTimer = block?.questions[show.qIndex]?.timer ?? 60
  const warn = left != null && left <= 10_000
  return (
    <Card className="p-4">
      <SectionTitle aside={<span className="flex items-center gap-1.5 text-[12px] text-stone-400"><Kbd>Space</Kbd> დაწყება/პაუზა</span>}>
        ტაიმერი
      </SectionTitle>
      <div className="flex items-end justify-between gap-3">
        <div
          className={`num text-[64px] leading-none ${left == null ? 'text-ink-500' : left <= 0 ? 'text-ember-400' : warn ? 'text-ember' : 'text-brass'}`}
          aria-live="off"
        >
          {left == null ? formatClock(qTimer * 1000) : left <= 0 ? '0:00' : formatClock(left)}
        </div>
        <span className="pb-2 text-[12.5px] font-semibold text-stone-400">
          {left == null ? 'მზადაა' : left <= 0 ? 'დრო ამოიწურა' : paused ? 'პაუზა' : 'მიდის'}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-700">
        <div
          className={`h-full rounded-full ${warn ? 'bg-ember-400' : 'bg-brass-400'}`}
          style={{ width: `${left == null ? 100 : (left / (t.duration * 1000)) * 100}%` }}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {running ? (
          <Button variant="primary" size="lg" onClick={pauseTimer} className="col-span-2">
            <Pause className="size-5" aria-hidden /> პაუზა
          </Button>
        ) : paused ? (
          <Button variant="primary" size="lg" onClick={resumeTimer} className="col-span-2">
            <Play className="size-5" aria-hidden /> გაგრძელება
          </Button>
        ) : (
          <Button variant="primary" size="lg" onClick={() => { unlockAudio(); startTimer(qTimer) }} className="col-span-2">
            <Play className="size-5" aria-hidden /> დაწყება · {qTimer} წმ
          </Button>
        )}
        <Button onClick={() => addTime(10)}>
          <Plus className="size-4" aria-hidden /> 10 წმ
        </Button>
        <Button onClick={resetTimer} disabled={left == null}>
          <RotateCcw className="size-4" aria-hidden /> განულება
        </Button>
        <Button size="sm" variant="ghost" onClick={() => startTimer(60)}>60 წმ</Button>
        <Button size="sm" variant="ghost" onClick={() => startTimer(20)}>20 წმ</Button>
      </div>
    </Card>
  )
}

/* ───────────── quick scoring for the current question ───────────── */

function ScoringCard() {
  const game = useStore((s) => s.game)
  const show = useStore((s) => s.show)
  const marks = useStore((s) => s.scores.marks)
  const stage = getStage(game, show.stageId)
  const block = getBlock(game, show.stageId, show.blockId)
  const q = block?.questions[show.qIndex]
  if (!stage || !block || !q) return null
  const num = questionNumber(stage, block.id, show.qIndex)
  const qMarks = marks[stage.id]?.[q.id] ?? {}
  const teams = stage.teamIds.map((id) => game.teams.find((t) => t.id === id)).filter(Boolean) as { id: string; name: string }[]
  const count = teams.filter((t) => qMarks[t.id]).length
  return (
    <Card className="p-4">
      <SectionTitle aside={<span className="text-[12.5px] text-stone-400">{count} / {teams.length}</span>}>
        სწორი პასუხი · კითხვა {num}
      </SectionTitle>
      <ul className="flex flex-col gap-1.5">
        {teams.map((t, i) => {
          const on = !!qMarks[t.id]
          return (
            <li key={t.id}>
              <button
                onClick={() => setMark(stage.id, q.id, t.id, !on)}
                aria-pressed={on}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-left text-[14px] transition-colors ${on ? 'border-sage-400/50 bg-sage-400/12 text-parchment-50' : 'border-ink-700 bg-ink-900 text-stone-300 hover:border-ink-600 hover:text-parchment-100'}`}
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-md ${on ? 'bg-sage-400 text-ink-950' : 'bg-ink-800 text-transparent ring-1 ring-ink-600'}`}
                >
                  <Check className="size-4" strokeWidth={3} aria-hidden />
                </span>
                <span className="truncate font-semibold">{t.name}</span>
                {i < 9 && <span className="ml-auto"><Kbd>{i + 1}</Kbd></span>}
              </button>
            </li>
          )
        })}
      </ul>
      <a href="#/scores" className="mt-3 inline-block cursor-pointer text-[12.5px] font-semibold text-brass-400 hover:text-brass-300">
        სრული ცხრილი და კორექცია →
      </a>
    </Card>
  )
}

/* ───────────── quick screens ───────────── */

function ScreenCard() {
  const game = useStore((s) => s.game)
  const show = useStore((s) => s.show)
  const [mins, setMins] = useState(game.settings.breakMinutes)
  const tile = (active: boolean) =>
    `flex h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border text-[12.5px] font-semibold transition-colors ${active ? 'border-brass-400/60 bg-brass-400/12 text-parchment-50' : 'border-ink-700 bg-ink-900 text-stone-300 hover:border-ink-600 hover:text-parchment-100'}`
  const items = [
    { scene: 'title' as const, icon: Type, label: 'სათაური' },
    { scene: 'teams' as const, icon: Users, label: 'გუნდები' },
    { scene: 'recap' as const, icon: ListChecks, label: 'ყველა პასუხი' },
    { scene: 'results' as const, icon: Trophy, label: 'შედეგები' },
    { scene: 'blank' as const, icon: Square, label: 'შავი ეკრანი' },
  ]
  return (
    <Card className="p-4">
      <SectionTitle>ეკრანი</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        {items.map(({ scene, icon: Icon, label }) => (
          <button
            key={scene}
            className={tile(show.scene === scene)}
            onClick={() => {
              if (show.scene === scene && show.quick) return resume()
              showScene(scene)
            }}
          >
            <Icon className="size-4.5 text-brass-400" aria-hidden />
            {label}
          </button>
        ))}
        <button className={tile(show.scene === 'break')} onClick={() => startBreak(mins)}>
          <Coffee className="size-4.5 text-brass-400" aria-hidden />
          შესვენება
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[13px] text-stone-300">
        <label htmlFor="brk" className="whitespace-nowrap">შესვენება:</label>
        <input
          id="brk"
          type="number"
          min={0}
          max={120}
          value={mins}
          onChange={(e) => setMins(Math.max(0, Number(e.target.value)))}
          className="h-8 w-16 rounded-md border border-ink-700 bg-ink-900 px-2 text-center text-parchment-100 focus:border-brass-400/70 focus:outline-none"
        />
        <span>წუთი</span>
        {show.scene === 'break' && (
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setShow({ breakEndsAt: null })}>
            ტაიმერის მოხსნა
          </Button>
        )}
      </div>
      <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-[13px] text-stone-300">
        <input
          type="checkbox"
          checked={game.settings.stepwiseResults}
          onChange={(e) => updateGame((g) => (g.settings.stepwiseResults = e.target.checked))}
          className="size-4 accent-[#e3b65c]"
        />
        შედეგები სათითაოდ (ბოლო ადგილიდან, ღილაკით →)
      </label>
    </Card>
  )
}
