import type { LucideIcon } from 'lucide-react'

import type { DecisionMode } from '../types/decision'

interface ModeCardProps {
  mode?: DecisionMode
  title: string
  description: string
  tag: string
  icon: LucideIcon
  tone: 'random' | 'scientific' | 'mystic' | 'ai'
  selected?: boolean
  disabled?: boolean
  onSelect?: (mode: DecisionMode) => void
}

export function ModeCard({
  mode,
  title,
  description,
  tag,
  icon: Icon,
  tone,
  selected = false,
  disabled = false,
  onSelect,
}: ModeCardProps): React.JSX.Element {
  return (
    <button
      className={`mode-card mode-card--${tone}${selected ? ' is-selected' : ''}`}
      type="button"
      aria-pressed={mode ? selected : undefined}
      disabled={disabled}
      onClick={() => mode && onSelect?.(mode)}
    >
      <span className="mode-card__icon" aria-hidden="true">
        <Icon size={22} strokeWidth={1.8} />
      </span>
      <span className="mode-card__copy">
        <span className="mode-card__title-row">
          <strong>{title}</strong>
          <span className="mode-card__tag">{tag}</span>
        </span>
        <span>{description}</span>
      </span>
    </button>
  )
}
