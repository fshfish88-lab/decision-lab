import {
  ArrowLeft,
  Bot,
  BrainCircuit,
  CheckCircle2,
  LockKeyhole,
  Sparkles,
  WifiOff,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import {
  AiApiError,
  createAiApiClient,
  type AiApiClient,
  type AiApiErrorCode,
} from '../ai/aiApiClient'
import { buildDirectDecisionContent } from '../ai/aiPromptBuilders'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { MobileAiView } from '../mobile/pages/MobileAiView'
import { usePlatform } from '../platform/PlatformContext'
import { createAiResult } from '../services/decisionEngine'
import { useDecision } from '../state/DecisionContext'
import { saveHistoryItem } from '../storage/history'

interface AiPageProps {
  client?: AiApiClient
}

const ERROR_COPY: Record<AiApiErrorCode, string> = {
  network: 'AI 服务暂时无法连接，随机、科学和玄学模式仍可正常使用。',
  timeout: 'AI 思考得有点久，本次请求已安全停止，可以重试。',
  rate_limited: '请求有点太密集，请稍后再试。',
  invalid_response: 'AI 没有按规则选择现有方案，本次结果没有保存。',
}

const THINKING_STEPS = [
  '正在理解你的纠结',
  '正在比较候选方案',
  '正在评估你可能后悔的地方',
  'AI 似乎已经有主意了',
] as const

export function AiPage({ client = createAiApiClient() }: AiPageProps): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const platform = usePlatform()
  const online = useOnlineStatus()
  const { state, dispatch } = useDecision()
  const options = useMemo(
    () => state.options.filter((option) => option.label.trim()),
    [state.options],
  )
  const [context, setContext] = useState(state.aiContext)
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [thinkingIndex, setThinkingIndex] = useState(0)
  const requestRef = useRef<AbortController | null>(null)

  // Cancel on route changes as well as unmount so old responses cannot navigate.
  useLayoutEffect(() => () => {
    requestRef.current?.abort()
    requestRef.current = null
  }, [location.key])

  useEffect(() => {
    if (!submitting) {
      setThinkingIndex(0)
      return
    }
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    if (reducedMotion) return
    const timer = window.setInterval(() => {
      setThinkingIndex((current) => (current + 1) % THINKING_STEPS.length)
    }, 1400)
    return () => window.clearInterval(timer)
  }, [submitting])

  if (options.length < 2) {
    const EmptyStateElement = platform === 'app' ? 'section' : 'main'
    return (
      <EmptyStateElement className={platform === 'app' ? 'mobile-empty-state' : 'empty-state'}>
        <span className="empty-state__icon"><Bot size={24} /></span>
        <h1>AI 还没有可理解的选项</h1>
        <p>请先输入至少两个有效选项。</p>
        <Link className="secondary-action" to="/">返回首页</Link>
      </EmptyStateElement>
    )
  }

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault()
    if (requestRef.current || submitting || !context.trim() || !online) return
    const controller = new AbortController()
    requestRef.current = controller
    setSubmitting(true)
    setStatus('')
    try {
      const advice = await client.decide(buildDirectDecisionContent({
        question: state.question,
        options,
        context,
      }), controller.signal)
      if (controller.signal.aborted || requestRef.current !== controller) return
      const result = createAiResult({
        question: state.question,
        options,
        context,
        advice,
      })
      dispatch({ type: 'set-result', result })
      saveHistoryItem(result)
      navigate('/result')
    } catch (error) {
      if (controller.signal.aborted || requestRef.current !== controller) return
      const code = error instanceof AiApiError
        ? error.code
        : error instanceof Error && error.message === 'AI 推荐项无法映射到候选项'
          ? 'invalid_response'
          : 'network'
      setStatus(ERROR_COPY[code])
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null
        setSubmitting(false)
      }
    }
  }

  if (platform === 'app') {
    return (
      <MobileAiView
        question={state.question}
        optionSummary={options.map((option) => option.label).join(' / ')}
        context={context}
        status={status}
        submitting={submitting}
        thinkingLabel={THINKING_STEPS[thinkingIndex]}
        online={online}
        onContextChange={setContext}
        onSubmit={(event) => void submit(event)}
      />
    )
  }

  return (
    <main className="ai-page">
      <Link className="back-button" to="/"><ArrowLeft size={17} />返回模式选择</Link>
      <header className="page-heading ai-heading">
        <span className="section-index">AI MODE / DIRECT ADVICE</span>
        <h1>AI 决策顾问</h1>
        <p>把真实情况说清楚，剩下的让 AI 直接拍板。至少这次不用再开一场内心听证会。</p>
      </header>

      <div className="ai-layout">
        <form className="ai-requirement-card" onSubmit={(event) => void submit(event)}>
          <div className="ai-requirement-card__heading">
            <span><Bot size={22} /></span>
            <div>
              <small>01 / DECISION CONTEXT</small>
              <h2>{state.question.trim() || '这次决定'}</h2>
            </div>
          </div>
          <div className="ai-option-summary">
            <span>候选项</span>
            <strong>{options.map((option) => option.label).join(' / ')}</strong>
          </div>
          <label className="ai-requirement-field" htmlFor="ai-context">
            <span>补充你的真实情况</span>
            <textarea
              id="ai-context"
              aria-label="补充你的真实情况"
              value={context}
              maxLength={500}
              disabled={submitting}
              placeholder="例如：预算 100 元，今天很累，不想走太远，但特别想吃肉。"
              onChange={(event) => setContext(event.target.value)}
            />
            <small>{context.length} / 500</small>
          </label>
          <button
            className="primary-action"
            type="submit"
            disabled={!context.trim() || submitting || !online}
          >
            {submitting ? <BrainCircuit size={18} /> : <Sparkles size={18} />}
            <span>{submitting ? THINKING_STEPS[thinkingIndex] : '让 AI 替我决定'}</span>
          </button>
          {submitting ? (
            <div className="ai-thinking-console" role="status">
              <BrainCircuit size={17} />
              <span>{THINKING_STEPS[thinkingIndex]}</span>
              <i aria-hidden="true"><b /><b /><b /></i>
            </div>
          ) : (
            <p className="ai-form-status" aria-live="polite">{online ? status : '当前离线，AI 需要联网。本地决策模式仍可正常使用。'}</p>
          )}
        </form>

        <aside className="ai-status-card">
          <span className={`ai-status-card__icon${online ? ' is-ready' : ''}`}>{online ? <CheckCircle2 size={22} /> : <WifiOff size={22} />}</span>
          <small>NETWORK STATUS</small>
          <h2>{online ? '网络已连接' : '当前离线'}</h2>
          <p>{online ? '可以尝试发送请求，AI 服务是否可用以请求结果为准。' : '联网后可以继续提交，已填写的背景会保留。'}</p>
          <div><LockKeyhole size={17} /><span>浏览器不保存 API Key</span></div>
          <div><Bot size={17} /><span>结果保存于当前浏览器</span></div>
          <Link to="/">改用本地决策模式</Link>
        </aside>
      </div>
    </main>
  )
}
