import type {
  Criterion,
  DecisionOption,
  ScientificRanking,
  ScientificScoreMap,
} from '../types/decision'

const EPSILON = 1e-6

export function rankScientificOptions(
  options: DecisionOption[],
  criteria: Criterion[],
  scores: ScientificScoreMap,
): ScientificRanking[] {
  if (options.length < 2) {
    throw new Error('至少需要两个有效选项')
  }

  if (criteria.length < 2) {
    throw new Error('至少需要两个评价指标')
  }

  const totalWeight = criteria.reduce(
    (total, criterion) => total + criterion.weight,
    0,
  )

  if (Math.abs(totalWeight - 100) > EPSILON) {
    throw new Error('指标权重总和必须等于 100%')
  }

  const ranked = options.map((option, originalIndex) => {
    const weightedTotal = criteria.reduce((total, criterion) => {
      const score = scores[option.id]?.[criterion.id]

      if (score === undefined || Number.isNaN(score)) {
        throw new Error(`请完成“${option.label}”的“${criterion.name}”评分`)
      }

      if (score < 1 || score > 10) {
        throw new Error('评分必须在 1 到 10 之间')
      }

      return total + criterion.weight * score
    }, 0)

    return {
      optionId: option.id,
      label: option.label,
      score: Number((weightedTotal / 100).toFixed(6)),
      originalIndex,
    }
  })

  return ranked
    .sort((left, right) => right.score - left.score || left.originalIndex - right.originalIndex)
    .map((item, index) => ({
      optionId: item.optionId,
      label: item.label,
      score: item.score,
      rank: index + 1,
    }))
}
