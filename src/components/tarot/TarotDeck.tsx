import type { TarotSpread } from '../../tarot/tarotEngine'
import { TarotCard } from './TarotCard'
import { useTarotReveal, type TarotPhase } from './useTarotReveal'

interface TarotDeckProps {
  spread: TarotSpread
  selectedPosition: number | null
  onSelect: (position: number) => void
  onPhaseChange?: (phase: TarotPhase) => void
}

const ROTATIONS = [-7, -5, -2.5, 0, 2.5, 5, 7]

export function TarotDeck({
  spread,
  selectedPosition,
  onSelect,
  onPhaseChange,
}: TarotDeckProps): React.JSX.Element {
  const { spreadRef, slotRefs, focusTarget, focusedPosition, phase, select, finishFlip, finishFocus } = useTarotReveal({
    selectedPosition, onSelect, onPhaseChange, offsetProperty: '--tarot-offset-y', maxWidth: 220, widthFraction: 0.42,
  })

  return (
    <div
      ref={spreadRef}
      className="tarot-deck"
      aria-label="七张大阿卡纳牌阵"
      data-phase={phase}
      style={{ marginBottom: 4 + (phase === 'revealed' ? focusTarget.space : 0) }}
    >
      {spread.cards.map((entry) => {
        const focused = entry.position === focusedPosition
        const centered = focused && (phase === 'focusing' || phase === 'revealed')
        return (
          <div
            className={`tarot-deck__slot${focused ? ' is-focused' : ''}`}
            key={`${spread.fingerprint}-${entry.position}`}
            ref={element => { slotRefs.current[entry.position] = element }}
            onTransitionEnd={event => {
              if (focused && event.target === event.currentTarget && event.propertyName === 'transform') finishFocus()
            }}
            style={{
              '--tarot-rotation': `${centered ? 0 : ROTATIONS[entry.position]}deg`,
              '--tarot-focus-x': `${centered ? focusTarget.x : 0}px`,
              '--tarot-focus-y': `${centered ? focusTarget.y : 0}px`,
              '--tarot-focus-scale': centered ? focusTarget.scale : 1,
            } as React.CSSProperties}
          >
            <TarotCard
              entry={entry}
              selected={focused}
              dimmed={focusedPosition !== null && !focused}
              revealInPlace
              onFlipComplete={() => finishFlip(entry.position)}
              onSelect={select}
            />
          </div>
        )
      })}
    </div>
  )
}
