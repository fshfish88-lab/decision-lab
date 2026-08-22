import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DecisionContext } from '../state/DecisionContext'
import { initialDecisionState } from '../state/decisionReducer'
import type { DecisionMode, DecisionResult } from '../types/decision'
import { AnalysisPage } from './AnalysisPage'

function makeResult(mode: DecisionMode): DecisionResult {
  const options = [
    { id: 'hotpot', label: '火锅' },
    { id: 'sushi', label: '日料' },
  ]

  return {
    id: `result-${mode}`,
    createdAt: '2026-08-13T00:00:00.000Z',
    question: '今晚吃什么？',
    options,
    mode,
    winner: options[0],
    explanation: '测试解释',
    confidence: 88,
    metrics: [],
  }
}

function renderAnalysis(mode: DecisionMode): void {
  render(
    <MemoryRouter initialEntries={['/analysis']}>
      <DecisionContext.Provider
        value={{
          state: { ...initialDecisionState, mode, result: makeResult(mode) },
          dispatch: vi.fn(),
        }}
      >
        <AnalysisPage />
      </DecisionContext.Provider>
    </MemoryRouter>,
  )
}

afterEach(() => vi.useRealTimers())

describe('AnalysisPage mode experiences', () => {
  it('shows random draw language', () => {
    vi.useFakeTimers()
    renderAnalysis('random')

    expect(screen.getByRole('heading', { name: '正在启动命运抽签' })).toBeInTheDocument()
    expect(screen.getByText('正在生成随机指纹')).toBeInTheDocument()
  })

  it('shows scientific calculation language', () => {
    vi.useFakeTimers()
    renderAnalysis('scientific')

    expect(screen.getByRole('heading', { name: '正在进行科学计算' })).toBeInTheDocument()
    expect(screen.getByText('正在应用指标权重')).toBeInTheDocument()
  })

  it('does not precompute a mystic result before the user draws a tarot card', () => {
    vi.useFakeTimers()
    render(
      <MemoryRouter initialEntries={['/analysis']}>
        <DecisionContext.Provider
          value={{
            state: { ...initialDecisionState, mode: 'mystic', result: null },
            dispatch: vi.fn(),
          }}
        >
          <AnalysisPage />
        </DecisionContext.Provider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '玄学模式需要你亲手抽牌' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '正在连接命运频道' })).not.toBeInTheDocument()
  })
})
