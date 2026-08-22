import { motion } from 'framer-motion'

import type { TarotSpreadCard } from '../../tarot/tarotEngine'

interface TarotCardProps {
  entry: TarotSpreadCard
  selected: boolean
  dimmed: boolean
  onSelect: (position: number) => void
}

export function TarotCard({
  entry,
  selected,
  dimmed,
  onSelect,
}: TarotCardProps): React.JSX.Element {
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
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: dimmed ? 0.25 : 1, y: selected ? -20 : 0 }}
      transition={{ duration: 0.36, delay: selected ? 0 : entry.position * 0.045 }}
    >
      <span className="tarot-card__inner">
        <span className="tarot-card__back" aria-hidden={selected}>
          <i className="tarot-card__sun" />
          <i className="tarot-card__diamond" />
          <small>DECISION LAB</small>
        </span>
        <span className={`tarot-card__face${entry.orientation === 'reversed' ? ' is-reversed' : ''}`} aria-hidden={!selected}>
          {selected ? (
            <>
              <small>{entry.card.numeral}</small>
              <i className="tarot-card__sigil" />
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
