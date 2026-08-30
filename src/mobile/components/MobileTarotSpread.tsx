import { useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'

import { TarotCard } from '../../components/tarot/TarotCard'
import type { TarotSpread, TarotSpreadCard } from '../../tarot/tarotEngine'

export type MobileTarotPhase = 'idle' | 'focusing' | 'revealed'

interface MobileTarotSpreadProps {
  spread: TarotSpread
  selectedPosition: number | null
  onSelect: (position: number) => void
  onPhaseChange?: (phase: MobileTarotPhase) => void
}

const REVEAL_DELAY_MS = 220
const TOP_ROW_COUNT = 4
const ROTATIONS = [-8, -3, 3, 8, -6, 0, 6]
const OFFSETS = [14, 2, 2, 14, 2, 13, 2]

export function MobileTarotSpread({
  spread,
  selectedPosition,
  onSelect,
  onPhaseChange,
}: MobileTarotSpreadProps): React.JSX.Element {
  const reducedMotion = useReducedMotion()
  const lockedPositionRef = useRef<number | null>(selectedPosition)
  const previousSelectedRef = useRef<number | null>(selectedPosition)
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [focusedPosition, setFocusedPosition] = useState<number | null>(selectedPosition)
  const [phase, setPhase] = useState<MobileTarotPhase>(selectedPosition === null ? 'idle' : 'revealed')

  const updatePhase = useCallback((nextPhase: MobileTarotPhase): void => {
    setPhase(nextPhase)
    onPhaseChange?.(nextPhase)
  }, [onPhaseChange])

  const clearRevealTimer = useCallback((): void => {
    if (revealTimerRef.current !== null) {
      clearTimeout(revealTimerRef.current)
      revealTimerRef.current = null
    }
  }, [])

  const beginFocus = useCallback((position: number): void => {
    clearRevealTimer()
    lockedPositionRef.current = position
    setFocusedPosition(position)
    updatePhase('focusing')
    revealTimerRef.current = setTimeout(() => {
      revealTimerRef.current = null
      updatePhase('revealed')
    }, reducedMotion ? 0 : REVEAL_DELAY_MS)
  }, [clearRevealTimer, reducedMotion, updatePhase])

  useEffect(() => {
    const previousSelected = previousSelectedRef.current
    previousSelectedRef.current = selectedPosition

    if (selectedPosition === null && previousSelected !== null) {
      clearRevealTimer()
      lockedPositionRef.current = null
      setFocusedPosition(null)
      updatePhase('idle')
      return
    }

    if (selectedPosition !== null && lockedPositionRef.current === null) {
      beginFocus(selectedPosition)
    }
  }, [beginFocus, clearRevealTimer, selectedPosition, updatePhase])

  useEffect(() => clearRevealTimer, [clearRevealTimer])

  function select(position: number): void {
    if (lockedPositionRef.current !== null) return
    beginFocus(position)
    onSelect(position)
  }

  function renderSlot(entry: TarotSpreadCard): React.JSX.Element {
    const focused = entry.position === focusedPosition
    const locked = lockedPositionRef.current !== null
    const slotClassName = [
      'mobile-tarot-spread__slot',
      focused ? 'is-focused' : '',
      locked && !focused ? 'is-dimmed' : '',
    ].filter(Boolean).join(' ')

    return (
      <div
        className={slotClassName}
        key={`${spread.fingerprint}-${entry.position}`}
        style={{
          '--mobile-tarot-rotation': `${ROTATIONS[entry.position]}deg`,
          '--mobile-tarot-offset-y': `${OFFSETS[entry.position]}px`,
        } as React.CSSProperties}
      >
        <TarotCard
          entry={entry}
          selected={focused && phase === 'revealed'}
          dimmed={locked && !focused}
          onSelect={select}
        />
      </div>
    )
  }

  return (
    <div
      className="mobile-tarot-spread"
      aria-label="七张大阿卡纳牌阵"
      data-phase={phase}
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
