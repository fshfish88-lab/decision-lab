import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

import type { DecisionResult } from '../../types/decision'

interface TarotRevealProps {
  result: DecisionResult
  onContinue: () => void
}

export function TarotReveal({ result, onContinue }: TarotRevealProps): React.JSX.Element {
  const tarot = result.details?.type === 'mystic' ? result.details.tarot : undefined
  if (!tarot) return <></>

  const orientationLabel = tarot.orientation === 'upright' ? '正位' : '逆位'

  return (
    <motion.section
      className="tarot-reveal"
      aria-labelledby="tarot-reveal-heading"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42 }}
    >
      <div className="tarot-reveal__copy">
        <span className="section-index">CARD REVEALED / {tarot.deckFingerprint}</span>
        <h2 id="tarot-reveal-heading">你的牌已翻开</h2>
        <p>{tarot.numeral} · {tarot.name}</p>
        <h3>{tarot.chineseName} · {orientationLabel}</h3>
        <div className="tarot-keywords" aria-label="牌面关键词">
          {tarot.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
        </div>
        <div className="tarot-reveal__omen">
          <span>牌面含义</span>
          <p>{tarot.interpretation}</p>
        </div>
      </div>
      <div className="tarot-reveal__answer">
        <span>本轮指向</span>
        <strong>{result.winner.label}</strong>
        <small>塔罗已经表态，科学部门对此不发表评论。</small>
      </div>
      <button className="primary-action" type="button" onClick={onContinue}>
        <span>查看完整结果</span><ArrowRight size={18} />
      </button>
    </motion.section>
  )
}
