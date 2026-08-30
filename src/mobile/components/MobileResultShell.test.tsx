import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { DecisionResult } from '../../types/decision'
import { MobileResultShell } from './MobileResultShell'

const result: DecisionResult = {
  id: 'result-1',
  createdAt: '2026-08-30T05:00:00.000Z',
  question: '今晚吃什么？',
  options: [{ id: 'one', label: '火锅' }, { id: 'two', label: '日料' }],
  mode: 'random',
  winner: { id: 'one', label: '火锅' },
  explanation: '等概率随机抽取。',
  confidence: 50,
  metrics: [],
}

describe('MobileResultShell', () => {
  it('prioritizes the result, then offers compact after-decision actions', () => {
    const onRerun = vi.fn()
    const onRegret = vi.fn()
    render(
      <MemoryRouter>
        <MobileResultShell
          result={result}
          onRerun={onRerun}
          onReturnHome={vi.fn()}
          onChangeMode={vi.fn()}
          onEditOptions={vi.fn()}
          onRegret={onRegret}
          onCopy={vi.fn().mockResolvedValue(undefined)}
          onDownload={vi.fn().mockResolvedValue(undefined)}
          regretted={false}
        >
          <p>结果详情</p>
        </MobileResultShell>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '决策结果' })).toBeInTheDocument()
    expect(screen.getByText('今晚吃什么？')).toBeInTheDocument()
    expect(screen.getByText('结果详情')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '再来一次' }))
    fireEvent.click(screen.getByRole('button', { name: '我后悔了' }))
    expect(onRerun).toHaveBeenCalledOnce()
    expect(onRegret).toHaveBeenCalledOnce()
    expect(screen.getByText(/反悔已记录/)).toBeInTheDocument()
  })
})
