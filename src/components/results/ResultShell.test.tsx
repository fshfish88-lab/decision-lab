import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { DecisionResult } from '../../types/decision'
import { ResultShell } from './ResultShell'

const result: DecisionResult = {
  id: 'result-1',
  createdAt: '2026-08-13T08:00:00.000Z',
  question: '今晚吃什么？',
  options: [
    { id: 'hotpot', label: '火锅' },
    { id: 'sushi', label: '日料' },
  ],
  mode: 'random',
  winner: { id: 'hotpot', label: '火锅' },
  explanation: '系统已经替你决定。',
  confidence: 100,
  metrics: [],
}

function renderShell(overrides: Partial<React.ComponentProps<typeof ResultShell>> = {}) {
  const props: React.ComponentProps<typeof ResultShell> = {
    result,
    onRerun: vi.fn(),
    onReturnHome: vi.fn(),
    onRegret: vi.fn(),
    onCopy: vi.fn().mockResolvedValue(undefined),
    onDownload: vi.fn().mockResolvedValue(undefined),
    regretted: false,
    children: <div>结果内容</div>,
    ...overrides,
  }
  render(<MemoryRouter><ResultShell {...props} /></MemoryRouter>)
  return props
}

describe('ResultShell V1.5 actions', () => {
  it('records regret once and exposes the completed state', async () => {
    const user = userEvent.setup()
    const props = renderShell()

    await user.click(screen.getByRole('button', { name: '我后悔了' }))

    expect(props.onRegret).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: '已记录反悔' })).toBeDisabled()
  })

  it('reports successful copy and PNG download', async () => {
    const user = userEvent.setup()
    const props = renderShell()

    await user.click(screen.getByRole('button', { name: '复制结果' }))
    expect(await screen.findByText('结果已复制')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '下载分享卡' }))
    expect(await screen.findByText('分享卡已下载')).toBeInTheDocument()
    expect(props.onCopy).toHaveBeenCalledTimes(1)
    expect(props.onDownload).toHaveBeenCalledTimes(1)
  })

  it('keeps the result visible when copying fails', async () => {
    const user = userEvent.setup()
    renderShell({ onCopy: vi.fn().mockRejectedValue(new Error('clipboard denied')) })

    await user.click(screen.getByRole('button', { name: '复制结果' }))

    expect(await screen.findByText('复制失败，请检查浏览器权限')).toBeInTheDocument()
    expect(screen.getByText('结果内容')).toBeInTheDocument()
  })
})
