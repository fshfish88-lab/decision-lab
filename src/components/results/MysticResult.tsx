import { Ban, CircleDot, MoonStar, Sparkles, Telescope } from 'lucide-react'

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
  const tarot = details?.tarot
  if (tarot) {
    const orientationLabel = tarot.orientation === 'upright' ? '正位' : '逆位'

    return (
      <div className="mode-result tarot-result">
        <section className="tarot-result__hero" aria-labelledby="tarot-result-heading">
          <div className="tarot-result__card" aria-label={`${tarot.chineseName} ${orientationLabel}`}>
            <small>{tarot.numeral}</small>
            <i aria-hidden="true"><CircleDot size={54} strokeWidth={1.2} /></i>
            <strong>{tarot.chineseName}</strong>
            <span>{tarot.name}</span>
            <small>{orientationLabel}</small>
          </div>
          <div className="tarot-result__reading">
            <span className="mode-result__eyebrow"><MoonStar size={16} /> MAJOR ARCANA READING</span>
            <h2 id="tarot-result-heading">你的牌</h2>
            <p className="tarot-result__name">{tarot.numeral} · {tarot.name}</p>
            <h3>{tarot.chineseName} · {orientationLabel}</h3>
            <div className="tarot-keywords" aria-label="牌面关键词">
              {tarot.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
            </div>
            <div className="tarot-strength" aria-label={`牌面强度 ${tarot.strength}/5`}>
              <span>牌面强度</span>
              <div aria-hidden="true">
                {Array.from({ length: 5 }, (_, index) => (
                  <i className={index < tarot.strength ? 'is-active' : ''} key={index} />
                ))}
              </div>
              <small>{tarot.strength >= 4 ? '倾向明确' : tarot.strength === 3 ? '倾向温和' : '留有余地'}</small>
            </div>
          </div>
          <div className="tarot-result__winner">
            <span>本轮指向</span>
            <h3>{result.winner.label}</h3>
            <small>牌已经翻开，反悔不在本轮服务范围内。</small>
          </div>
        </section>

        <section className="tarot-result__interpretation" aria-labelledby="tarot-interpretation-heading">
          <div>
            <span className="section-index">CARD INTERPRETATION</span>
            <h2 id="tarot-interpretation-heading">牌意解读</h2>
            <p>{tarot.interpretation}</p>
          </div>
          <dl>
            <div><dt>牌阵指纹</dt><dd>{tarot.deckFingerprint}</dd></div>
            <div><dt>抽牌位置</dt><dd>{String(tarot.selectedPosition + 1).padStart(2, '0')} / 07</dd></div>
            <div><dt>科学意见</dt><dd>不予置评</dd></div>
          </dl>
        </section>

        <section className="mystic-guidance" aria-label="本轮建议">
          <article className="is-favorable"><Sparkles size={20} /><div><span>宜</span><strong>{details.favorable}</strong></div></article>
          <article className="is-avoid"><Ban size={20} /><div><span>忌</span><strong>{details.avoid}</strong></div></article>
        </section>

        <section className="mystic-result__explanation" aria-labelledby="mystic-explanation-heading">
          <div><h2 id="mystic-explanation-heading">本轮结论</h2><p>{result.explanation}</p></div>
          {result.disclaimer && <small>{result.disclaimer}</small>}
        </section>
      </div>
    )
  }

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
