import { describe, expect, it, vi } from 'vitest'

import type { AiDecisionRequest } from '../types/decision'
import { createAiDecisionClient } from './aiDecisionClient'

const request: AiDecisionRequest = {
  question: '今晚吃什么？',
  options: [
    { id: 'hotpot', label: '火锅' },
    { id: 'sushi', label: '日料' },
  ],
  requirements: '预算 100 元，不想走太远。',
}

describe('createAiDecisionClient', () => {
  it('returns a structured not-configured error when no server endpoint exists', async () => {
    const client = createAiDecisionClient('')

    expect(client.isConfigured).toBe(false)
    await expect(client.analyze(request)).rejects.toMatchObject({ code: 'not_configured' })
  })

  it('rejects an invalid server response instead of trusting unknown JSON', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ recommendation: '火锅' }),
    } as Response)

    await expect(createAiDecisionClient('/api/decision', fetcher).analyze(request))
      .rejects.toMatchObject({ code: 'invalid_response' })
  })

  it('accepts only a structured constraint and criterion suggestion', async () => {
    const suggestion = {
      constraints: ['预算不超过 100 元'],
      criteria: [
        { id: 'budget', name: '预算匹配', weight: 60, reason: '用户明确提出预算' },
        { id: 'distance', name: '距离便利', weight: 40, reason: '用户不想走太远' },
      ],
    }
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => suggestion } as Response)

    await expect(createAiDecisionClient('/api/decision', fetcher).analyze(request)).resolves.toEqual(suggestion)
    expect(fetcher).toHaveBeenCalledWith('/api/decision', expect.objectContaining({ method: 'POST' }))
  })
})
