import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AiApiError, type AiApiClient } from '../../ai/aiApiClient'
import type { DecisionResult } from '../../types/decision'
import { AiDeepAnalysisPanel } from './AiDeepAnalysisPanel'

const result: DecisionResult = {
  id: 'random-1',
  createdAt: '2026-08-13T08:00:00.000Z',
  question: '今晚吃什么？',
  options: [
    { id: 'hotpot', label: '火锅' },
    { id: 'sushi', label: '日料' },
  ],
  mode: 'random',
  winner: { id: 'hotpot', label: '火锅' },
  explanation: '等概率抽中火锅。',
  confidence: 100,
  metrics: [],
  details: {
    type: 'random',
    sample: 0,
    winningIndex: 0,
    fingerprint: '0000-0000',
    drawNumber: '#000001',
    probability: 0.5,
  },
}

const analysis = {
  overview: '这次抽签暴露了你的真实偏好。',
  key_factors: ['你看到火锅时没有立刻反对'],
  risks: ['预算可能更高'],
  hidden_conflicts: ['想省钱但也想获得满足感'],
  scenarios: ['今晚很累时，接受结果更省心'],
  next_steps: ['关掉第二个外卖软件'],
}

function client(deepAnalyze: AiApiClient['deepAnalyze']): AiApiClient {
  return { deepAnalyze, decide: vi.fn() }
}

describe('AiDeepAnalysisPanel', () => {
  it('waits for an explicit click and renders a structured Bento result', async () => {
    const user = userEvent.setup()
    let resolveRequest: (value: typeof analysis) => void = () => undefined
    const deepAnalyze = vi.fn(() => new Promise<typeof analysis>((resolve) => {
      resolveRequest = resolve
    }))

    render(<AiDeepAnalysisPanel result={result} client={client(deepAnalyze)} />)

    expect(deepAnalyze).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'AI 深度分析' }))
    expect(screen.getByRole('button', { name: '正在分析你的纠结' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: '正在分析你的纠结' }))
    expect(deepAnalyze).toHaveBeenCalledTimes(1)

    resolveRequest(analysis)

    expect(await screen.findByRole('heading', { name: 'AI 分析总览' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'AI 深度分析结果' })).toHaveClass('ai-deep-analysis__grid')
    expect(screen.getByRole('heading', { name: '现实风险' })).toBeInTheDocument()
    expect(screen.getByText('关掉第二个外卖软件')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重新分析' })).toBeEnabled()
  })

  it('shows a rate-limit message and permits retrying', async () => {
    const user = userEvent.setup()
    const deepAnalyze = vi.fn()
      .mockRejectedValueOnce(new AiApiError('rate_limited', 'limited'))
      .mockResolvedValueOnce(analysis)

    render(<AiDeepAnalysisPanel result={result} client={client(deepAnalyze)} />)

    await user.click(screen.getByRole('button', { name: 'AI 深度分析' }))
    expect(await screen.findByText('请求有点太密集，请稍后再试。')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'AI 深度分析' }))

    expect(await screen.findByText('这次抽签暴露了你的真实偏好。')).toBeInTheDocument()
    expect(deepAnalyze).toHaveBeenCalledTimes(2)
  })
})
