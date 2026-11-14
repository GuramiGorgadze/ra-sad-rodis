import { Cloud, CloudOff, HardDrive, KeyRound, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { login, useCloud } from '../lib/cloud'
import { Mark } from './Ring'
import { Button } from './ui'

/** Small save indicator for the app header. */
export function SaveStatus() {
  const { mode, status, savedAt } = useCloud()
  if (mode === 'checking') return null
  if (mode === 'local')
    return (
      <span className="hidden items-center gap-1.5 text-[12.5px] text-stone-400 lg:flex" title="მონაცემები ინახება მხოლოდ ამ ბრაუზერში">
        <HardDrive className="size-3.5" aria-hidden /> ამ ბრაუზერში
      </span>
    )
  const time = savedAt ? new Date(savedAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''
  return (
    <span role="status" className="hidden items-center gap-1.5 text-[12.5px] lg:flex">
      {status === 'saving' ? (
        <>
          <LoaderCircle className="size-3.5 animate-spin text-brass-400" aria-hidden />
          <span className="text-stone-300">ინახება…</span>
        </>
      ) : status === 'error' ? (
        <>
          <CloudOff className="size-3.5 text-ember-400" aria-hidden />
          <span className="text-ember-300">ვერ შეინახა — ვცდით თავიდან</span>
        </>
      ) : (
        <>
          <Cloud className="size-3.5 text-sage-400" aria-hidden />
          <span className="text-stone-300">შენახულია ონლაინ{time && ` · ${time}`}</span>
        </>
      )}
    </span>
  )
}

export function Splash() {
  return (
    <div className="flex h-full items-center justify-center bg-ink-950">
      <Mark className="size-14 animate-pulse" />
    </div>
  )
}

export function LoginScreen({ role }: { role: 'app' | 'screen' }) {
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const r = await login(pw, role)
    setBusy(false)
    if (r === 'wrong') setMsg('პაროლი არასწორია.')
    if (r === 'wait') setMsg('ბევრი მცდელობა — სცადეთ ერთ წუთში.')
    if (r === 'offline') setMsg('სერვერთან კავშირი ვერ დამყარდა.')
  }
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-ink-950 px-6">
      <div className="pointer-events-none absolute inset-0" style={{ background: 'var(--screen-spot)' }} />
      <form onSubmit={submit} className="relative w-full max-w-sm rounded-2xl border border-ink-700 bg-ink-900/90 p-7 shadow-2xl">
        <Mark className="mx-auto size-12" />
        <h1 className="mt-5 text-center font-display text-2xl font-semibold text-parchment-100">
          რა<span className="text-brass-400">?</span> სად<span className="text-brass-400">?</span> როდის
          <span className="text-brass-400">?</span>
        </h1>
        <p className="mt-2 text-center text-[13.5px] text-stone-400">შეიყვანეთ პაროლი, რომ გახსნათ შენახული თამაში.</p>
        <label htmlFor="pw" className="mt-6 block text-[12.5px] font-semibold text-stone-300">
          პაროლი
        </label>
        <div className="relative mt-1.5">
          <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" aria-hidden />
          <input
            id="pw"
            type="password"
            autoFocus
            autoComplete="current-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="h-11 w-full rounded-lg border border-ink-700 bg-ink-950 pr-3 pl-9 text-parchment-100 focus:border-brass-400/70 focus:ring-2 focus:ring-brass-400/25 focus:outline-none"
          />
        </div>
        {msg && (
          <p role="alert" className="mt-2 text-[13px] text-ember-300">
            {msg}
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" disabled={busy || !pw} className="mt-5 w-full">
          {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />} შესვლა
        </Button>
      </form>
    </div>
  )
}
