import { createMysticDecision } from '../algorithms/mystic'
import { chooseRandomOption } from '../algorithms/random'
import { rankScientificOptions } from '../algorithms/scientific'
import type {
  Criterion,
  DecisionOption,
  DecisionResult,
  ScientificScoreMap,
} from '../types/decision'

interface ResultMetadata {
  question: string
  options: DecisionOption[]
  now?: () => Date
  makeId?: () => string
}

interface RandomResultInput extends ResultMetadata {
  random?: () => number
}

interface ScientificResultInput extends ResultMetadata {
  criteria: Criterion[]
  scores: ScientificScoreMap
}

function defaultId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `decision-${Date.now()}`
}

function baseResult(
  input: ResultMetadata,
): Pick<DecisionResult, 'id' | 'createdAt' | 'question' | 'options'> {
  return {
    id: (input.makeId ?? defaultId)(),
    createdAt: (input.now ?? (() => new Date()))().toISOString(),
    question: input.question.trim() || '这次决定',
    options: input.options,
  }
}

export function createRandomResult(input: RandomResultInput): DecisionResult {
  const winnerLabel = chooseRandomOption(
    input.options.map((option) => option.label),
    input.random,
  )
  const winner = input.options.find((option) => option.label.trim() === winnerLabel)
  if (!winner) throw new Error('随机结果无法映射到候选项')

  return {
    ...baseResult(input),
    mode: 'random',
    winner,
    explanation: `系统对 ${input.options.length} 个候选项执行了等概率抽取，「${winner.label}」在本轮随机序列中胜出。`,
    confidence: 100,
    metrics: [
      { key: 'equal-probability', label: '等概率执行', value: 100 },
      { key: 'coverage', label: '候选覆盖率', value: 100 },
      { key: 'bias', label: '人为偏置', value: 0, inverse: true },
    ],
  }
}

export function createMysticResult(input: RandomResultInput): DecisionResult {
  const mystic = createMysticDecision(
    input.options.map((option) => option.label),
    input.random,
  )
  const winner = input.options.find((option) => option.label.trim() === mystic.winner)
  if (!winner) throw new Error('玄学结果无法映射到候选项')

  return {
    ...baseResult(input),
    mode: 'mystic',
    winner,
    explanation: mystic.explanation,
    confidence: mystic.confidence,
    metrics: mystic.metrics,
    disclaimer: mystic.disclaimer,
  }
}

export function createScientificResult(input: ScientificResultInput): DecisionResult {
  const ranking = rankScientificOptions(input.options, input.criteria, input.scores)
  const leader = ranking[0]
  const winner = input.options.find((option) => option.id === leader.optionId)
  if (!winner) throw new Error('科学结果无法映射到候选项')

  const mostImportant = [...input.criteria].sort((a, b) => b.weight - a.weight)[0]
  const metrics = input.criteria.slice(0, 4).map((criterion) => ({
    key: criterion.id,
    label: criterion.name,
    value: Math.round(input.scores[winner.id][criterion.id] * 10),
  }))

  return {
    ...baseResult(input),
    mode: 'scientific',
    winner,
    explanation: `「${winner.label}」的综合加权得分为 ${leader.score.toFixed(2)}，并在权重最高的“${mostImportant.name}”等指标下取得当前最优排名。`,
    confidence: Math.round(leader.score * 10),
    metrics,
    ranking,
  }
}
