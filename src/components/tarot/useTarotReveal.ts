import { useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'

export type TarotPhase = 'idle' | 'flipping' | 'focusing' | 'revealed'

interface RevealOptions {
  selectedPosition: number | null
  onSelect: (position: number) => void
  onPhaseChange?: (phase: TarotPhase) => void
  offsetProperty: string
  maxWidth: number
  widthFraction?: number
}

export function useTarotReveal({ selectedPosition, onSelect, onPhaseChange, offsetProperty, maxWidth, widthFraction = 0.46 }: RevealOptions) {
  const reducedMotion = useReducedMotion()
  const lockedPositionRef = useRef<number | null>(selectedPosition)
  const previousSelectedRef = useRef<number | null>(selectedPosition)
  const spreadRef = useRef<HTMLDivElement | null>(null)
  const slotRefs = useRef<Array<HTMLDivElement | null>>([])
  const [focusTarget, setFocusTarget] = useState({ x: 0, y: 0, scale: 1, space: 0 })
  const [focusedPosition, setFocusedPosition] = useState<number | null>(selectedPosition)
  const [phase, setPhase] = useState<TarotPhase>(selectedPosition === null ? 'idle' : 'revealed')

  const updatePhase = useCallback((nextPhase: TarotPhase): void => {
    setPhase(nextPhase)
    onPhaseChange?.(nextPhase)
  }, [onPhaseChange])

  const measureFocus = useCallback((position: number): void => {
    const slot = slotRefs.current[position]
    if (!slot) return
    const rect = slot.getBoundingClientRect()
    const viewport = window.visualViewport
    const width = viewport?.width ?? window.innerWidth
    const height = viewport?.height ?? window.innerHeight
    const centerX = (viewport?.offsetLeft ?? 0) + width / 2
    const centerY = (viewport?.offsetTop ?? 0) + height / 2
    const style = getComputedStyle(slot)
    const offset = Number.parseFloat(style.getPropertyValue(offsetProperty)) || 0
    const matrix = style.transform && style.transform !== 'none' ? new DOMMatrixReadOnly(style.transform) : undefined
    const originX = rect.x + rect.width / 2 - (matrix?.m41 ?? 0)
    const originY = rect.y + rect.height / 2 - (matrix?.m42 ?? offset)
    const targetWidth = Math.min(maxWidth, width * widthFraction, Math.max(80, height - 180) * 0.61)
    const spreadBottom = spreadRef.current?.getBoundingClientRect().bottom ?? centerY
    setFocusTarget({
      x: centerX - originX,
      y: centerY - originY - offset,
      scale: targetWidth / (slot.offsetWidth || 72),
      space: Math.max(0, centerY + targetWidth / 0.61 / 2 + 16 - spreadBottom),
    })
  }, [maxWidth, offsetProperty, widthFraction])

  const beginFlip = useCallback((position: number): void => {
    lockedPositionRef.current = position
    setFocusedPosition(position)
    measureFocus(position)
    updatePhase(reducedMotion ? 'revealed' : 'flipping')
  }, [measureFocus, reducedMotion, updatePhase])

  useEffect(() => {
    const previousSelected = previousSelectedRef.current
    previousSelectedRef.current = selectedPosition
    if (selectedPosition === null && previousSelected !== null) {
      lockedPositionRef.current = null
      setFocusedPosition(null)
      updatePhase('idle')
    } else if (selectedPosition !== null && lockedPositionRef.current === null) {
      beginFlip(selectedPosition)
    }
  }, [beginFlip, selectedPosition, updatePhase])

  useEffect(() => {
    if (focusedPosition === null) return
    const refresh = (): void => measureFocus(focusedPosition)
    refresh()
    window.addEventListener('resize', refresh)
    window.visualViewport?.addEventListener('resize', refresh)
    return () => {
      window.removeEventListener('resize', refresh)
      window.visualViewport?.removeEventListener('resize', refresh)
    }
  }, [focusedPosition, measureFocus])

  useEffect(() => {
    if (reducedMotion && (phase === 'flipping' || phase === 'focusing')) updatePhase('revealed')
  }, [phase, reducedMotion, updatePhase])

  function select(position: number): void {
    if (lockedPositionRef.current !== null) return
    beginFlip(position)
    onSelect(position)
  }

  function finishFlip(position: number): void {
    if (position === focusedPosition && phase === 'flipping') {
      measureFocus(position)
      updatePhase('focusing')
    }
  }

  function finishFocus(): void {
    if (phase === 'focusing') updatePhase('revealed')
  }

  return { spreadRef, slotRefs, focusTarget, focusedPosition, phase, select, finishFlip, finishFocus }
}
