import { fireEvent, render, screen } from '@testing-library/react'
import { Dices } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'

import { MobileModeCard } from './MobileModeCard'
import { MobileOptionEditor } from './MobileOptionEditor'
import { MobilePageHeader } from './MobilePageHeader'
import { MobileStickyAction } from './MobileStickyAction'

describe('mobile primitives', () => {
  it('describes selected modes with text and aria state', () => {
    const onSelect = vi.fn()
    render(
      <MobileModeCard
        mode="random"
        title="随机"
        description="交给概率"
        icon={Dices}
        tone="random"
        selected
        onSelect={onSelect}
      />,
    )

    const card = screen.getByRole('button', { name: /随机/ })
    expect(card).toHaveAttribute('aria-pressed', 'true')
    expect(card).toHaveTextContent('已选择')
    fireEvent.click(card)
    expect(onSelect).toHaveBeenCalledWith('random')
  })

  it('keeps option editing within the 2 to 10 item limits', () => {
    const onAdd = vi.fn()
    const onRemove = vi.fn()
    const options = [
      { id: 'one', label: '选项一' },
      { id: 'two', label: '选项二' },
    ]

    render(
      <MobileOptionEditor
        options={options}
        onChange={vi.fn()}
        onAdd={onAdd}
        onRemove={onRemove}
      />,
    )

    expect(screen.getByLabelText('选项 1')).toHaveAttribute('maxlength', '30')
    expect(screen.getByRole('button', { name: '删除选项 1' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '添加选项' }))
    expect(onAdd).toHaveBeenCalledOnce()
  })

  it('disables adding when ten options are present', () => {
    render(
      <MobileOptionEditor
        options={Array.from({ length: 10 }, (_, index) => ({
          id: String(index),
          label: `选项 ${index + 1}`,
        }))}
        onChange={vi.fn()}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: '添加选项' })).toBeDisabled()
    expect(screen.getByText('10 / 10')).toBeInTheDocument()
  })

  it('exposes disabled sticky actions and their explanation', () => {
    render(
      <MobileStickyAction
        label="开始决策"
        disabled
        helperText="至少填写两个选项"
        onClick={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: '开始决策' })).toBeDisabled()
    expect(screen.getByText('至少填写两个选项')).toBeInTheDocument()
  })

  it('provides a labelled page back action', () => {
    const onBack = vi.fn()
    render(<MobilePageHeader title="科学决策" eyebrow="步骤 1 / 2" onBack={onBack} />)

    fireEvent.click(screen.getByRole('button', { name: '返回' }))
    expect(onBack).toHaveBeenCalledOnce()
    expect(screen.getByRole('heading', { name: '科学决策' })).toBeInTheDocument()
    expect(screen.getByText('步骤 1 / 2')).toBeInTheDocument()
  })
})
