import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MobileAiView } from './MobileAiView'

describe('MobileAiView', () => {
  it('describes offline state honestly and prevents submission', () => {
    render(
      <MobileAiView
        question="今晚吃什么？"
        optionSummary="火锅 / 日料"
        context="预算 100 元"
        status=""
        submitting={false}
        thinkingLabel="正在理解你的纠结"
        online={false}
        onContextChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByText('当前离线')).toBeInTheDocument()
    expect(screen.getByText(/AI 需要联网/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '让 AI 替我决定' })).toBeDisabled()
  })

  it('uses shared input and submit callbacks while online', () => {
    const onContextChange = vi.fn()
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())
    render(
      <MobileAiView
        question="今晚吃什么？"
        optionSummary="火锅 / 日料"
        context=""
        status=""
        submitting={false}
        thinkingLabel="正在理解你的纠结"
        online
        onContextChange={onContextChange}
        onSubmit={onSubmit}
      />,
    )

    fireEvent.change(screen.getByLabelText('补充你的真实情况'), { target: { value: '今天很累' } })
    expect(onContextChange).toHaveBeenCalledWith('今天很累')
    expect(screen.getByText('服务在线')).toBeInTheDocument()
  })
})
