import { TarotCard } from '../../components/tarot/TarotCard'
import { useTarotReveal, type TarotPhase } from '../../components/tarot/useTarotReveal'
import type { TarotSpread, TarotSpreadCard } from '../../tarot/tarotEngine'

export type { TarotPhase as MobileTarotPhase } from '../../components/tarot/useTarotReveal'

interface MobileTarotSpreadProps {
  spread: TarotSpread
  selectedPosition: number | null
  onSelect: (position: number) => void
  onPhaseChange?: (phase: TarotPhase) => void
}

const TOP_ROW_COUNT = 4
const ROTATIONS = [-8, -3, 3, 8, -6, 0, 6]
const OFFSETS = [14, 2, 2, 14, 2, 13, 2]

export function MobileTarotSpread({
  spread,
  selectedPosition,
  onSelect,
  onPhaseChange,
}: MobileTarotSpreadProps): React.JSX.Element {
  const { spreadRef, slotRefs, focusTarget, focusedPosition, phase, select, finishFlip, finishFocus } = useTarotReveal({
    selectedPosition, onSelect, onPhaseChange, offsetProperty: '--mobile-tarot-offset-y', maxWidth: 176,
  })

  function renderSlot(entry: TarotSpreadCard): React.JSX.Element {
    const focused = entry.position === focusedPosition
    const centered = focused && (phase === 'focusing' || phase === 'revealed')
    const locked = focusedPosition !== null
    const slotClassName = [
      'mobile-tarot-spread__slot',
      focused ? 'is-focused' : '',
      locked && !focused ? 'is-dimmed' : '',
    ].filter(Boolean).join(' ')

    return (
      <div
        className={slotClassName}
        key={`${spread.fingerprint}-${entry.position}`}
        ref={(element) => { slotRefs.current[entry.position] = element }}
        onTransitionEnd={(event) => {
          if (focused && phase === 'focusing' && event.target === event.currentTarget && event.propertyName === 'transform') {
            finishFocus()
          }
        }}
        style={{
          '--mobile-tarot-rotation': `${centered ? 0 : ROTATIONS[entry.position]}deg`,
          '--mobile-tarot-offset-y': `${OFFSETS[entry.position]}px`,
          '--mobile-tarot-focus-x': `${centered ? focusTarget.x : 0}px`,
          '--mobile-tarot-focus-y': `${centered ? focusTarget.y : 0}px`,
          '--mobile-tarot-focus-scale': centered ? focusTarget.scale : 1,
        } as React.CSSProperties}
      >
        <TarotCard
          entry={entry}
          selected={focused}
          dimmed={locked && !focused}
          revealInPlace
          onFlipComplete={() => finishFlip(entry.position)}
          onSelect={select}
        />
      </div>
    )
  }

  return (
    <div
      ref={spreadRef}
      className="mobile-tarot-spread"
      aria-label="七张大阿卡纳牌阵"
      data-phase={phase}
      style={{ marginBottom: phase === 'revealed' ? focusTarget.space : 0 }}
    >
      <div className="mobile-tarot-spread__row mobile-tarot-spread__row--top" data-testid="tarot-row-top">
        {spread.cards.slice(0, TOP_ROW_COUNT).map(renderSlot)}
      </div>
      <div className="mobile-tarot-spread__row mobile-tarot-spread__row--bottom" data-testid="tarot-row-bottom">
        {spread.cards.slice(TOP_ROW_COUNT).map(renderSlot)}
      </div>
    </div>
  )
}
