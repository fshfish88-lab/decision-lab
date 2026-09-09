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
  overview: '火锅只是被随机抽中，目前没有明显现实障碍。',
  key_factors: ['没有发现硬性障碍'],
  risks: ['排队过久时可以放弃'],
  hidden_conflicts: ['可能因为重新比较而反悔'],
  scenarios: ['先检查距离和排队'],
  next_steps: ['确认没有硬性限制后执行'],
}

function client(deepAnalyze: AiApiClient['deepAnalyze']): AiApiClient {
  return { deepAnalyze, decide: vi.fn() }
}

describe('AiDeepAnalysisPanel', () => {
  it('cancels pending analysis when leaving the result page', async () => {
    const user = userEvent.setup()
    let requestSignal: AbortSignal | undefined
    const deepAnalyze = vi.fn((_content: string, signal?: AbortSignal) => {
      requestSignal = signal
      return new Promise<typeof analysis>((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      })
    })
    const { unmount } = render(<AiDeepAnalysisPanel result={result} client={client(deepAnalyze)} />)
    await user.click(screen.getByRole('button', { name: 'AI 深度分析' }))
    expect(requestSignal?.aborted).toBe(false)
    unmount()
    expect(requestSignal?.aborted).toBe(true)
  })

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

    expect(await screen.findByRole('heading', { name: '本轮结论' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'AI 深度分析结果' })).toHaveClass('ai-deep-analysis')
    expect(screen.getByRole('heading', { name: '能不能执行' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '最省事的执行方式' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '你可能为什么反悔' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '什么时候可以放弃' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '现在怎么做' })).toBeInTheDocument()
    expect(screen.getByText('确认没有硬性限制后执行')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重新分析' })).toBeEnabled()
  })

  it('renders scientific analysis as a model review', async () => {
    const user = userEvent.setup()
    const scientificResult: DecisionResult = {
      ...result,
      id: 'scientific-1',
      mode: 'scientific',
      ranking: [
        { optionId: 'hotpot', label: '火锅', score: 8.4, rank: 1 },
        { optionId: 'sushi', label: '日料', score: 8.1, rank: 2 },
      ],
      details: {
        type: 'scientific',
        criteria: [
          { id: 'taste', name: '口味', weight: 60 },
          { id: 'price', name: '价格', weight: 40 },
        ],
        scores: { hotpot: { taste: 9, price: 7 }, sushi: { taste: 8, price: 8 } },
        contributions: [
          { criterionId: 'taste', name: '口味', weight: 60, score: 9, contribution: 5.4 },
          { criterionId: 'price', name: '价格', weight: 40, score: 7, contribution: 2.8 },
        ],
      },
    }

    render(<AiDeepAnalysisPanel result={scientificResult} client={client(vi.fn().mockResolvedValue(analysis))} />)
    await user.click(screen.getByRole('button', { name: 'AI 深度分析' }))

    expect(await screen.findByRole('heading', { name: 'AI 模型体检' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '模型结论' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '胜出驱动力' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '领先优势' })).toBeInTheDocument()
    expect(screen.getByText('领先 0.30')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '权重集中度' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '翻转敏感性' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '模型外因素' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '当前建议' })).toBeInTheDocument()
  })

  it('renders tarot analysis as a second reading with a reality boundary', async () => {
    const user = userEvent.setup()
    const tarotResult: DecisionResult = {
      ...result,
      id: 'tarot-1',
      mode: 'mystic',
      details: {
        type: 'mystic',
        tarot: {
          cardId: 'the-world', number: 21, numeral: 'XXI', name: 'THE WORLD',
          chineseName: '世界', orientation: 'upright', keywords: ['完成', '整合', '收尾'],
          decisionStyle: 'ACT', interpretation: '结束比较，进入执行。', strength: 5,
          selectedPosition: 2, deckFingerprint: 'TAROT-1234ABCD',
        },
        evidence: [], favorable: '听牌', avoid: '继续纠结',
      },
    }

    render(<AiDeepAnalysisPanel result={tarotResult} client={client(vi.fn().mockResolvedValue(analysis))} />)
    await user.click(screen.getByRole('button', { name: 'AI 深度分析' }))

    expect(await screen.findByRole('heading', { name: 'AI 二次解读' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '这张牌在说什么' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '当前决策倾向' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '为什么会指向火锅' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '阴影提醒' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '可以听牌' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '应该忽略牌' })).toBeInTheDocument()
    expect(screen.getByText('娱乐性象征 · 最终决定权仍属于你')).toBeInTheDocument()
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

    expect(await screen.findByText('火锅只是被随机抽中，目前没有明显现实障碍。')).toBeInTheDocument()
    expect(deepAnalyze).toHaveBeenCalledTimes(2)
  })
})
