export type DecisionMode = 'random' | 'scientific' | 'mystic'

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
}

export type DecisionHistoryItem = DecisionResult

export interface HistoryStoreV1 {
  version: 1
  items: DecisionHistoryItem[]
}
