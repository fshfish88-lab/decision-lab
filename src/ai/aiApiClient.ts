import type { AiDecisionData, AiDeepAnalysisData } from '../types/decision'

export const AI_ENDPOINTS = {
  deepAnalysis: 'https://api.fshfish.com/api/ai/deep-analysis',
  decision: 'https://api.fshfish.com/api/ai/decision',
} as const

export const AI_REQUEST_TIMEOUT_MS = 40_000

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

function readAlias(
  value: Record<string, unknown>,
  snakeCase: string,
  camelCase: string,
): unknown {
  return value[snakeCase] ?? value[camelCase]
}

function normalizeList(
  value: unknown,
  formatRecord?: (item: Record<string, unknown>) => string | null,
): string[] | null {
  if (!Array.isArray(value)) return null
  const normalized: string[] = []
  for (const item of value) {
    if (typeof item === 'string') {
      normalized.push(item)
      continue
    }
    if (!isRecord(item) || !formatRecord) return null
    const formatted = formatRecord(item)
    if (formatted === null) return null
    normalized.push(formatted)
  }
  return normalized
}

function levelLabel(value: unknown, suffix: string): string {
  const labels: Record<string, string> = { high: '高', medium: '中', low: '低' }
  return typeof value === 'string' ? `${labels[value] ?? value}${suffix}` : ''
}

function formatKeyFactor(item: Record<string, unknown>): string | null {
  if (typeof item.name !== 'string' || typeof item.reason !== 'string') return null
  const impact = levelLabel(item.impact, '影响')
  return `${item.name}${impact ? `（${impact}）` : ''}：${item.reason}`
}

function formatRisk(item: Record<string, unknown>): string | null {
  if (typeof item.risk !== 'string' || typeof item.mitigation !== 'string') return null
  const level = levelLabel(item.level, '风险')
  return `${item.risk}${level ? `（${level}）` : ''}；应对：${item.mitigation}`
}

function formatScenario(item: Record<string, unknown>): string | null {
  if (
    typeof item.name !== 'string' ||
    typeof item.outcome !== 'string' ||
    typeof item.trigger !== 'string'
  ) return null
  return `${item.name}：${item.outcome}；触发条件：${item.trigger}`
}

function normalizeDeepAnalysis(value: unknown): AiDeepAnalysisData | null {
  if (!isRecord(value) || typeof value.overview !== 'string') return null
  const keyFactors = normalizeList(
    readAlias(value, 'key_factors', 'keyFactors'),
    formatKeyFactor,
  )
  const risks = normalizeList(value.risks, formatRisk)
  const hiddenConflicts = normalizeList(
    readAlias(value, 'hidden_conflicts', 'hiddenConflicts'),
  )
  const scenarios = normalizeList(value.scenarios, formatScenario)
  const nextSteps = normalizeList(readAlias(value, 'next_steps', 'nextSteps'))
  if (!keyFactors || !risks || !hiddenConflicts || !scenarios || !nextSteps) return null
  return {
    overview: value.overview,
    key_factors: keyFactors,
    risks,
    hidden_conflicts: hiddenConflicts,
    scenarios,
    next_steps: nextSteps,
  }
}

function normalizeDecision(value: unknown): AiDecisionData | null {
  if (!isRecord(value)) return null
  const recommendedOption = readAlias(value, 'recommended_option', 'recommendedOption')
  const coreReasons = normalizeList(readAlias(value, 'core_reasons', 'coreReasons'))
  const mainTradeoff = readAlias(value, 'main_tradeoff', 'mainTradeoff')
  const conditionsToReconsider = normalizeList(
    readAlias(value, 'conditions_to_reconsider', 'conditionsToReconsider'),
  )
  const actionPlan = normalizeList(readAlias(value, 'action_plan', 'actionPlan'))
  if (
    typeof recommendedOption !== 'string' ||
    typeof value.confidence !== 'number' ||
    !Number.isFinite(value.confidence) ||
    value.confidence < 0 ||
    value.confidence > 100 ||
    typeof value.verdict !== 'string' ||
    !coreReasons ||
    typeof mainTradeoff !== 'string' ||
    !conditionsToReconsider ||
    !actionPlan
  ) return null
  return {
    recommended_option: recommendedOption,
    confidence: value.confidence,
    verdict: value.verdict,
    core_reasons: coreReasons,
    main_tradeoff: mainTradeoff,
    conditions_to_reconsider: conditionsToReconsider,
    action_plan: actionPlan,
  }
}

async function request<T>(
  endpoint: string,
  expectedType: 'deep-analysis' | 'decision',
  content: string,
  fetcher: typeof fetch,
  normalize: (value: unknown) => T | null,
): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS)

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
    if (!isRecord(payload) || payload.success !== true || payload.type !== expectedType) {
      throw new AiApiError('invalid_response', 'AI 返回内容未通过格式检查')
    }
    const normalized = normalize(payload.data) ?? normalize(payload)
    if (!normalized) {
      throw new AiApiError('invalid_response', 'AI 返回内容未通过格式检查')
    }
    return normalized
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
      return request(
        AI_ENDPOINTS.deepAnalysis,
        'deep-analysis',
        content,
        fetcher,
        normalizeDeepAnalysis,
      )
    },
    decide(content) {
      return request(AI_ENDPOINTS.decision, 'decision', content, fetcher, normalizeDecision)
    },
  }
}
