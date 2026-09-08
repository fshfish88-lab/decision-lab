import { describe, expect, it } from 'vitest'

import type {
  Criterion,
  DecisionOption,
  ScientificScoreMap,
} from '../types/decision'
import { createRandomScientificScores, rankScientificOptions } from './scientific'

const options: DecisionOption[] = [
  { id: 'hotpot', label: '火锅' },
  { id: 'sushi', label: '日料' },
]

const criteria: Criterion[] = [
  { id: 'taste', name: '喜欢程度', weight: 60 },
  { id: 'price', name: '价格', weight: 40 },
]

describe('rankScientificOptions', () => {
  it.each([-30, 130, NaN, Infinity, -Infinity])('rejects invalid individual weight %s', (weight) => {
    expect(() => rankScientificOptions(options, [
      { ...criteria[0], weight },
      { ...criteria[1], weight: 100 - weight },
    ], { hotpot: { taste: 10, price: 1 }, sushi: { taste: 1, price: 1 } }))
      .toThrow('每项权重必须是 0 到 100 之间的有限数值')
  })

  it('rejects duplicated criterion ids before scoring', () => {
    expect(() => rankScientificOptions(options, [criteria[0], { ...criteria[1], id: 'taste' }], {
      hotpot: { taste: 8 }, sushi: { taste: 7 },
    })).toThrow('评价指标不能重复')
  })

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

describe('createRandomScientificScores', () => {
  it('fills every option and criterion with an integer score from 1 to 10', () => {
    const values = [0, 0.19, 0.51, 0.999]
    let index = 0

    expect(
      createRandomScientificScores(options, criteria, () => values[index++] ?? 0),
    ).toEqual({
      hotpot: { taste: 1, price: 2 },
      sushi: { taste: 6, price: 10 },
    })
  })
})
