import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AiApiError, type AiApiClient } from '../ai/aiApiClient'
import { useDecision } from '../state/DecisionContext'
import { DecisionProvider } from '../state/DecisionProvider'
import { readHistory } from '../storage/history'
import type { AiDecisionData } from '../types/decision'
import { AiPage } from './AiPage'
import { HomePage } from './HomePage'

const advice: AiDecisionData = {
  recommended_option: '火锅',
  confidence: 89,
  verdict: '今晚更适合火锅。',
  core_reasons: ['满足感优先'],
  main_tradeoff: '预算略高',
  conditions_to_reconsider: ['预算不足'],
  action_plan: ['现在去订位'],
}

function ResultProbe(): React.JSX.Element {
  const { state } = useDecision()
  return <div>AI 结果：{state.result?.winner.label}</div>
}

function renderFlow(client: AiApiClient): void {
  render(
    <MemoryRouter initialEntries={['/']}>
      <DecisionProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/ai" element={<AiPage client={client} />} />
          <Route path="/result" element={<ResultProbe />} />
        </Routes>
      </DecisionProvider>
    </MemoryRouter>,
  )
}

async function enterAiMode(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.type(screen.getByLabelText('选项 1'), '火锅')
  await user.type(screen.getByLabelText('选项 2'), '日料')
  await user.click(screen.getByRole('button', { name: /AI 模式/ }))
  await user.click(screen.getByRole('button', { name: '让 AI 替我决定' }))
}

describe('AiPage', () => {
  afterEach(() => vi.restoreAllMocks())
  it('cancels a departed request and ignores even a client that resolves after cancellation', async () => {
    localStorage.clear()
    const user = userEvent.setup()
    let resolveDecision!: (value: AiDecisionData) => void
    const decide = vi.fn<(content: string, signal?: AbortSignal) => Promise<AiDecisionData>>(() => new Promise<AiDecisionData>((resolve) => {
      resolveDecision = resolve
    }))
    renderFlow({ decide, deepAnalyze: vi.fn() })
    await enterAiMode(user)
    await user.type(screen.getByLabelText('补充你的真实情况'), '测试请求')
    await user.click(screen.getByRole('button', { name: '让 AI 替我决定' }))
    const signal = decide.mock.calls[0][1]
    await user.click(screen.getByRole('link', { name: '返回模式选择' }))
    await act(async () => resolveDecision(advice))
    expect(screen.getByLabelText('选项 1')).toHaveValue('火锅')
    expect(readHistory()).toHaveLength(0)
    expect(signal?.aborted).toBe(true)
  })

  it('shows offline status, prevents submitting, and enables retry after reconnecting', async () => {
    const user = userEvent.setup()
    const decide = vi.fn()
    renderFlow({ decide, deepAnalyze: vi.fn() })
    await enterAiMode(user)
    await user.type(screen.getByLabelText('补充你的真实情况'), '保留这段背景')
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    fireEvent(window, new Event('offline'))
    expect(screen.getByRole('heading', { name: '当前离线' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '让 AI 替我决定' })).toBeDisabled()
    expect(decide).not.toHaveBeenCalled()
    online.mockReturnValue(true)
    fireEvent(window, new Event('online'))
    expect(screen.getByRole('button', { name: '让 AI 替我决定' })).toBeEnabled()
    expect(screen.getByLabelText('补充你的真实情况')).toHaveValue('保留这段背景')
    expect(screen.queryByText('AI 顾问在线')).not.toBeInTheDocument()
  })

  it('requests direct advice, prevents duplicate submission, and saves the result', async () => {
    localStorage.clear()
    const user = userEvent.setup()
    let resolveDecision: (value: AiDecisionData) => void = () => undefined
    const decide = vi.fn(() => new Promise<AiDecisionData>((resolve) => {
      resolveDecision = resolve
    }))
    renderFlow({ decide, deepAnalyze: vi.fn() })
    await enterAiMode(user)

    expect(screen.getByRole('heading', { name: 'AI 决策顾问' })).toBeInTheDocument()
    expect(screen.getByText('火锅 / 日料')).toBeInTheDocument()
    await user.type(screen.getByLabelText('补充你的真实情况'), '预算 100 元，今天很累。')
    await user.click(screen.getByRole('button', { name: '让 AI 替我决定' }))

    expect(screen.getByRole('button', { name: '正在理解你的纠结' })).toBeDisabled()
    expect(screen.getByRole('main')).toHaveClass('ai-page')
    expect(screen.getByRole('status')).toHaveTextContent('正在理解你的纠结')
    expect(decide).toHaveBeenCalledTimes(1)
    resolveDecision(advice)

    expect(await screen.findByText('AI 结果：火锅')).toBeInTheDocument()
    expect(readHistory()).toHaveLength(1)
    expect(readHistory()[0]).toMatchObject({ mode: 'ai', winner: { label: '火锅' } })
  })

  it('keeps user context after a rate-limited request', async () => {
    localStorage.clear()
    const user = userEvent.setup()
    const decide = vi.fn().mockRejectedValue(new AiApiError('rate_limited', 'limited'))
    renderFlow({ decide, deepAnalyze: vi.fn() })
    await enterAiMode(user)

    const context = screen.getByLabelText('补充你的真实情况')
    await user.type(context, '预算 100 元，不想走太远。')
    await user.click(screen.getByRole('button', { name: '让 AI 替我决定' }))

    expect(await screen.findByText('请求有点太密集，请稍后再试。')).toBeInTheDocument()
    expect(context).toHaveValue('预算 100 元，不想走太远。')
    expect(screen.getByRole('button', { name: '让 AI 替我决定' })).toBeEnabled()
  })
})
