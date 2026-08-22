import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { DecisionProvider } from '../state/DecisionProvider'
import { HomePage } from './HomePage'

function renderHome(): void {
  render(
    <MemoryRouter>
      <DecisionProvider>
        <HomePage />
      </DecisionProvider>
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  it('requires two valid options and a mode before starting', async () => {
    const user = userEvent.setup()
    renderHome()

    const start = screen.getByRole('button', { name: '选择一种决策方式' })
    expect(start).toBeDisabled()

    await user.type(screen.getByLabelText('选项 1'), '火锅')
    await user.type(screen.getByLabelText('选项 2'), '日料')
    await user.click(screen.getByRole('button', { name: /随机模式/ }))

    expect(start).toBeEnabled()
    expect(start).toHaveAccessibleName('交给命运')
  })

  it('matches the primary action copy to the selected decision mode', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(screen.getByRole('button', { name: /科学模式/ }))
    expect(screen.getByRole('button', { name: '开始计算' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /玄学模式/ }))
    expect(screen.getByRole('button', { name: '开始抽牌' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /AI 模式/ }))
    expect(screen.getByRole('button', { name: '让 AI 替我决定' })).toBeInTheDocument()
  })

  it('gives every mode a restrained personality line', () => {
    renderHome()

    expect(screen.getByText('系统不承担后果')).toBeInTheDocument()
    expect(screen.getByText('看起来相当严谨')).toBeInTheDocument()
    expect(screen.getByText('7 张牌背 · 结果已确定')).toBeInTheDocument()
    expect(screen.getByText('这次可能真的有用')).toBeInTheDocument()
  })

  it('adds an option with Enter and keeps the API-ready AI entry available', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.type(screen.getByLabelText('选项 2'), '{Enter}')

    expect(screen.getByLabelText('选项 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /AI 模式/ })).toBeEnabled()
    expect(screen.getByText('在线顾问')).toBeInTheDocument()
  })
})
