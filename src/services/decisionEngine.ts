import { createMysticDecision } from '../algorithms/mystic'
import { drawRandomOption } from '../algorithms/random'
import { rankScientificOptions } from '../algorithms/scientific'
import type {
  Criterion,
  DecisionOption,
  DecisionResult,
  MysticEvidence,
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

function formatRandomSeed(sample: number): string {
  const encoded = Math.floor(sample * 0xffffffff)
    .toString(16)
    .toUpperCase()
    .padStart(8, '0')
  return `${encoded.slice(0, 4)}-${encoded.slice(4)}`
}

function formatDrawNumber(sample: number): string {
  const number = Math.floor(sample * 999999) + 1
  return `#${String(number).padStart(6, '0')}`
}

function buildMysticEvidence(
  input: RandomResultInput,
  winner: DecisionOption,
  confidence: number,
): MysticEvidence[] {
  const inputPosition = input.options.findIndex((option) => option.id === winner.id) + 1
  const resonance = ((winner.label.trim().length * 137 + confidence) % 1000) / 1000
  const timelines = Math.min(9999, confidence * 100 + winner.label.trim().length * 7)

  return [
    {
      key: 'input-order',
      title: '输入顺序效应',
      description: `你把「${winner.label}」放在第 ${inputPosition} 个位置，系统认为这绝非偶然。`,
      reading: `POSITION / ${String(inputPosition).padStart(2, '0')}`,
    },
    {
      key: 'character-resonance',
      title: '字符共振',
      description: `当前时间与「${winner.label}」的字符长度产生了异常稳定的相关性。`,
      reading: `RESONANCE / ${resonance.toFixed(3)}`,
    },
    {
      key: 'parallel-timelines',
      title: '平行时间线',
      description: `在 10,000 条模拟时间线中，有 ${timelines.toLocaleString('zh-CN')} 个你最终选择了「${winner.label}」。`,
      reading: `TIMELINES / ${timelines}`,
    },
  ]
}

export function createRandomResult(input: RandomResultInput): DecisionResult {
  const draw = drawRandomOption(
    input.options.map((option) => option.label),
    input.random,
  )
  const winner = input.options.find((option) => option.label.trim() === draw.winner)
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
    details: {
      type: 'random',
      sample: draw.sample,
      winningIndex: draw.winningIndex,
      seed: formatRandomSeed(draw.sample),
      drawNumber: formatDrawNumber(draw.sample),
      probability: 1 / draw.optionCount,
    },
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
    details: {
      type: 'mystic',
      evidence: buildMysticEvidence(input, winner, mystic.confidence),
      favorable: `今日宜：${winner.label}`,
      avoid: '今日忌：重新打开选项继续纠结',
    },
  }
}

export function createScientificResult(input: ScientificResultInput): DecisionResult {
  const ranking = rankScientificOptions(input.options, input.criteria, input.scores)
  const leader = ranking[0]
  const winner = input.options.find((option) => option.id === leader.optionId)
  if (!winner) throw new Error('科学结果无法映射到候选项')

  const contributions = input.criteria.map((criterion) => {
    const score = input.scores[winner.id][criterion.id]
    return {
      criterionId: criterion.id,
      name: criterion.name,
      weight: criterion.weight,
      score,
      contribution: score * criterion.weight / 100,
    }
  })
  const strongest = [...contributions].sort(
    (left, right) => right.contribution - left.contribution,
  )[0]
  const runnerUp = ranking[1]
  const gap = runnerUp ? leader.score - runnerUp.score : leader.score
  const metrics = input.criteria.slice(0, 4).map((criterion) => ({
    key: criterion.id,
    label: criterion.name,
    value: Math.round(input.scores[winner.id][criterion.id] * 10),
  }))

  return {
    ...baseResult(input),
    mode: 'scientific',
    winner,
    explanation: `「${winner.label}」的综合加权得分为 ${leader.score.toFixed(2)}，在“${strongest.name}”上获得本轮最高贡献 ${strongest.contribution.toFixed(2)} 分，并以 ${gap.toFixed(2)} 分的综合优势胜出。`,
    confidence: Math.round(leader.score * 10),
    metrics,
    ranking,
    details: {
      type: 'scientific',
      criteria: input.criteria.map((criterion) => ({ ...criterion })),
      scores: Object.fromEntries(
        Object.entries(input.scores).map(([optionId, scoreMap]) => [
          optionId,
          { ...scoreMap },
        ]),
      ),
      contributions,
    },
  }
}
