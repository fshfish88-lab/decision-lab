import { ArrowRight, BarChart3, Bot, Dices, Orbit } from 'lucide-react'

import { DecisionMachine } from '../../components/DecisionMachine'
import { ModeCard } from '../../components/ModeCard'
import { OptionEditor } from '../../components/OptionEditor'
import type { HomeViewProps } from '../../pages/home/HomePageController'

export function WebHomeView({
  question,
  options,
  selectedMode,
  canStart,
  ctaLabel,
  onQuestionChange,
  onOptionChange,
  onAddOption,
  onRemoveOption,
  onSelectMode,
  onStart,
}: HomeViewProps): React.JSX.Element {
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

      <section id="decision-input" className="decision-workbench" aria-labelledby="workbench-title">
        <div className="workbench-heading">
          <div>
            <span className="section-index">01 / INPUT</span>
            <h2 id="workbench-title">你在纠结什么？</h2>
          </div>
          <label className="question-field">
            <span>给这次纠结起个名字</span>
            <input
              value={question}
              maxLength={40}
              placeholder="例如：今晚吃什么？"
              onChange={(event) => onQuestionChange(event.target.value)}
            />
          </label>
        </div>

        <div className="workbench-grid">
          <div className="input-panel">
            <OptionEditor
              options={options}
              onChange={onOptionChange}
              onAdd={onAddOption}
              onRemove={onRemoveOption}
            />
            <p className="field-hint">至少 2 项、最多 10 项；按 Enter 可以继续添加。</p>
          </div>

          <div id="mode-selection" className="mode-panel">
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
                selected={selectedMode === 'random'}
                onSelect={onSelectMode}
              />
              <ModeCard
                mode="scientific"
                title="科学模式"
                description="多指标评分，认真计算。"
                aside="看起来相当严谨"
                tag="加权法"
                icon={BarChart3}
                tone="scientific"
                selected={selectedMode === 'scientific'}
                onSelect={onSelectMode}
              />
              <ModeCard
                mode="mystic"
                title="玄学模式"
                description="亲手抽一张，大阿卡纳替你表态。"
                aside="7 张牌背 · 结果已确定"
                tag="纯娱乐"
                icon={Orbit}
                tone="mystic"
                selected={selectedMode === 'mystic'}
                onSelect={onSelectMode}
              />
              <ModeCard
                mode="ai"
                title="AI 模式"
                description="理解你的情况，直接给出建议。"
                aside="这次可能真的有用"
                tag="在线顾问"
                icon={Bot}
                tone="ai"
                selected={selectedMode === 'ai'}
                onSelect={onSelectMode}
              />
            </div>
          </div>
        </div>

        <button className="primary-action" type="button" disabled={!canStart} onClick={onStart}>
          <span>{ctaLabel}</span>
          <ArrowRight size={19} />
        </button>
      </section>
    </main>
  )
}
