import { ArrowLeft, History, PencilLine, RefreshCw, RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { DecisionResult } from '../../types/decision'

const MODE_LABELS = {
  random: '随机模式',
  scientific: '科学模式',
  mystic: '玄学模式',
} as const

interface ResultShellProps {
  result: DecisionResult
  children: React.ReactNode
  onRerun: () => void
  onReturnHome: () => void
}

export function ResultShell({
  result,
  children,
  onRerun,
  onReturnHome,
}: ResultShellProps): React.JSX.Element {
  return (
    <main className={`result-page result-page--${result.mode}`}>
      <div className="result-toolbar">
        <button className="back-button" type="button" onClick={onReturnHome}>
          <ArrowLeft size={17} />返回首页
        </button>
        <span>
          {MODE_LABELS[result.mode]} ·{' '}
          {new Date(result.createdAt).toLocaleString('zh-CN', { hour12: false })}
        </span>
      </div>

      <header className="page-heading result-heading">
        <span className="section-index">DECISION COMPLETE / MODE-SPECIFIC REPORT</span>
        <h1>决策结果</h1>
        <p>{result.question}</p>
      </header>

      {children}

      <div className="result-actions">
        <button className="primary-action" type="button" onClick={onRerun}>
          <RefreshCw size={18} /><span>再来一次</span>
        </button>
        <button className="secondary-action" type="button" onClick={onReturnHome}>
          <RotateCcw size={18} />换一种模式
        </button>
        <button className="secondary-action" type="button" onClick={onReturnHome}>
          <PencilLine size={18} />修改选项
        </button>
        <Link className="secondary-action" to="/history">
          <History size={18} />查看记录
        </Link>
      </div>
    </main>
  )
}
