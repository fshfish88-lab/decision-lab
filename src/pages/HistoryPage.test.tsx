import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { saveHistoryItem } from '../storage/history'
import { DecisionProvider } from '../state/DecisionProvider'
import type { DecisionResult } from '../types/decision'
import { HistoryPage } from './HistoryPage'
import { HomePage } from './HomePage'
import { ResultPage } from './ResultPage'

const result: DecisionResult = {
  id: 'history-1',
  createdAt: '2026-08-13T08:00:00.000Z',
  question: '今晚吃什么？',
  options: [
    { id: 'hotpot', label: '火锅' },
    { id: 'sushi', label: '日料' },
  ],
  mode: 'random',
  winner: { id: 'hotpot', label: '火锅' },
  explanation: '等概率抽取后，火锅胜出。',
  confidence: 100,
  metrics: [],
}

function renderHistory(): void {
  render(
    <MemoryRouter initialEntries={['/history']}>
      <DecisionProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/result" element={<ResultPage />} />
        </Routes>
      </DecisionProvider>
    </MemoryRouter>,
  )
}

describe('HistoryPage', () => {
  beforeEach(() => {
    localStorage.clear()
    saveHistoryItem(result)
  })

  it('shows record detail with honest behavior status', async () => {
    const user = userEvent.setup()
    renderHistory()

    await user.click(screen.getByRole('button', { name: '查看详情 今晚吃什么？' }))

    expect(screen.getByText('等概率抽取后，火锅胜出。')).toBeInTheDocument()
    expect(screen.getByText('尚未反悔')).toBeInTheDocument()
    expect(screen.getByText('分享 0 次')).toBeInTheDocument()
  })

  it('restores the question, options, and mode for another decision', async () => {
    const user = userEvent.setup()
    renderHistory()

    await user.click(screen.getByRole('button', { name: '查看详情 今晚吃什么？' }))
    await user.click(screen.getByRole('button', { name: '再次使用' }))

    expect(screen.getByPlaceholderText('例如：今晚吃什么？')).toHaveValue('今晚吃什么？')
    expect(screen.getByLabelText('选项 1')).toHaveValue('火锅')
    expect(screen.getByLabelText('选项 2')).toHaveValue('日料')
    expect(screen.getByRole('button', { name: '交给命运' })).toBeEnabled()
  })

  it('opens a saved result from history', async () => {
    const user = userEvent.setup()
    renderHistory()

    await user.click(screen.getByRole('button', { name: '查看详情 今晚吃什么？' }))
    await user.click(screen.getByRole('button', { name: '查看结果' }))

    expect(screen.getByRole('heading', { name: '决策结果' })).toBeInTheDocument()
    expect(screen.getAllByText('火锅').length).toBeGreaterThan(0)
  })

  it('restores the latest saved result when the result route is refreshed', () => {
    render(
      <MemoryRouter initialEntries={['/result']}>
        <DecisionProvider>
          <Routes>
            <Route path="/result" element={<ResultPage />} />
          </Routes>
        </DecisionProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '决策结果' })).toBeInTheDocument()
    expect(screen.getAllByText('火锅').length).toBeGreaterThan(0)
  })
})
