import type { TarotSpread } from '../../tarot/tarotEngine'
import { TarotCard } from './TarotCard'

interface TarotDeckProps {
  spread: TarotSpread
  selectedPosition: number | null
  onSelect: (position: number) => void
}

const ROTATIONS = [-12, -8, -4, 0, 4, 8, 12]

export function TarotDeck({
  spread,
  selectedPosition,
  onSelect,
}: TarotDeckProps): React.JSX.Element {
  return (
    <div className="tarot-deck" aria-label="七张大阿卡纳牌阵">
      {spread.cards.map((entry) => (
        <div
          className="tarot-deck__slot"
          key={`${spread.fingerprint}-${entry.position}`}
          style={{ '--tarot-rotation': `${ROTATIONS[entry.position]}deg` } as React.CSSProperties}
        >
          <TarotCard
            entry={entry}
            selected={entry.position === selectedPosition}
            dimmed={selectedPosition !== null && entry.position !== selectedPosition}
            onSelect={onSelect}
          />
        </div>
      ))}
    </div>
  )
}
