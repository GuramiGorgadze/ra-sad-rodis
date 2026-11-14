import type { Block, BlockKind, Game, Question, Scores, Show, Stage, Team } from './types'

export function uid(prefix = ''): string {
  return prefix + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)
}

export const KIND_LABEL: Record<BlockKind, string> = {
  regular: 'ტური',
  blitz: 'ბლიცი',
  superblitz: 'სუპერბლიცი',
}

export const KIND_DEFAULTS: Record<BlockKind, { count: number; timer: number }> = {
  regular: { count: 10, timer: 60 },
  blitz: { count: 3, timer: 20 },
  superblitz: { count: 3, timer: 20 },
}

export function makeQuestion(timer = 60): Question {
  return {
    id: uid('q'),
    hostText: '',
    image: null,
    answerText: '',
    answerImage: null,
    comment: '',
    points: 1,
    timer,
  }
}

export function makeBlock(kind: BlockKind, title?: string, count?: number): Block {
  const d = KIND_DEFAULTS[kind]
  return {
    id: uid('b'),
    title: title ?? KIND_LABEL[kind],
    kind,
    questions: Array.from({ length: count ?? d.count }, () => makeQuestion(d.timer)),
  }
}

export function makeStage(title: string, teams: Team[], blocks: Block[]): Stage {
  return { id: uid('s'), title, teamIds: teams.map((t) => t.id), answerMode: 'each', blocks }
}

export function makeDefaultGame(): Game {
  const teams: Team[] = Array.from({ length: 8 }, (_, i) => ({ id: uid('t'), name: `გუნდი ${i + 1}` }))
  return {
    version: 1,
    settings: {
      eventTitle: 'რა? სად? როდის?',
      eventSubtitle: 'სკოლის ინტელექტუალური თამაში',
      soundOn: true,
      volume: 0.8,
      stepwiseResults: false,
      breakMinutes: 10,
    },
    teams,
    stages: [
      makeStage('პირველი დღე', teams, [makeBlock('regular', 'ტური 1')]),
      makeStage('მეორე დღე', teams.slice(0, 4), [makeBlock('regular', 'ტური 1')]),
      makeStage('ფინალი', teams.slice(0, 1), [
        makeBlock('regular', 'ძირითადი ტური'),
        makeBlock('blitz'),
        makeBlock('superblitz'),
      ]),
    ],
  }
}

export const emptyScores = (): Scores => ({ marks: {}, adjust: {} })

export const idleTimer = { id: 0, duration: 60, endsAt: null, pausedLeft: null }

export function makeDefaultShow(game: Game): Show {
  return {
    scene: 'title',
    stageId: game.stages[0]?.id ?? null,
    blockId: null,
    qIndex: 0,
    reveal: -1,
    timer: { ...idleTimer },
    breakEndsAt: null,
  }
}

/** Mkhedruli → Mtavruli (Georgian capitals), done in JS so it never depends on browser casing rules. */
export function mt(s: string): string {
  let out = ''
  for (const ch of s) {
    const c = ch.codePointAt(0)!
    if (c >= 0x10d0 && c <= 0x10fa) out += String.fromCodePoint(c + 0x0bc0)
    else if (c >= 0x10fd && c <= 0x10ff) out += String.fromCodePoint(c + 0x0bc0)
    else out += ch.toUpperCase()
  }
  return out
}

/** "1 კითხვა", "10 კითხვა" — Georgian nouns stay singular after numerals. */
export const qCount = (n: number) => `${n} კითხვა`
