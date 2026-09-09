import { BarChart3, Bot, Dices, FlaskConical, Orbit } from 'lucide-react'

import type { HomeViewProps } from '../../pages/home/HomePageController'
import { MobileModeCard } from '../components/MobileModeCard'
import { MobileOptionEditor } from '../components/MobileOptionEditor'
import { MobileStickyAction } from '../components/MobileStickyAction'

export function MobileHomeView({
  question,
  options,
  selectedMode,
  canStart,
  ctaLabel,
  validationMessage,
  onQuestionChange,
  onOptionChange,
  onAddOption,
  onRemoveOption,
  onSelectMode,
  onStart,
}: HomeViewProps): React.JSX.Element {
  return (
    <section className="mobile-home" aria-labelledby="mobile-home-title">
      <header className="mobile-home__header">
        <span className="mobile-home__brand"><FlaskConical size={15} aria-hidden="true" /> DECISION LAB <span>选择实验室</span></span>
        <h1 id="mobile-home-title">今天想决定什么？</h1>
        <p>把纠结写下来，剩下的交给我们。</p>
      </header>

      <section id="decision-input" className="mobile-home__card" aria-labelledby="mobile-input-title">
        <div className="mobile-home__section-heading">
          <span>01</span>
          <div>
            <h2 id="mobile-input-title">写下你的选项</h2>
            <p>2–10 个选项</p>
          </div>
        </div>
        <label className="mobile-home__question">
          <span className="sr-only">这次要决定的问题</span>
          <input
            value={question}
            maxLength={40}
            placeholder="例如：今晚吃什么？"
            onChange={(event) => onQuestionChange(event.target.value)}
          />
        </label>
        <MobileOptionEditor
          options={options}
          onChange={onOptionChange}
          onAdd={onAddOption}
          onRemove={onRemoveOption}
        />
      </section>

      <section id="mode-selection" className="mobile-home__modes" aria-labelledby="mobile-mode-title">
        <div className="mobile-home__section-heading">
          <span>02</span>
          <div>
            <h2 id="mobile-mode-title">选择决策方式</h2>
            <p>选一种就好</p>
          </div>
        </div>
        <div className="mobile-home__mode-grid" role="group" aria-label="选择决策方式">
          <MobileModeCard
            mode="random"
            title="随机模式"
            description="等概率，交给命运"
            icon={Dices}
            tone="random"
            selected={selectedMode === 'random'}
            onSelect={onSelectMode}
          />
          <MobileModeCard
            mode="scientific"
            title="科学模式"
            description="按权重，认真算一遍"
            icon={BarChart3}
            tone="scientific"
            selected={selectedMode === 'scientific'}
            onSelect={onSelectMode}
          />
          <MobileModeCard
            mode="mystic"
            title="塔罗模式"
            description="抽张牌，听一点灵感"
            icon={Orbit}
            tone="mystic"
            selected={selectedMode === 'mystic'}
            onSelect={onSelectMode}
          />
          <MobileModeCard
            mode="ai"
            title="AI 模式"
            description="说背景，给直接建议"
            icon={Bot}
            tone="ai"
            selected={selectedMode === 'ai'}
            onSelect={onSelectMode}
          />
        </div>
      </section>

      <MobileStickyAction
        label={ctaLabel}
        disabled={!canStart}
        helperText={validationMessage}
        onClick={onStart}
      />
    </section>
  )
}
