import { ArrowRight, BarChart3, Bot, Dices, Orbit } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { DecisionMachine } from '../components/DecisionMachine'
import { ModeCard } from '../components/ModeCard'
import { OptionEditor } from '../components/OptionEditor'
import { useDecision } from '../state/DecisionContext'
import type { DecisionMode } from '../types/decision'

const CTA_LABELS: Record<DecisionMode, string> = {
  random: '交给命运',
  scientific: '开始计算',
  mystic: '开始做法',
  ai: '交给 AI 理解',
}

export function HomePage(): React.JSX.Element {
  const navigate = useNavigate()
  const { state, dispatch } = useDecision()
  const validCount = useMemo(
    () => state.options.filter((option) => option.label.trim()).length,
    [state.options],
  )
  const canStart = validCount >= 2 && state.mode !== null
  const ctaLabel = state.mode ? CTA_LABELS[state.mode] : '选择一种决策方式'

  function selectMode(mode: DecisionMode): void {
    dispatch({ type: 'set-mode', mode })
  }

  function startDecision(): void {
    if (!canStart || !state.mode) return
    dispatch({ type: 'clear-result' })
    navigate(state.mode === 'scientific' ? '/science' : state.mode === 'ai' ? '/ai' : '/analysis')
  }

  return (
    <main className="home-page">
      <section className="hero-grid" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="eyebrow">选择困难症终结器 · V1.5</span>
          <h1 id="hero-title">
            今天，
            <br />
            我们替你做决定。
          </h1>
          <p>输入你的选项，选择一种模式，剩下的交给系统。</p>
          <div className="system-line">
            <span />
            不需要登录 · 数据仅保存在本机
          </div>
        </div>
        <DecisionMachine />
      </section>

      <section className="decision-workbench" aria-labelledby="workbench-title">
        <div className="workbench-heading">
          <div>
            <span className="section-index">01 / INPUT</span>
            <h2 id="workbench-title">你在纠结什么？</h2>
          </div>
          <label className="question-field">
            <span>给这次纠结起个名字</span>
            <input
              value={state.question}
              maxLength={40}
              placeholder="例如：今晚吃什么？"
              onChange={(event) =>
                dispatch({ type: 'set-question', question: event.target.value })
              }
            />
          </label>
        </div>

        <div className="workbench-grid">
          <div className="input-panel">
            <OptionEditor
              options={state.options}
              onChange={(id, label) => dispatch({ type: 'set-option', id, label })}
              onAdd={() => dispatch({ type: 'add-option' })}
              onRemove={(id) => dispatch({ type: 'remove-option', id })}
            />
            <p className="field-hint">至少 2 项、最多 10 项；按 Enter 可以继续添加。</p>
          </div>

          <div className="mode-panel">
            <div className="mode-panel__heading">
              <span className="section-index">02 / METHOD</span>
              <h2>选择决策模式</h2>
            </div>
            <div className="mode-grid">
              <ModeCard
                mode="random"
                title="随机模式"
                description="掷骰子，听天由命。"
                aside="系统不承担后果"
                tag="等概率"
                icon={Dices}
                tone="random"
                selected={state.mode === 'random'}
                onSelect={selectMode}
              />
              <ModeCard
                mode="scientific"
                title="科学模式"
                description="多指标评分，认真计算。"
                aside="看起来相当严谨"
                tag="加权法"
                icon={BarChart3}
                tone="scientific"
                selected={state.mode === 'scientific'}
                onSelect={selectMode}
              />
              <ModeCard
                mode="mystic"
                title="玄学模式"
                description="一本正经地胡说八道。"
                aside="可信度：随缘"
                tag="纯娱乐"
                icon={Orbit}
                tone="mystic"
                selected={state.mode === 'mystic'}
                onSelect={selectMode}
              />
              <ModeCard
                mode="ai"
                title="AI 模式"
                description="先理解需求，再辅助分析。"
                aside="这次可能真的有用"
                tag="API 待接入"
                icon={Bot}
                tone="ai"
                selected={state.mode === 'ai'}
                onSelect={selectMode}
              />
            </div>
          </div>
        </div>

        <button
          className="primary-action"
          type="button"
          disabled={!canStart}
          onClick={startDecision}
        >
          <span>{ctaLabel}</span>
          <ArrowRight size={19} />
        </button>
      </section>
    </main>
  )
}
