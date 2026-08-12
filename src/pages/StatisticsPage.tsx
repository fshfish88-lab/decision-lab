import { Award, BarChart3, CalendarDays, RotateCcw, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { evaluateAchievements } from '../achievements/achievements'
import { calculateStatistics } from '../analytics/statistics'
import { readHistory } from '../storage/history'
import type { DecisionMode } from '../types/decision'

const MODE_LABELS: Record<DecisionMode, string> = {
  random: '随机模式',
  scientific: '科学模式',
  mystic: '玄学模式',
}

interface StatisticsPageProps {
  now?: Date
}

export function StatisticsPage({ now = new Date() }: StatisticsPageProps): React.JSX.Element {
  const history = useMemo(() => readHistory(), [])
  const summary = useMemo(() => calculateStatistics(history, now), [history, now])
  const achievements = useMemo(() => evaluateAchievements(history), [history])
  const trendMaximum = Math.max(1, ...summary.trend.map((entry) => entry.count))

  return (
    <main className="statistics-page">
      <header className="page-heading page-heading--split">
        <div>
          <span className="section-index">LOCAL INSIGHTS / V1.5</span>
          <h1>统计分析</h1>
          <p>只分析保存在当前浏览器里的真实决定，不拿演示数据冒充人生经验。</p>
        </div>
        <div className="statistics-total">
          <BarChart3 size={20} />
          <span>累计决策</span>
          <strong>{summary.totalCount}</strong>
        </div>
      </header>

      {history.length === 0 ? (
        <section className="empty-state empty-state--embedded statistics-empty">
          <span className="empty-state__icon"><TrendingUp size={24} /></span>
          <h2>还没有足够的决策数据</h2>
          <p>完成第一次决定后，这里才会开始认真统计。</p>
          <Link className="secondary-action" to="/">开始一次决定</Link>
        </section>
      ) : (
        <>
          <section className="statistics-kpi-grid" aria-label="核心统计">
            <article>
              <CalendarDays size={20} />
              <span>本月决策次数</span>
              <strong>{summary.monthCount}</strong>
              <small>次决定</small>
            </article>
            <article>
              <BarChart3 size={20} />
              <span>最常使用模式</span>
              <strong className="statistics-kpi-text">
                {summary.favoriteModes.map((mode) => MODE_LABELS[mode]).join('、')}
              </strong>
              <small>{summary.favoriteModes.length > 1 ? '本月难分高下' : '你的常用选择方式'}</small>
            </article>
            <article>
              <RotateCcw size={20} />
              <span>反悔次数</span>
              <strong>{summary.regretCount}</strong>
              <small>系统已如实记录</small>
            </article>
            <article>
              <TrendingUp size={20} />
              <span>决策服从率</span>
              <strong>{summary.obedienceRate?.toFixed(1)}%</strong>
              <small>决定之后没有反悔</small>
            </article>
          </section>

          <div className="statistics-detail-grid">
            <section className="statistics-panel" aria-labelledby="trend-title">
              <div className="statistics-panel__heading">
                <div><span className="section-index">LAST 7 DAYS</span><h2 id="trend-title">最近 7 天</h2></div>
                <small>按自然日统计</small>
              </div>
              <div className="trend-chart">
                {summary.trend.map((entry) => (
                  <div key={entry.dateKey} className="trend-chart__item">
                    <div
                      className="trend-chart__bar"
                      role="img"
                      aria-label={`${entry.label}：${entry.count} 次决策`}
                    >
                      <span style={{ height: `${Math.max(8, (entry.count / trendMaximum) * 100)}%` }} />
                    </div>
                    <strong>{entry.count}</strong>
                    <small>{entry.label}</small>
                  </div>
                ))}
              </div>
            </section>

            <section className="statistics-panel" aria-labelledby="distribution-title">
              <div className="statistics-panel__heading">
                <div><span className="section-index">MODE MIX</span><h2 id="distribution-title">模式分布</h2></div>
              </div>
              <div className="distribution-list">
                {summary.distribution.map((entry) => (
                  <div key={entry.mode}>
                    <div><strong>{MODE_LABELS[entry.mode]} · {entry.count} 次</strong><span>{entry.percentage.toFixed(1)}%</span></div>
                    <span className={`distribution-bar distribution-bar--${entry.mode}`}>
                      <i style={{ width: `${entry.percentage}%` }} />
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}

      <section className="achievement-section" aria-labelledby="achievement-title">
        <div className="statistics-panel__heading">
          <div><span className="section-index">ACHIEVEMENTS</span><h2 id="achievement-title">成就档案</h2></div>
          <small>{achievements.filter((item) => item.unlocked).length} / {achievements.length} 已解锁</small>
        </div>
        <div className="achievement-grid">
          {achievements.map((item) => (
            <article className={`achievement-card${item.unlocked ? ' is-unlocked' : ''}`} key={item.id}>
              <span className="achievement-card__icon"><Award size={20} /></span>
              <div><h3>{item.title}</h3><p>{item.description}</p></div>
              <div className="achievement-card__progress">
                <span><i style={{ width: `${(item.progress / item.target) * 100}%` }} /></span>
                <small>{item.unlocked ? '已解锁' : `${item.progress} / ${item.target}`}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
