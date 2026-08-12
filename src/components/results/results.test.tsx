import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { DecisionResult } from '../../types/decision'
import { RandomResult } from './RandomResult'

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
