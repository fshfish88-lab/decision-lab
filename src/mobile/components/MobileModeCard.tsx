import type { LucideIcon } from 'lucide-react'

import type { DecisionMode } from '../../types/decision'

interface MobileModeCardProps {
  mode: DecisionMode
  title: string
  description: string
  icon: LucideIcon
  tone: 'random' | 'scientific' | 'mystic' | 'ai'
  selected?: boolean
  disabled?: boolean
  onSelect: (mode: DecisionMode) => void
}

export function MobileModeCard({
  mode,
  title,
  description,
  icon: Icon,
  tone,
  selected = false,
  disabled = false,
  onSelect,
}: MobileModeCardProps): React.JSX.Element {
  return (
    <button
      className={`mobile-mode-card mobile-mode-card--${tone}${selected ? ' is-selected' : ''}`}
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelect(mode)}
    >
      <span className="mobile-mode-card__icon" aria-hidden="true">
        <Icon size={22} strokeWidth={1.8} />
      </span>
      <span className="mobile-mode-card__copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      <span className="mobile-mode-card__state">{selected ? '已选择' : '选择'}</span>
    </button>
  )
}
