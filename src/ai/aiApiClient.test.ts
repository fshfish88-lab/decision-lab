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

  it('forwards caller cancellation and clears the timeout without reporting a timeout error', async () => {
    vi.useFakeTimers()
    const controller = new AbortController()
    let fetchSignal: AbortSignal | null | undefined
    const fetcher = vi.fn((_input: URL | RequestInfo, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      fetchSignal = init?.signal
      fetchSignal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    }))
    const pending = createAiApiClient(fetcher).decide('取消的请求', controller.signal)
    const rejection = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort()
    await rejection
    expect(fetchSignal?.aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

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

  it('normalizes the flattened structured deep-analysis response used by production', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        type: 'deep-analysis',
        overview: '烧烤已经被命运点名。',
        key_factors: [{ name: '玄学共振强度', impact: 'high', reason: '宇宙在递烤串。' }],
        risks: [{ risk: '容易烤焦', level: 'medium', mitigation: '避开焦黑部分。' }],
        hidden_conflicts: ['爽快与丰富之间仍有拉扯。'],
        scenarios: [{ name: '完美烧烤夜', outcome: '大家吃得很开心。', trigger: '无需排队。' }],
        next_steps: ['现在去订位。'],
      }),
    } as Response)

    await expect(createAiApiClient(fetcher).deepAnalyze('完整上下文')).resolves.toEqual({
      overview: '烧烤已经被命运点名。',
      key_factors: ['玄学共振强度（高影响）：宇宙在递烤串。'],
      risks: ['容易烤焦（中风险）；应对：避开焦黑部分。'],
      hidden_conflicts: ['爽快与丰富之间仍有拉扯。'],
      scenarios: ['完美烧烤夜：大家吃得很开心。；触发条件：无需排队。'],
      next_steps: ['现在去订位。'],
    })
  })

  it('accepts flattened camelCase aliases from the decision endpoint', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        type: 'decision',
        recommendedOption: '火锅',
        confidence: 89,
        verdict: '今晚更适合火锅。',
        coreReasons: ['满足感优先'],
        mainTradeoff: '预算略高',
        conditionsToReconsider: ['预算不足'],
        actionPlan: ['现在去订位'],
      }),
    } as Response)

    await expect(createAiApiClient(fetcher).decide('用户背景')).resolves.toEqual(
      decisionPayload.data,
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

  it('recovers once from malformed deep-analysis data without exposing it', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ success: true, type: 'deep-analysis', overview: '只有摘要，其他字段缺失' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => deepPayload })
    await expect(createAiApiClient(fetcher).deepAnalyze('原始决策')).resolves.toEqual(deepPayload.data)
    expect(fetcher).toHaveBeenCalledTimes(2)
    const retryBody = JSON.parse(fetcher.mock.calls[1][1].body as string) as { content: string }
    expect(retryBody.content).toContain('原始决策')
    expect(retryBody.content).toContain('格式修正')
    expect(retryBody.content).not.toContain('只有摘要，其他字段缺失')
  })

  it('recovers from invalid JSON but caps format recovery at one retry', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => { throw new SyntaxError('truncated JSON') } })
    await expect(createAiApiClient(fetcher).deepAnalyze('内容')).rejects.toMatchObject({ code: 'invalid_response' })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('uses one 40-second deadline for the original request and format retry', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn()
      .mockImplementationOnce(() => new Promise<Response>(resolve => setTimeout(() => resolve({ ok: true, status: 200, json: async () => ({}) } as Response), 12_000)))
      .mockImplementationOnce((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      }))
    const pending = createAiApiClient(fetcher).deepAnalyze('内容')
    const rejection = expect(pending).rejects.toMatchObject({ code: 'timeout' })
    await vi.advanceTimersByTimeAsync(12_000)
    expect(fetcher).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(28_000)
    await rejection
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not retry network errors, limits or direct decisions', async () => {
    for (const status of [429, 500]) {
      const fetcher = vi.fn().mockResolvedValue({ ok: false, status })
      await expect(createAiApiClient(fetcher).deepAnalyze('内容')).rejects.toBeInstanceOf(AiApiError)
      expect(fetcher).toHaveBeenCalledTimes(1)
    }
    const fetcher = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
    await expect(createAiApiClient(fetcher).decide('内容')).rejects.toMatchObject({ code: 'invalid_response' })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('does not start format recovery when less than ten seconds remain', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn(() => new Promise<Response>(resolve => setTimeout(() => resolve({ ok: true, status: 200, json: async () => ({}) } as Response), 31_000)))
    const rejection = expect(createAiApiClient(fetcher).deepAnalyze('内容')).rejects.toMatchObject({ code: 'invalid_response' })
    await vi.advanceTimersByTimeAsync(31_000)
    await rejection
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('cancels the format retry with the original caller signal', async () => {
    vi.useFakeTimers()
    const controller = new AbortController()
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) })
      .mockImplementationOnce((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      }))
    const rejection = expect(createAiApiClient(fetcher).deepAnalyze('内容', controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
    await vi.advanceTimersByTimeAsync(0)
    expect(fetcher).toHaveBeenCalledTimes(2)
    controller.abort()
    await rejection
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps a request alive through 39,999 ms and aborts at 40 seconds', async () => {
    vi.useFakeTimers()
    const requestSignals: AbortSignal[] = []
    const fetcher = vi.fn((_input: URL | RequestInfo, init?: RequestInit) => (
      new Promise<Response>((_resolve, reject) => {
        if (init?.signal) requestSignals.push(init.signal)
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      })
    )) as unknown as typeof fetch
    const pending = createAiApiClient(fetcher).decide('内容')
    const rejection = expect(pending).rejects.toEqual(
      expect.objectContaining<Partial<AiApiError>>({ code: 'timeout' }),
    )

    await vi.advanceTimersByTimeAsync(39_999)
    expect(requestSignals[0]?.aborted).toBe(false)

    await vi.advanceTimersByTimeAsync(1)

    await rejection
  })
})
