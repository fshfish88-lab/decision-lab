import { ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

import { MetricRing } from '../components/MetricRing'
import { RandomResult } from '../components/results/RandomResult'
import { ResultShell } from '../components/results/ResultShell'
import { ScientificResult } from '../components/results/ScientificResult'
import { useDecision } from '../state/DecisionContext'

export function ResultPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { state, dispatch } = useDecision()
  const result = state.result

  if (!result) {
    return (
      <main className="empty-state">
        <span className="empty-state__icon"><ShieldCheck size={24} /></span>
        <h1>当前没有决策结果</h1>
        <p>系统不会为了填满页面而编造一个答案。</p>
        <button className="secondary-action" type="button" onClick={() => navigate('/')}>开始一次决定</button>
      </main>
    )
  }

  const rerunPath = result.mode === 'scientific' ? '/science' : '/analysis'

  function rerun(): void {
    dispatch({ type: 'clear-result' })
    navigate(rerunPath)
  }

  const legacyResult = (
    <>
      <section className="result-hero">
        <motion.div
          className={`winner-card winner-card--${result.mode}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <span>经过严谨{result.mode === 'mystic' ? '（并不）' : ''}的计算</span>
          <h2>{result.winner.label}</h2>
          <div className="winner-seal"><ShieldCheck size={17} />就是它了</div>
          <div className="winner-card__orbits" aria-hidden="true"><i /><i /><i /></div>
        </motion.div>

        <article className="confidence-card">
          <span>{result.mode === 'scientific' ? '最高综合得分' : result.mode === 'random' ? '等概率执行完整度' : '命运可信度'}</span>
          <strong>{result.confidence}%</strong>
          <div className="confidence-bar"><span style={{ width: `${result.confidence}%` }} /></div>
          <p>{result.mode === 'random' ? '所有候选项拥有完全相同的抽取概率。' : '系统已完成本轮参数校验与结果生成。'}</p>
        </article>
      </section>

      <section className="result-section" aria-labelledby="metrics-heading">
        <div className="section-heading-row">
          <div><span className="section-index">METRICS</span><h2 id="metrics-heading">详细分析</h2></div>
          <small>{result.mode === 'mystic' ? '非常不科学' : '基于本次输入'}</small>
        </div>
        <div className="metric-grid">
          {result.metrics.map((metric) => <MetricRing key={metric.key} label={metric.label} value={metric.value} inverse={metric.inverse} />)}
        </div>
      </section>

      {result.ranking && (
        <section className="result-section ranking-section" aria-labelledby="ranking-heading">
          <div className="section-heading-row"><div><span className="section-index">FULL RANKING</span><h2 id="ranking-heading">完整排名</h2></div></div>
          <ol>{result.ranking.map((item) => <li key={item.optionId}><span>{String(item.rank).padStart(2, '0')}</span><strong>{item.label}</strong><b>{item.score.toFixed(2)}</b></li>)}</ol>
        </section>
      )}

      <section className="explanation-card" aria-labelledby="explanation-heading">
        <div className="explanation-card__label"><span /><small>SYSTEM NOTE</small></div>
        <div><h2 id="explanation-heading">系统解释</h2><p>{result.explanation}</p>{result.disclaimer && <small>{result.disclaimer}</small>}</div>
      </section>
    </>
  )

  return (
    <ResultShell
      result={result}
      onRerun={rerun}
      onReturnHome={() => navigate('/')}
    >
      {result.mode === 'random' ? (
        <RandomResult result={result} />
      ) : result.mode === 'scientific' ? (
        <ScientificResult result={result} />
      ) : legacyResult}
    </ResultShell>
  )
}
