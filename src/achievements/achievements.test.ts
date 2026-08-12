import { describe, expect, it } from 'vitest'

import type { DecisionHistoryItem, DecisionMode } from '../types/decision'
import { evaluateAchievements } from './achievements'

function makeHistory(modes: DecisionMode[], regrettedIndexes: number[] = []): DecisionHistoryItem[] {
  return modes.map((mode, index) => ({
    id: `decision-${index}`,
    createdAt: new Date(2026, 7, 13, 12, modes.length - index).toISOString(),
    question: '测试决定',
    options: [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ],
    mode,
    winner: { id: 'a', label: 'A' },
    explanation: '测试结果',
    confidence: 80,
    metrics: [],
    shareCount: 0,
    ...(regrettedIndexes.includes(index)
      ? { regrettedAt: new Date(2026, 7, 13, 13).toISOString() }
      : {}),
  }))
}

function achievement(history: DecisionHistoryItem[], id: string) {
  return evaluateAchievements(history).find((entry) => entry.id === id)
}

describe('evaluateAchievements', () => {
  it('unlocks the first and ten-decision milestones at their exact thresholds', () => {
    expect(achievement([], 'first-decision')).toMatchObject({ progress: 0, unlocked: false })
    expect(achievement(makeHistory(['random']), 'first-decision')?.unlocked).toBe(true)
    expect(achievement(makeHistory(Array<DecisionMode>(10).fill('random')), 'ten-decisions'))
      .toMatchObject({ progress: 10, target: 10, unlocked: true })
  })

  it('unlocks each mode-specific achievement from real mode counts', () => {
    expect(achievement(makeHistory(Array<DecisionMode>(20).fill('random')), 'random-servant')?.unlocked).toBe(true)
    expect(achievement(makeHistory(Array<DecisionMode>(10).fill('scientific')), 'science-believer')?.unlocked).toBe(true)
    expect(achievement(makeHistory(Array<DecisionMode>(10).fill('mystic')), 'mystic-reader')?.unlocked).toBe(true)
  })

  it('requires the newest five decisions to exist and have no regret', () => {
    const five = makeHistory(['random', 'scientific', 'mystic', 'random', 'scientific'])
    expect(achievement(five.slice(0, 4), 'obedient-five')?.unlocked).toBe(false)
    expect(achievement(five, 'obedient-five')).toMatchObject({ progress: 5, unlocked: true })
    expect(achievement(makeHistory(
      ['random', 'scientific', 'mystic', 'random', 'scientific'],
      [0],
    ), 'obedient-five')).toMatchObject({ progress: 0, unlocked: false })
  })
})
