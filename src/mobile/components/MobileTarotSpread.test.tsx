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

  it('finishes the in-place flip before centering, then reveals the reading after centering', () => {
    const onSelect = vi.fn()
    const onPhaseChange = vi.fn()
    render(<MobileTarotSpread spread={spread} selectedPosition={null} onSelect={onSelect} onPhaseChange={onPhaseChange} />)

    const cards = screen.getAllByRole('button', { name: /选择第 \d 张塔罗牌/ })
    act(() => {
      cards[1].click()
      cards[4].click()
    })

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(1)
    const stage = screen.getByLabelText('七张大阿卡纳牌阵')
    const inner = cards[1].querySelector('.tarot-card__inner')!
    const slot = cards[1].parentElement!
    const finish = (element: Element, propertyName: string): void => {
      const event = new Event('transitionend', { bubbles: true })
      Object.defineProperty(event, 'propertyName', { value: propertyName })
      fireEvent(element, event)
    }
    expect(stage).toHaveAttribute('data-phase', 'flipping')
    expect(cards[1]).toHaveClass('is-selected')
    expect(slot.style.getPropertyValue('--mobile-tarot-focus-scale')).toBe('1')

    finish(inner, 'box-shadow')
    expect(stage).toHaveAttribute('data-phase', 'flipping')
    finish(inner, 'transform')
    expect(stage).toHaveAttribute('data-phase', 'focusing')
    expect(Number(slot.style.getPropertyValue('--mobile-tarot-focus-scale'))).toBeGreaterThan(1)

    finish(inner, 'transform')
    expect(stage).toHaveAttribute('data-phase', 'focusing')
    finish(slot, 'transform')

    expect(stage).toHaveAttribute('data-phase', 'revealed')
    expect(onPhaseChange.mock.calls.map(([phase]) => phase)).toEqual(['flipping', 'focusing', 'revealed'])
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
