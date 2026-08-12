import type { AiDecisionData, AiDeepAnalysisData } from '../types/decision'

export const AI_ENDPOINTS = {
  deepAnalysis: 'https://api.fshfish.com/api/ai/deep-analysis',
  decision: 'https://api.fshfish.com/api/ai/decision',
} as const

export type AiApiErrorCode =
  | 'network'
  | 'timeout'
  | 'rate_limited'
  | 'invalid_response'

export class AiApiError extends Error {
  constructor(public readonly code: AiApiErrorCode, message: string) {
    super(message)
    this.name = 'AiApiError'
  }
}

export interface AiApiClient {
  deepAnalyze(content: string): Promise<AiDeepAnalysisData>
  decide(content: string): Promise<AiDecisionData>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isDeepAnalysis(value: unknown): value is AiDeepAnalysisData {
  return isRecord(value) &&
    typeof value.overview === 'string' &&
    isStringArray(value.key_factors) &&
    isStringArray(value.risks) &&
    isStringArray(value.hidden_conflicts) &&
    isStringArray(value.scenarios) &&
    isStringArray(value.next_steps)
}

function isDecision(value: unknown): value is AiDecisionData {
  return isRecord(value) &&
    typeof value.recommended_option === 'string' &&
    typeof value.confidence === 'number' &&
    Number.isFinite(value.confidence) &&
    value.confidence >= 0 &&
    value.confidence <= 100 &&
    typeof value.verdict === 'string' &&
    isStringArray(value.core_reasons) &&
    typeof value.main_tradeoff === 'string' &&
    isStringArray(value.conditions_to_reconsider) &&
    isStringArray(value.action_plan)
}

async function request<T>(
  endpoint: string,
  expectedType: 'deep-analysis' | 'decision',
  content: string,
  fetcher: typeof fetch,
  validate: (value: unknown) => value is T,
): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 20_000)

  try {
    const response = await fetcher(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
      signal: controller.signal,
    })
    if (response.status === 429) {
      throw new AiApiError('rate_limited', '请求有点太密集，请稍后再试')
    }
    if (!response.ok) {
      throw new AiApiError('network', 'AI 服务暂时无法连接')
    }

    const payload: unknown = await response.json()
    if (
      !isRecord(payload) ||
      payload.success !== true ||
      payload.type !== expectedType ||
      !validate(payload.data)
    ) {
      throw new AiApiError('invalid_response', 'AI 返回内容未通过格式检查')
    }
    return payload.data
  } catch (error) {
    if (error instanceof AiApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AiApiError('timeout', 'AI 请求超时')
    }
    throw new AiApiError('network', '无法连接 AI 服务')
  } finally {
    window.clearTimeout(timeout)
  }
}

export function createAiApiClient(fetcher: typeof fetch = fetch): AiApiClient {
  return {
    deepAnalyze(content) {
      return request(AI_ENDPOINTS.deepAnalysis, 'deep-analysis', content, fetcher, isDeepAnalysis)
    },
    decide(content) {
      return request(AI_ENDPOINTS.decision, 'decision', content, fetcher, isDecision)
    },
  }
}
