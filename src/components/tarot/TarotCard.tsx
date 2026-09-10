import { motion, useReducedMotion } from 'framer-motion'

import type { TarotSpreadCard } from '../../tarot/tarotEngine'
import { TarotCardArtwork } from './TarotCardArtwork'

interface TarotCardProps {
  entry: TarotSpreadCard
  selected: boolean
  dimmed: boolean
  revealInPlace?: boolean
  onFlipComplete?: () => void
  onSelect: (position: number) => void
}

export function TarotCard({
  entry,
  selected,
  dimmed,
  revealInPlace = false,
  onFlipComplete,
  onSelect,
}: TarotCardProps): React.JSX.Element {
  const reducedMotion = useReducedMotion()
  const orientationLabel = entry.orientation === 'upright' ? '正位' : '逆位'

  return (
    <motion.button
      className={`tarot-card${selected ? ' is-selected' : ''}${dimmed ? ' is-dimmed' : ''}`}
      type="button"
      aria-label={selected
        ? `${entry.card.chineseName}，${orientationLabel}，已选择`
        : `选择第 ${entry.position + 1} 张塔罗牌`}
      disabled={dimmed}
      onClick={() => onSelect(entry.position)}
      initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: dimmed ? 0.25 : 1, y: selected && !reducedMotion && !revealInPlace ? -20 : 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.36, delay: selected || reducedMotion ? 0 : entry.position * 0.045 }}
    >
      <span
        className="tarot-card__inner"
        onTransitionEnd={(event) => {
          if (selected && event.target === event.currentTarget && event.propertyName === 'transform') {
            onFlipComplete?.()
          }
        }}
      >
        <span className="tarot-card__back" aria-hidden={selected}>
          <i className="tarot-card__sun" />
          <i className="tarot-card__diamond" />
          <small>DECISION LAB</small>
        </span>
        <span className={`tarot-card__face${entry.orientation === 'reversed' ? ' is-reversed' : ''}`} aria-hidden={!selected}>
          {selected ? (
            <>
              <small>{entry.card.numeral}</small>
              <TarotCardArtwork cardId={entry.card.id} className="tarot-card__artwork" reveal />
              <strong>{entry.card.chineseName}</strong>
              <span>{entry.card.name}</span>
              <small>{orientationLabel}</small>
            </>
          ) : null}
        </span>
      </span>
    </motion.button>
  )
}
