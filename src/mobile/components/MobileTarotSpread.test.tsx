import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createTarotSpread } from '../../tarot/tarotEngine'
import { MobileTarotSpread } from './MobileTarotSpread'

const spread = createTarotSpread([
  { id: 'one', label: '看展' },
  { id: 'two', label: '爬山' },
], () => 0.25)

describe('MobileTarotSpread', () => {
  afterEach(() => vi.useRealTimers())

  it('renders four cards in the first row and three in the second row', () => {
    render(<MobileTarotSpread spread={spread} selectedPosition={null} onSelect={vi.fn()} />)

    expect(screen.getByTestId('tarot-row-top').children).toHaveLength(4)
    expect(screen.getByTestId('tarot-row-bottom').children).toHaveLength(3)
    expect(screen.getAllByRole('button', { name: /选择第 \d 张塔罗牌/ })).toHaveLength(7)
  })

  it('accepts only the first click and advances from idle to focusing to revealed', () => {
    vi.useFakeTimers()
    const onSelect = vi.fn()
    render(<MobileTarotSpread spread={spread} selectedPosition={null} onSelect={onSelect} />)

    const cards = screen.getAllByRole('button', { name: /选择第 \d 张塔罗牌/ })
    act(() => {
      cards[1].click()
      cards[4].click()
    })

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(1)
    expect(screen.getByLabelText('七张大阿卡纳牌阵')).toHaveAttribute('data-phase', 'focusing')

    act(() => vi.advanceTimersByTime(240))

    expect(screen.getByLabelText('七张大阿卡纳牌阵')).toHaveAttribute('data-phase', 'revealed')
  })

  it('keeps all later cards inert after the first pointer action', () => {
    const onSelect = vi.fn()
    render(<MobileTarotSpread spread={spread} selectedPosition={null} onSelect={onSelect} />)

    const cards = screen.getAllByRole('button', { name: /选择第 \d 张塔罗牌/ })
    fireEvent.click(cards[0])
    fireEvent.click(cards[6])

    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith(0)
  })
})
