import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createTarotSpread } from '../../tarot/tarotEngine'
import { MobileTarotView } from './MobileTarotView'

describe('MobileTarotView', () => {
  it('presents a focused card stage with a visible entertainment notice', () => {
    const spread = createTarotSpread([
      { id: 'one', label: '看展' },
      { id: 'two', label: '爬山' },
    ], () => 0.25)

    render(
      <MobileTarotView
        spread={spread}
        selectedPosition={null}
        revealedResult={null}
        onSelect={vi.fn()}
        onContinue={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: '凭第一感觉，选一张' })).toBeInTheDocument()
    expect(screen.getByText(/仅供娱乐/)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /选择第/ })).toHaveLength(7)
  })
})
