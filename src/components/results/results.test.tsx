import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { DecisionResult } from '../../types/decision'
import { RandomResult } from './RandomResult'
import { ScientificResult } from './ScientificResult'
import { MysticResult } from './MysticResult'
import { AiResult } from './AiResult'

const randomResult: DecisionResult = {
  id: 'random-1',
  createdAt: '2026-08-13T00:00:00.000Z',
  question: '今晚吃什么？',
  options: [
    { id: 'hotpot', label: '火锅' },
    { id: 'sushi', label: '日料' },
  ],
  mode: 'random',
  winner: { id: 'hotpot', label: '火锅' },
  explanation: '等概率抽签结果。',
  confidence: 100,
  metrics: [],
  details: {
    type: 'random',
    sample: 0,
    winningIndex: 0,
    seed: '0000-0000',
    drawNumber: '#000001',
    probability: 0.5,
  },
}

const scientificResult: DecisionResult = {
  id: 'scientific-1',
  createdAt: '2026-08-13T00:00:00.000Z',
  question: '今晚吃什么？',
  options: [
    { id: 'hotpot', label: '火锅' },
    { id: 'sushi', label: '日料' },
  ],
  mode: 'scientific',
  winner: { id: 'sushi', label: '日料' },
  explanation: '日料凭借价格指标的优势胜出。',
  confidence: 78,
  metrics: [],
  ranking: [
    { optionId: 'sushi', label: '日料', score: 7.8, rank: 1 },
    { optionId: 'hotpot', label: '火锅', score: 7.6, rank: 2 },
  ],
  details: {
    type: 'scientific',
    criteria: [
      { id: 'taste', name: '喜欢程度', weight: 60 },
      { id: 'price', name: '价格友好', weight: 40 },
    ],
    scores: {
      hotpot: { taste: 8, price: 7 },
      sushi: { taste: 7, price: 9 },
    },
    contributions: [
      { criterionId: 'taste', name: '喜欢程度', weight: 60, score: 7, contribution: 4.2 },
      { criterionId: 'price', name: '价格友好', weight: 40, score: 9, contribution: 3.6 },
    ],
  },
}

const mysticResult: DecisionResult = {
  id: 'mystic-1',
  createdAt: '2026-08-13T00:00:00.000Z',
  question: '今晚吃什么？',
  options: [
    { id: 'hotpot', label: '火锅' },
    { id: 'sushi', label: '日料' },
  ],
  mode: 'mystic',
  winner: { id: 'hotpot', label: '火锅' },
  explanation: '宇宙已经替你把犹豫折叠成了一个答案。',
  confidence: 88,
  metrics: [
    { key: 'cosmic', label: '宇宙共振率', value: 88 },
    { key: 'subconscious', label: '潜意识偏好', value: 76 },
    { key: 'regret', label: '后悔概率', value: 21, inverse: true },
  ],
  disclaimer: '本报告仅供娱乐，请勿用于医疗、法律、金融等重要决定。',
  details: {
    type: 'mystic',
    evidence: [
      { key: 'order', title: '输入顺序效应', description: '第一顺位暗藏玄机。', reading: 'POSITION / 01' },
      { key: 'text', title: '字符共振', description: '字符与今日频率一致。', reading: 'RESONANCE / 0.888' },
      { key: 'timeline', title: '平行时间线', description: '多数时间线都选了火锅。', reading: 'TIMELINES / 8888' },
    ],
    favorable: '今日宜：火锅',
    avoid: '今日忌：重新打开选项继续纠结',
  },
}

const tarotResult: DecisionResult = {
  ...mysticResult,
  id: 'tarot-1',
  winner: { id: 'sushi', label: '日料' },
  explanation: '太阳正位让答案变得明确。',
  confidence: 100,
  metrics: [],
  disclaimer: '塔罗解读仅供娱乐。牌已经表态，真正的决定权仍然在你。',
  details: {
    type: 'mystic',
    tarot: {
      cardId: 'the-sun',
      number: 19,
      numeral: 'XIX',
      name: 'THE SUN',
      chineseName: '太阳',
      orientation: 'upright',
      keywords: ['快乐', '明确', '满足'],
      decisionStyle: 'ACT',
      interpretation: '太阳正位代表快乐、明确、满足。它表示事情正在变得清楚，内心偏好也更容易被看见。',
      message: '这次不必再追加比较，明确的偏好已经足以支持行动。',
      shadowTitle: '别把晴天当保证书',
      shadow: '快乐是有效线索，但如果存在预算或安全等硬约束，仍应优先处理现实条件。',
      mapping: [
        { keyword: '快乐', description: '承认「日料」带来的直接吸引力。' },
        { keyword: '明确', description: '让「日料」结束这一轮追加比较。' },
        { keyword: '满足', description: '把「日料」从候选项变成可执行答案。' },
      ],
      verdict: '日料。就这样。',
      verdictSubtext: '牌面负责给出落点，不负责证明它客观更优。',
      strength: 5,
      selectedPosition: 2,
      deckFingerprint: 'TAROT-1234ABCD',
    },
    evidence: [],
    favorable: '接受「日料」作为本轮答案',
    avoid: '翻回牌背假装刚才没有看见',
  },
}

