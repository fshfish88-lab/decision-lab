import { MYSTIC_DISCLAIMER, MYSTIC_TEMPLATES } from '../data/mysticTemplates'
import type { DecisionMetric } from '../types/decision'
import { cleanOptions } from './random'

export interface MysticDecision {
  winner: string
  explanation: string
  confidence: number
  metrics: DecisionMetric[]
  disclaimer: string
}

const POSITIVE_METRICS = [
  { key: 'cosmic', label: '宇宙共振率' },
  { key: 'destiny', label: '命运匹配度' },
  { key: 'subconscious', label: '潜意识偏好' },
  { key: 'fortune', label: '今日幸运指数' },
  { key: 'entropy', label: '决策熵稳定度' },
] as const

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function sampleIndex(length: number, random: () => number): number {
  const sample = random()
  if (sample < 0 || sample >= 1) {
    throw new Error('随机源必须返回 [0, 1) 区间内的数值')
  }
  return Math.floor(sample * length)
}

export function createMysticDecision(
  options: string[],
  random: () => number = Math.random,
): MysticDecision {
  const validOptions = cleanOptions(options)
  if (validOptions.length < 2) {
    throw new Error('至少需要两个有效选项')
  }

  const winner = validOptions[sampleIndex(validOptions.length, random)]
  const confidence = clamp(Math.round(78 + random() * 19), 60, 99)
  const template = MYSTIC_TEMPLATES[sampleIndex(MYSTIC_TEMPLATES.length, random)]
  const metricCount = 3 + sampleIndex(3, random)

  const positiveMetrics: DecisionMetric[] = POSITIVE_METRICS.map((metric, index) => ({
    ...metric,
    value: clamp(
      Math.round(confidence + (random() - 0.5) * 10 + (index % 2 === 0 ? 2 : -2)),
      60,
      99,
    ),
  })).slice(0, metricCount - 1)

  const regret: DecisionMetric = {
    key: 'regret',
    label: '后悔概率',
    value: clamp(Math.round(100 - confidence + (random() - 0.5) * 4), 1, 40),
    inverse: true,
  }

  return {
    winner,
    explanation: template.replaceAll('{choice}', winner),
    confidence,
    metrics: [...positiveMetrics, regret],
    disclaimer: MYSTIC_DISCLAIMER,
  }
}
