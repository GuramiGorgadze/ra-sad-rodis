import { ArrowRight, MonitorPlay, PencilRuler, SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Kbd } from './components/bits'
import { Mark, TableMotif } from './components/Ring'
import { openScreenWindow } from './components/ui'
import ControlPage from './control/ControlPage'
import ScoresPage from './control/ScoresPage'
import EditorPage from './editor/EditorPage'
import ScreenPage from './screen/ScreenPage'

function useRoute() {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const f = () => setHash(location.hash)
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  const [path, query = ''] = hash.replace(/^#/, '').split('?')
  return { path: path || '/', params: new URLSearchParams(query) }
}

export default function App() {
  const { path, params } = useRoute()
  useEffect(() => {
    document.title =
      path === '/screen' ? 'ეკრანი · რა? სად? როდის?' : path === '/control' ? 'პულტი · რა? სად? როდის?' : 'რა? სად? როდის?'
  }, [path])
  if (path === '/screen') return <ScreenPage preview={params.has('preview')} />
  if (path === '/control') return <ControlPage />
  if (path === '/scores') return <ScoresPage />
  if (path === '/editor') return <EditorPage />
  return <Home />
}

function Home() {
  const cards = [
    {
      icon: MonitorPlay,
      title: 'პროექტორის ეკრანი',
      text: 'გაიხსნება ცალკე ფანჯარაში. გადაიტანეთ პროექტორზე და დააჭირეთ F-ს.',
      action: openScreenWindow,
      primary: true,
    },
    {
      icon: SlidersHorizontal,
      title: 'პულტი',
      text: 'კითხვების გადართვა, ტაიმერი, ქულები. ეს ეკრანი მხოლოდ თქვენ გიჩანთ.',
      href: '#/control',
    },
    {
      icon: PencilRuler,
      title: 'რედაქტორი',
      text: 'გუნდები, ეტაპები, კითხვების სურათები და პასუხები.',
      href: '#/editor',
    },
  ]
  return (
    <div className="relative min-h-full overflow-hidden bg-ink-950">
      <div className="pointer-events-none absolute inset-0" style={{ background: 'var(--screen-spot)' }} />
      <TableMotif className="animate-spin-slow pointer-events-none absolute top-[-30vmax] left-1/2 h-[110vmax] w-[110vmax] -translate-x-1/2 opacity-[0.06]" />
      <div className="relative mx-auto flex min-h-full max-w-6xl flex-col px-6 py-14">
        <div className="flex flex-col items-center text-center">
          <Mark className="size-16 drop-shadow-[0_0_24px_rgba(227,182,92,0.35)]" />
          <h1 className="mt-6 font-display text-5xl font-semibold tracking-wide text-parchment-100 md:text-6xl">
            რა<span className="text-brass">?</span> სად<span className="text-brass">?</span> როდის<span className="text-brass">?</span>
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-stone-300">
            სკოლის ინტელექტუალური თამაშის ეკრანი: კითხვის ნომერი და სურათი, ტაიმერი, პასუხები, შედეგები და შესვენება.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {cards.map((c) => {
            const Icon = c.icon
            const body = (
              <>
                <span
                  className={`flex size-11 items-center justify-center rounded-xl ${c.primary ? 'bg-brass-400 text-ink-950' : 'bg-ink-800 text-brass-400 ring-1 ring-ink-700'}`}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="mt-5 flex items-center gap-2 font-display text-lg font-semibold text-parchment-100">
                  {c.title}
                  <ArrowRight className="size-4 text-stone-400 transition-transform group-hover:translate-x-1 group-hover:text-brass-400" aria-hidden />
                </span>
                <span className="mt-2 text-[14px] leading-relaxed text-stone-400">{c.text}</span>
              </>
            )
            const cls = `group flex cursor-pointer flex-col rounded-2xl border p-6 text-left transition-colors ${c.primary ? 'border-brass-400/40 bg-gradient-to-b from-brass-400/[0.09] to-ink-900 hover:border-brass-400/70' : 'border-ink-700 bg-ink-900/80 hover:border-ink-600 hover:bg-ink-850'}`
            return c.href ? (
              <a key={c.title} href={c.href} className={cls}>
                {body}
              </a>
            ) : (
              <button key={c.title} onClick={c.action} className={cls}>
                {body}
              </button>
            )
          })}
        </div>

        <div className="mt-12 grid gap-6 rounded-2xl border border-ink-700/70 bg-ink-900/60 p-6 md:grid-cols-3">
          {[
            ['1', 'მოამზადეთ', 'რედაქტორში ჩაწერეთ გუნდების სახელები, ატვირთეთ სურათები და პასუხები. გააკეთეთ სარეზერვო ასლი.'],
            ['2', 'ჩართეთ პროექტორი', 'ლეპტოპზე აირჩიეთ «Extend» (Win + P). გახსენით პროექტორის ეკრანი, გადაიტანეთ მეორე ეკრანზე, დააჭირეთ F.'],
            ['3', 'წაიყვანეთ თამაში', 'პულტიდან: → შემდეგი, Space — ტაიმერი, ✓ — სწორი პასუხები. ქულები მხოლოდ თქვენთან ჩანს.'],
          ].map(([n, t, d]) => (
            <div key={n} className="flex gap-4">
              <span className="num text-4xl leading-none text-brass">{n}</span>
              <div>
                <p className="font-display font-semibold text-parchment-100">{t}</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-stone-400">{d}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-[13px] text-stone-400">
          ყველა ფანჯარა ერთსა და იმავე ბრაუზერში უნდა იყოს გახსნილი. კლავიშები პროექტორის ეკრანზე: <Kbd>←</Kbd> <Kbd>→</Kbd>{' '}
          <Kbd>Space</Kbd> <Kbd>F</Kbd> <Kbd>B</Kbd>
        </p>
      </div>
    </div>
  )
}
