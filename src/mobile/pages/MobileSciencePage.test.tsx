import { useEffect } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { useDecision } from '../../state/DecisionContext'
import { DecisionProvider } from '../../state/DecisionProvider'
import { MobileSciencePage } from './MobileSciencePage'

function SeedDraft(): null {
  const { dispatch } = useDecision()
  useEffect(() => {
    dispatch({
      type: 'restore-draft',
      draft: {
        question: '周末去哪？',
        mode: 'scientific',
        options: [
          { id: 'one', label: '看展' },
          { id: 'two', label: '爬山' },
        ],
      },
    })
  }, [dispatch])
  return null
}

describe('MobileSciencePage', () => {
  it('uses a two-step card flow instead of a desktop score table', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/science']}>
        <DecisionProvider>
          <SeedDraft />
          <Routes>
            <Route path="/science" element={<MobileSciencePage />} />
            <Route path="/analysis" element={<p>进入分析</p>} />
          </Routes>
        </DecisionProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: '设置评价指标' })).toBeInTheDocument()
    expect(screen.getByText('权重合计')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '下一步：为选项评分' }))
    expect(screen.getByRole('heading', { name: '为选项评分' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: '看展评分' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: '爬山评分' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '随机填充评分' }))
    await user.click(screen.getByRole('button', { name: '开始科学分析' }))
    expect(await screen.findByText('进入分析')).toBeInTheDocument()
  })
})
