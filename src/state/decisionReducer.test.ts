import { describe, expect, it } from 'vitest'

import { decisionReducer, initialDecisionState } from './decisionReducer'

describe('decisionReducer', () => {
  it('edits options and enforces the ten-option limit', () => {
    let state = decisionReducer(initialDecisionState, {
      type: 'set-option',
      id: 'option-1',
      label: '火锅',
    })

    expect(state.options[0].label).toBe('火锅')

    for (let index = 0; index < 12; index += 1) {
      state = decisionReducer(state, { type: 'add-option' })
    }

    expect(state.options).toHaveLength(10)
  })

  it('selects a mode and stores scientific configuration', () => {
    const withMode = decisionReducer(initialDecisionState, {
      type: 'set-mode',
      mode: 'scientific',
    })
    const withScore = decisionReducer(withMode, {
      type: 'set-score',
      optionId: 'option-1',
      criterionId: 'taste',
      score: 8,
    })

    expect(withScore.mode).toBe('scientific')
    expect(withScore.scores['option-1'].taste).toBe(8)
  })

  it('sets and clears the current result without erasing the draft', () => {
    const result = {
      id: 'decision-1',
      createdAt: '2026-08-12T12:00:00.000Z',
      question: '今天吃什么？',
      options: [
        { id: 'option-1', label: '火锅' },
        { id: 'option-2', label: '日料' },
      ],
      mode: 'random' as const,
      winner: { id: 'option-1', label: '火锅' },
      explanation: '系统已经替你决定。',
      confidence: 88,
      metrics: [],
    }
    const withResult = decisionReducer(initialDecisionState, {
      type: 'set-result',
      result,
    })
    const cleared = decisionReducer(withResult, { type: 'clear-result' })

    expect(withResult.result?.winner.label).toBe('火锅')
    expect(cleared.result).toBeNull()
    expect(cleared.options).toHaveLength(2)
  })
})
