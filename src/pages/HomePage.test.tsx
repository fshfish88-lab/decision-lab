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

    const start = screen.getByRole('button', { name: '开始决策' })
    expect(start).toBeDisabled()

    await user.type(screen.getByLabelText('选项 1'), '火锅')
    await user.type(screen.getByLabelText('选项 2'), '日料')
    await user.click(screen.getByRole('button', { name: /随机模式/ }))

    expect(start).toBeEnabled()
  })

  it('adds an option with Enter and keeps AI marked unavailable', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.type(screen.getByLabelText('选项 2'), '{Enter}')

    expect(screen.getByLabelText('选项 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /AI 模式/ })).toBeDisabled()
    expect(screen.getByText('V1.5')).toBeInTheDocument()
  })
})
