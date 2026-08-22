import { describe, expect, it } from 'vitest'

import type { DecisionOption } from '../types/decision'
import { TAROT_CARDS } from './tarotCards'
import { createTarotSpread, selectTarotCard } from './tarotEngine'

const OPTIONS: DecisionOption[] = [
  { id: 'hotpot', label: '火锅' },
  { id: 'barbecue', label: '烧烤' },
  { id: 'sushi', label: '日料' },
]

function sequenceRandom(values: number[]): () => number {
  let index = 0
  return () => {
    const value = values[index % values.length]
    index += 1
    return value
  }
}

describe('tarot card catalogue', () => {
  it('contains all 22 uniquely identified Major Arcana with complete meanings', () => {
    expect(TAROT_CARDS).toHaveLength(22)
    expect(new Set(TAROT_CARDS.map((card) => card.id)).size).toBe(22)
    expect(new Set(TAROT_CARDS.map((card) => card.number)).size).toBe(22)

    for (const card of TAROT_CARDS) {
      for (const meaning of [card.upright, card.reversed]) {
        expect(meaning.keywords).toHaveLength(3)
        expect(['EXPLORE', 'STABILIZE', 'FOLLOW_DESIRE', 'ACT', 'PAUSE', 'BREAK_PATTERN'])
          .toContain(meaning.decisionStyle)
        expect(meaning.interpretation).toContain(card.chineseName)
        expect(meaning.message.length).toBeGreaterThanOrEqual(16)
        expect(meaning.shadowTitle.length).toBeGreaterThanOrEqual(4)
        expect(meaning.shadow.length).toBeGreaterThanOrEqual(16)
        expect(`${meaning.interpretation}${meaning.message}${meaning.shadowTitle}${meaning.shadow}`).not.toMatch(
          /命运缝隙|第三次回声|未被命名|最后一道光|轻响|隐秘余韵|你应该|建议你|选择那个/,
        )
        expect(meaning.strength).toBeGreaterThanOrEqual(1)
        expect(meaning.strength).toBeLessThanOrEqual(5)
      }
    }

    expect(TAROT_CARDS.find((card) => card.id === 'the-devil')?.reversed.shadowTitle)
      .toBe('别把松绑变成逃避')
    expect(TAROT_CARDS.find((card) => card.id === 'judgement')?.reversed.message)
      .toContain('停止内心听证会')
    expect(TAROT_CARDS.find((card) => card.id === 'the-moon')?.upright.interpretation)
      .toContain('信息还没有完全清楚')
  })
})

describe('createTarotSpread', () => {
  it('creates seven unique cards and fixes their option mappings before selection', () => {
    const spread = createTarotSpread(
      OPTIONS,
      sequenceRandom([0.04, 0.76, 0.31, 0.91, 0.18, 0.63]),
    )

    expect(spread.cards).toHaveLength(7)
    expect(new Set(spread.cards.map((entry) => entry.card.id)).size).toBe(7)
    expect(spread.cards.map((entry) => entry.position)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(new Set(spread.cards.map((entry) => entry.winner.id)).size).toBeGreaterThan(1)
    expect(spread.fingerprint).toMatch(/^TAROT-[A-F0-9]{8}$/)

    const selected = selectTarotCard(spread, 3)
    expect(selected).toBe(spread.cards[3])
    expect(selectTarotCard(spread, 3).winner).toEqual(selected.winner)
  })

  it('filters blank options and rejects a spread with fewer than two valid choices', () => {
    const withBlank = [...OPTIONS, { id: 'blank', label: '   ' }]
    const spread = createTarotSpread(withBlank, () => 0)

    expect(spread.cards.every((entry) => entry.winner.id !== 'blank')).toBe(true)
    expect(() => createTarotSpread([{ id: 'only', label: '唯一选项' }], () => 0)).toThrow(
      '至少需要两个有效选项',
    )
  })

  it('uses injected randomness deterministically', () => {
    const values = [0.12, 0.88, 0.42, 0.67, 0.03, 0.51]
    const first = createTarotSpread(OPTIONS, sequenceRandom(values))
    const second = createTarotSpread(OPTIONS, sequenceRandom(values))

    expect(second).toEqual(first)
  })
})
