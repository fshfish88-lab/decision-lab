import { describe, expect, it } from 'vitest'

import { chooseRandomOption, cleanOptions, drawRandomOption } from './random'

describe('cleanOptions', () => {
  it('trims values, collapses repeated whitespace, and removes blank options', () => {
    expect(cleanOptions(['  火锅  ', ' ', '日  料', '\t烧烤\n'])).toEqual([
      '火锅',
      '日 料',
      '烧烤',
    ])
  })
})

describe('chooseRandomOption', () => {
  it('rejects fewer than two valid options', () => {
    expect(() => chooseRandomOption(['火锅', '   '], () => 0)).toThrow(
      '至少需要两个有效选项',
    )
  })

  it('chooses the first option at the start of the random interval', () => {
    expect(chooseRandomOption(['火锅', '烧烤', '日料'], () => 0)).toBe('火锅')
  })

  it('chooses the last option at the end of the random interval', () => {
    expect(chooseRandomOption(['火锅', '烧烤', '日料'], () => 0.999)).toBe(
      '日料',
    )
  })
})

describe('drawRandomOption', () => {
  it('returns the exact sample and landing index used by the draw', () => {
    expect(drawRandomOption(['火锅', '日料', '烧烤'], () => 0.7)).toEqual({
      winner: '烧烤',
      sample: 0.7,
      winningIndex: 2,
      optionCount: 3,
    })
  })
})
