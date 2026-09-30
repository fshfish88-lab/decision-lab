import { describe, expect, it } from 'vitest'

import {
  cleanDecisionOptions,
  hasValidLabel,
  hasDuplicateOptionLabels,
  matchOptionsByLabel,
  normalizeOptionLabel,
  selectValidOptions,
} from './optionLabels'

describe('normalizeOptionLabel', () => {
  it('trims the ends and collapses internal whitespace to a single space', () => {
    expect(normalizeOptionLabel('  火  锅  ')).toBe('火 锅')
    expect(normalizeOptionLabel('\t烧烤\n')).toBe('烧烤')
    expect(normalizeOptionLabel('日   料')).toBe('日 料')
  })

  it('reduces a blank label to an empty string', () => {
    expect(normalizeOptionLabel('   ')).toBe('')
    expect(normalizeOptionLabel('\t\n')).toBe('')
  })
})

describe('hasValidLabel / selectValidOptions', () => {
  it('keeps only options with a non-blank label', () => {
    const options = [
      { id: 'a', label: '火锅' },
      { id: 'b', label: '   ' },
      { id: 'c', label: ' 日  料 ' },
    ]

    expect(hasValidLabel('   ')).toBe(false)
    expect(selectValidOptions(options).map((option) => option.id)).toEqual(['a', 'c'])
  })
})

describe('cleanDecisionOptions', () => {
  it('pairs each normalized label with its original option', () => {
    const options = [
      { id: 'a', label: ' 火  锅 ' },
      { id: 'b', label: ' ' },
      { id: 'c', label: '烧烤' },
    ]

    expect(cleanDecisionOptions(options)).toEqual([
      { option: { id: 'a', label: ' 火  锅 ' }, label: '火 锅' },
      { option: { id: 'c', label: '烧烤' }, label: '烧烤' },
    ])
  })

  it('preserves duplicates rather than collapsing them', () => {
    const options = [
      { id: 'a', label: '火锅' },
      { id: 'b', label: '火锅' },
    ]

    expect(cleanDecisionOptions(options).map((entry) => entry.option.id)).toEqual([
      'a',
      'b',
    ])
  })
})

describe('matchOptionsByLabel', () => {
  it('matches after normalization, not on the raw string', () => {
    const options = [{ id: 'a', label: '火  锅' }]

    expect(matchOptionsByLabel(options, '火 锅').map((option) => option.id)).toEqual(['a'])
    expect(matchOptionsByLabel(options, ' 火 锅 ').map((option) => option.id)).toEqual(['a'])
  })

  it('does not treat a collapsed space as removable', () => {
    const options = [{ id: 'a', label: '火  锅' }]

    // 折叠空格只把连续空白压成一个，不会把它删掉，
    // 所以「火 锅」和「火锅」是两个不同的标签。
    expect(matchOptionsByLabel(options, '火锅')).toEqual([])
  })

  it('returns every duplicate so callers can detect the ambiguity', () => {
    const options = [
      { id: 'a', label: '火锅' },
      { id: 'b', label: '火锅' },
    ]

    expect(matchOptionsByLabel(options, '火锅')).toHaveLength(2)
  })

  it('returns nothing for a blank target or a missing label', () => {
    const options = [{ id: 'a', label: '火锅' }]

    expect(matchOptionsByLabel(options, '   ')).toEqual([])
    expect(matchOptionsByLabel(options, '日料')).toEqual([])
  })
})

describe('hasDuplicateOptionLabels', () => {
  it('detects exact and normalized duplicates but ignores blank entries', () => {
    const options = (labels: string[]) => labels.map((label, index) => ({ id: String(index), label }))
    expect(hasDuplicateOptionLabels(options(['火锅', '火锅']))).toBe(true)
    expect(hasDuplicateOptionLabels(options([' 火  锅 ', '火\t锅']))).toBe(true)
    expect(hasDuplicateOptionLabels(options(['', '  ', '火锅', '火 锅']))).toBe(false)
  })
})
