import { createMysticDecision } from '../algorithms/mystic'
import { drawRandomOption } from '../algorithms/random'
import { rankScientificOptions } from '../algorithms/scientific'
import type { TarotSpreadCard } from '../tarot/tarotEngine'
import type {
  AiDecisionData,
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

interface TarotResultInput extends ResultMetadata {
  selection: TarotSpreadCard
  deckFingerprint: string
}

interface AiResultInput extends ResultMetadata {
  context: string
  advice: AiDecisionData
}

function defaultId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `decision-${Date.now()}`
}

function baseResult(
  input: ResultMetadata,
  createdAt = (input.now ?? (() => new Date()))(),
): Pick<DecisionResult, 'id' | 'createdAt' | 'question' | 'options'> {
  return {
    id: (input.makeId ?? defaultId)(),
    createdAt: createdAt.toISOString(),
    question: input.question.trim() || '这次决定',
    options: input.options,
  }
}

function formatRandomFingerprint(sample: number): string {
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
  currentTime: Date,
): MysticEvidence[] {
  const inputPosition = input.options.findIndex((option) => option.id === winner.id) + 1
  const currentHour = currentTime.getHours()
  const currentMinute = currentTime.getMinutes()
  const timeLabel = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`
  const resonance = (
    (winner.label.trim().length * 137 + confidence + currentHour * 31 + currentMinute * 17)
    % 1000
  ) / 1000
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
      description: `当前时间 ${timeLabel} 与「${winner.label}」的字符长度产生了异常稳定的共振。`,
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
      fingerprint: formatRandomFingerprint(draw.sample),
      drawNumber: formatDrawNumber(draw.sample),
      probability: 1 / draw.optionCount,
    },
  }
}

export function createMysticResult(input: RandomResultInput): DecisionResult {
  const currentTime = (input.now ?? (() => new Date()))()
  const mystic = createMysticDecision(
    input.options.map((option) => option.label),
    input.random,
  )
  const winner = input.options.find((option) => option.label.trim() === mystic.winner)
  if (!winner) throw new Error('玄学结果无法映射到候选项')

  return {
    ...baseResult(input, currentTime),
    mode: 'mystic',
    winner,
    explanation: mystic.explanation,
    confidence: mystic.confidence,
    metrics: mystic.metrics,
    disclaimer: mystic.disclaimer,
    details: {
      type: 'mystic',
      evidence: buildMysticEvidence(input, winner, mystic.confidence, currentTime),
      favorable: `今日宜：${winner.label}`,
      avoid: '今日忌：重新打开选项继续纠结',
    },
  }
}

export function createTarotResult(input: TarotResultInput): DecisionResult {
  const { card, orientation, position, winner } = input.selection
  const meaning = card[orientation]
  const orientationLabel = orientation === 'upright' ? '正位' : '逆位'
  const resonance = meaning.resonance.replace('{option}', winner.label)

  return {
    ...baseResult(input),
    mode: 'mystic',
    winner,
    explanation: `${card.chineseName} · ${orientationLabel}：${meaning.interpretation} ${resonance} ${meaning.echo} ${meaning.punchline}`,
    confidence: meaning.strength * 20,
    metrics: [],
    disclaimer: '塔罗解读仅供娱乐。牌已经表态，真正的决定权仍然在你。',
    details: {
      type: 'mystic',
      tarot: {
        cardId: card.id,
        number: card.number,
        numeral: card.numeral,
        name: card.name,
        chineseName: card.chineseName,
        orientation,
        keywords: [...meaning.keywords],
        interpretation: meaning.interpretation,
        resonance,
        echo: meaning.echo,
        punchline: meaning.punchline,
        strength: meaning.strength,
        selectedPosition: position,
        deckFingerprint: input.deckFingerprint,
      },
      evidence: [],
      favorable: `接受「${winner.label}」作为本轮答案`,
      avoid: '翻回牌背假装刚才没有看见',
    },
  }
}

export function createAiResult(input: AiResultInput): DecisionResult {
  const recommendation = input.advice.recommended_option.trim()
  const winner = input.options.find((option) => option.label.trim() === recommendation)
  if (!winner) throw new Error('AI 推荐项无法映射到候选项')

  return {
    ...baseResult(input),
    mode: 'ai',
    winner,
    explanation: input.advice.verdict,
    confidence: input.advice.confidence,
    metrics: [],
    details: {
      type: 'ai',
      context: input.context.trim(),
      advice: {
        ...input.advice,
        recommended_option: recommendation,
        core_reasons: [...input.advice.core_reasons],
        conditions_to_reconsider: [...input.advice.conditions_to_reconsider],
        action_plan: [...input.advice.action_plan],
      },
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
