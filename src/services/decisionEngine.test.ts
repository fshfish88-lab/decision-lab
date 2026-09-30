import { describe, expect, it } from 'vitest'

import { createTarotSpread } from '../tarot/tarotEngine'
import type { Criterion, DecisionOption, ScientificScoreMap } from '../types/decision'
import {
  createAiResult,
  createMysticResult,
  createRandomResult,
  createScientificResult,
  createTarotResult,
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

  it('persists a structured tarot decision reading and resolves the selected option', () => {
    const spread = createTarotSpread(options, () => 0)
    const result = createTarotResult({
      ...metadata,
      options,
      selection: spread.cards[0],
      deckFingerprint: spread.fingerprint,
    })

    const tarot = result.details?.type === 'mystic' ? result.details.tarot : undefined
    expect(tarot?.interpretation).toContain(tarot?.chineseName)
    expect(tarot?.message?.length).toBeGreaterThanOrEqual(16)
    expect(tarot?.shadowTitle?.length).toBeGreaterThanOrEqual(4)
    expect(tarot?.shadow?.length).toBeGreaterThanOrEqual(16)
    expect(tarot?.mapping).toHaveLength(3)
    expect(tarot?.mapping?.map((item) => item.keyword)).toEqual(tarot?.keywords)
    expect(tarot?.mapping?.every((item) => item.description.includes(result.winner.label)))
      .toBe(true)
    expect(tarot?.verdict).toBe(`${result.winner.label}。就这样。`)
    expect(tarot?.verdictSubtext).toContain('客观更优')
    expect(result.explanation).toContain(tarot?.message)
  })

  it('does not double-wrap an option label that already uses book-title marks', () => {
    const markedOptions = [
      { id: 'sushi', label: '「日料」' },
      { id: 'hotpot', label: '火锅' },
    ]
    const spread = createTarotSpread(markedOptions, () => 0)
    const result = createTarotResult({
      ...metadata,
      options: markedOptions,
      selection: { ...spread.cards[0], winner: markedOptions[0] },
      deckFingerprint: spread.fingerprint,
    })
    const tarot = result.details?.type === 'mystic' ? result.details.tarot : undefined

    expect(tarot?.mapping?.every((item) => !/[「]{2}|[」]{2}/.test(item.description))).toBe(true)
    expect(tarot?.mapping?.every((item) => item.description.includes('「日料」'))).toBe(true)
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

describe('decisionEngine option mapping', () => {
  const advice = {
    recommended_option: '火锅', confidence: 80, verdict: '测试', core_reasons: [],
    main_tradeoff: '', conditions_to_reconsider: [], action_plan: [],
  }

  it.each([['火锅', '火锅', '火锅'], [' 火  锅 ', '火\t锅', '火 锅']])(
    'rejects an ambiguous AI recommendation for %s / %s', (first, second, recommendation) => {
      expect(() => createAiResult({ ...metadata, context: '',
        options: [{ id: 'first', label: first }, { id: 'second', label: second }],
        advice: { ...advice, recommended_option: recommendation },
      })).toThrow('AI 推荐项无法映射到候选项')
    },
  )

  it('maps a normalized AI recommendation to the unique original option', () => {
    const result = createAiResult({ ...metadata, context: '',
      options: [{ id: 'first', label: '火  锅' }, { id: 'second', label: '烧烤' }],
      advice: { ...advice, recommended_option: ' 火 锅 ' },
    })
    expect(result.winner).toEqual({ id: 'first', label: '火  锅' })
  })

  it.each([createRandomResult, createMysticResult])('preserves duplicate identity after filtering blank options: %s', make => {
    expect(make({ ...metadata, random: () => 0.7, options: [
      { id: 'blank', label: '  ' }, { id: 'first', label: '火锅' }, { id: 'second', label: '火锅' },
    ] }).winner.id).toBe('second')
  })
  // 回归：清理阶段会折叠选项内部的连续空格，而回查阶段过去只做 trim，
  // 两边规则不一致会让合法选项直接映射失败。
  it('maps a random draw back to an option whose label contains inner whitespace', () => {
    const spaced: DecisionOption[] = [
      { id: 'hotpot', label: '火  锅' },
      { id: 'bbq', label: '烧烤' },
    ]

    const result = createRandomResult({ ...metadata, options: spaced, random: () => 0 })

    expect(result.winner.id).toBe('hotpot')
  })

  it('maps a mystic draw back to an option whose label contains inner whitespace', () => {
    const spaced: DecisionOption[] = [
      { id: 'hotpot', label: '火  锅' },
      { id: 'bbq', label: '烧烤' },
    ]

    const result = createMysticResult({ ...metadata, options: spaced, random: () => 0 })

    expect(result.winner.id).toBe('hotpot')
  })

  // 回归：过去用 Array.find 按文本回查，重名选项永远命中第一个，
  // 抽取真正落到的那个选项的信息被丢弃。
  it('returns the drawn duplicate rather than the first option with that label', () => {
    const duplicated: DecisionOption[] = [
      { id: 'first', label: '火锅' },
      { id: 'second', label: '火锅' },
    ]

    const result = createRandomResult({
      ...metadata,
      options: duplicated,
      random: () => 0.7,
    })

    expect(result.winner.id).toBe('second')
  })

  it('returns the drawn duplicate in mystic mode as well', () => {
    const duplicated: DecisionOption[] = [
      { id: 'first', label: '火锅' },
      { id: 'second', label: '火锅' },
    ]

    const result = createMysticResult({
      ...metadata,
      options: duplicated,
      random: () => 0.7,
    })

    expect(result.winner.id).toBe('second')
  })

  it('excludes blank options from the draw and the reported candidate count', () => {
    const withBlank: DecisionOption[] = [
      { id: 'hotpot', label: '火锅' },
      { id: 'blank', label: '   ' },
      { id: 'sushi', label: '日料' },
    ]

    const result = createRandomResult({ ...metadata, options: withBlank, random: () => 0 })

    expect(result.winner.id).toBe('hotpot')
    expect(result.explanation).toContain('2 个候选项')
  })
})
