import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Compass,
  GitFork,
  ListChecks,
  RefreshCw,
  Scale,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import { useState } from 'react'

import {
  AiApiError,
  createAiApiClient,
  type AiApiClient,
  type AiApiErrorCode,
} from '../../ai/aiApiClient'
import { buildDeepAnalysisContent } from '../../ai/aiPromptBuilders'
import { usePlatform } from '../../platform/PlatformContext'
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

interface AnalysisCardProps {
  title: string
  items: string[]
  icon: React.ComponentType<{ size?: number }>
  className?: string
  ordered?: boolean
}

function AnalysisCard({ title, items, icon: Icon, className = '', ordered = false }: AnalysisCardProps): React.JSX.Element {
  const List = ordered ? 'ol' : 'ul'
  return (
    <article className={`ai-analysis-card ${className}`.trim()}>
      <span className="ai-analysis-card__icon"><Icon size={18} /></span>
      <h3>{title}</h3>
      {items.length ? (
        <List className={ordered ? 'ai-analysis-steps' : 'ai-analysis-list'}>
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>
              {ordered ? <span>{String(index + 1).padStart(2, '0')}</span> : null}
              {item}
            </li>
          ))}
        </List>
      ) : (
        <p>这一项暂时没有补充。AI 偶尔也懂得少说两句。</p>
      )}
    </article>
  )
}

function SummaryCard({ title, overview, chips }: { title: string; overview: string; chips: string[] }): React.JSX.Element {
  return (
    <article className="ai-analysis-summary">
      <span className="ai-analysis-card__icon"><Sparkles size={19} /></span>
      <div>
        <h3>{title}</h3>
        <p>{overview}</p>
        <div className="ai-analysis-chips">
          {chips.map((chip) => <span key={chip}>{chip}</span>)}
        </div>
      </div>
    </article>
  )
}

function RandomAiAnalysisView({ analysis, result }: { analysis: AiDeepAnalysisData; result: DecisionResult }): React.JSX.Element {
  return (
    <div className="ai-analysis-view ai-analysis-view--random">
      <SummaryCard title="本轮结论" overview={analysis.overview} chips={['随机结果', result.winner.label, '现实检查']} />
      <div className="ai-analysis-grid">
        <AnalysisCard title="能不能执行" items={analysis.key_factors} icon={CheckCircle2} />
        <AnalysisCard title="最省事的执行方式" items={analysis.scenarios} icon={ArrowRight} />
        <AnalysisCard title="你可能为什么反悔" items={analysis.hidden_conflicts} icon={RefreshCw} />
        <AnalysisCard title="什么时候可以放弃" items={analysis.risks} icon={TriangleAlert} />
        <AnalysisCard title="现在怎么做" items={analysis.next_steps} icon={ListChecks} className="ai-analysis-card--wide ai-analysis-card--action" ordered />
      </div>
    </div>
  )
}

function ScientificAiAnalysisView({ analysis, result }: { analysis: AiDeepAnalysisData; result: DecisionResult }): React.JSX.Element {
  const first = result.ranking?.[0]
  const second = result.ranking?.[1]
  const lead = first && second ? Math.max(0, first.score - second.score) : null
  const sensitivity = lead === null ? '待检查' : lead <= 0.35 ? '高度敏感' : lead <= 0.75 ? '轻度敏感' : '相对稳健'
  const criteria = result.details?.type === 'scientific' ? result.details.criteria : []
  const dominant = [...criteria].sort((left, right) => right.weight - left.weight)[0]

  return (
    <div className="ai-analysis-view ai-analysis-view--scientific">
      <SummaryCard
        title="模型结论"
        overview={analysis.overview}
        chips={[`第一名 ${result.winner.label}`, lead === null ? '分差待检查' : `领先 ${lead.toFixed(2)}`, sensitivity]}
      />
      <div className="ai-analysis-grid">
        <AnalysisCard title="胜出驱动力" items={analysis.key_factors} icon={BrainCircuit} />
        <article className="ai-analysis-card ai-analysis-card--metric">
          <span className="ai-analysis-card__icon"><Scale size={18} /></span>
          <h3>领先优势</h3>
          {first && second ? (
            <div className="ai-analysis-metrics">
              <p><span>{first.label}</span><strong>{first.score.toFixed(2)}</strong></p>
              <p><span>{second.label}</span><strong>{second.score.toFixed(2)}</strong></p>
              <p className="is-lead"><span>当前分差</span><strong>{lead?.toFixed(2)}</strong></p>
            </div>
          ) : <p>旧记录未保留完整排名，无法计算分差。</p>}
        </article>
        <article className="ai-analysis-card">
          <span className="ai-analysis-card__icon"><GitFork size={18} /></span>
          <h3>权重集中度</h3>
          {dominant ? <p className="ai-analysis-callout"><strong>{dominant.name} {dominant.weight}%</strong> 是当前权重最高的指标。</p> : null}
          {analysis.hidden_conflicts.length ? <ul className="ai-analysis-list">{analysis.hidden_conflicts.map((item) => <li key={item}>{item}</li>)}</ul> : null}
        </article>
        <AnalysisCard title="翻转敏感性" items={analysis.scenarios} icon={RefreshCw} />
        <AnalysisCard title="模型外因素" items={analysis.risks} icon={ShieldAlert} className="ai-analysis-card--wide" />
        <AnalysisCard title="当前建议" items={analysis.next_steps} icon={ListChecks} className="ai-analysis-card--wide ai-analysis-card--action" ordered />
      </div>
    </div>
  )
}

