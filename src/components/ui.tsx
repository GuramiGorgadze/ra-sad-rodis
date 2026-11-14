import { MonitorPlay, PencilRuler, SlidersHorizontal, Table2 } from 'lucide-react'
import { Children } from 'react'
import { mt } from '../lib/defaults'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { useStore } from '../lib/store'
import { Mark } from './Ring'
import { SaveStatus } from './cloudui'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg' | 'xl'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-brass-400 text-ink-950 hover:bg-brass-300 active:bg-brass-500 shadow-[0_1px_0_rgb(255_255_255/0.25)_inset]',
  secondary: 'bg-ink-800 text-parchment-100 border border-ink-700 hover:bg-ink-750 hover:border-ink-600 active:bg-ink-700',
  ghost: 'text-stone-300 hover:bg-ink-800 hover:text-parchment-100',
  danger: 'bg-ember-400/10 text-ember-300 border border-ember-400/30 hover:bg-ember-400/20',
  success: 'bg-sage-400 text-ink-950 hover:bg-sage-300',
}
const SIZE: Record<Size, string> = {
  sm: 'h-8 px-2.5 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-3.5 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-5 text-[15px] gap-2.5 rounded-xl',
  xl: 'h-16 px-6 text-lg gap-3 rounded-2xl',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex shrink-0 cursor-pointer items-center justify-center font-semibold whitespace-nowrap transition-[background,color,border,transform] duration-150 select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${VARIANT[variant]} ${SIZE[size]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Field({ label, hint, children, className = '' }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="text-[12.5px] font-semibold text-stone-300">{label}</span>
      {children}
      {hint && <span className="text-xs leading-snug text-stone-400">{hint}</span>}
    </label>
  )
}

const INPUT =
  'w-full rounded-lg border border-ink-700 bg-ink-900 px-3 text-[14.5px] text-parchment-100 placeholder:text-ink-500 transition-colors hover:border-ink-600 focus:border-brass-400/70 focus:outline-none focus:ring-2 focus:ring-brass-400/25'

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={`h-10 ${INPUT} ${className}`} />
}

export function Textarea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={`min-h-[72px] resize-y py-2 leading-relaxed ${INPUT} ${className}`} />
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className = '',
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div role="radiogroup" className={`inline-flex rounded-lg border border-ink-700 bg-ink-900 p-0.5 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-8 cursor-pointer rounded-md px-3 text-[13px] font-semibold transition-colors ${value === o.value ? 'bg-ink-700 text-parchment-100 shadow' : 'text-stone-400 hover:text-parchment-100'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-ink-700/80 bg-ink-850 ${className}`}>{children}</section>
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="font-display text-[13px] font-semibold tracking-[0.16em] text-brass-400">
        {Children.map(children, (c) => (typeof c === 'string' ? mt(c) : c))}
      </h3>
      {aside}
    </div>
  )
}

export function openScreenWindow() {
  window.open('#/screen', 'rsr-screen', 'popup,width=1280,height=720')
}

const NAV = [
  { href: '#/control', label: 'პულტი', icon: SlidersHorizontal },
  { href: '#/scores', label: 'ქულები', icon: Table2 },
  { href: '#/editor', label: 'რედაქტორი', icon: PencilRuler },
]

export function AppHeader({ route, right }: { route: string; right?: ReactNode }) {
  const err = useStore((s) => s.storageError)
  return (
    <header className="sticky top-0 z-30 border-b border-ink-700/80 bg-ink-900/90 backdrop-blur">
      <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
        <a href="#/" className="flex cursor-pointer items-center gap-2.5">
          <Mark className="size-7" />
          <span className="font-display text-[15px] font-semibold tracking-wide text-parchment-100">
            რა<span className="text-brass-400">?</span> სად<span className="text-brass-400">?</span> როდის
            <span className="text-brass-400">?</span>
          </span>
        </a>
        <nav className="ml-2 flex items-center gap-1" aria-label="მთავარი ნავიგაცია">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = route === href.slice(1)
            return (
              <a
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-9 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors ${active ? 'bg-ink-800 text-parchment-100 ring-1 ring-ink-700' : 'text-stone-400 hover:bg-ink-850 hover:text-parchment-100'}`}
              >
                <Icon className={`size-4 ${active ? 'text-brass-400' : ''}`} aria-hidden />
                <span className="hidden sm:inline">{label}</span>
              </a>
            )
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <SaveStatus />
          {right}
          <Button variant="primary" onClick={openScreenWindow}>
            <MonitorPlay className="size-4" aria-hidden /> <span className="hidden md:inline">პროექტორის ეკრანი</span>
          </Button>
        </div>
      </div>
      {err && (
        <div className="bg-ember-600/30 px-6 py-1.5 text-center text-[13px] text-ember-300">
          მონაცემების შენახვა ვერ მოხერხდა (მეხსიერება სავსეა?). გააკეთეთ სარეზერვო ასლი რედაქტორში.
        </div>
      )}
    </header>
  )
}
