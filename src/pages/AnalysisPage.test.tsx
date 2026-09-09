import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DecisionContext } from '../state/DecisionContext'
import { initialDecisionState } from '../state/decisionReducer'
import type { DecisionMode, DecisionResult } from '../types/decision'
import { AnalysisPage } from './AnalysisPage'
import { PlatformContext, type AppPlatform } from '../platform/PlatformContext'
import { saveHistoryItem } from '../storage/history'

vi.mock('../storage/history', () => ({ saveHistoryItem: vi.fn() }))

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

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

function RouteProbe(): React.JSX.Element {
  return <output data-testid="route">{useLocation().pathname}</output>
}

describe('AnalysisPage mode experiences', () => {
  it.each<[AppPlatform, boolean]>([['web', false], ['app', false], ['web', true], ['app', true]])(
    'reveals and saves the same prepared winner once on %s (reduced motion: %s)',
    (platform, reducedMotion) => {
      vi.useFakeTimers()
      const originalMatchMedia = window.matchMedia
      vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
        ...originalMatchMedia(query), matches: reducedMotion,
      }))
      const result = makeResult('random')
      const dispatch = vi.fn()
      const view = (
        <MemoryRouter initialEntries={['/analysis']}>
          <PlatformContext.Provider value={platform}>
            <DecisionContext.Provider value={{ state: { ...initialDecisionState, mode: 'random', result }, dispatch }}>
              <AnalysisPage /><RouteProbe />
            </DecisionContext.Provider>
          </PlatformContext.Provider>
        </MemoryRouter>
      )
      const { container, rerender } = render(view)
      expect(container.querySelector('.random-draw__answer strong')).toHaveTextContent(result.winner.label)
      act(() => vi.advanceTimersByTime(reducedMotion ? 249 : 1999))
      expect(screen.getByTestId('route')).toHaveTextContent('/analysis')
      expect(saveHistoryItem).not.toHaveBeenCalled()
      rerender(view)
      act(() => vi.advanceTimersByTime(1))
      expect(screen.getByTestId('route')).toHaveTextContent('/result')
      expect(dispatch).toHaveBeenCalledWith({ type: 'set-result', result })
      expect(saveHistoryItem).toHaveBeenCalledExactlyOnceWith(result)
    },
  )

  it('cancels the pending reveal when leaving analysis early', () => {
    vi.useFakeTimers()
    const dispatch = vi.fn()
    const { unmount } = render(
      <MemoryRouter>
        <DecisionContext.Provider value={{ state: { ...initialDecisionState, mode: 'random', result: makeResult('random') }, dispatch }}>
          <AnalysisPage />
        </DecisionContext.Provider>
      </MemoryRouter>,
    )
    act(() => vi.advanceTimersByTime(800))
    unmount()
    act(() => vi.advanceTimersByTime(3000))
    expect(dispatch).not.toHaveBeenCalled()
    expect(saveHistoryItem).not.toHaveBeenCalled()
  })

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