const aiResult: DecisionResult = {
  id: 'ai-1',
  createdAt: '2026-08-13T00:00:00.000Z',
  question: '今晚吃什么？',
  options: [
    { id: 'hotpot', label: '火锅' },
    { id: 'sushi', label: '日料' },
  ],
  mode: 'ai',
  winner: { id: 'hotpot', label: '火锅' },
  explanation: '今天已经够累了，别再把晚饭做成第二份工作。',
  confidence: 89,
  metrics: [],
  details: {
    type: 'ai',
    context: '预算 100 元，今天很累。',
    advice: {
      recommended_option: '火锅',
      confidence: 89,
      verdict: '今天已经够累了，别再把晚饭做成第二份工作。',
      core_reasons: ['满足感更高', '不用继续比较菜单'],
      main_tradeoff: '会比日料多花一点时间。',
      conditions_to_reconsider: ['预算突然收紧'],
      action_plan: ['现在订位', '十分钟内出门'],
    },
  },
}

describe('RandomResult', () => {
  it('presents an honest random landing instead of analysis metrics', () => {
    render(<RandomResult result={randomResult} />)

    expect(screen.getByRole('heading', { name: '命运选择了它' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '命运落点' })).toBeInTheDocument()
    expect(screen.getAllByText('50.00%')).toHaveLength(3)
    expect(screen.getByText('0000-0000')).toBeInTheDocument()
    expect(screen.getByText('RANDOM FINGERPRINT / 本轮随机指纹')).toBeInTheDocument()
    expect(screen.queryByText(/RANDOM SEED|随机种子/)).not.toBeInTheDocument()
    expect(
      screen.getByText('这次没有任何科学依据，但至少你不用继续纠结。'),
    ).toBeInTheDocument()
    expect(screen.queryByText('指标贡献')).not.toBeInTheDocument()
  })

  it('renders a legacy result without mode details', () => {
    render(<RandomResult result={{ ...randomResult, details: undefined }} />)

    expect(screen.getByText('LEGACY-RESULT')).toBeInTheDocument()
    expect(screen.getAllByText('50.00%')).toHaveLength(3)
    expect(screen.getAllByText('火锅').length).toBeGreaterThan(0)
  })
})

describe('ScientificResult', () => {
  it('explains the winning score, criterion contributions, and full comparison', () => {
    render(<ScientificResult result={scientificResult} />)

    expect(screen.getByRole('heading', { name: '最终推荐' })).toBeInTheDocument()
    expect(screen.getByLabelText('综合得分 7.80 分')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '指标贡献' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '方案评分对比' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '喜欢程度 60%' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '为什么它胜出？' })).toBeInTheDocument()
    expect(screen.queryByText('命运落点')).not.toBeInTheDocument()
  })

  it('keeps older scientific history readable when contribution details are absent', () => {
    render(<ScientificResult result={{ ...scientificResult, details: undefined }} />)

    expect(screen.getByRole('heading', { name: '完整排名' })).toBeInTheDocument()
    expect(screen.getByText('该历史记录创建于详细贡献数据启用之前。')).toBeInTheDocument()
    expect(screen.getByText('日料凭借价格指标的优势胜出。')).toBeInTheDocument()
  })
})

