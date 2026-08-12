import { afterEach, describe, expect, it, vi } from 'vitest'

import { AI_ENDPOINTS, AiApiError, createAiApiClient } from './aiApiClient'

const deepPayload = {
  success: true,
  type: 'deep-analysis',
  data: {
    overview: '火锅值得接受。',
    key_factors: ['想吃肉'],
    risks: ['预算略高'],
    hidden_conflicts: ['满足感与预算冲突'],
    scenarios: ['疲惫时更适合直接决定'],
    next_steps: ['现在去订位'],
  },
}

const decisionPayload = {
  success: true,
  type: 'decision',
  data: {
    recommended_option: '火锅',
    confidence: 89,
    verdict: '今晚更适合火锅。',
    core_reasons: ['满足感优先'],
    main_tradeoff: '预算略高',
    conditions_to_reconsider: ['预算不足'],
    action_plan: ['现在去订位'],
  },
}

describe('createAiApiClient', () => {
  afterEach(() => vi.useRealTimers())

  it('posts content to the deep-analysis endpoint', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => deepPayload,
    } as Response)

    await expect(createAiApiClient(fetcher).deepAnalyze('完整上下文'))
      .resolves.toEqual(deepPayload.data)
    expect(fetcher).toHaveBeenCalledWith(
      AI_ENDPOINTS.deepAnalysis,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ content: '完整上下文' }),
      }),
    )
  })

  it('posts direct advice to the decision endpoint', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => decisionPayload,
    } as Response)

    await expect(createAiApiClient(fetcher).decide('用户背景')).resolves.toEqual(decisionPayload.data)
    expect(fetcher).toHaveBeenCalledWith(
      AI_ENDPOINTS.decision,
      expect.objectContaining({ body: JSON.stringify({ content: '用户背景' }) }),
    )
  })

  it('maps HTTP 429 to a rate-limited error', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 429 } as Response)

    await expect(createAiApiClient(fetcher).decide('内容'))
      .rejects.toEqual(expect.objectContaining<Partial<AiApiError>>({ code: 'rate_limited' }))
  })

  it('rejects an invalid structured response', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, result: '旧接口文本' }),
    } as Response)

    await expect(createAiApiClient(fetcher).deepAnalyze('内容'))
      .rejects.toEqual(expect.objectContaining<Partial<AiApiError>>({ code: 'invalid_response' }))
  })

  it('aborts a request after twenty seconds', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn((_input: URL | RequestInfo, init?: RequestInit) => (
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      })
    )) as unknown as typeof fetch
    const pending = createAiApiClient(fetcher).decide('内容')
    const rejection = expect(pending).rejects.toEqual(
      expect.objectContaining<Partial<AiApiError>>({ code: 'timeout' }),
    )

    await vi.advanceTimersByTimeAsync(20_000)

    await rejection
  })
})
