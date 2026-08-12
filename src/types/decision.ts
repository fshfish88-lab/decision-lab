export type DecisionMode = 'random' | 'scientific' | 'mystic' | 'ai'

export interface DecisionOption {
  id: string
  label: string
}

export interface Criterion {
  id: string
  name: string
  weight: number
}

export type ScientificScoreMap = Record<string, Record<string, number>>

export interface ScientificRanking {
  optionId: string
  label: string
  score: number
  rank: number
}

export interface DecisionMetric {
  key: string
  label: string
  value: number
  inverse?: boolean
}

export interface RandomResultDetails {
  type: 'random'
  sample: number
  winningIndex: number
  fingerprint?: string
  /** @deprecated 兼容旧版历史记录。 */
  seed?: string
  drawNumber: string
  probability: number
}

export interface ScientificContribution {
  criterionId: string
  name: string
  weight: number
  score: number
  contribution: number
}

export interface ScientificResultDetails {
  type: 'scientific'
  criteria: Criterion[]
  scores: ScientificScoreMap
  contributions: ScientificContribution[]
}

export interface MysticEvidence {
  key: string
  title: string
  description: string
  reading: string
}

export interface MysticResultDetails {
  type: 'mystic'
  evidence: MysticEvidence[]
  favorable: string
  avoid: string
}

export interface AiDeepAnalysisData {
  overview: string
  key_factors: string[]
  risks: string[]
  hidden_conflicts: string[]
  scenarios: string[]
  next_steps: string[]
}

export interface AiDecisionData {
  recommended_option: string
  confidence: number
  verdict: string
  core_reasons: string[]
  main_tradeoff: string
  conditions_to_reconsider: string[]
  action_plan: string[]
}

export interface AiResultDetails {
  type: 'ai'
  context: string
  advice: AiDecisionData
}

export type DecisionResultDetails =
  | RandomResultDetails
  | ScientificResultDetails
  | MysticResultDetails
  | AiResultDetails

export interface DecisionResult {
  id: string
  createdAt: string
  question: string
  options: DecisionOption[]
  mode: DecisionMode
  winner: DecisionOption
  explanation: string
  confidence: number
  metrics: DecisionMetric[]
  ranking?: ScientificRanking[]
  disclaimer?: string
  details?: DecisionResultDetails
}

export interface DecisionBehavior {
  regrettedAt?: string
  shareCount: number
  lastSharedAt?: string
}

export interface AiDecisionRequest {
  question: string
  options: DecisionOption[]
  requirements: string
}

export interface AiCriterionSuggestion {
  id: string
  name: string
  weight: number
  reason: string
}

export interface AiDecisionSuggestion {
  constraints: string[]
  criteria: AiCriterionSuggestion[]
}

export type DecisionHistoryItem = DecisionResult & DecisionBehavior

export interface HistoryStoreV1 {
  version: 1
  items: DecisionResult[]
}

export interface HistoryStoreV2 {
  version: 2
  items: DecisionHistoryItem[]
}
