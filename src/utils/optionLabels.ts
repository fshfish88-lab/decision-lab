import type { DecisionOption } from '../types/decision'

/**
 * 选项文本的唯一规范化规则。
 *
 * 抽取算法与结果映射必须共用同一套规则，否则「清理时折叠空格、回查时只 trim」
 * 这类不对称会让合法选项映射失败，或静默命中错误的重名项。
 */
export function normalizeOptionLabel(label: string): string {
  return label.trim().replace(/\s+/g, ' ')
}

export function hasValidLabel(label: string): boolean {
  return normalizeOptionLabel(label).length > 0
}

export function selectValidOptions(options: readonly DecisionOption[]): DecisionOption[] {
  return options.filter((option) => hasValidLabel(option.label))
}

export function hasDuplicateOptionLabels(options: readonly DecisionOption[]): boolean {
  const labels = options.map((option) => normalizeOptionLabel(option.label)).filter(Boolean)
  return new Set(labels).size !== labels.length
}

/**
 * 按规范化后的文本匹配候选项，返回全部命中项。
 * 命中数大于 1 表示存在重名选项，调用方需要显式处理而不是取第一个。
 */
export function matchOptionsByLabel(
  options: readonly DecisionOption[],
  target: string,
): DecisionOption[] {
  const normalized = normalizeOptionLabel(target)
  if (!normalized) return []
  return options.filter((option) => normalizeOptionLabel(option.label) === normalized)
}

export interface CleanedOption {
  option: DecisionOption
  label: string
}

/**
 * 过滤空值并规范化文本，同时保留与原始候选对象的对应关系。
 *
 * 算法在规范化后的文本上运行，结果再按下标回到原始对象，
 * 这样既不会因空格折叠而失配，也不会因重名而命中第一个同名的项。
 */
export function cleanDecisionOptions(
  options: readonly DecisionOption[],
): CleanedOption[] {
  return options
    .map((option) => ({ option, label: normalizeOptionLabel(option.label) }))
    .filter((entry) => entry.label.length > 0)
}
