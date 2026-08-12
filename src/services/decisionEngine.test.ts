import { describe, expect, it } from 'vitest'

import type { Criterion, DecisionOption, ScientificScoreMap } from '../types/decision'
import {
  createMysticResult,
  createRandomResult,
  createScientificResult,
} from './decisionEngine'

const options: DecisionOption[] = [
  { id: 'hotpot', label: '火锅' },
  { id: 'sushi', label: '日料' },
]

const metadata = {
  question: '今晚吃什么？',
  now: () => new Date('2026-08-12T12:00:00.000Z'),
  makeId: () => 'decision-1',
}

describe('decisionEngine', () => {
  it('builds a complete random result from an equal-probability draw', () => {
    const result = createRandomResult({ ...metadata, options, random: () => 0 })

    expect(result.id).toBe('decision-1')
    expect(result.winner.label).toBe('火锅')
    expect(result.mode).toBe('random')
    expect(result.explanation).toContain('2 个候选项')
  })

  it('builds a local mystic result with an entertainment disclaimer', () => {
    const result = createMysticResult({ ...metadata, options, random: () => 0.5 })

    expect(result.winner.label).toBe('日料')
    expect(result.mode).toBe('mystic')
    expect(result.disclaimer).toContain('仅供娱乐')
  })

  it('builds a scientific result with a full ranking', () => {
    const criteria: Criterion[] = [
      { id: 'taste', name: '喜欢程度', weight: 60 },
      { id: 'price', name: '价格', weight: 40 },
    ]
    const scores: ScientificScoreMap = {
      hotpot: { taste: 8, price: 7 },
      sushi: { taste: 7, price: 9 },
    }
    const result = createScientificResult({ ...metadata, options, criteria, scores })

    expect(result.winner.label).toBe('日料')
    expect(result.ranking?.map((item) => item.label)).toEqual(['日料', '火锅'])
    expect(result.explanation).toContain('7.8')
  })
})
