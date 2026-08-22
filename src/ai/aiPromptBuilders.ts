import type { DecisionOption, DecisionResult } from '../types/decision'

const VOICE_RULES = [
  '表达风格：果断、聪明、略带调侃，符合 DECISION LAB 的冷幽默。',
  '幽默不能遮盖结论、风险和行动建议。',
  '禁止低幼梗、攻击性表达、虚构事实和虚构数据。',
  '涉及健康、安全、法律或财务时收敛幽默并明确风险。',
].join('\n')

function optionLabels(options: DecisionOption[]): string {
  return options.map((option) => option.label.trim()).join('、')
}

function localDetails(result: DecisionResult): string {
  if (result.details?.type === 'random') {
    return [
      '模式数据：等概率随机抽取',
      '理论概率：' + (result.details.probability * 100).toFixed(2) + '%',
      '抽签编号：' + result.details.drawNumber,
      '随机指纹：' + (result.details.fingerprint ?? '旧记录未提供'),
    ].join('\n')
  }

  if (result.details?.type === 'scientific') {
    const details = result.details
    const ranking = result.ranking?.map(
      (item) => item.rank + '. ' + item.label + '：' + item.score.toFixed(2),
    ).join('\n') ?? '未提供排名'
    const contributions = details.contributions.map(
      (item) => item.name + '：权重 ' + item.weight + '%，评分 ' + item.score +
        '，贡献 ' + item.contribution.toFixed(2),
    ).join('\n')
    const matrix = result.options.map((option) => {
      const scores = details.criteria.map((criterion) => (
        criterion.name + ' ' + (details.scores[option.id]?.[criterion.id] ?? '未评分')
      )).join('，')
      return option.label + '：' + scores
    }).join('\n')

    return '完整排名：\n' + ranking +
      '\n获胜项指标贡献：\n' + contributions +
      '\n评分矩阵：\n' + matrix
  }

  if (result.details?.type === 'mystic') {
    const evidence = result.details.evidence.map(
      (item) => item.title + '：' + item.description + '（' + item.reading + '）',
    ).join('\n')
    return [
      '娱乐声明：本模式仅供娱乐，以下玄学数据不是事实。',
      '玄学证据：\n' + evidence,
      result.details.favorable,
      result.details.avoid,
    ].join('\n')
  }

  return '模式数据：当前记录未提供额外详情。'
}

export function buildDeepAnalysisContent(result: DecisionResult): string {
  return [
    '任务类型：AI 深度分析',
    '硬性规则：本地算法结果是最终事实，不能修改、替换或否定本地最终结果。',
    '请解释现实优缺点、风险、隐藏冲突、可能情景和下一步。',
    '决策问题：' + result.question,
    '候选项：' + optionLabels(result.options),
    '本地模式：' + result.mode,
    '本地最终结果：' + result.winner.label,
    '本地解释：' + result.explanation,
    localDetails(result),
    '额外背景：未提供额外背景。',
    VOICE_RULES,
  ].join('\n\n')
}

export function buildDirectDecisionContent(input: {
  question: string
  options: DecisionOption[]
  context: string
}): string {
  return [
    '任务类型：AI 直接决策',
    '硬性规则：只能从候选项中选择一个最终建议，recommended_option 必须与候选项文字完全一致。',
    '决策问题：' + (input.question.trim() || '这次决定'),
    '候选项：' + optionLabels(input.options),
    '用户背景：' + input.context.trim(),
    '请给出明确结论、核心理由、主要取舍、重新考虑条件和可执行行动计划。',
    VOICE_RULES,
  ].join('\n\n')
}
