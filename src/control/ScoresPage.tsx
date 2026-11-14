import { Check, Minus, Plus, Trophy, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { AppHeader, Button, Segmented } from '../components/ui'
import { stageMax, standings } from '../lib/scoring'
import { questionNumber } from '../lib/sequence'
import { bumpAdjust, setMark, setShow, updateScores, useStore } from '../lib/store'

export default function ScoresPage() {
  const game = useStore((s) => s.game)
  const scores = useStore((s) => s.scores)
  const showStage = useStore((s) => s.show.stageId)
  const [stageId, setStageId] = useState(showStage ?? game.stages[0]?.id ?? '')
  const stage = game.stages.find((s) => s.id === stageId) ?? game.stages[0]
  if (!stage)
    return (
      <div className="h-full bg-ink-900">
        <AppHeader route="/scores" />
      </div>
    )
  const marks = scores.marks[stage.id] ?? {}
  const adjust = scores.adjust[stage.id] ?? {}
  const rank = standings(game, scores, stage.id)
  const placeOf = new Map(rank.map((r) => [r.teamId, r]))
  const teams = stage.teamIds.map((id) => game.teams.find((t) => t.id === id)).filter(Boolean) as { id: string; name: string }[]

  const showResults = () => {
    const last = stage.blocks[stage.blocks.length - 1]
    setShow({
      scene: 'results',
      stageId: stage.id,
      blockId: last?.id ?? null,
      qIndex: Math.max(0, (last?.questions.length ?? 1) - 1),
      reveal: game.settings.stepwiseResults ? 0 : -1,
      quick: true,
    })
  }
  const clearStage = () => {
    if (!confirm(`წაიშალოს «${stage.title}»-ის ყველა ქულა?`)) return
    updateScores((s) => {
      delete s.marks[stage.id]
      delete s.adjust[stage.id]
    })
  }

  return (
    <div className="flex h-full flex-col bg-ink-900">
      <AppHeader route="/scores" />
      <div className="flex flex-wrap items-center gap-3 border-b border-ink-700/70 px-4 py-3 lg:px-6">
        <Segmented value={stage.id} options={game.stages.map((s) => ({ value: s.id, label: s.title }))} onChange={setStageId} />
        <span className="text-[13px] text-stone-400">მაქსიმუმი: {stageMax(stage)} ქულა</span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="danger" size="sm" onClick={clearStage}>
            <Trash2 className="size-4" aria-hidden /> გასუფთავება
          </Button>
          <Button variant="primary" onClick={showResults}>
            <Trophy className="size-4" aria-hidden /> შედეგები ეკრანზე
          </Button>
        </div>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-auto p-4 lg:p-6">
        {teams.length === 0 ? (
          <p className="text-stone-400">ამ ეტაპისთვის გუნდები არ არის არჩეული — მონიშნეთ რედაქტორში.</p>
        ) : (
          <table className="border-separate border-spacing-0 text-[14px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-ink-900" />
                {stage.blocks.map((b) => (
                  <th
                    key={b.id}
                    colSpan={b.questions.length}
                    className="border-b border-ink-700 px-2 pb-2 text-left text-[12px] font-semibold tracking-wide text-brass-400"
                  >
                    {b.title}
                  </th>
                ))}
                <th colSpan={3} />
              </tr>
              <tr className="text-[12px] text-stone-400">
                <th className="sticky left-0 z-20 min-w-48 bg-ink-900 px-3 py-2 text-left font-semibold">გუნდი</th>
                {stage.blocks.map((b) =>
                  b.questions.map((q, i) => (
                    <th key={q.id} className="num w-11 py-2 text-center text-[15px] font-normal text-parchment-100/80">
                      {questionNumber(stage, b.id, i)}
                    </th>
                  )),
                )}
                <th className="px-3 py-2 font-semibold">კორექცია</th>
                <th className="px-3 py-2 font-semibold">ჯამი</th>
                <th className="px-3 py-2 font-semibold">ადგილი</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t, ti) => {
                const r = placeOf.get(t.id)
                return (
                  <tr key={t.id} className="group">
                    <td className="sticky left-0 z-10 border-t border-ink-700/60 bg-ink-900 px-3 py-1.5 font-semibold text-parchment-100 group-hover:bg-ink-850">
                      <span className="mr-2 text-[12px] text-stone-400">{ti + 1}.</span>
                      {t.name}
                    </td>
                    {stage.blocks.map((b) =>
                      b.questions.map((q) => {
                        const on = !!marks[q.id]?.[t.id]
                        return (
                          <td key={q.id} className="border-t border-ink-700/60 p-1 text-center group-hover:bg-ink-850">
                            <button
                              onClick={() => setMark(stage.id, q.id, t.id, !on)}
                              aria-pressed={on}
                              aria-label={`${t.name}, კითხვა ${questionNumber(stage, b.id, b.questions.indexOf(q))}`}
                              className={`flex size-9 cursor-pointer items-center justify-center rounded-md transition-colors ${on ? 'bg-sage-400 text-ink-950' : 'bg-ink-850 text-transparent ring-1 ring-ink-700 hover:ring-ink-500 hover:text-stone-400/40'}`}
                            >
                              <Check className="size-4.5" strokeWidth={3} aria-hidden />
                            </button>
                          </td>
                        )
                      }),
                    )}
                    <td className="border-t border-ink-700/60 px-3 group-hover:bg-ink-850">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="ghost" aria-label="მინუს ერთი" onClick={() => bumpAdjust(stage.id, t.id, -1)}>
                          <Minus className="size-4" aria-hidden />
                        </Button>
                        <span className={`num w-8 text-center text-lg ${adjust[t.id] ? (adjust[t.id] > 0 ? 'text-sage-400' : 'text-ember-400') : 'text-stone-400'}`}>
                          {adjust[t.id] ? (adjust[t.id] > 0 ? `+${adjust[t.id]}` : adjust[t.id]) : 0}
                        </span>
                        <Button size="sm" variant="ghost" aria-label="პლუს ერთი" onClick={() => bumpAdjust(stage.id, t.id, 1)}>
                          <Plus className="size-4" aria-hidden />
                        </Button>
                      </div>
                    </td>
                    <td className="num border-t border-ink-700/60 px-3 text-center text-2xl text-brass group-hover:bg-ink-850">{r?.score ?? 0}</td>
                    <td className="num border-t border-ink-700/60 px-3 text-center text-xl text-parchment-100 group-hover:bg-ink-850">{r?.place ?? '–'}</td>
                  </tr>
                )
              })}
              <tr className="text-[12.5px] text-stone-400">
                <td className="sticky left-0 z-10 border-t border-ink-700 bg-ink-900 px-3 py-2">სწორი პასუხები</td>
                {stage.blocks.map((b) =>
                  b.questions.map((q) => (
                    <td key={q.id} className="num border-t border-ink-700 py-2 text-center text-[15px]">
                      {teams.filter((t) => marks[q.id]?.[t.id]).length}
                    </td>
                  )),
                )}
                <td colSpan={3} className="border-t border-ink-700" />
              </tr>
            </tbody>
          </table>
        )}
        <p className="mt-6 max-w-2xl text-[13px] leading-relaxed text-stone-400">
          დააჭირეთ უჯრას — გუნდმა სწორად უპასუხა (ქულა ემატება კითხვის ღირებულების მიხედვით). «კორექცია» — დამატებითი ან ჩამოჭრილი
          ქულები. ეს გვერდი პროექტორზე არ ჩანს; ეკრანზე შედეგები მხოლოდ «შედეგები ეკრანზე» ღილაკით გამოჩნდება.
        </p>
      </div>
    </div>
  )
}