function TarotAiAnalysisView({ analysis, result }: { analysis: AiDeepAnalysisData; result: DecisionResult }): React.JSX.Element {
  const tarot = result.details?.type === 'mystic' ? result.details.tarot : undefined
  const cardLabel = tarot ? `${tarot.chineseName} · ${tarot.orientation === 'upright' ? '正位' : '逆位'}` : '旧版玄学记录'

  return (
    <div className="ai-analysis-view ai-analysis-view--mystic">
      <SummaryCard title="这张牌在说什么" overview={analysis.overview} chips={[cardLabel, result.winner.label, '象征性解读']} />
      <div className="ai-analysis-grid">
        <AnalysisCard title="当前决策倾向" items={analysis.key_factors} icon={Compass} />
        <AnalysisCard title={`为什么会指向${result.winner.label}`} items={analysis.hidden_conflicts} icon={ArrowRight} />
        <AnalysisCard title="阴影提醒" items={analysis.risks} icon={TriangleAlert} className="ai-analysis-card--wide ai-analysis-card--warning" />
        <AnalysisCard title="可以听牌" items={analysis.scenarios} icon={CheckCircle2} />
        <AnalysisCard title="应该忽略牌" items={analysis.next_steps} icon={ShieldAlert} />
      </div>
      <p className="ai-analysis-disclaimer">娱乐性象征 · 最终决定权仍属于你</p>
    </div>
  )
}

function panelCopy(result: DecisionResult): { eyebrow: string; title: string; description: string } {
  if (result.mode === 'scientific') {
    return { eyebrow: 'AI MODEL REVIEW / SCIENTIFIC', title: 'AI 模型体检', description: '不重新评分，只检查这个结果到底稳不稳。' }
  }
  if (result.mode === 'mystic') {
    return { eyebrow: 'AI SECOND READING / TAROT', title: 'AI 二次解读', description: '不重新抽牌，只把这张牌翻译成现实语言。' }
  }
  return { eyebrow: 'AI REALITY CHECK / RANDOM', title: 'AI 随机结果检查', description: '随机只负责替你停止纠结，不负责证明它更好。' }
}

export function AiDeepAnalysisPanel({ result, client = createAiApiClient() }: AiDeepAnalysisPanelProps): React.JSX.Element {
  const platform = usePlatform()
  const [analysis, setAnalysis] = useState<AiDeepAnalysisData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState('')
  const copy = panelCopy(result)

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
    <section className={`ai-deep-analysis ai-deep-analysis--${result.mode}${platform === 'app' ? ' mobile-ai-deep-analysis' : ''}`} role={analysis ? 'region' : undefined} aria-label={analysis ? 'AI 深度分析结果' : undefined}>
      <div className="ai-deep-analysis__heading">
        <div>
          <span className="section-index">{copy.eyebrow}</span>
          <h2>{copy.title}</h2>
          <p>{copy.description}</p>
        </div>
        <button className="secondary-action" type="button" disabled={submitting} onClick={() => void analyze()}>
          <Sparkles size={18} />
          {submitting ? '正在分析你的纠结' : analysis ? '重新分析' : 'AI 深度分析'}
        </button>
      </div>
      <p className="ai-form-status" aria-live="polite">{status}</p>
      {analysis && result.mode === 'random' ? <RandomAiAnalysisView analysis={analysis} result={result} /> : null}
      {analysis && result.mode === 'scientific' ? <ScientificAiAnalysisView analysis={analysis} result={result} /> : null}
      {analysis && result.mode === 'mystic' ? <TarotAiAnalysisView analysis={analysis} result={result} /> : null}
    </section>
  )
}
