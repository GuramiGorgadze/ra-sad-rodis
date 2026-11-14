export type ID = string

export interface Team {
  id: ID
  name: string
}

export interface Question {
  id: ID
  /** Text only the host sees (to read aloud). Never projected. */
  hostText: string
  /** Picture shown on the projector together with the question number. */
  image: ID | null
  answerText: string
  answerImage: ID | null
  /** Optional explanation shown under the answer. */
  comment: string
  points: number
  /** Seconds for the discussion timer. */
  timer: number
}

export type BlockKind = 'regular' | 'blitz' | 'superblitz'

export interface Block {
  id: ID
  title: string
  kind: BlockKind
  questions: Question[]
}

export type AnswerMode = 'each' | 'end'

export interface Stage {
  id: ID
  title: string
  teamIds: ID[]
  /** 'each' — answer right after every question; 'end' — all answers after the block. */
  answerMode: AnswerMode
  blocks: Block[]
}

export interface Settings {
  eventTitle: string
  eventSubtitle: string
  soundOn: boolean
  volume: number
  /** Results reveal row by row (last place first) with the Next button. */
  stepwiseResults: boolean
  breakMinutes: number
}

export interface Game {
  version: 1
  settings: Settings
  teams: Team[]
  stages: Stage[]
}

/** scores[stageId][questionId][teamId] = true when the team answered correctly. */
export interface Scores {
  marks: Record<ID, Record<ID, Record<ID, boolean>>>
  /** Manual +/- adjustments per stage per team. */
  adjust: Record<ID, Record<ID, number>>
}

export type Scene =
  | 'title'
  | 'teams'
  | 'block'
  | 'question'
  | 'answer'
  | 'recap'
  | 'results'
  | 'break'
  | 'blank'

export interface TimerState {
  /** Increments every time a timer is (re)started — used to trigger sounds once. */
  id: number
  duration: number
  /** Epoch ms when it will hit zero, or null when paused / idle. */
  endsAt: number | null
  /** Remaining ms while paused. null when idle or running. */
  pausedLeft: number | null
}

export interface Show {
  scene: Scene
  stageId: ID | null
  blockId: ID | null
  qIndex: number
  /** Number of result rows revealed (counted from the bottom). -1 = all. */
  reveal: number
  timer: TimerState
  breakEndsAt: number | null
  /** true while a quick screen (results, blank…) is shown outside the run of show */
  quick?: boolean
}
