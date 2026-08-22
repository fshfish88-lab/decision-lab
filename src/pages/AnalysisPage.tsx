import { BarChart3, Check, Dices, LoaderCircle, Orbit, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { createRandomResult } from '../services/decisionEngine'
import { saveHistoryItem } from '../storage/history'
import { useDecision } from '../state/DecisionContext'
import type { DecisionMode, DecisionResult } from '../types/decision'

const ANALYSIS_CONFIG: Record<DecisionMode, {
  eyebrow: string
  title: string
  description: string
  steps: readonly string[]
  conclusion: string
}> = {
  random: {
    eyebrow: 'RANDOM MODE / SHUFFLING',
    title: '正在启动命运抽签',
    description: '没有偏好，没有暗箱，只有一次诚实的等概率落点。',
    steps: ['正在洗牌候选项', '正在生成随机指纹', '正在排除人为干预', '正在确认命运落点'],
    conclusion: '命运确认。',
  },
  scientific: {
    eyebrow: 'SCIENTIFIC MODE / CALCULATING',
    title: '正在进行科学计算',
    description: '评分、权重与排名都将按照本次输入真实计算。',
    steps: ['正在校验评分矩阵', '正在应用指标权重', '正在计算综合得分', '正在生成完整排名'],
    conclusion: '计算完成。',
  },
  mystic: {
    eyebrow: 'MYSTIC MODE / CONNECTING',
    title: '正在连接命运频道',
    description: '水晶球正在工作，科学部门已暂时离开现场。',
    steps: ['正在校准宇宙频率', '正在读取潜意识波动', '正在搜索平行时间线', '水晶球连接稳定'],
    conclusion: '天机已泄露。',
  },
}

function AnalysisVisual({ mode }: { mode: DecisionMode }): React.JSX.Element {
  if (mode === 'random') {
    return (
      <div className="analysis-mode-visual analysis-mode-visual--random" aria-hidden="true">
        <i className="analysis-shuffle-card" />
        <i className="analysis-shuffle-card" />
        <i className="analysis-shuffle-card" />
      </div>
    )
  }

  if (mode === 'scientific') {
    return (
      <div className="analysis-mode-visual analysis-mode-visual--scientific" aria-hidden="true">
        <i className="analysis-data-bar" />
        <i className="analysis-data-bar" />
        <i className="analysis-data-bar" />
      </div>
    )
  }

  return (
    <div className="analysis-mode-visual analysis-mode-visual--mystic" aria-hidden="true">
      <span className="analysis-orbit-core" />
      <i className="analysis-orbit-dot" />
      <i className="analysis-orbit-dot" />
      <i className="analysis-orbit-dot" />
    </div>
  )
}

export function AnalysisPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { state, dispatch } = useDecision()
  const preparedResult = useRef<DecisionResult | null>(state.result)

  if (!preparedResult.current && state.mode === 'random') {
    const options = state.options.filter((option) => option.label.trim())
    preparedResult.current = createRandomResult({ question: state.question, options })
  }

  useEffect(() => {
    const result = preparedResult.current
    if (!result) return

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(
      () => {
        dispatch({ type: 'set-result', result })
        saveHistoryItem(result)
        navigate('/result', { replace: true })
      },
      reducedMotion ? 250 : 2000,
    )

    return () => window.clearTimeout(timer)
  }, [dispatch, navigate])

  if (!preparedResult.current) {
    if (state.mode === 'mystic') {
      return (
        <main className="empty-state">
          <span className="empty-state__icon"><Orbit size={24} /></span>
          <h1>玄学模式需要你亲手抽牌</h1>
          <p>答案不会在你看到牌阵之前生成。</p>
          <button className="secondary-action" type="button" onClick={() => navigate('/tarot')}>进入塔罗牌阵</button>
        </main>
      )
    }

    return (
      <main className="empty-state">
        <span className="empty-state__icon"><Orbit size={24} /></span>
        <h1>还没有可分析的决定</h1>
        <p>请先返回首页输入至少两个选项。</p>
        <button className="secondary-action" type="button" onClick={() => navigate('/')}>返回首页</button>
      </main>
    )
  }

  const mode = preparedResult.current.mode
  const config = ANALYSIS_CONFIG[mode]
  const MarkIcon = mode === 'random' ? Dices : mode === 'scientific' ? BarChart3 : Sparkles

  return (
    <main className="analysis-page">
      <motion.div
        className={`analysis-console analysis-console--${mode}`}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        <div className="analysis-console__mark"><MarkIcon size={23} /></div>
        <span className="section-index">{config.eyebrow}</span>
        <h1>{config.title}</h1>
        <p>{config.description}</p>

        <AnalysisVisual mode={mode} />

        <div className="analysis-progress" aria-label="决策分析进度">
          <span />
        </div>

        <div className="analysis-steps">
          {config.steps.map((step, index) => (
            <div key={step}>
              <span className={index < 2 ? 'is-complete' : ''}>
                {index < 2 ? <Check size={14} /> : <LoaderCircle size={14} />}
              </span>
              <p>{step}</p>
              <small>{index < 2 ? 'DONE' : 'PROCESSING'}</small>
            </div>
          ))}
        </div>
        <p className="analysis-conclusion">{config.conclusion}</p>
      </motion.div>
    </main>
  )
}
