import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TAROT_CARDS } from '../../tarot/tarotCards'
import { TAROT_ARTWORK_IDS, TarotCardArtwork } from './TarotCardArtwork'

describe('TarotCardArtwork', () => {
  it('defines one distinct symbolic composition for every Major Arcana', () => {
    expect(TAROT_ARTWORK_IDS).toEqual(TAROT_CARDS.map((card) => card.id))
    expect(new Set(TAROT_ARTWORK_IDS).size).toBe(22)
  })

  it('renders decorative card-specific artwork and a safe fallback', () => {
    const { rerender } = render(<TarotCardArtwork cardId="the-moon" />)
    const moon = screen.getByTestId('tarot-artwork-the-moon')
    expect(moon).toHaveAttribute('aria-hidden', 'true')
    expect(moon.querySelectorAll('path, circle, line, polygon, polyline').length)
      .toBeGreaterThanOrEqual(6)

    rerender(<TarotCardArtwork cardId="unknown-card" />)
    expect(screen.getByTestId('tarot-artwork-fallback')).toBeInTheDocument()
  })
})
