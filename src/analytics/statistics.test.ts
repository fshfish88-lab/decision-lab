import { describe, expect, it } from 'vitest'

import type { DecisionHistoryItem, DecisionMode } from '../types/decision'
import { calculateStatistics } from './statistics'

function item(
  id: string,
  mode: DecisionMode,
  createdAt: Date,
  regretted = false,
): DecisionHistoryItem {
  return {
    id,
    createdAt: createdAt.toISOString(),
    question: '今天吃什么？',
    options: [
      { id: 'hotpot', label: '火锅' },
      { id: 'sushi', label: '日料' },
    ],
    mode,
    winner: { id: 'hotpot', label: '火锅' },
    explanation: '系统已经替你决定。',
    confidence: 88,
    metrics: [],
    shareCount: 0,
    ...(regretted ? { regrettedAt: createdAt.toISOString() } : {}),
  }
}

describe('calculateStatistics', () => {
  it('calculates current-month KPIs, tied favorite modes, and the seven-day trend', () => {
    const now = new Date(2026, 7, 13, 12)
    const history = [
      item('1', 'random', new Date(2026, 7, 13, 8), true),
      item('2', 'scientific', new Date(2026, 7, 13, 9)),
    ]

    const summary = calculateStatistics(history, now)

    expect(summary).toMatchObject({
      totalCount: 2,
      monthCount: 2,
      regretCount: 1,
      obedienceRate: 50,
      favoriteModes: ['random', 'scientific'],
    })
    expect(summary.trend).toHaveLength(7)
    expect(summary.trend.at(-1)).toMatchObject({ dateKey: '2026-08-13', count: 2 })
  })

  it('returns an honest empty summary', () => {
    const summary = calculateStatistics([], new Date(2026, 7, 13, 12))

    expect(summary.obedienceRate).toBeNull()
    expect(summary.favoriteModes).toEqual([])
    expect(summary.distribution.every((entry) => entry.count === 0)).toBe(true)
    expect(summary.trend.every((entry) => entry.count === 0)).toBe(true)
  })

  it('separates current-month, all-time, and recent-seven-day boundaries', () => {
    const now = new Date(2026, 7, 13, 12)
    const history = [
      item('today', 'random', new Date(2026, 7, 13, 8)),
      item('recent', 'random', new Date(2026, 7, 8, 8)),
      item('older-month', 'mystic', new Date(2026, 6, 30, 8)),
    ]

    const summary = calculateStatistics(history, now)

    expect(summary.totalCount).toBe(3)
    expect(summary.monthCount).toBe(2)
    expect(summary.favoriteModes).toEqual(['random'])
    expect(summary.distribution.find((entry) => entry.mode === 'random')).toMatchObject({
      count: 2,
      percentage: 66.7,
    })
    expect(summary.trend.reduce((sum, entry) => sum + entry.count, 0)).toBe(2)
  })
})
