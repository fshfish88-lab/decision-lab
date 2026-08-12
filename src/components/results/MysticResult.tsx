import { Ban, MoonStar, Sparkles, Telescope } from 'lucide-react'

import type { DecisionMetric, DecisionResult, MysticEvidence, MysticResultDetails } from '../../types/decision'

interface MysticResultProps {
  result: DecisionResult
}

function getDetails(result: DecisionResult): MysticResultDetails | undefined {
  return result.details?.type === 'mystic' ? result.details : undefined
}

function legacyEvidence(metrics: DecisionMetric[]): MysticEvidence[] {
  const fallbackMetrics: DecisionMetric[] = [
    { key: 'cosmic', label: '宇宙共振率', value: 50 },
    { key: 'subconscious', label: '潜意识偏好', value: 50 },
    { key: 'timing', label: '时机契合度', value: 50 },
  ]
  return [...metrics, ...fallbackMetrics].slice(0, 3).map((metric, index) => ({
    key: `legacy-${metric.key}-${index}`,
    title: metric.label,
    description: `旧版报告记录的「${metric.label}」读数仍在影响这次命运解释。`,
    reading: `METRIC / ${metric.value}`,
  }))
}

export function MysticResult({ result }: MysticResultProps): React.JSX.Element {
  const details = getDetails(result)
  const evidence = details?.evidence.slice(0, 3) ?? legacyEvidence(result.metrics)
  const favorable = details?.favorable ?? `今日宜：${result.winner.label}`
  const avoid = details?.avoid ?? '今日忌：继续纠结'

  return (
    <div className="mode-result mystic-result">
      <section className="mystic-result__report" aria-labelledby="mystic-report-heading">
        <div>
          <span className="mode-result__eyebrow"><MoonStar size={16} /> DESTINY REPORT</span>
          <h2 id="mystic-report-heading">今日命运报告</h2>
          <p>宇宙已完成一轮非常可疑但相当坚定的推演。</p>
        </div>
        <div className="mystic-result__winner">
          <span>命运指向</span>
          <h3>{result.winner.label}</h3>
          <small>可信度 {result.confidence}% · 可信度仅供气氛使用</small>
        </div>
      </section>

      <section className="mode-result__section mystic-orbit-section" aria-labelledby="mystic-orbit-heading">
        <div className="mode-result__heading">
          <div><span>ASTRAL READINGS</span><h2 id="mystic-orbit-heading">命运星盘</h2></div>
          <small>检测到轻微宇宙偏心</small>
        </div>
        <div className="mystic-orbit" aria-label="本次玄学指标星盘">
          <div className="mystic-orbit__core"><Sparkles size={22} /><strong>{result.winner.label}</strong></div>
          <i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" />
          <div className="mystic-orbit__readings">
            {result.metrics.slice(0, 3).map((metric) => (
              <article key={metric.key}><span>{metric.label}</span><strong>{metric.value}%</strong></article>
            ))}
          </div>
        </div>
      </section>

      <section className="mode-result__section" aria-labelledby="mystic-evidence-heading">
        <div className="mode-result__heading">
          <div><span>PSEUDO EVIDENCE</span><h2 id="mystic-evidence-heading">玄学证据</h2></div>
          <small><Telescope size={15} /> 一本正经地胡说八道</small>
        </div>
        <div className="mystic-evidence">
          {evidence.map((item, index) => (
            <article key={item.key}>
              <span>证据 {String(index + 1).padStart(2, '0')}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <code>{item.reading}</code>
            </article>
          ))}
        </div>
      </section>

      <section className="mystic-guidance" aria-label="今日宜忌">
        <article className="is-favorable"><Sparkles size={20} /><div><span>宜</span><strong>{favorable}</strong></div></article>
        <article className="is-avoid"><Ban size={20} /><div><span>忌</span><strong>{avoid}</strong></div></article>
      </section>

      <section className="mystic-result__explanation" aria-labelledby="mystic-explanation-heading">
        <div><h2 id="mystic-explanation-heading">命运解读</h2><p>{result.explanation}</p></div>
        {result.disclaimer && <small>{result.disclaimer}</small>}
      </section>
    </div>
  )
}
