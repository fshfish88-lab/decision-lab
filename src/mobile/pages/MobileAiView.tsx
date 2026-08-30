import { Bot, BrainCircuit, LockKeyhole, Sparkles, Wifi, WifiOff } from 'lucide-react'

interface MobileAiViewProps {
  question: string
  optionSummary: string
  context: string
  status: string
  submitting: boolean
  thinkingLabel: string
  online: boolean
  onContextChange: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

export function MobileAiView({
  question,
  optionSummary,
  context,
  status,
  submitting,
  thinkingLabel,
  online,
  onContextChange,
  onSubmit,
}: MobileAiViewProps): React.JSX.Element {
  return (
    <section className="mobile-ai">
      <header className="mobile-flow-heading">
        <span>AI 决策顾问</span>
        <h1>把真实情况说清楚</h1>
        <p>AI 会直接给建议，但不会假装拥有宇宙唯一真理。</p>
      </header>

      <div className={`mobile-ai__network${online ? ' is-online' : ' is-offline'}`} role="status">
        {online ? <Wifi size={18} aria-hidden="true" /> : <WifiOff size={18} aria-hidden="true" />}
        <div>
          <strong>{online ? '服务在线' : '当前离线'}</strong>
          <span>{online ? '可以发送本次决策背景' : 'AI 需要联网，本地决策模式仍可正常使用'}</span>
        </div>
      </div>

      <form className="mobile-ai__form" onSubmit={onSubmit}>
        <div className="mobile-ai__summary">
          <span><Bot size={19} aria-hidden="true" /></span>
          <div>
            <small>本次问题</small>
            <h2>{question.trim() || '这次决定'}</h2>
            <p>{optionSummary}</p>
          </div>
        </div>
        <label className="mobile-ai__field" htmlFor="mobile-ai-context">
          <span>补充你的真实情况</span>
          <textarea
            id="mobile-ai-context"
            aria-label="补充你的真实情况"
            value={context}
            maxLength={500}
            disabled={submitting}
            placeholder="例如：预算 100 元，今天很累，不想走太远。"
            onChange={(event) => onContextChange(event.target.value)}
          />
          <small>{context.length} / 500</small>
        </label>
        <div className="mobile-ai__privacy">
          <LockKeyhole size={16} aria-hidden="true" />
          <span>浏览器不保存 API Key；结果仅保存于当前设备。</span>
        </div>
        {status ? <p className="mobile-form-error" aria-live="polite">{status}</p> : null}
        <button
          className="mobile-ai__submit"
          type="submit"
          disabled={!context.trim() || submitting || !online}
        >
          {submitting ? <BrainCircuit size={18} aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}
          {submitting ? thinkingLabel : '让 AI 替我决定'}
        </button>
      </form>
    </section>
  )
}
