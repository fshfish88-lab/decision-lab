import { describe, expect, it } from 'vitest'

import type { Criterion, DecisionOption, ScientificScoreMap } from '../types/decision'
import {
  createAiResult,
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
  it('builds a direct AI result from an existing option', () => {
    const result = createAiResult({
      ...metadata,
      options,
      context: '很累，想吃肉。',
      advice: {
        recommended_option: '火锅',
        confidence: 89,
        verdict: '今晚更适合火锅。',
        core_reasons: ['满足感优先'],
        main_tradeoff: '预算略高',
        conditions_to_reconsider: ['预算不足'],
        action_plan: ['现在去订位'],
      },
    })

    expect(result).toMatchObject({
      id: 'decision-1',
      mode: 'ai',
      winner: { label: '火锅' },
      confidence: 89,
      explanation: '今晚更适合火锅。',
      details: { type: 'ai', context: '很累，想吃肉。' },
    })
  })

  it('rejects an AI recommendation outside the current options', () => {
    expect(() => createAiResult({
      ...metadata,
      options,
      context: '很累。',
      advice: {
        recommended_option: '烧烤',
        confidence: 80,
        verdict: '建议烧烤。',
        core_reasons: [],
        main_tradeoff: '距离较远',
        conditions_to_reconsider: [],
        action_plan: [],
      },
    })).toThrow('AI 推荐项无法映射到候选项')
  })

  it('builds a complete random result from an equal-probability draw', () => {
    const result = createRandomResult({ ...metadata, options, random: () => 0 })

    expect(result.id).toBe('decision-1')
    expect(result.winner.label).toBe('火锅')
    expect(result.mode).toBe('random')
    expect(result.explanation).toContain('2 个候选项')
    expect(result.details).toEqual({
      type: 'random',
      sample: 0,
      winningIndex: 0,
      fingerprint: '0000-0000',
      drawNumber: '#000001',
      probability: 0.5,
    })
  })

  it('builds a local mystic result with an entertainment disclaimer', () => {
    const result = createMysticResult({ ...metadata, options, random: () => 0.5 })

    expect(result.winner.label).toBe('日料')
    expect(result.mode).toBe('mystic')
    expect(result.disclaimer).toContain('仅供娱乐')
    expect(result.details?.type).toBe('mystic')
    if (result.details?.type !== 'mystic') throw new Error('玄学详情缺失')
    expect(result.details.evidence).toHaveLength(3)
    expect(result.details.evidence.map((item) => item.title)).toEqual([
      '输入顺序效应',
      '字符共振',
      '平行时间线',
    ])
    expect(result.details.favorable).toContain(result.winner.label)
    expect(result.details.avoid).toContain('重新')
  })

  it('uses the current hour and minute in the mystic resonance reading', () => {
    const morning = createMysticResult({
      ...metadata,
      options,
      now: () => new Date(2026, 7, 13, 9, 15),
      random: () => 0.5,
    })
    const evening = createMysticResult({
      ...metadata,
      options,
      now: () => new Date(2026, 7, 13, 21, 45),
      random: () => 0.5,
    })

    if (morning.details?.type !== 'mystic' || evening.details?.type !== 'mystic') {
      throw new Error('玄学详情缺失')
    }
    const morningResonance = morning.details.evidence.find(
      (item) => item.key === 'character-resonance',
    )
    const eveningResonance = evening.details.evidence.find(
      (item) => item.key === 'character-resonance',
    )

    expect(morningResonance?.reading).not.toBe(eveningResonance?.reading)
    expect(morningResonance?.description).toContain('09:15')
    expect(eveningResonance?.description).toContain('21:45')
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
    expect(result.details?.type).toBe('scientific')
    if (result.details?.type !== 'scientific') throw new Error('科学详情缺失')
    expect(result.details.contributions).toEqual([
      {
        criterionId: 'taste',
        name: '喜欢程度',
        weight: 60,
        score: 7,
        contribution: 4.2,
      },
      {
        criterionId: 'price',
        name: '价格',
        weight: 40,
        score: 9,
        contribution: 3.6,
      },
    ])
    expect(
      result.details.contributions.reduce(
        (sum, item) => sum + item.contribution,
        0,
      ),
    ).toBeCloseTo(result.ranking?.[0].score ?? 0, 8)
  })
})
