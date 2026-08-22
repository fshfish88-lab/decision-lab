import { ArrowLeft, Check, Clipboard, Download, History, PencilLine, RefreshCw, RotateCcw, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import type { DecisionResult } from '../../types/decision'

const MODE_LABELS = {
  random: '随机模式',
  scientific: '科学模式',
  mystic: '玄学模式',
  ai: 'AI 模式',
} as const

interface ResultShellProps {
  result: DecisionResult
  children: React.ReactNode
  onRerun: () => void
  onReturnHome: () => void
  onChangeMode: () => void
  onEditOptions: () => void
  onRegret: () => void
  onCopy: () => Promise<void>
  onDownload: () => Promise<void>
  regretted: boolean
}

export function ResultShell({
  result,
  children,
  onRerun,
  onReturnHome,
  onChangeMode,
  onEditOptions,
  onRegret,
  onCopy,
  onDownload,
  regretted,
}: ResultShellProps): React.JSX.Element {
  const [regretRecorded, setRegretRecorded] = useState(regretted)
  const [busyAction, setBusyAction] = useState<'copy' | 'download' | null>(null)
  const [status, setStatus] = useState('')

  function recordRegret(): void {
    if (regretRecorded) return
    onRegret()
    setRegretRecorded(true)
    setStatus('反悔已记录，系统表示并不意外')
  }

  async function runShareAction(kind: 'copy' | 'download'): Promise<void> {
    setBusyAction(kind)
    setStatus('')
    try {
      if (kind === 'copy') {
        await onCopy()
        setStatus('结果已复制')
      } else {
        await onDownload()
        setStatus('分享卡已下载')
      }
    } catch {
      setStatus(kind === 'copy' ? '复制失败，请检查浏览器权限' : '分享卡生成失败，请稍后重试')
    } finally {
      setBusyAction(null)
    }
  }

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

      <section className="result-share-actions" aria-label="结果记录与分享">
        <div>
          <span className="section-index">V1.5 / AFTER DECISION</span>
          <h2>决定之后</h2>
          <p>接受系统安排，或者诚实地承认你还是后悔了。</p>
        </div>
        <div className="result-share-actions__buttons">
          <button className="secondary-action" type="button" disabled={regretRecorded} onClick={recordRegret}>
            {regretRecorded ? <Check size={18} /> : <Undo2 size={18} />}
            {regretRecorded ? '已记录反悔' : '我后悔了'}
          </button>
          <button className="secondary-action" type="button" disabled={busyAction !== null} onClick={() => void runShareAction('copy')}>
            <Clipboard size={18} />复制结果
          </button>
          <button className="secondary-action" type="button" disabled={busyAction !== null} onClick={() => void runShareAction('download')}>
            <Download size={18} />下载分享卡
          </button>
        </div>
        <p className="result-status" aria-live="polite">{status}</p>
      </section>

      <div className="result-actions">
        <button className="primary-action" type="button" onClick={onRerun}>
          <RefreshCw size={18} /><span>再来一次</span>
        </button>
        <button className="secondary-action" type="button" onClick={onChangeMode}>
          <RotateCcw size={18} />换一种模式
        </button>
        <button className="secondary-action" type="button" onClick={onEditOptions}>
          <PencilLine size={18} />修改选项
        </button>
        <Link className="secondary-action" to="/history">
          <History size={18} />查看记录
        </Link>
      </div>
    </main>
  )
}
