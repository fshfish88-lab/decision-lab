import { ArrowLeft, Layers3 } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { TarotDeck } from '../components/tarot/TarotDeck'
import { TarotReveal } from '../components/tarot/TarotReveal'
import { createTarotResult } from '../services/decisionEngine'
import { saveHistoryItem } from '../storage/history'
import { useDecision } from '../state/DecisionContext'
import { createTarotSpread, selectTarotCard, type TarotSpread } from '../tarot/tarotEngine'
import type { DecisionResult } from '../types/decision'

export function TarotPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { state, dispatch } = useDecision()
  const validOptions = useMemo(
    () => state.options.filter((option) => option.label.trim()),
    [state.options],
  )
  const ready = state.mode === 'mystic' && validOptions.length >= 2
  const spreadRef = useRef<TarotSpread | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null)
  const [revealedResult, setRevealedResult] = useState<DecisionResult | null>(null)

  if (ready && !spreadRef.current) {
    spreadRef.current = createTarotSpread(validOptions)
  }

  function reveal(position: number): void {
    const spread = spreadRef.current
    if (!spread || selectedPosition !== null) return

    const selection = selectTarotCard(spread, position)
    const result = createTarotResult({
      question: state.question,
      options: validOptions,
      selection,
      deckFingerprint: spread.fingerprint,
    })
    setSelectedPosition(position)
    setRevealedResult(result)
    dispatch({ type: 'set-result', result })
    saveHistoryItem(result)
  }

  if (!ready || !spreadRef.current) {
    return (
      <main className="empty-state">
        <span className="empty-state__icon"><Layers3 size={24} /></span>
        <h1>还没有可用的塔罗牌阵</h1>
        <p>请先返回首页，输入至少两个选项并选择玄学模式。</p>
        <button className="secondary-action" type="button" onClick={() => navigate('/')}>返回首页</button>
      </main>
    )
  }

  return (
    <main className="tarot-page">
      <button className="back-button" type="button" onClick={() => navigate('/')}>
        <ArrowLeft size={17} />返回修改选项
      </button>
      <header className="tarot-heading">
        <span className="section-index">MYSTIC MODE / MAJOR ARCANA</span>
        <h1 aria-label="凭第一感觉，选择一张">
          凭第一感觉，<span className="tarot-heading__action">选择一张</span>
        </h1>
        <p>牌阵已经确定。你选中的不是一张牌背，而是这轮决定的落点。</p>
        <small>22 张大阿卡纳 · 本轮展开 7 张 · 纯娱乐</small>
      </header>

      <TarotDeck
        spread={spreadRef.current}
        selectedPosition={selectedPosition}
        onSelect={reveal}
      />

      {revealedResult ? (
        <TarotReveal result={revealedResult} onContinue={() => navigate('/result')} />
      ) : (
        <p className="tarot-prompt">不要分析牌背。第一眼想点哪张，就点哪张。</p>
      )}
    </main>
  )
}
