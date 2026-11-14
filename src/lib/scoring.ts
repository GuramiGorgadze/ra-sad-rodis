import type { Game, ID, Scores, Stage } from './types'

export interface Standing {
  teamId: ID
  name: string
  score: number
  correct: number
  adjust: number
  place: number
}

export function stageMax(stage: Stage) {
  return stage.blocks.reduce((sum, b) => sum + b.questions.reduce((s, q) => s + (q.points || 0), 0), 0)
}

export function standings(game: Game, scores: Scores, stageId: ID | null): Standing[] {
  const stage = game.stages.find((s) => s.id === stageId)
  if (!stage) return []
  const marks = scores.marks[stage.id] ?? {}
  const adjust = scores.adjust[stage.id] ?? {}
  const rows = stage.teamIds
    .map((tid) => game.teams.find((t) => t.id === tid))
    .filter((t): t is NonNullable<typeof t> => !!t)
    .map((team) => {
      let score = 0
      let correct = 0
      for (const b of stage.blocks)
        for (const q of b.questions)
          if (marks[q.id]?.[team.id]) {
            score += q.points || 0
            correct++
          }
      const adj = adjust[team.id] ?? 0
      return { teamId: team.id, name: team.name, score: score + adj, correct, adjust: adj, place: 0 }
    })
  // keep the configured team order for ties, so the list doesn't jump around
  const order = new Map(stage.teamIds.map((id, i) => [id, i]))
  rows.sort((a, b) => b.score - a.score || order.get(a.teamId)! - order.get(b.teamId)!)
  rows.forEach((r, i) => {
    r.place = i > 0 && rows[i - 1].score === r.score ? rows[i - 1].place : i + 1
  })
  return rows
}