describe('MysticResult', () => {
  it('renders a tarot reading without legacy pseudo-science numbers', () => {
    render(<MysticResult result={tarotResult} />)

    expect(screen.getByRole('heading', { name: '你的牌' })).toBeInTheDocument()
    expect(screen.getByText('XIX · THE SUN')).toBeInTheDocument()
    expect(screen.getByText('太阳 · 正位')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '日料' })).toBeInTheDocument()
    expect(screen.getByLabelText('决策信号 5/5')).toBeInTheDocument()
    expect(screen.getAllByText('快乐')).toHaveLength(2)
    expect(screen.getByText(/DRAW 03 \/ 07 · RECORD TAROT-1234ABCD · SYMBOLIC READING/)).toBeInTheDocument()
    expect(screen.getByTestId('tarot-artwork-the-sun')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '牌面含义' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '本次启示' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '别把晴天当保证书' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '牌意落点' })).toBeInTheDocument()
    expect(screen.getByText('日料。就这样。')).toBeInTheDocument()
    expect(screen.getByText('把「日料」从候选项变成可执行答案。')).toBeInTheDocument()
    expect(screen.getByText('Decision Lab 不对神秘学结论提供统计显著性保证。')).toBeInTheDocument()
    expect(screen.queryByText('牌面征兆')).not.toBeInTheDocument()
    expect(screen.queryByText('命运映射')).not.toBeInTheDocument()
    expect(screen.queryByText('隐秘余韵')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '为什么是它' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '逆位提醒' })).not.toBeInTheDocument()
    expect(screen.queryByText('科学意见')).not.toBeInTheDocument()
    expect(screen.queryByText('不予置评')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '本轮结论' })).not.toBeInTheDocument()
    expect(screen.getByText('塔罗解读仅供娱乐。牌已经表态，真正的决定权仍然在你。')).toBeInTheDocument()
    expect(screen.queryByLabelText('本轮建议')).not.toBeInTheDocument()
    expect(screen.queryByText('命运星盘')).not.toBeInTheDocument()
    expect(screen.queryByText('玄学证据')).not.toBeInTheDocument()
    expect(screen.queryByText(/可信度/)).not.toBeInTheDocument()
    expect(screen.queryByText(/宇宙共振率/)).not.toBeInTheDocument()
  })

  it('keeps older tarot history readable without rich reading fields', () => {
    const legacyTarotResult = structuredClone(tarotResult)
    if (legacyTarotResult.details?.type === 'mystic' && legacyTarotResult.details.tarot) {
      const tarot = legacyTarotResult.details.tarot
      delete tarot.decisionStyle
      delete tarot.message
      delete tarot.shadowTitle
      delete tarot.shadow
      delete tarot.mapping
      delete tarot.verdict
      delete tarot.verdictSubtext
      tarot.resonance = '牌阵会指向「日料」，因为旧记录这样写。'
      tarot.echo = '旧记录仍然保留一条反面提醒。'
      tarot.punchline = 'Decision Lab 保留了这条旧记录。'
    }

    render(<MysticResult result={legacyTarotResult} />)

    expect(screen.getByText('太阳正位代表快乐、明确、满足。它表示事情正在变得清楚，内心偏好也更容易被看见。')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '为什么是它' })).toBeInTheDocument()
    expect(screen.getByText('牌阵会指向「日料」，因为旧记录这样写。')).toBeInTheDocument()
  })

  it('renders a playful destiny report with evidence and an entertainment warning', () => {
    render(<MysticResult result={mysticResult} />)

    expect(screen.getByText('DESTINY REPORT')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '今日命运报告' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '命运星盘' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '玄学证据' })).toBeInTheDocument()
    expect(screen.getByText('证据 01')).toBeInTheDocument()
    expect(screen.getByText('今日宜：火锅')).toBeInTheDocument()
    expect(screen.getByText('今日忌：重新打开选项继续纠结')).toBeInTheDocument()
    expect(screen.getByText(mysticResult.disclaimer!)).toBeInTheDocument()
    expect(screen.queryByText('方案评分对比')).not.toBeInTheDocument()
  })

  it('derives three readable evidence cards for older mystic history', () => {
    render(<MysticResult result={{ ...mysticResult, details: undefined }} />)

    expect(screen.getAllByText(/证据 0[1-3]/)).toHaveLength(3)
    expect(screen.getByText('METRIC / 88')).toBeInTheDocument()
    expect(screen.getByText('今日宜：火锅')).toBeInTheDocument()
  })
})

describe('AiResult', () => {
  it('renders a direct-advice Bento instead of local-mode analysis', () => {
    render(<AiResult result={aiResult} />)

    expect(screen.getByRole('heading', { name: 'AI 最终建议' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '火锅' })).toBeInTheDocument()
    expect(screen.getByText('推荐强度 89%')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '为什么推荐' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '需要接受' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '重新考虑条件' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '下一步行动' })).toBeInTheDocument()
    expect(screen.queryByText('AI 深度分析')).not.toBeInTheDocument()
  })

  it('does not invent missing AI details for legacy data', () => {
    render(<AiResult result={{ ...aiResult, details: undefined }} />)

    expect(screen.getByText('AI 结果详情不完整，本次不展示推测内容。')).toBeInTheDocument()
  })
})
