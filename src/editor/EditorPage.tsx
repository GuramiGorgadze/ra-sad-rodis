import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  FlaskConical,
  Plus,
  RotateCcw,
  Settings2,
  Trash2,
  Upload,
  Users,
  Volume2,
  Layers,
  Sparkles,
} from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { AppHeader, Button, Card, Field, Input, SectionTitle, Segmented, Textarea } from '../components/ui'
import { KIND_DEFAULTS, KIND_LABEL, makeBlock, makeQuestion, uid } from '../lib/defaults'
import { cleanupImages, exportBackup, importBackup, loadDemo, resetEverything } from '../lib/io'
import { questionNumber } from '../lib/sequence'
import { gong } from '../lib/sound'
import { updateGame, useStore } from '../lib/store'
import type { AnswerMode, Block, BlockKind, Game, Question, Stage } from '../lib/types'
import { ImageDrop } from './ImageDrop'

type Section = { kind: 'general' } | { kind: 'teams' } | { kind: 'stage'; id: string }

export default function EditorPage() {
  const game = useStore((s) => s.game)
  const [sec, setSec] = useState<Section>({ kind: 'stage', id: game.stages[0]?.id ?? '' })
  const stage = sec.kind === 'stage' ? game.stages.find((s) => s.id === sec.id) : undefined

  const navItem = (active: boolean) =>
    `flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[14px] font-semibold transition-colors ${active ? 'bg-ink-800 text-parchment-50 ring-1 ring-ink-700' : 'text-stone-300 hover:bg-ink-850 hover:text-parchment-100'}`

  return (
    <div className="flex h-full flex-col bg-ink-900">
      <AppHeader route="/editor" right={<span className="hidden items-center gap-1.5 text-[12.5px] text-stone-400 lg:flex"><Check className="size-3.5 text-sage-400" aria-hidden /> ცვლილებები ავტომატურად ინახება</span>} />
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="scroll-thin flex min-h-0 flex-col gap-1 overflow-y-auto border-r border-ink-700/70 p-3" aria-label="რედაქტორის განყოფილებები">
          <button className={navItem(sec.kind === 'general')} onClick={() => setSec({ kind: 'general' })}>
            <Settings2 className="size-4 text-brass-400" aria-hidden /> ზოგადი და ფაილები
          </button>
          <button className={navItem(sec.kind === 'teams')} onClick={() => setSec({ kind: 'teams' })}>
            <Users className="size-4 text-brass-400" aria-hidden /> გუნდები
            <span className="ml-auto text-[12px] text-stone-400">{game.teams.length}</span>
          </button>
          <p className="mt-4 mb-1 px-3 font-display text-[11px] font-semibold tracking-[0.18em] text-stone-400">ᲔᲢᲐᲞᲔᲑᲘ</p>
          {game.stages.map((s) => {
            const total = s.blocks.reduce((n, b) => n + b.questions.length, 0)
            const filled = s.blocks.reduce((n, b) => n + b.questions.filter((q) => q.answerText.trim() || q.answerImage).length, 0)
            return (
              <button key={s.id} className={navItem(sec.kind === 'stage' && sec.id === s.id)} onClick={() => setSec({ kind: 'stage', id: s.id })}>
                <Layers className="size-4 text-brass-400" aria-hidden />
                <span className="truncate">{s.title || 'უსათაურო'}</span>
                <span className={`ml-auto text-[12px] ${filled === total ? 'text-sage-400' : 'text-stone-400'}`}>
                  {filled}/{total}
                </span>
              </button>
            )
          })}
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 justify-start"
            onClick={() => {
              const id = uid('s')
              updateGame((g) => {
                g.stages.push({ id, title: 'ახალი ეტაპი', teamIds: g.teams.map((t) => t.id), answerMode: 'each', blocks: [makeBlock('regular', 'ტური 1')] })
              })
              setSec({ kind: 'stage', id })
            }}
          >
            <Plus className="size-4" aria-hidden /> ეტაპის დამატება
          </Button>
        </aside>
        <main className="scroll-thin min-h-0 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] p-4 lg:p-8">
            {sec.kind === 'general' && <GeneralSection />}
            {sec.kind === 'teams' && <TeamsSection />}
            {sec.kind === 'stage' && stage && <StageSection stage={stage} onDeleted={() => setSec({ kind: 'general' })} />}
          </div>
        </main>
      </div>
    </div>
  )
}

function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl font-semibold text-parchment-50">{children}</h1>
      {sub && <p className="mt-1.5 text-[14px] text-stone-400">{sub}</p>}
    </div>
  )
}

/* ───────────────────────── general ───────────────────────── */

