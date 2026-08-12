import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { markHistoryItemRegretted, saveHistoryItem } from '../storage/history'
import type { DecisionMode, DecisionResult } from '../types/decision'
import { StatisticsPage } from './StatisticsPage'

function result(id: string, mode: DecisionMode, hour: number): DecisionResult {
  return {
    id,
    createdAt: new Date(2026, 7, 13, hour).toISOString(),
    question: '今晚吃什么？',
    options: [
      { id: 'hotpot', label: '火锅' },
      { id: 'sushi', label: '日料' },
    ],
    mode,
    winner: { id: 'hotpot', label: '火锅' },
    explanation: '系统已经替你决定。',
    confidence: 88,
    metrics: [],
  }
}

function renderPage(): void {
  render(
    <MemoryRouter>
      <StatisticsPage now={new Date(2026, 7, 13, 12)} />
    </MemoryRouter>,
  )
}

describe('StatisticsPage', () => {
  beforeEach(() => localStorage.clear())

  it('shows an honest empty state without sample metrics', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: '统计分析' })).toBeInTheDocument()
    expect(screen.getByText('还没有足够的决策数据')).toBeInTheDocument()
    expect(screen.queryByText('50.0%')).not.toBeInTheDocument()
    expect(screen.getByText('初次见面')).toBeInTheDocument()
  })

  it('renders real KPIs, trend, distribution, and all achievements', () => {
    saveHistoryItem(result('random-1', 'random', 8))
    saveHistoryItem(result('science-1', 'scientific', 9))
    markHistoryItemRegretted('random-1', new Date(2026, 7, 13, 10).toISOString())

    renderPage()

    expect(screen.getByText('本月决策次数')).toBeInTheDocument()
    expect(screen.getByText('最常使用模式')).toBeInTheDocument()
    expect(screen.getByText('随机模式、科学模式')).toBeInTheDocument()
    expect(screen.getByText('决策服从率')).toBeInTheDocument()
    expect(within(screen.getByLabelText('核心统计')).getByText('50.0%')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '8/13：2 次决策' })).toBeInTheDocument()
    expect(screen.getByText('随机模式 · 1 次')).toBeInTheDocument()

    for (const title of [
      '初次见面',
      '选择困难症患者',
      '命运的奴隶',
      '科学主义者',
      '赛博算命师',
      '系统说什么就是什么',
    ]) {
      expect(screen.getByText(title)).toBeInTheDocument()
    }
  })
})
