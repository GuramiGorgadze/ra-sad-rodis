import {
  CircleCheck,
  CircleHelp,
  Coffee,
  ImageIcon,
  Layers,
  ListChecks,
  Square,
  TriangleAlert,
  Trophy,
  Type,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Caps } from '../components/bits'
import { buildSequence, getBlock, getStage, type Step } from '../lib/sequence'
import { currentIndex, goTo, useStore } from '../lib/store'
import type { Scene } from '../lib/types'

export const SCENE_ICON: Record<Scene, LucideIcon> = {
  title: Type,
  teams: Users,
  block: Layers,
  question: CircleHelp,
  answer: CircleCheck,
  recap: ListChecks,
  results: Trophy,
  break: Coffee,
  blank: Square,
}

export const SCENE_NAME: Record<Scene, string> = {
  title: 'სათაური',
  teams: 'გუნდები',
  block: 'ტურის დასაწყისი',
  question: 'კითხვა',
  answer: 'პასუხი',
  recap: 'ყველა პასუხი',
  results: 'შედეგები',
  break: 'შესვენება',
  blank: 'შავი ეკრანი',
}

/** Live, scaled copy of the projector screen. */
export function ScreenPreview({ className = '' }: { className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.3)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setScale(el.clientWidth / 1920))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={box} className={`relative aspect-video overflow-hidden rounded-xl bg-ink-950 ring-1 ring-ink-700 ${className}`}>
      <iframe
        title="ეკრანის გადახედვა"
        src="#/screen?preview=1"
        tabIndex={-1}
        className="pointer-events-none absolute top-0 left-0 origin-top-left border-0"
        style={{ width: 1920, height: 1080, transform: `scale(${scale})` }}
      />
    </div>
  )
}

/** Ordered list of every slide; click to jump. */
export function RunOfShow() {
  const game = useStore((s) => s.game)
  const show = useStore((s) => s.show)
  const seq = useMemo(() => buildSequence(game), [game])
  const { index: cur, exact } = useMemo(() => currentIndex(seq), [seq, show])
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-current="true"]') as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [cur])

  const groups: { stageId: string; title: string; items: { step: Step; i: number }[] }[] = []
  seq.forEach((step, i) => {
    let g = groups[groups.length - 1]
    if (!g || g.stageId !== step.stageId) {
      g = { stageId: step.stageId, title: getStage(game, step.stageId)?.title ?? '', items: [] }
      groups.push(g)
    }
    g.items.push({ step, i })
  })

  return (
    <div ref={listRef} className="scroll-thin h-full overflow-y-auto px-2 pb-6">
      {groups.map((g) => (
        <div key={g.stageId} className="mt-3">
          <div className="sticky top-0 z-10 bg-ink-900/95 px-2 py-2 backdrop-blur">
            <Caps className="text-[11px] text-brass-400">{g.title}</Caps>
          </div>
          <ul className="flex flex-col gap-px">
            {g.items.map(({ step, i }) => {
              const Icon = SCENE_ICON[step.scene]
              const q = getBlock(game, step.stageId, step.blockId)?.questions[step.qIndex]
              const isCur = i === cur
              const warnAnswer = step.scene === 'answer' && q && !q.answerText.trim() && !q.answerImage
              const hasPic = (step.scene === 'question' && q?.image) || (step.scene === 'answer' && q?.answerImage)
              const block = getBlock(game, step.stageId, step.blockId)
              const showBlockHeader =
                step.blockId &&
                (i === 0 || seq[i - 1].blockId !== step.blockId) &&
                step.scene !== 'block' &&
                (getStage(game, step.stageId)?.blocks.length ?? 0) > 1
              return (
                <li key={step.key}>
                  {showBlockHeader && (
                    <div className="mt-2 mb-1 px-2 text-[11.5px] font-semibold text-stone-400">{block?.title}</div>
                  )}
                  <button
                    data-current={isCur}
                    onClick={() => goTo(step)}
                    className={`group flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-[13.5px] transition-colors ${
                      isCur
                        ? exact
                          ? 'bg-brass-400/15 text-parchment-50 ring-1 ring-brass-400/40'
                          : 'bg-ink-800 text-parchment-100 ring-1 ring-ink-600'
                        : 'text-stone-300 hover:bg-ink-800/70 hover:text-parchment-100'
                    } ${step.scene === 'answer' ? 'pl-7' : ''}`}
                  >
                    <Icon
                      className={`size-4 shrink-0 ${isCur ? 'text-brass-400' : step.scene === 'answer' ? 'text-stone-400/70' : 'text-stone-400'}`}
                      aria-hidden
                    />
                    <span className="truncate">{step.label}</span>
                    <span className="ml-auto flex items-center gap-1.5">
                      {hasPic && <ImageIcon className="size-3.5 text-brass-400/70" aria-label="სურათით" />}
                      {warnAnswer && <TriangleAlert className="size-3.5 text-ember-400" aria-label="პასუხი არ არის" />}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
