import { describe, expect, it } from 'vitest'

import type {
  Criterion,
  DecisionOption,
  ScientificScoreMap,
} from '../types/decision'
import { rankScientificOptions } from './scientific'

const options: DecisionOption[] = [
  { id: 'hotpot', label: '火锅' },
  { id: 'sushi', label: '日料' },
]

const criteria: Criterion[] = [
  { id: 'taste', name: '喜欢程度', weight: 60 },
  { id: 'price', name: '价格', weight: 40 },
]

describe('rankScientificOptions', () => {
  it('computes exact weighted scores and ranks them from high to low', () => {
    const scores: ScientificScoreMap = {
      hotpot: { taste: 8, price: 7 },
      sushi: { taste: 7, price: 9 },
    }

    expect(rankScientificOptions(options, criteria, scores)).toEqual([
      { optionId: 'sushi', label: '日料', score: 7.8, rank: 1 },
      { optionId: 'hotpot', label: '火锅', score: 7.6, rank: 2 },
    ])
  })

  it('keeps original option order when scores tie', () => {
    const scores: ScientificScoreMap = {
      hotpot: { taste: 8, price: 8 },
      sushi: { taste: 8, price: 8 },
    }

    expect(
      rankScientificOptions(options, criteria, scores).map((item) => item.optionId),
    ).toEqual(['hotpot', 'sushi'])
  })

  it('requires at least two criteria whose weights total 100', () => {
    expect(() =>
      rankScientificOptions(options, [criteria[0]], {
        hotpot: { taste: 8 },
        sushi: { taste: 7 },
      }),
    ).toThrow('至少需要两个评价指标')

    expect(() =>
      rankScientificOptions(
        options,
        [
          { ...criteria[0], weight: 40 },
          { ...criteria[1], weight: 40 },
        ],
        {
          hotpot: { taste: 8, price: 7 },
          sushi: { taste: 7, price: 9 },
        },
      ),
    ).toThrow('指标权重总和必须等于 100%')
  })

  it('rejects missing scores and scores outside 1 to 10', () => {
    expect(() =>
      rankScientificOptions(options, criteria, {
        hotpot: { taste: 8, price: 7 },
        sushi: { taste: 7 },
      }),
    ).toThrow('请完成“日料”的“价格”评分')

    expect(() =>
      rankScientificOptions(options, criteria, {
        hotpot: { taste: 11, price: 7 },
        sushi: { taste: 7, price: 9 },
      }),
    ).toThrow('评分必须在 1 到 10 之间')
  })
})