function GeneralSection() {
  const settings = useStore((s) => s.game.settings)
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const set = <K extends keyof Game['settings']>(k: K, v: Game['settings'][K]) => updateGame((g) => (g.settings[k] = v))
  return (
    <>
      <PageTitle sub="სათაური, ხმა და მონაცემების სარეზერვო ასლი.">ზოგადი</PageTitle>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <SectionTitle>სათაურის ეკრანი</SectionTitle>
          <div className="grid gap-4">
            <Field label="თამაშის სახელი">
              <Input value={settings.eventTitle} onChange={(e) => set('eventTitle', e.target.value)} />
            </Field>
            <Field label="ქვესათაური" hint="მაგ. სკოლის სახელი ან თარიღი.">
              <Input value={settings.eventSubtitle} onChange={(e) => set('eventSubtitle', e.target.value)} />
            </Field>
            <Field label="შესვენების ხანგრძლივობა (წუთი)">
              <Input type="number" min={0} value={settings.breakMinutes} onChange={(e) => set('breakMinutes', Math.max(0, Number(e.target.value)))} className="max-w-32" />
            </Field>
          </div>
        </Card>
        <Card className="p-5">
          <SectionTitle>ხმა</SectionTitle>
          <label className="flex cursor-pointer items-center gap-3 text-[14px] text-parchment-100">
            <input type="checkbox" checked={settings.soundOn} onChange={(e) => set('soundOn', e.target.checked)} className="size-4 accent-[#e3b65c]" />
            ტაიმერის სიგნალები (დაწყება, 10 წამი, დრო!)
          </label>
          <div className="mt-4 flex items-center gap-3">
            <Volume2 className="size-4 text-stone-400" aria-hidden />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) => set('volume', Number(e.target.value))}
              className="w-56 accent-[#e3b65c]"
              aria-label="ხმის სიძლიერე"
            />
            <Button size="sm" onClick={() => gong(settings.volume)}>მოსმენა</Button>
          </div>
          <label className="mt-5 flex cursor-pointer items-center gap-3 text-[14px] text-parchment-100">
            <input type="checkbox" checked={settings.stepwiseResults} onChange={(e) => set('stepwiseResults', e.target.checked)} className="size-4 accent-[#e3b65c]" />
            შედეგები სათითაოდ — ბოლო ადგილიდან პირველისკენ
          </label>
        </Card>
        <Card className="p-5 xl:col-span-2">
          <SectionTitle>ფაილები</SectionTitle>
          <p className="mb-4 max-w-3xl text-[13.5px] leading-relaxed text-stone-400">
            ყველაფერი ინახება ამ კომპიუტერის ბრაუზერში. სხვა კომპიუტერზე გადასატანად ან უსაფრთხოებისთვის ჩამოტვირთეთ სარეზერვო ასლი
            (ერთი .json ფაილი სურათებიანად) და იქ ატვირთეთ.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => void exportBackup()}>
              <Download className="size-4" aria-hidden /> სარეზერვო ასლის ჩამოტვირთვა
            </Button>
            <Button onClick={() => file.current?.click()}>
              <Upload className="size-4" aria-hidden /> ასლის ატვირთვა
            </Button>
            <input
              ref={file}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f || !confirm('ატვირთვა ჩაანაცვლებს მიმდინარე თამაშს. გავაგრძელოთ?')) return
                try {
                  await importBackup(f)
                  setMsg('ასლი წარმატებით აიტვირთა.')
                } catch (err) {
                  setMsg(String((err as Error).message ?? err))
                }
              }}
            />
            <Button
              onClick={async () => {
                if (!confirm('ჩაიტვირთოს სადემონსტრაციო თამაში? მიმდინარე მონაცემები წაიშლება.')) return
                await loadDemo()
                setMsg('დემო ჩაიტვირთა — გახსენით პულტი და სცადეთ.')
              }}
            >
              <FlaskConical className="size-4" aria-hidden /> დემო თამაში
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                await cleanupImages()
                setMsg('გამოუყენებელი სურათები წაიშალა.')
              }}
            >
              <Sparkles className="size-4" aria-hidden /> სურათების გასუფთავება
            </Button>
            <Button
              variant="danger"
              className="ml-auto"
              onClick={async () => {
                if (!confirm('წაიშალოს ყველაფერი (გუნდები, კითხვები, სურათები, ქულები)?')) return
                await resetEverything()
                setMsg('ყველაფერი თავიდან დაიწყო.')
              }}
            >
              <RotateCcw className="size-4" aria-hidden /> ყველაფრის წაშლა
            </Button>
          </div>
          {msg && (
            <p role="status" className="mt-4 text-[13.5px] text-sage-400">
              {msg}
            </p>
          )}
        </Card>
      </div>
    </>
  )
}

