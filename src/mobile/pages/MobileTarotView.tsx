import { Sparkles } from 'lucide-react'
import { useState } from 'react'

import { TarotReveal } from '../../components/tarot/TarotReveal'
import type { TarotSpread } from '../../tarot/tarotEngine'
import type { DecisionResult } from '../../types/decision'
import { MobileTarotSpread, type MobileTarotPhase } from '../components/MobileTarotSpread'

interface MobileTarotViewProps {
  spread: TarotSpread
  selectedPosition: number | null
  revealedResult: DecisionResult | null
  onSelect: (position: number) => void
  onContinue: () => void
}

export function MobileTarotView({
  spread,
  selectedPosition,
  revealedResult,
  onSelect,
  onContinue,
}: MobileTarotViewProps): React.JSX.Element {
  const [phase, setPhase] = useState<MobileTarotPhase>(selectedPosition === null ? 'idle' : 'revealed')

  return (
    <section className="mobile-tarot">
      <header className="mobile-tarot__heading">
        <span><Sparkles size={15} aria-hidden="true" /> 大阿卡纳牌阵</span>
        <h1>凭第一感觉，选一张</h1>
        <p>牌阵已经确定。不要分析牌背，第一眼想点哪张，就点哪张。</p>
        <small>22 张大阿卡纳 · 本轮展开 7 张 · 仅供娱乐</small>
      </header>

      <div className="mobile-tarot__stage">
        <MobileTarotSpread
          spread={spread}
          selectedPosition={selectedPosition}
          onSelect={onSelect}
          onPhaseChange={setPhase}
        />
      </div>

      {revealedResult && phase === 'revealed' ? (
        <TarotReveal result={revealedResult} onContinue={onContinue} />
      ) : (
        <p className="mobile-tarot__prompt">
          {phase === 'flipping' || phase === 'focusing' ? '牌面正在回应你的第一感觉…' : '轻点一张牌，原地翻开后放大揭晓。'}
        </p>
      )}
    </section>
  )
}
