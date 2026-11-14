import { motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { mt } from '../lib/defaults'
import { useImageUrl } from '../lib/media'

/** Georgian capitals (Mtavruli), letter-spaced. */
export function Caps({ children, className = '' }: { children: string; className?: string }) {
  return <span className={`caps ${className}`}>{mt(children)}</span>
}

/** Number that counts up smoothly when it changes. */
export function CountUp({ value, delay = 0, duration = 900 }: { value: number; delay?: number; duration?: number }) {
  const [shown, setShown] = useState(0)
  const from = useRef(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now() + delay * 1000
    const a = from.current
    const step = (t: number) => {
      const p = Math.max(0, Math.min(1, (t - start) / duration))
      const e = 1 - Math.pow(1 - p, 3)
      const v = a + (value - a) * e
      setShown(v)
      from.current = v
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, delay, duration])
  const rounded = Number.isInteger(value) ? Math.round(shown) : Math.round(shown * 10) / 10
  return <>{rounded}</>
}

/** Picture stored in IndexedDB, faded in once decoded. */
export function StoredImage({
  id,
  className = '',
  alt = '',
  fit = 'contain',
}: {
  id: string | null
  className?: string
  alt?: string
  fit?: 'contain' | 'cover'
}) {
  const url = useImageUrl(id)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => setLoaded(false), [url])
  if (!url) return null
  return (
    <motion.img
      src={url}
      alt={alt}
      draggable={false}
      onLoad={() => setLoaded(true)}
      initial={{ opacity: 0, scale: 0.985 }}
      animate={loaded ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.985 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`${fit === 'cover' ? 'object-cover' : 'object-contain'} ${className}`}
    />
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.6em] items-center justify-center rounded border border-ink-600 bg-ink-800 px-1.5 py-0.5 font-sans text-[0.75em] font-semibold text-stone-300">
      {children}
    </kbd>
  )
}