/* ───────────────────────── teams ───────────────────────── */

function TeamsSection() {
  const teams = useStore((s) => s.game.teams)
  return (
    <>
      <PageTitle sub="სახელები შეგიძლიათ ნებისმიერ დროს შეცვალოთ — ეკრანი მაშინვე განახლდება.">გუნდები</PageTitle>
      <Card className="max-w-2xl p-5">
        <ol className="flex flex-col gap-2">
          {teams.map((t, i) => (
            <li key={t.id} className="flex items-center gap-3">
              <span className="num w-7 text-right text-xl text-brass-400">{i + 1}</span>
              <Input
                value={t.name}
                aria-label={`გუნდი ${i + 1}`}
                onChange={(e) => updateGame((g) => (g.teams[i].name = e.target.value))}
              />
              <Button
                variant="ghost"
                aria-label="ზემოთ"
                disabled={i === 0}
                onClick={() => updateGame((g) => ([g.teams[i - 1], g.teams[i]] = [g.teams[i], g.teams[i - 1]]))}
              >
                <ArrowUp className="size-4" aria-hidden />
              </Button>
              <Button
                variant="ghost"
                aria-label={`${t.name} — წაშლა`}
                onClick={() => {
                  if (!confirm(`წაიშალოს «${t.name}»?`)) return
                  updateGame((g) => {
                    g.teams = g.teams.filter((x) => x.id !== t.id)
                    g.stages.forEach((s) => (s.teamIds = s.teamIds.filter((id) => id !== t.id)))
                  })
                }}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ol>
        <Button
          className="mt-4"
          onClick={() =>
            updateGame((g) => {
              const t = { id: uid('t'), name: `გუნდი ${g.teams.length + 1}` }
              g.teams.push(t)
            })
          }
        >
          <Plus className="size-4" aria-hidden /> გუნდის დამატება
        </Button>
        <p className="mt-4 text-[13px] text-stone-400">ახალი გუნდი ეტაპს ავტომატურად არ ემატება — მონიშნეთ ეტაპის გვერდზე.</p>
      </Card>
    </>
  )
}

/* ───────────────────────── stage ───────────────────────── */

function patchStage(id: string, fn: (s: Stage) => void) {
  updateGame((g) => {
    const s = g.stages.find((x) => x.id === id)
    if (s) fn(s)
  })
}
function patchBlock(stageId: string, blockId: string, fn: (b: Block) => void) {
  patchStage(stageId, (s) => {
    const b = s.blocks.find((x) => x.id === blockId)
    if (b) fn(b)
  })
}
function patchQuestion(stageId: string, blockId: string, qid: string, patch: Partial<Question>) {
  patchBlock(stageId, blockId, (b) => {
    const q = b.questions.find((x) => x.id === qid)
    if (q) Object.assign(q, patch)
  })
}

function StageSection({ stage, onDeleted }: { stage: Stage; onDeleted: () => void }) {
  const teams = useStore((s) => s.game.teams)
  const total = stage.blocks.reduce((n, b) => n + b.questions.length, 0)
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <Field label="ეტაპის სახელი" className="min-w-64 flex-1">
          <Input value={stage.title} onChange={(e) => patchStage(stage.id, (s) => (s.title = e.target.value))} className="h-12 font-display text-xl font-semibold" />
        </Field>
        <span className="pb-3 text-[13.5px] text-stone-400">{total} კითხვა · {stage.blocks.length} ტური</span>
        <Button
          variant="danger"
          className="mb-1"
          onClick={() => {
            if (!confirm(`წაიშალოს ეტაპი «${stage.title}» ყველა კითხვით?`)) return
            updateGame((g) => (g.stages = g.stages.filter((s) => s.id !== stage.id)))
            onDeleted()
          }}
        >
          <Trash2 className="size-4" aria-hidden /> ეტაპის წაშლა
        </Button>
      </div>

      <div className="mb-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="p-5">
          <SectionTitle
            aside={
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => patchStage(stage.id, (s) => (s.teamIds = teams.map((t) => t.id)))}>
                  ყველა
                </Button>
                <Button size="sm" variant="ghost" onClick={() => patchStage(stage.id, (s) => (s.teamIds = []))}>
                  არცერთი
                </Button>
              </div>
            }
          >
            მონაწილე გუნდები · {stage.teamIds.length}
          </SectionTitle>
          <div className="flex flex-wrap gap-2">
            {teams.map((t) => {
              const on = stage.teamIds.includes(t.id)
              return (
                <button
                  key={t.id}
                  aria-pressed={on}
                  onClick={() =>
                    patchStage(stage.id, (s) => {
                      // keep the global team order
                      const set = new Set(s.teamIds)
                      if (on) set.delete(t.id)
                      else set.add(t.id)
                      s.teamIds = teams.map((x) => x.id).filter((id) => set.has(id))
                    })
                  }
                  className={`flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-[13.5px] font-semibold transition-colors ${on ? 'border-brass-400/60 bg-brass-400/12 text-parchment-50' : 'border-ink-700 text-stone-400 hover:border-ink-600 hover:text-parchment-100'}`}
                >
                  {on && <Check className="size-3.5 text-brass-400" strokeWidth={3} aria-hidden />}
                  {t.name}
                </button>
              )
            })}
          </div>
        </Card>
        <Card className="p-5">
          <SectionTitle>პასუხების ჩვენება</SectionTitle>
          <Segmented<AnswerMode>
            value={stage.answerMode}
            onChange={(v) => patchStage(stage.id, (s) => (s.answerMode = v))}
            options={[
              { value: 'each', label: 'ყოველი კითხვის შემდეგ' },
              { value: 'end', label: 'ტურის ბოლოს' },
            ]}
          />
          <p className="mt-3 text-[13px] leading-relaxed text-stone-400">
            ტურის ბოლოს ყოველთვის ჩანს ყველა პასუხის სია და შედეგები. ორ ტურს შორის — შესვენება.
          </p>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        {stage.blocks.map((b, bi) => (
          <BlockEditor key={b.id} stage={stage} block={b} index={bi} />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-dashed border-ink-600 p-4">
        <span className="mr-2 self-center text-[13.5px] text-stone-400">დაამატეთ:</span>
        {(['regular', 'blitz', 'superblitz'] as BlockKind[]).map((k) => (
          <Button
            key={k}
            onClick={() =>
              patchStage(stage.id, (s) => {
                const n = s.blocks.filter((x) => x.kind === 'regular').length + 1
                s.blocks.push(makeBlock(k, k === 'regular' ? `ტური ${n}` : undefined))
              })
            }
          >
            <Plus className="size-4" aria-hidden /> {k === 'regular' ? 'ტური' : KIND_LABEL[k]} · {KIND_DEFAULTS[k].count} კითხვა
          </Button>
        ))}
      </div>
    </>
  )
}

function BlockEditor({ stage, block, index }: { stage: Stage; block: Block; index: number }) {
  const [allTimer, setAllTimer] = useState(block.questions[0]?.timer ?? 60)
  return (
    <Card className="p-4 lg:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="num text-3xl leading-none text-brass">{index + 1}</span>
        <Input
          value={block.title}
          onChange={(e) => patchBlock(stage.id, block.id, (b) => (b.title = e.target.value))}
          aria-label="ტურის სახელი"
          className="max-w-64 font-display font-semibold"
        />
        <Segmented<BlockKind>
          value={block.kind}
          onChange={(v) => patchBlock(stage.id, block.id, (b) => (b.kind = v))}
          options={[
            { value: 'regular', label: 'ჩვეულებრივი' },
            { value: 'blitz', label: 'ბლიცი' },
            { value: 'superblitz', label: 'სუპერბლიცი' },
          ]}
        />
        <div className="flex items-center gap-2 text-[13px] text-stone-300">
          <span>ყველას დრო:</span>
          <input
            type="number"
            min={5}
            value={allTimer}
            onChange={(e) => setAllTimer(Number(e.target.value))}
            className="h-8 w-16 rounded-md border border-ink-700 bg-ink-900 px-2 text-center text-parchment-100 focus:border-brass-400/70 focus:outline-none"
            aria-label="ყველა კითხვის დრო წამებში"
          />
          <Button size="sm" onClick={() => patchBlock(stage.id, block.id, (b) => b.questions.forEach((q) => (q.timer = allTimer)))}>
            მინიჭება
          </Button>
        </div>
        <div className="ml-auto flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            disabled={index === 0}
            aria-label="ტური ზემოთ"
            onClick={() => patchStage(stage.id, (s) => ([s.blocks[index - 1], s.blocks[index]] = [s.blocks[index], s.blocks[index - 1]]))}
          >
            <ArrowUp className="size-4" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={index === stage.blocks.length - 1}
            aria-label="ტური ქვემოთ"
            onClick={() => patchStage(stage.id, (s) => ([s.blocks[index + 1], s.blocks[index]] = [s.blocks[index], s.blocks[index + 1]]))}
          >
            <ArrowDown className="size-4" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              if (!confirm(`წაიშალოს «${block.title}» და მისი ${block.questions.length} კითხვა?`)) return
              patchStage(stage.id, (s) => (s.blocks = s.blocks.filter((x) => x.id !== block.id)))
            }}
          >
            <Trash2 className="size-4" aria-hidden /> წაშლა
          </Button>
        </div>
      </div>
      <div className="grid gap-4 2xl:grid-cols-2">
        {block.questions.map((q, i) => (
          <QuestionEditor key={q.id} stage={stage} block={block} q={q} index={i} />
        ))}
      </div>
      <Button
        className="mt-4"
        onClick={() => patchBlock(stage.id, block.id, (b) => b.questions.push(makeQuestion(b.questions.at(-1)?.timer ?? KIND_DEFAULTS[b.kind].timer)))}
      >
        <Plus className="size-4" aria-hidden /> კითხვის დამატება
      </Button>
    </Card>
  )
}

function QuestionEditor({ stage, block, q, index }: { stage: Stage; block: Block; q: Question; index: number }) {
  const set = (patch: Partial<Question>) => patchQuestion(stage.id, block.id, q.id, patch)
  const num = questionNumber(stage, block.id, index)
  const ready = !!(q.answerText.trim() || q.answerImage)
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900/70 p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="num w-10 text-3xl leading-none text-brass">{num}</span>
        <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${ready ? 'bg-sage-400/12 text-sage-400' : 'bg-ink-800 text-stone-400'}`}>
          {ready ? 'მზადაა' : 'პასუხი აკლია'}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <label className="flex items-center gap-1.5 text-[12.5px] text-stone-400">
            დრო
            <input
              type="number"
              min={5}
              value={q.timer}
              onChange={(e) => set({ timer: Math.max(1, Number(e.target.value)) })}
              className="h-8 w-14 rounded-md border border-ink-700 bg-ink-900 px-1.5 text-center text-parchment-100 focus:border-brass-400/70 focus:outline-none"
            />
          </label>
          <label className="ml-2 flex items-center gap-1.5 text-[12.5px] text-stone-400">
            ქულა
            <input
              type="number"
              min={0}
              step={0.5}
              value={q.points}
              onChange={(e) => set({ points: Math.max(0, Number(e.target.value)) })}
              className="h-8 w-12 rounded-md border border-ink-700 bg-ink-900 px-1.5 text-center text-parchment-100 focus:border-brass-400/70 focus:outline-none"
            />
          </label>
          <Button
            size="sm"
            variant="ghost"
            className="ml-1"
            disabled={index === 0}
            aria-label="ზემოთ"
            onClick={() => patchBlock(stage.id, block.id, (b) => ([b.questions[index - 1], b.questions[index]] = [b.questions[index], b.questions[index - 1]]))}
          >
            <ArrowUp className="size-4" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-label={`კითხვა ${num} — წაშლა`}
            onClick={() => {
              const hasContent = q.hostText || q.answerText || q.image || q.answerImage || q.comment
              if (hasContent && !confirm(`წაიშალოს კითხვა ${num}?`)) return
              patchBlock(stage.id, block.id, (b) => (b.questions = b.questions.filter((x) => x.id !== q.id)))
            }}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <p className="font-display text-[11px] font-semibold tracking-[0.18em] text-stone-400">ᲙᲘᲗᲮᲕᲐ</p>
          <ImageDrop value={q.image} onChange={(id) => set({ image: id })} label="სურათი ეკრანზე" className="aspect-[16/10]" />
          <Textarea
            value={q.hostText}
            onChange={(e) => set({ hostText: e.target.value })}
            placeholder="კითხვის ტექსტი — მხოლოდ წამყვანისთვის, ეკრანზე არ ჩანს"
            aria-label="კითხვის ტექსტი"
            rows={3}
          />
        </div>
        <div className="flex flex-col gap-3">
          <p className="font-display text-[11px] font-semibold tracking-[0.18em] text-sage-400">ᲞᲐᲡᲣᲮᲘ</p>
          <Input value={q.answerText} onChange={(e) => set({ answerText: e.target.value })} placeholder="სწორი პასუხი" aria-label="პასუხი" className="font-display text-[15.5px] font-semibold" />
          <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3">
            <ImageDrop value={q.answerImage} onChange={(id) => set({ answerImage: id })} label="სურათი" compact className="aspect-square" />
            <Textarea
              value={q.comment}
              onChange={(e) => set({ comment: e.target.value })}
              placeholder="კომენტარი (არასავალდებულო) — გამოჩნდება პასუხის ქვეშ"
              aria-label="კომენტარი"
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
