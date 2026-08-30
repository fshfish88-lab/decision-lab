import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { HomeViewProps } from '../../pages/home/HomePageController'
import { MobileHomeView } from './MobileHomeView'

function props(overrides: Partial<HomeViewProps> = {}): HomeViewProps {
  return {
    question: '',
    options: [
      { id: 'one', label: '' },
      { id: 'two', label: '' },
    ],
    selectedMode: null,
    canStart: false,
    ctaLabel: '选择一种决策方式',
    validationMessage: '至少填写两个有效选项',
    onQuestionChange: vi.fn(),
    onOptionChange: vi.fn(),
    onAddOption: vi.fn(),
    onRemoveOption: vi.fn(),
    onSelectMode: vi.fn(),
    onStart: vi.fn(),
    ...overrides,
  }
}

describe('MobileHomeView', () => {
  it('renders an app-specific input and two-column mode selection', () => {
    const viewProps = props()
    render(<MobileHomeView {...viewProps} />)

    expect(screen.getByRole('heading', { name: '今天想决定什么？' })).toBeInTheDocument()
    expect(screen.getByLabelText('这次要决定的问题')).toHaveAttribute('maxlength', '40')
    expect(screen.getByRole('group', { name: '选择决策方式' })).toHaveClass('mobile-home__mode-grid')
    expect(screen.getAllByRole('button', { name: /随机|科学|塔罗|AI/ })).toHaveLength(4)
    expect(screen.getByRole('button', { name: '选择一种决策方式' })).toBeDisabled()
    expect(screen.getByText('至少填写两个有效选项')).toBeInTheDocument()
  })

  it('uses the shared callbacks for mode selection and starting', () => {
    const onSelectMode = vi.fn()
    const onStart = vi.fn()
    const viewProps = props({
      selectedMode: 'random',
      canStart: true,
      ctaLabel: '交给命运',
      validationMessage: null,
      onSelectMode,
      onStart,
    })
    render(<MobileHomeView {...viewProps} />)

    fireEvent.click(screen.getByRole('button', { name: /科学模式/ }))
    fireEvent.click(screen.getByRole('button', { name: '交给命运' }))

    expect(onSelectMode).toHaveBeenCalledWith('scientific')
    expect(onStart).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: /随机模式/ })).toHaveAttribute('aria-pressed', 'true')
  })
})
