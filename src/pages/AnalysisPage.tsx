import { Check, LoaderCircle, Orbit, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { createMysticResult, createRandomResult } from '../services/decisionEngine'
import { saveHistoryItem } from '../storage/history'
import { useDecision } from '../state/DecisionContext'
import type { DecisionResult } from '../types/decision'

const ANALYSIS_STEPS = [
  '校验候选项完整性',
  '建立决策参数',
  '计算后悔缓冲区',
  '生成最终建议',
]

export function AnalysisPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { state, dispatch } = useDecision()
  const preparedResult = useRef<DecisionResult | null>(state.result)

  if (!preparedResult.current && state.mode && state.mode !== 'scientific') {
    const options = state.options.filter((option) => option.label.trim())
    preparedResult.current =
      state.mode === 'mystic'
        ? createMysticResult({ question: state.question, options })
        : createRandomResult({ question: state.question, options })
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
    return (
      <main className="empty-state">
        <span className="empty-state__icon"><Orbit size={24} /></span>
        <h1>还没有可分析的决定</h1>
        <p>请先返回首页输入至少两个选项。</p>
        <button className="secondary-action" type="button" onClick={() => navigate('/')}>返回首页</button>
      </main>
    )
  }

  return (
    <main className="analysis-page">
      <motion.div
        className="analysis-console"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        <div className="analysis-console__mark"><Sparkles size={23} /></div>
        <span className="section-index">DECISION ENGINE / RUNNING</span>
        <h1>正在进行决策分析</h1>
        <p>请稍候，系统正在把你的纠结整理成一个看起来很确定的答案。</p>

        <div className="analysis-progress" aria-label="决策分析进度">
          <span />
        </div>

        <div className="analysis-steps">
          {ANALYSIS_STEPS.map((step, index) => (
            <div key={step}>
              <span className={index < 2 ? 'is-complete' : ''}>
                {index < 2 ? <Check size={14} /> : <LoaderCircle size={14} />}
              </span>
              <p>{step}</p>
              <small>{index < 2 ? 'DONE' : 'PROCESSING'}</small>
            </div>
          ))}
        </div>
      </motion.div>
    </main>
  )
}
