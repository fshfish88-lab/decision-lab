import { BarChart3, Bot, Check, Dices, LoaderCircle, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'

import type { DecisionMode } from '../../types/decision'

interface MobileAnalysisViewProps {
  mode: DecisionMode
  title: string
  description: string
  steps: readonly string[]
  conclusion: string
  visual?: ReactNode
  completedSteps?: number
}

export function MobileAnalysisView({
  mode,
  title,
  description,
  steps,
  conclusion,
  visual,
  completedSteps = 2,
}: MobileAnalysisViewProps): React.JSX.Element {
  const MarkIcon = mode === 'random'
    ? Dices
    : mode === 'scientific'
      ? BarChart3
      : mode === 'mystic'
        ? Sparkles
        : Bot

  return (
    <section className={`mobile-analysis mobile-analysis--${mode}`}>
      <div className="mobile-analysis__mark"><MarkIcon size={26} aria-hidden="true" /></div>
      <header>
        <span>DECISION LAB 正在工作</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      {visual}
      <div
        className="mobile-analysis__progress"
        role="progressbar"
        aria-label="决策分析进度"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext="正在准备决策结果"
      >
        <span />
      </div>
      <div className="mobile-analysis__steps">
        {steps.map((step, index) => (
          <div key={step}>
            <span>{index < completedSteps ? <Check size={14} /> : <LoaderCircle size={14} />}</span>
            <p>{step}</p>
            <small>{index < completedSteps ? '已完成' : '处理中'}</small>
          </div>
        ))}
      </div>
      <p className="mobile-analysis__conclusion">{conclusion}</p>
    </section>
  )
}
