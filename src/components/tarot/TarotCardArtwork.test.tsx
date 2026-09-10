import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TAROT_CARDS } from '../../tarot/tarotCards'
import { TAROT_ARTWORK_IDS, TarotCardArtwork } from './TarotCardArtwork'

describe('TarotCardArtwork', () => {
  it('provides complete coordinate groups for every SVG path command', () => {
    const arity: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 }
    const { container, rerender } = render(<TarotCardArtwork cardId="the-fool" />)
    for (const cardId of TAROT_ARTWORK_IDS) {
      rerender(<TarotCardArtwork cardId={cardId} />)
      for (const path of container.querySelectorAll('path')) {
        for (const [, command, coordinates] of path.getAttribute('d')!.matchAll(/([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g)) {
          const count = coordinates.match(/[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g)?.length ?? 0
          const size = arity[command.toLowerCase()]
          expect(count, `${cardId}: ${command}${coordinates}`).toBeGreaterThanOrEqual(size)
          expect(size ? count % size : count, `${cardId}: incomplete ${command} coordinates`).toBe(0)
        }
      }
    }
  })

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
