import { BarChart3, CheckCircle2, FlaskConical } from 'lucide-react'

import type { DecisionResult, ScientificResultDetails } from '../../types/decision'

interface ScientificResultProps {
  result: DecisionResult
}

function getDetails(result: DecisionResult): ScientificResultDetails | undefined {
  return result.details?.type === 'scientific' ? result.details : undefined
}

export function ScientificResult({ result }: ScientificResultProps): React.JSX.Element {
  const details = getDetails(result)
  const ranking = result.ranking ?? []
  const leader = ranking[0]
  const runnerUp = ranking[1]
  const winningScore = leader?.score ?? result.confidence / 10
  const scoreGap = leader && runnerUp ? leader.score - runnerUp.score : undefined
  const maxContribution = Math.max(
    1,
    ...(details?.contributions.map((item) => item.contribution) ?? []),
  )

  return (
    <div className="mode-result scientific-result">
      <section className="scientific-result__hero" aria-labelledby="scientific-result-heading">
        <div className="scientific-result__hero-copy">
          <span className="mode-result__eyebrow"><FlaskConical size={16} /> WEIGHTED DECISION</span>
          <h2 id="scientific-result-heading">最终推荐</h2>
          <h3>{result.winner.label}</h3>
          <p>每一分都有出处，这次不是拍脑袋。</p>
        </div>
        <div className="scientific-result__score" aria-label={`综合得分 ${winningScore.toFixed(2)} 分`}>
          <span>综合得分</span>
          <strong>{winningScore.toFixed(2)} <small>/ 10</small></strong>
          {scoreGap !== undefined && <p>领先第二名 {scoreGap.toFixed(2)} 分</p>}
        </div>
      </section>

      <section className="mode-result__section" aria-labelledby="scientific-ranking-heading">
        <div className="mode-result__heading">
          <div><span>FULL RANKING</span><h2 id="scientific-ranking-heading">完整排名</h2></div>
          <small>按加权总分降序</small>
        </div>
        <ol className="scientific-ranking">
          {ranking.map((item) => (
            <li key={item.optionId} className={item.rank === 1 ? 'is-winner' : undefined}>
              <span>{String(item.rank).padStart(2, '0')}</span>
              <strong>{item.label}</strong>
              <b>{item.score.toFixed(2)}</b>
              {item.rank === 1 && <CheckCircle2 size={18} aria-label="推荐方案" />}
            </li>
          ))}
        </ol>
      </section>

      {details ? (
        <>
          <section className="mode-result__section" aria-labelledby="contribution-heading">
            <div className="mode-result__heading">
              <div><span>CONTRIBUTION</span><h2 id="contribution-heading">指标贡献</h2></div>
              <small>{result.winner.label} 的得分构成</small>
            </div>
            <div className="scientific-contributions">
              {details.contributions.map((item) => (
                <article key={item.criterionId}>
                  <div><strong>{item.name}</strong><span>权重 {item.weight}% · 评分 {item.score}</span></div>
                  <div className="scientific-contributions__track" aria-hidden="true">
                    <span style={{ width: `${(item.contribution / maxContribution) * 100}%` }} />
                  </div>
                  <b>+{item.contribution.toFixed(2)}</b>
                </article>
              ))}
            </div>
          </section>

          <section className="mode-result__section" aria-labelledby="comparison-heading">
            <div className="mode-result__heading">
              <div><span>SCORE MATRIX</span><h2 id="comparison-heading">方案评分对比</h2></div>
              <small><BarChart3 size={15} /> 横向滑动查看完整表格</small>
            </div>
            <div className="scientific-table-wrap" tabIndex={0} aria-label="方案评分对比表，可横向滚动">
              <table>
                <thead>
                  <tr>
                    <th scope="col">方案</th>
                    {details.criteria.map((criterion) => (
                      <th key={criterion.id} scope="col">{criterion.name} <small>{criterion.weight}%</small></th>
                    ))}
                    <th scope="col">综合得分</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((item) => (
                    <tr key={item.optionId}>
                      <th scope="row">{item.label}</th>
                      {details.criteria.map((criterion) => (
                        <td key={criterion.id}>{details.scores[item.optionId]?.[criterion.id] ?? '—'}</td>
                      ))}
                      <td><strong>{item.score.toFixed(2)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <p className="mode-result__legacy-note">该历史记录创建于详细贡献数据启用之前。</p>
      )}

      <section className="scientific-result__explanation" aria-labelledby="scientific-explanation-heading">
        <span aria-hidden="true"><BarChart3 size={21} /></span>
        <div><h2 id="scientific-explanation-heading">为什么它胜出？</h2><p>{result.explanation}</p></div>
      </section>
    </div>
  )
}
