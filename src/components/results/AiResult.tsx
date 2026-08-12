import { ArrowRight, BrainCircuit, CheckCircle2, RefreshCw, Scale } from 'lucide-react'

import type { DecisionResult } from '../../types/decision'

interface AiResultProps {
  result: DecisionResult
}

function AdviceList({ items }: { items: string[] }): React.JSX.Element {
  return (
    <ul className="ai-result__list">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  )
}

export function AiResult({ result }: AiResultProps): React.JSX.Element {
  if (result.details?.type !== 'ai') {
    return <section className="ai-result-error">AI 结果详情不完整，本次不展示推测内容。</section>
  }

  const advice = result.details.advice
  return (
    <div className="mode-result ai-result">
      <section className="ai-result__hero" aria-labelledby="ai-result-heading">
        <div>
          <span className="mode-result__eyebrow"><BrainCircuit size={16} />AI DECISION / DIRECT ADVICE</span>
          <h2 id="ai-result-heading">AI 最终建议</h2>
          <p>{advice.verdict}</p>
        </div>
        <div className="ai-result__choice">
          <span>别再开会了，就选</span>
          <h2>{result.winner.label}</h2>
          <strong>推荐强度 {advice.confidence}%</strong>
        </div>
      </section>

      <div className="ai-result__grid">
        <section className="ai-result__card ai-result__card--reasons">
          <span className="ai-result__icon"><CheckCircle2 size={20} /></span>
          <h2>为什么推荐</h2>
          <AdviceList items={advice.core_reasons} />
        </section>

        <section className="ai-result__card ai-result__card--tradeoff">
          <span className="ai-result__icon"><Scale size={20} /></span>
          <h2>需要接受</h2>
          <p>{advice.main_tradeoff}</p>
          <small>没有零代价的决定，只有更值得付的代价。</small>
        </section>

        <section className="ai-result__card">
          <span className="ai-result__icon"><RefreshCw size={20} /></span>
          <h2>重新考虑条件</h2>
          <AdviceList items={advice.conditions_to_reconsider} />
        </section>

        <section className="ai-result__card ai-result__card--action">
          <span className="ai-result__icon"><ArrowRight size={20} /></span>
          <h2>下一步行动</h2>
          <ol className="ai-result__steps">
            {advice.action_plan.map((action, index) => (
              <li key={action}><span>{String(index + 1).padStart(2, '0')}</span>{action}</li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  )
}
