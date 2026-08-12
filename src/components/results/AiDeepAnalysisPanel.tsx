import {
  BrainCircuit,
  Compass,
  GitFork,
  ListChecks,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'

import {
  AiApiError,
  createAiApiClient,
  type AiApiClient,
  type AiApiErrorCode,
} from '../../ai/aiApiClient'
import { buildDeepAnalysisContent } from '../../ai/aiPromptBuilders'
import type { AiDeepAnalysisData, DecisionResult } from '../../types/decision'

const ERROR_COPY: Record<AiApiErrorCode, string> = {
  network: 'AI 服务暂时无法连接，原来的决策结果仍然有效。',
  timeout: 'AI 思考得有点久，本次分析已安全停止，可以重试。',
  rate_limited: '请求有点太密集，请稍后再试。',
  invalid_response: 'AI 返回内容未通过格式检查，系统没有擅自展示。',
}

interface AiDeepAnalysisPanelProps {
  result: DecisionResult
  client?: AiApiClient
}

const PANEL_SECTIONS = [
  { key: 'key_factors', title: '关键因素', icon: BrainCircuit },
  { key: 'risks', title: '现实风险', icon: ShieldAlert },
  { key: 'hidden_conflicts', title: '隐藏冲突', icon: GitFork },
  { key: 'scenarios', title: '可能情景', icon: Compass },
  { key: 'next_steps', title: '下一步建议', icon: ListChecks },
] as const

export function AiDeepAnalysisPanel({
  result,
  client = createAiApiClient(),
}: AiDeepAnalysisPanelProps): React.JSX.Element {
  const [analysis, setAnalysis] = useState<AiDeepAnalysisData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState('')

  async function analyze(): Promise<void> {
    if (submitting) return
    setSubmitting(true)
    setStatus('')
    try {
      setAnalysis(await client.deepAnalyze(buildDeepAnalysisContent(result)))
    } catch (error) {
      const code = error instanceof AiApiError ? error.code : 'network'
      setStatus(ERROR_COPY[code])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={'ai-deep-analysis ai-deep-analysis--' + result.mode}>
      <div className="ai-deep-analysis__heading">
        <div>
          <span className="section-index">AI LAYER / OPTIONAL</span>
          <h2>AI 深度分析</h2>
          <p>原结果不会改变，AI 只负责把现实问题说得更明白一点。</p>
        </div>
        <button
          className="secondary-action"
          type="button"
          disabled={submitting}
          onClick={() => void analyze()}
        >
          <Sparkles size={18} />
          {submitting ? '正在分析你的纠结' : analysis ? '重新分析' : 'AI 深度分析'}
        </button>
      </div>

      <p className="ai-form-status" aria-live="polite">{status}</p>

      {analysis ? (
        <div
          className="ai-deep-analysis__grid"
          role="region"
          aria-label="AI 深度分析结果"
        >
          <article className="ai-deep-analysis__overview">
            <span><Sparkles size={19} /></span>
            <h3>AI 分析总览</h3>
            <p>{analysis.overview}</p>
          </article>
          {PANEL_SECTIONS.map(({ key, title, icon: Icon }) => (
            <article key={key}>
              <span><Icon size={18} /></span>
              <h3>{title}</h3>
              {analysis[key].length ? (
                <ul>
                  {analysis[key].map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : (
                <p>这一项暂时没有补充。AI 偶尔也懂得少说两句。</p>
              )}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
