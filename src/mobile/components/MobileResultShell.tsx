import { Check, Clipboard, History, PencilLine, RefreshCw, RotateCcw, Share2, Undo2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'

import type { DecisionResult } from '../../types/decision'
import { MobileShareCardSheet } from './MobileShareCardSheet'

const MODE_LABELS = {
  random: '随机模式',
  scientific: '科学模式',
  mystic: '塔罗模式',
  ai: 'AI 模式',
} as const

interface MobileResultShellProps {
  result: DecisionResult
  children: React.ReactNode
  onRerun: () => void
  onReturnHome: () => void
  onChangeMode: () => void
  onEditOptions: () => void
  onRegret: () => void
  onCopy: () => Promise<void>
  renderShareCard: (result: DecisionResult) => Promise<Blob>
  saveShareCard: (base64: string) => Promise<{ uri: string; fileName: string }>
  shareShareCard: (base64: string) => Promise<{ chooserOpened: true }>
  onShareChooserOpened: () => void
  regretted: boolean
}

export function MobileResultShell({
  result,
  children,
  onRerun,
  onReturnHome,
  onChangeMode,
  onEditOptions,
  onRegret,
  onCopy,
  renderShareCard,
  saveShareCard,
  shareShareCard,
  onShareChooserOpened,
  regretted,
}: MobileResultShellProps): React.JSX.Element {
  const [regretRecorded, setRegretRecorded] = useState(regretted)
  const [copying, setCopying] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [status, setStatus] = useState('')
  const closeShareSheet = useCallback(() => setShareOpen(false), [])

  function recordRegret(): void {
    if (regretRecorded) return
    onRegret()
    setRegretRecorded(true)
    setStatus('反悔已记录，系统表示并不意外')
  }

  async function copyResult(): Promise<void> {
    setCopying(true)
    setStatus('')
    try {
      await onCopy()
      setStatus('结果已复制')
    } catch {
      setStatus('复制失败，请检查系统权限')
    } finally {
      setCopying(false)
    }
  }

  return (
    <section className={`mobile-result mobile-result--${result.mode}`}>
      <header className="mobile-result__heading">
        <span>{MODE_LABELS[result.mode]} · {new Date(result.createdAt).toLocaleDateString('zh-CN')}</span>
        <h1>决策结果</h1>
        <p>{result.question}</p>
      </header>

      <div className="mobile-result__content">{children}</div>

      <section className="mobile-result__after" aria-label="结果记录与分享">
        <div>
          <span>决定之后</span>
          <h2>接受安排，或者诚实反悔</h2>
        </div>
        <div className="mobile-result__after-grid">
          <button type="button" disabled={regretRecorded} onClick={recordRegret}>
            {regretRecorded ? <Check size={17} /> : <Undo2 size={17} />}
            {regretRecorded ? '已记录反悔' : '我后悔了'}
          </button>
          <button type="button" disabled={copying} onClick={() => void copyResult()}>
            <Clipboard size={17} />复制结果
          </button>
          <button type="button" disabled={copying} onClick={() => setShareOpen(true)}>
            <Share2 size={17} />分享结果卡
          </button>
        </div>
        <p aria-live="polite">{status}</p>
      </section>

      <div className="mobile-result__actions">
        <button className="is-primary" type="button" onClick={onRerun}>
          <RefreshCw size={18} />再来一次
        </button>
        <button type="button" onClick={onChangeMode}><RotateCcw size={18} />换一种模式</button>
        <button type="button" onClick={onEditOptions}><PencilLine size={18} />修改选项</button>
        <Link to="/history"><History size={18} />查看记录</Link>
        <button type="button" onClick={onReturnHome}>返回决策首页</button>
      </div>

      {shareOpen ? (
        <MobileShareCardSheet
          result={result}
          onClose={closeShareSheet}
          renderShareCard={renderShareCard}
          saveShareCard={saveShareCard}
          shareShareCard={shareShareCard}
          onShareChooserOpened={onShareChooserOpened}
        />
      ) : null}
    </section>
  )
}
