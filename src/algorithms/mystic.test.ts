import { describe, expect, it } from 'vitest'

import { MYSTIC_TEMPLATES } from '../data/mysticTemplates'
import { createMysticDecision } from './mystic'

describe('mystic templates', () => {
  it('ships at least 30 dynamic explanation templates', () => {
    expect(MYSTIC_TEMPLATES.length).toBeGreaterThanOrEqual(30)
    expect(MYSTIC_TEMPLATES.every((template) => template.includes('{choice}'))).toBe(
      true,
    )
  })
})

describe('createMysticDecision', () => {
  it('inserts the chosen option and creates 3 to 5 coherent metrics', () => {
    const result = createMysticDecision(['火锅', '日料'], () => 0.5)

    expect(result.winner).toBe('日料')
    expect(result.explanation).toContain('日料')
    expect(result.metrics.length).toBeGreaterThanOrEqual(3)
    expect(result.metrics.length).toBeLessThanOrEqual(5)
    expect(
      result.metrics
        .filter((metric) => !metric.inverse)
        .every((metric) => metric.value >= 60 && metric.value <= 99),
    ).toBe(true)
    expect(
      result.metrics
        .filter((metric) => metric.inverse)
        .every((metric) => metric.value >= 1 && metric.value <= 40),
    ).toBe(true)
    expect(result.confidence).toBeGreaterThanOrEqual(60)
    expect(result.disclaimer).toContain('仅供娱乐')
  })

  it('keeps regret low when confidence is high', () => {
    const result = createMysticDecision(['火锅', '日料'], () => 0.95)
    const regret = result.metrics.find((metric) => metric.key === 'regret')

    expect(result.confidence).toBeGreaterThan(90)
    expect(regret?.value).toBeLessThanOrEqual(15)
  })
})
