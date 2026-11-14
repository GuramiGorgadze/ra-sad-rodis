import { KIND_LABEL, mt } from './defaults'
import type { Block, Game, ID, Scene, Show, Stage } from './types'

/** One "slide" in the run of show. Next / Previous walk through these in order. */
export interface Step {
  key: string
  scene: Scene
  stageId: ID
  blockId: ID | null
  qIndex: number
  label: string
}

export const stepKey = (s: { scene: Scene; stageId: ID | null; blockId: ID | null; qIndex: number }) => {
  const noBlock = s.scene === 'title' || s.scene === 'teams'
  const noQ = noBlock || s.scene === 'block' || s.scene === 'recap' || s.scene === 'break'
  return `${s.scene}|${s.stageId ?? ''}|${noBlock ? '' : (s.blockId ?? '')}|${noQ ? 0 : s.qIndex}`
}

export function needsBlockIntro(stage: Stage, block: Block) {
  return stage.blocks.length > 1 || block.kind !== 'regular'
}

export function buildSequence(game: Game): Step[] {
  const out: Step[] = []
  const push = (scene: Scene, stageId: ID, blockId: ID | null, qIndex: number, label: string) =>
    out.push({ key: stepKey({ scene, stageId, blockId, qIndex }), scene, stageId, blockId, qIndex, label })

  for (const stage of game.stages) {
    push('title', stage.id, null, 0, 'სათაური')
    push('teams', stage.id, null, 0, 'გუნდები')
    stage.blocks.forEach((block, bi) => {
      const n = block.questions.length
      if (needsBlockIntro(stage, block)) push('block', stage.id, block.id, 0, block.title || KIND_LABEL[block.kind])
      if (stage.answerMode === 'each') {
        for (let i = 0; i < n; i++) {
          push('question', stage.id, block.id, i, `კითხვა ${i + 1}`)
          push('answer', stage.id, block.id, i, `პასუხი ${i + 1}`)
        }
      } else {
        for (let i = 0; i < n; i++) push('question', stage.id, block.id, i, `კითხვა ${i + 1}`)
        for (let i = 0; i < n; i++) push('answer', stage.id, block.id, i, `პასუხი ${i + 1}`)
      }
      if (n > 1) push('recap', stage.id, block.id, 0, 'ყველა პასუხი')
      push('results', stage.id, block.id, Math.max(0, n - 1), 'შედეგები')
      if (bi < stage.blocks.length - 1) push('break', stage.id, block.id, 0, 'შესვენება')
    })
  }
  return out
}

export function findStep(seq: Step[], show: Pick<Show, 'scene' | 'stageId' | 'blockId' | 'qIndex'>) {
  const k = stepKey(show)
  return seq.findIndex((s) => s.key === k)
}

export function getStage(game: Game, id: ID | null) {
  return game.stages.find((s) => s.id === id) ?? null
}

export function getBlock(game: Game, stageId: ID | null, blockId: ID | null) {
  const st = getStage(game, stageId)
  return st?.blocks.find((b) => b.id === blockId) ?? null
}

/** How many questions of this stage have been played up to (block, qIndex) inclusive. */
export function questionsPlayed(stage: Stage, blockId: ID | null, qIndex: number) {
  let n = 0
  for (const b of stage.blocks) {
    if (b.id === blockId) return n + Math.min(qIndex + 1, b.questions.length)
    n += b.questions.length
  }
  return n
}

/** Global number of a question inside its stage (1-based, continues across blocks of the same kind). */
export function questionNumber(stage: Stage, blockId: ID | null, qIndex: number) {
  let n = 0
  for (const b of stage.blocks) {
    if (b.id === blockId) return b.kind === 'regular' ? n + qIndex + 1 : qIndex + 1
    if (b.kind === 'regular') n += b.questions.length
  }
  return qIndex + 1
}

export function stageLabel(game: Game, stageId: ID | null, blockId?: ID | null) {
  const stage = getStage(game, stageId)
  if (!stage) return ''
  const block = blockId ? stage.blocks.find((b) => b.id === blockId) : null
  const parts = [stage.title]
  if (block && stage.blocks.length > 1) parts.push(block.title || KIND_LABEL[block.kind])
  return mt(parts.join(' · '))
}
