import { AlertCircle, ArrowLeft, Bot, CheckCircle2, LockKeyhole, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  AiDecisionError,
  createAiDecisionClient,
  type AiDecisionClient,
} from '../ai/aiDecisionClient'
import { useDecision } from '../state/DecisionContext'
import type { AiDecisionSuggestion } from '../types/decision'

interface AiPageProps {
  client?: AiDecisionClient
}

const ERROR_COPY = {
  not_configured: 'AI 服务尚未接入，当前不会生成任何演示答案。',
  network: 'AI 服务暂时无法连接，随机、科学和玄学模式仍可正常使用。',
  timeout: 'AI 思考时间过长，本次请求已安全停止。',
  invalid_response: 'AI 返回内容未通过格式检查，因此没有进入决策流程。',
} as const

export function AiPage({ client = createAiDecisionClient() }: AiPageProps): React.JSX.Element {
  const { state } = useDecision()
  const options = useMemo(
    () => state.options.filter((option) => option.label.trim()),
    [state.options],
  )
  const [requirements, setRequirements] = useState('')
  const [suggestion, setSuggestion] = useState<AiDecisionSuggestion | null>(null)
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (options.length < 2) {
    return (
      <main className="empty-state">
        <span className="empty-state__icon"><Bot size={24} /></span>
        <h1>AI 还没有可理解的选项</h1>
        <p>请先输入至少两个有效选项。</p>
        <Link className="secondary-action" to="/">返回首页</Link>
      </main>
    )
  }

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault()
    if (!client.isConfigured || !requirements.trim()) return
    setSubmitting(true)
    setStatus('')
    setSuggestion(null)
    try {
      const nextSuggestion = await client.analyze({
        question: state.question.trim() || '这次决定',
        options,
        requirements: requirements.trim(),
      })
      setSuggestion(nextSuggestion)
    } catch (error) {
      const code = error instanceof AiDecisionError ? error.code : 'network'
      setStatus(ERROR_COPY[code])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="ai-page">
      <Link className="back-button" to="/"><ArrowLeft size={17} />返回模式选择</Link>
      <header className="page-heading ai-heading">
        <span className="section-index">AI MODE / REQUIREMENT LAB</span>
        <h1>AI 需求实验室</h1>
        <p>AI 负责理解与解释，最终排序仍交给可复核的确定性算法。</p>
      </header>

      <div className="ai-layout">
        <form className="ai-requirement-card" onSubmit={(event) => void submit(event)}>
          <div className="ai-requirement-card__heading">
            <span><Bot size={22} /></span>
            <div><small>01 / CONTEXT</small><h2>{state.question.trim() || '这次决定'}</h2></div>
          </div>
          <div className="ai-option-summary">
            <span>候选项</span>
            <strong>{options.map((option) => option.label).join(' / ')}</strong>
          </div>
          <label className="ai-requirement-field" htmlFor="ai-requirements">
            <span>补充你的真实需求</span>
            <textarea
              id="ai-requirements"
              aria-label="补充你的真实需求"
              value={requirements}
              maxLength={500}
              placeholder="例如：预算 100 元，不想走太远，但今天特别想吃肉。"
              onChange={(event) => setRequirements(event.target.value)}
            />
            <small>{requirements.length} / 500</small>
          </label>
          <button
            className="primary-action"
            type="submit"
            disabled={!client.isConfigured || !requirements.trim() || submitting}
          >
            <Bot size={18} />
            <span>{client.isConfigured ? (submitting ? '正在理解需求' : '提取约束与指标') : '等待 API 接入'}</span>
          </button>
          <p className="ai-form-status" aria-live="polite">{status}</p>
        </form>

        <aside className="ai-status-card">
          <span className={`ai-status-card__icon${client.isConfigured ? ' is-ready' : ''}`}>
            {client.isConfigured ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
          </span>
          <small>SERVICE STATUS</small>
          <h2>{client.isConfigured ? 'AI 服务已配置' : 'AI 服务尚未接入'}</h2>
          <p>{client.isConfigured
            ? '需求只会发送到配置的 Serverless API。'
            : 'API 到手前，系统不会编造约束、指标或推荐结果。'}</p>
          <div><LockKeyhole size={17} /><span>浏览器不保存 API Key</span></div>
          <div><SlidersHorizontal size={17} /><span>最终排名由本地算法计算</span></div>
          <Link to="/">改用本地决策模式</Link>
        </aside>
      </div>

      <section className="ai-steps" aria-labelledby="ai-steps-title">
        <div><span className="section-index">PROCESS</span><h2 id="ai-steps-title">接入后的分析流程</h2></div>
        <ol>
          <li><strong>01</strong><span>提取限制条件</span></li>
          <li><strong>02</strong><span>建议评分指标</span></li>
          <li><strong>03</strong><span>由你确认修改</span></li>
          <li><strong>04</strong><span>本地算法完成排名</span></li>
        </ol>
      </section>

      {suggestion && (
        <section className="ai-suggestion" aria-labelledby="ai-suggestion-title">
          <span className="section-index">AI SUGGESTION / EDITABLE</span>
          <h2 id="ai-suggestion-title">需求理解结果</h2>
          <ul>{suggestion.constraints.map((constraint) => <li key={constraint}>{constraint}</li>)}</ul>
          <div>{suggestion.criteria.map((criterion) => (
            <label key={criterion.id}>
              <span>{criterion.reason}</span>
              <input defaultValue={criterion.name} aria-label={`${criterion.name}指标名称`} />
              <input defaultValue={criterion.weight} type="number" min="0" max="100" aria-label={`${criterion.name}权重`} />
            </label>
          ))}</div>
          <p>这里仍不是最终推荐；请先确认指标，再进入本地评分。</p>
        </section>
      )}
    </main>
  )
}
