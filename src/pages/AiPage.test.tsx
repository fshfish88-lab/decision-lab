import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { DecisionProvider } from '../state/DecisionProvider'
import { AiPage } from './AiPage'
import { HomePage } from './HomePage'

describe('AiPage', () => {
  it('keeps the API-unconfigured flow honest and never fabricates a result', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <DecisionProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/ai" element={<AiPage />} />
          </Routes>
        </DecisionProvider>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('选项 1'), '火锅')
    await user.type(screen.getByLabelText('选项 2'), '日料')
    await user.click(screen.getByRole('button', { name: /AI 模式/ }))
    await user.click(screen.getByRole('button', { name: '交给 AI 理解' }))

    expect(screen.getByRole('heading', { name: 'AI 需求实验室' })).toBeInTheDocument()
    expect(screen.getByText('AI 服务尚未接入')).toBeInTheDocument()
    expect(screen.getByText('火锅 / 日料')).toBeInTheDocument()

    await user.type(screen.getByLabelText('补充你的真实需求'), '预算 100 元，不想走太远。')
    expect(screen.getByRole('button', { name: '等待 API 接入' })).toBeDisabled()
    expect(screen.queryByText('最终推荐')).not.toBeInTheDocument()
  })
})
