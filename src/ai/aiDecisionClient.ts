import type { AiDecisionRequest, AiDecisionSuggestion } from '../types/decision'

export type AiDecisionErrorCode = 'not_configured' | 'network' | 'timeout' | 'invalid_response'

export class AiDecisionError extends Error {
  constructor(public readonly code: AiDecisionErrorCode, message: string) {
    super(message)
    this.name = 'AiDecisionError'
  }
}

export interface AiDecisionClient {
  isConfigured: boolean
  analyze(request: AiDecisionRequest): Promise<AiDecisionSuggestion>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isSuggestion(value: unknown): value is AiDecisionSuggestion {
  if (!isRecord(value) || !Array.isArray(value.constraints) || !Array.isArray(value.criteria)) {
    return false
  }
  return value.constraints.every((constraint) => typeof constraint === 'string') &&
    value.criteria.length >= 2 &&
    value.criteria.every((criterion) => (
      isRecord(criterion) &&
      typeof criterion.id === 'string' &&
      typeof criterion.name === 'string' &&
      typeof criterion.reason === 'string' &&
      typeof criterion.weight === 'number' &&
      Number.isFinite(criterion.weight) &&
      criterion.weight >= 0 &&
      criterion.weight <= 100
    ))
}

export function createAiDecisionClient(
  endpoint = import.meta.env.VITE_AI_API_URL as string | undefined,
  fetcher: typeof fetch = fetch,
): AiDecisionClient {
  const normalizedEndpoint = endpoint?.trim() ?? ''

  return {
    isConfigured: Boolean(normalizedEndpoint),
    async analyze(request): Promise<AiDecisionSuggestion> {
      if (!normalizedEndpoint) {
        throw new AiDecisionError('not_configured', 'AI 服务尚未接入')
      }

      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 10000)
      try {
        const response = await fetcher(normalizedEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal: controller.signal,
        })
        if (!response.ok) throw new AiDecisionError('network', 'AI 服务暂时不可用')

        const payload: unknown = await response.json()
        if (!isSuggestion(payload)) {
          throw new AiDecisionError('invalid_response', 'AI 返回了无法验证的数据')
        }
        return payload
      } catch (error) {
        if (error instanceof AiDecisionError) throw error
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new AiDecisionError('timeout', 'AI 请求超时')
        }
        throw new AiDecisionError('network', '无法连接 AI 服务')
      } finally {
        window.clearTimeout(timeout)
      }
    },
  }
}
