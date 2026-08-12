import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { DecisionResult } from '../../types/decision'
import { RandomResult } from './RandomResult'
import { ScientificResult } from './ScientificResult'
import { MysticResult } from './MysticResult'

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
