import { ChevronDown, ChevronUp, Clock3, Eye, Filter, RotateCcw, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useDecision } from '../state/DecisionContext'
import { clearHistory, deleteHistoryItem, readHistory } from '../storage/history'
import type { DecisionHistoryItem, DecisionMode } from '../types/decision'

const MODE_LABELS = { random: '随机', scientific: '科学', mystic: '玄学', ai: 'AI' } as const

function tarotSummary(item: DecisionHistoryItem): string | undefined {
  const tarot = item.details?.type === 'mystic' ? item.details.tarot : undefined
  if (!tarot) return undefined
  return `抽到：${tarot.chineseName} · ${tarot.orientation === 'upright' ? '正位' : '逆位'}`
}

export function HistoryPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { dispatch } = useDecision()
  const [history, setHistory] = useState<DecisionHistoryItem[]>(() => readHistory())
  const [filter, setFilter] = useState<'all' | DecisionMode>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const visibleItems = useMemo(
    () => filter === 'all' ? history : history.filter((item) => item.mode === filter),
    [filter, history],
  )

  function remove(id: string): void {
    deleteHistoryItem(id)
    setHistory(readHistory())
  }

  function clearAll(): void {
    if (!window.confirm('确定清空全部本地决策记录吗？')) return
    clearHistory()
    setHistory([])
  }

  function reuse(item: DecisionHistoryItem): void {
    dispatch({
      type: 'restore-draft',
      draft: {
        question: item.question,
        options: item.options,
        mode: item.mode,
      },
    })
    navigate('/')
  }

  function openResult(item: DecisionHistoryItem): void {
    dispatch({ type: 'set-result', result: item })
    navigate('/result')
  }

  return (
    <main className="history-page">
      <header className="page-heading page-heading--split">
        <div><span className="section-index">LOCAL ARCHIVE / LAST 50</span><h1>决策记录</h1><p>所有记录只保存在当前浏览器中，不会上传到服务器。</p></div>
        <div className="history-count"><span>累计保存</span><strong>{history.length}</strong><small>次决定</small></div>
      </header>

      <div className="history-toolbar">
        <label><Filter size={16} /><span>筛选模式</span><select value={filter} onChange={(event) => setFilter(event.target.value as 'all' | DecisionMode)}><option value="all">全部模式</option><option value="random">随机模式</option><option value="scientific">科学模式</option><option value="mystic">玄学模式</option><option value="ai">AI 模式</option></select></label>
        <button className="text-button text-button--danger" type="button" disabled={!history.length} onClick={clearAll}><Trash2 size={16} />清空记录</button>
      </div>

      {visibleItems.length ? (
        <div className="history-list">
          {visibleItems.map((item, index) => {
            const expanded = expandedId === item.id
            const tarot = tarotSummary(item)
            return (
              <article className={`history-item${expanded ? ' is-expanded' : ''}`} key={item.id}>
                <span className={`history-item__mode history-item__mode--${item.mode}`}>{MODE_LABELS[item.mode]}</span>
                <div className="history-item__copy">
                  <small>NO. {String(history.length - index).padStart(3, '0')}</small>
                  <h2>{item.question}</h2>
                  <p>{item.options.map((option) => option.label).join(' / ')}</p>
                  {tarot && <p className="history-item__tarot">{tarot}</p>}
                </div>
                <div className="history-item__result">
                  <span>{tarot ? '本轮指向' : '系统选择'}</span>
                  <strong>{item.winner.label}</strong>
                  <small>{new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false })}</small>
                </div>
                <div className="history-item__controls">
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={`${expanded ? '收起详情' : '查看详情'} ${item.question}`}
                    aria-expanded={expanded}
                    onClick={() => setExpandedId(expanded ? null : item.id)}
                  >
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <button className="icon-button" type="button" aria-label={`删除记录 ${item.question}`} onClick={() => remove(item.id)}><Trash2 size={16} /></button>
                </div>
                {expanded && (
                  <div className="history-item__details">
                    <div>
                      <span>系统解释</span>
                      <p>{item.explanation}</p>
                    </div>
                    <div className="history-item__meta">
                      <span>{item.regrettedAt ? '已记录反悔' : '尚未反悔'}</span>
                      <span>分享 {item.shareCount} 次</span>
                    </div>
                    <button className="secondary-action" type="button" onClick={() => openResult(item)}>
                      <Eye size={16} />查看结果
                    </button>
                    <button className="secondary-action" type="button" onClick={() => reuse(item)}>
                      <RotateCcw size={16} />再次使用
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      ) : (
        <div className="empty-state empty-state--embedded"><span className="empty-state__icon"><Clock3 size={24} /></span><h2>{history.length ? '没有符合筛选条件的记录' : '还没有决策记录'}</h2><p>完成第一次决定后，系统会把结果保存在这里。</p><Link className="secondary-action" to="/">开始一次决定</Link></div>
      )}
    </main>
  )
}
