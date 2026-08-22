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

export type TarotOrientation = 'upright' | 'reversed'

export interface TarotMeaning {
  keywords: string[]
  interpretation: string
  omen: string
  resonance: string
  echo: string
  strength: number
}

export interface TarotCardDefinition {
  id: string
  number: number
  numeral: string
  name: string
  chineseName: string
  upright: TarotMeaning
  reversed: TarotMeaning
}

export interface TarotResultReading {
  cardId: string
  number: number
  numeral: string
  name: string
  chineseName: string
  orientation: TarotOrientation
  keywords: string[]
  interpretation: string
  /** 新版三段式解读；可选以兼容旧版 LocalStorage。 */
  omen?: string
  /** 已将候选项占位符替换为本轮结果。 */
  resonance?: string
  echo?: string
  strength: number
  selectedPosition: number
  deckFingerprint: string
}

export interface MysticResultDetails {
  type: 'mystic'
  tarot?: TarotResultReading
  /** 兼容 V1.0 玄学历史记录。 */
  evidence: MysticEvidence[]
  /** 兼容 V1.0 玄学历史记录。 */
  favorable: string
  /** 兼容 V1.0 玄学历史记录。 */
  avoid: string
}

export type DecisionResultDetails =
  | RandomResultDetails
  | ScientificResultDetails
  | MysticResultDetails

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

export type DecisionHistoryItem = DecisionResult

export interface HistoryStoreV1 {
  version: 1
  items: DecisionHistoryItem[]
}
