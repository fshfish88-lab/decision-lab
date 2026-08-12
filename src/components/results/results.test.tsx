import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { DecisionResult } from '../../types/decision'
import { RandomResult } from './RandomResult'
import { ScientificResult } from './ScientificResult'

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

describe('RandomResult', () => {
  it('presents an honest random landing instead of analysis metrics', () => {
    render(<RandomResult result={randomResult} />)

    expect(screen.getByRole('heading', { name: '命运选择了它' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '命运落点' })).toBeInTheDocument()
    expect(screen.getAllByText('50.00%')).toHaveLength(3)
    expect(screen.getByText('0000-0000')).toBeInTheDocument()
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
