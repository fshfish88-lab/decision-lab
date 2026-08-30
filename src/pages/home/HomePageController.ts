import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useDecision } from '../../state/DecisionContext'
import type { DecisionMode, DecisionOption } from '../../types/decision'

const CTA_LABELS: Record<DecisionMode, string> = {
  random: '交给命运',
  scientific: '开始计算',
  mystic: '开始抽牌',
  ai: '让 AI 替我决定',
}

export interface HomeViewProps {
  question: string
  options: DecisionOption[]
  selectedMode: DecisionMode | null
  canStart: boolean
  ctaLabel: string
  validationMessage: string | null
  onQuestionChange: (value: string) => void
  onOptionChange: (id: string, value: string) => void
  onAddOption: () => void
  onRemoveOption: (id: string) => void
  onSelectMode: (mode: DecisionMode) => void
  onStart: () => void
}

export function useHomePageController(): HomeViewProps {
  const navigate = useNavigate()
  const location = useLocation()
  const { state, dispatch } = useDecision()
  const validCount = useMemo(
    () => state.options.filter((option) => option.label.trim()).length,
    [state.options],
  )
  const canStart = validCount >= 2 && state.mode !== null
  const ctaLabel = state.mode ? CTA_LABELS[state.mode] : '选择一种决策方式'
  const validationMessage = validCount < 2
    ? '至少填写两个有效选项'
    : state.mode === null
      ? '选择一种决策方式'
      : null

  useEffect(() => {
    const focusTarget = (location.state as { focusTarget?: 'input' | 'mode' } | null)?.focusTarget
    if (!focusTarget) return

    const target = document.getElementById(focusTarget === 'mode' ? 'mode-selection' : 'decision-input')
    if (!target) return

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })

    if (focusTarget === 'input') {
      target.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true })
    }
  }, [location.key, location.state])

  function startDecision(): void {
    if (!canStart || !state.mode) return
    dispatch({ type: 'clear-result' })
    navigate(
      state.mode === 'scientific'
        ? '/science'
        : state.mode === 'mystic'
          ? '/tarot'
          : state.mode === 'ai'
            ? '/ai'
            : '/analysis',
    )
  }

  return {
    question: state.question,
    options: state.options,
    selectedMode: state.mode,
    canStart,
    ctaLabel,
    validationMessage,
    onQuestionChange: (question) => dispatch({ type: 'set-question', question }),
    onOptionChange: (id, label) => dispatch({ type: 'set-option', id, label }),
    onAddOption: () => dispatch({ type: 'add-option' }),
    onRemoveOption: (id) => dispatch({ type: 'remove-option', id }),
    onSelectMode: (mode) => dispatch({ type: 'set-mode', mode }),
    onStart: startDecision,
  }
}
