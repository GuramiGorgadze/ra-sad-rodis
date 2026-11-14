import { motion } from 'motion/react'
import { useId } from 'react'

const TAU = Math.PI * 2

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p0 = [cx + r * Math.sin(a0), cy - r * Math.cos(a0)]
  const p1 = [cx + r * Math.sin(a1), cy - r * Math.cos(a1)]
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M ${p0[0]} ${p0[1]} A ${r} ${r} 0 ${large} 1 ${p1[0]} ${p1[1]}`
}

/**
 * The ring of sectors from the game table. Each question of the round is one sector:
 * played sectors are dim brass, the current one glows, the rest are outlines.
 */
export function SectorRing({
  count,
  current,
  className,
  animateIn = true,
}: {
  count: number
  current: number
  className?: string
  animateIn?: boolean
}) {
  const gid = useId().replace(/:/g, '')
  const n = Math.max(1, count)
  const gap = n === 1 ? 0 : Math.min(0.06, (TAU / n) * 0.12)
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff1c9" />
          <stop offset=".55" stopColor="#e3b65c" />
          <stop offset="1" stopColor="#9c6f22" />
        </linearGradient>
        <filter id={`f${gid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>
      {Array.from({ length: n }, (_, i) => {
        const a0 = (i / n) * TAU + gap / 2
        const a1 = ((i + 1) / n) * TAU - gap / 2
        const d = arcPath(100, 100, 92, a0, a1)
        const isCur = i === current
        const done = i < current
        return (
          <g key={i}>
            {isCur && <path d={d} stroke={`url(#g${gid})`} strokeWidth="7" fill="none" filter={`url(#f${gid})`} opacity=".8" />}
            <motion.path
              d={d}
              fill="none"
              strokeLinecap="butt"
              stroke={isCur ? `url(#g${gid})` : done ? '#c9963a' : 'rgb(227 182 92 / 0.16)'}
              strokeOpacity={done ? 0.5 : 1}
              strokeWidth={isCur ? 6 : 3.2}
              initial={animateIn ? { pathLength: 0, opacity: 0 } : false}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: animateIn ? 0.15 + i * 0.045 : 0, ease: [0.16, 1, 0.3, 1] }}
            />
          </g>
        )
      })}
    </svg>
  )
}

/** Thin countdown arc that sits inside the sector ring. */
export function TimerArc({ fraction, warn, className }: { fraction: number; warn: boolean; className?: string }) {
  const r = 82
  const c = TAU * r
  const f = Math.max(0, Math.min(1, fraction))
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <circle cx="100" cy="100" r={r} fill="none" stroke="rgb(227 182 92 / 0.10)" strokeWidth="1.6" />
      <circle
        cx="100"
        cy="100"
        r={r}
        fill="none"
        stroke={warn ? '#ff6b4a' : '#e3b65c'}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - f)}
        transform="rotate(-90 100 100)"
        style={{ filter: `drop-shadow(0 0 3px ${warn ? 'rgb(255 107 74 / .8)' : 'rgb(227 182 92 / .6)'})` }}
      />
      {/* moving tip */}
      {f > 0.002 && (
        <circle
          cx={100 + r * Math.sin(TAU * f)}
          cy={100 - r * Math.cos(TAU * f)}
          r="2.6"
          fill={warn ? '#ffd9cc' : '#fff4d6'}
        />
      )}
    </svg>
  )
}

/** The round game table with 13 sectors and the arrow — our own background motif. */
export function TableMotif({ className }: { className?: string }) {
  const n = 13
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true">
      <g fill="none" stroke="#e3b65c">
        <circle cx="200" cy="200" r="196" strokeWidth=".6" />
        <circle cx="200" cy="200" r="150" strokeWidth=".5" />
        <circle cx="200" cy="200" r="52" strokeWidth=".6" />
        {Array.from({ length: n }, (_, i) => {
          const a = (i / n) * TAU
          return (
            <line
              key={i}
              x1={200 + 52 * Math.sin(a)}
              y1={200 - 52 * Math.cos(a)}
              x2={200 + 196 * Math.sin(a)}
              y2={200 - 196 * Math.cos(a)}
              strokeWidth=".5"
            />
          )
        })}
        {Array.from({ length: n }, (_, i) => {
          const a = ((i + 0.5) / n) * TAU
          return <circle key={`d${i}`} cx={200 + 173 * Math.sin(a)} cy={200 - 173 * Math.cos(a)} r="5" strokeWidth=".6" />
        })}
      </g>
      <path d="M200 120 L206 200 L200 280 L194 200Z" fill="#e3b65c" opacity=".55" />
      <circle cx="200" cy="200" r="6" fill="none" stroke="#e3b65c" strokeWidth="1" />
    </svg>
  )
}

/** Small brand mark: table ring + arrow. */
export function Mark({ className }: { className?: string }) {
  const n = 13
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="none" stroke="#e3b65c" strokeWidth="2.2" />
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * TAU
        return (
          <line
            key={i}
            x1={32 + 21 * Math.sin(a)}
            y1={32 - 21 * Math.cos(a)}
            x2={32 + 26 * Math.sin(a)}
            y2={32 - 26 * Math.cos(a)}
            stroke="#e3b65c"
            strokeOpacity=".55"
            strokeWidth="1.4"
          />
        )
      })}
      <path d="M32 12 L35.2 32 L32 52 L28.8 32Z" fill="#e3b65c" />
      <circle cx="32" cy="32" r="2.6" fill="#0d0b09" stroke="#e3b65c" strokeWidth="1.2" />
    </svg>
  )
}
