import { Dices, Fingerprint, Hash, ListChecks } from 'lucide-react'
import { motion } from 'framer-motion'

import type { DecisionResult } from '../../types/decision'

interface RandomResultProps {
  result: DecisionResult
}

export function RandomResult({ result }: RandomResultProps): React.JSX.Element {
  const details = result.details?.type === 'random' ? result.details : undefined
  const probability = details?.probability ?? 1 / result.options.length
  const probabilityLabel = `${(probability * 100).toFixed(2)}%`
  const seed = details?.seed ?? 'LEGACY-RESULT'
  const drawNumber = details?.drawNumber ?? '#------'
  const winningIndex = details?.winningIndex ?? Math.max(
    0,
    result.options.findIndex((option) => option.id === result.winner.id),
  )
  const trajectory = [
    ...result.options,
    ...result.options.slice(winningIndex + 1),
    result.winner,
  ]

  return (
    <div className="mode-result random-result">
      <motion.section
        className="random-result__hero"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <span className="section-index">RANDOM RESULT / NO PREFERENCE APPLIED</span>
        <h2>命运选择了它</h2>
        <strong>{result.winner.label}</strong>
        <p>所有候选项机会完全相同，这一轮只是它刚好停在终点。</p>
        <Dices size={76} aria-hidden="true" />
      </motion.section>

      <section className="mode-result__section" aria-labelledby="fate-track-heading">
        <div className="mode-result__heading">
          <div><span className="section-index">FATE LANDING</span><h2 id="fate-track-heading">命运落点</h2></div>
          <small>等概率轨迹回放</small>
        </div>
        <div className="fate-track" aria-label={`抽签最终停在 ${result.winner.label}`}>
          {trajectory.map((option, index) => {
            const isWinner = index === trajectory.length - 1
            return (
              <div className={`fate-track__item${isWinner ? ' is-winner' : ''}`} key={`${option.id}-${index}`}>
                <span>{option.label}</span>
                {isWinner && <b>STOP</b>}
              </div>
            )
          })}
        </div>
      </section>

      <section className="mode-result__section" aria-labelledby="random-meta-heading">
        <div className="mode-result__heading">
          <div><span className="section-index">DRAW METADATA</span><h2 id="random-meta-heading">本轮抽签信息</h2></div>
        </div>
        <div className="random-meta-grid">
          <article><ListChecks size={20} /><span>候选数量</span><strong>{result.options.length}</strong></article>
          <article><Dices size={20} /><span>理论概率</span><strong>{probabilityLabel}</strong></article>
          <article><Hash size={20} /><span>抽签编号</span><strong>{drawNumber}</strong></article>
        </div>
        <article className="random-seed-card">
          <Fingerprint size={22} />
          <div><span>RANDOM SEED / 本轮随机种子</span><strong>{seed}</strong></div>
          <small>用于标记本轮样本，不代表密码学随机证明。</small>
        </article>
      </section>

      <section className="mode-result__section" aria-labelledby="probability-heading">
        <div className="mode-result__heading">
          <div><span className="section-index">EQUAL PROBABILITY</span><h2 id="probability-heading">所有候选项概率</h2></div>
          <small>没有任何候选项被偏爱</small>
        </div>
        <div className="probability-list">
          {result.options.map((option) => (
            <div className="probability-row" key={option.id}>
              <div><strong>{option.label}</strong><span>{probabilityLabel}</span></div>
              <div className="probability-row__bar"><span style={{ width: probabilityLabel }} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="random-system-note" aria-labelledby="random-note-heading">
        <span className="section-index">SYSTEM COMMENT</span>
        <h2 id="random-note-heading">系统评价</h2>
        <p>这次没有任何科学依据，但至少你不用继续纠结。</p>
      </section>
    </div>
  )
}
