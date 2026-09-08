import { Dices, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { createRandomScientificScores } from '../../algorithms/scientific'
import { createScientificResult } from '../../services/decisionEngine'
import { useDecision } from '../../state/DecisionContext'
import { MobileStickyAction } from '../components/MobileStickyAction'

export function MobileSciencePage(): React.JSX.Element {
  const navigate = useNavigate()
  const { state, dispatch } = useDecision()
  const [step, setStep] = useState<1 | 2>(1)
  const [error, setError] = useState('')
  const [randomized, setRandomized] = useState(false)
  const options = useMemo(
    () => state.options.filter((option) => option.label.trim()),
    [state.options],
  )
  const totalWeight = state.criteria.reduce((sum, criterion) => sum + criterion.weight, 0)

  function updateCriterion(id: string, field: 'name' | 'weight', value: string): void {
    dispatch({
      type: 'set-criteria',
      criteria: state.criteria.map((criterion) => criterion.id === id
        ? { ...criterion, [field]: field === 'weight' ? Number(value) : value }
        : criterion),
    })
  }

  function addCriterion(): void {
    dispatch({ type: 'add-criterion' })
  }

  function removeCriterion(id: string): void {
    if (state.criteria.length <= 2) return
    dispatch({
      type: 'set-criteria',
      criteria: state.criteria.filter((criterion) => criterion.id !== id),
    })
  }

  function randomizeScores(): void {
    const scores = createRandomScientificScores(options, state.criteria)
    for (const option of options) {
      for (const criterion of state.criteria) {
        dispatch({
          type: 'set-score',
          optionId: option.id,
          criterionId: criterion.id,
          score: scores[option.id][criterion.id],
        })
      }
    }
    setRandomized(true)
    setError('')
  }

  function startAnalysis(): void {
    try {
      const result = createScientificResult({
        question: state.question,
        options,
        criteria: state.criteria,
        scores: state.scores,
      })
      dispatch({ type: 'set-result', result })
      setError('')
      navigate('/analysis')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '科学模式配置不完整')
    }
  }

  if (options.length < 2) {
    return (
      <section className="mobile-empty-state">
        <h1>科学模式需要至少两个选项</h1>
        <button type="button" onClick={() => navigate('/')}>返回输入</button>
      </section>
    )
  }

  return (
    <section className="mobile-science">
      <div className="mobile-flow-progress" aria-label={`科学决策步骤 ${step} / 2`}>
        <span className="is-active" />
        <span className={step === 2 ? 'is-active' : ''} />
      </div>

      {step === 1 ? (
        <>
          <header className="mobile-flow-heading">
            <span>步骤 1 / 2</span>
            <h1>设置评价指标</h1>
            <p>权重代表每项指标的重要程度，合计必须为 100%。</p>
          </header>
          <div className={`mobile-weight-total${totalWeight === 100 ? ' is-valid' : ''}`}>
            <span>权重合计</span>
            <strong>{totalWeight}%</strong>
            <small>{totalWeight === 100 ? '可以进入评分' : '请调整为 100%'}</small>
          </div>
          <div className="mobile-criteria-list">
            {state.criteria.map((criterion, index) => (
              <article key={criterion.id} className="mobile-criterion-card">
                <div className="mobile-criterion-card__heading">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <label>
                    <span className="sr-only">指标名称</span>
                    <input
                      value={criterion.name}
                      maxLength={12}
                      onChange={(event) => updateCriterion(criterion.id, 'name', event.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    aria-label={`删除指标 ${criterion.name}`}
                    disabled={state.criteria.length <= 2}
                    onClick={() => removeCriterion(criterion.id)}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </div>
                <label className="mobile-criterion-card__weight">
                  <span>{criterion.name}权重</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={criterion.weight}
                    onChange={(event) => updateCriterion(criterion.id, 'weight', event.target.value)}
                  />
                  <strong>{criterion.weight}%</strong>
                </label>
              </article>
            ))}
          </div>
          <button
            className="mobile-inline-action"
            type="button"
            disabled={state.criteria.length >= 6}
            onClick={addCriterion}
          >
            <Plus size={18} aria-hidden="true" />添加指标
          </button>
          <MobileStickyAction
            label="下一步：为选项评分"
            disabled={totalWeight !== 100}
            helperText={totalWeight === 100 ? null : '权重合计必须为 100%'}
            onClick={() => setStep(2)}
          />
        </>
      ) : (
        <>
          <header className="mobile-flow-heading">
            <span>步骤 2 / 2</span>
            <h1>为选项评分</h1>
            <p>1 分较低，10 分较高。所有评分都会进入真实加权计算。</p>
          </header>
          <button className="mobile-inline-action" type="button" onClick={randomizeScores}>
            <Dices size={18} aria-hidden="true" />
            {randomized ? '再随机一批评分' : '随机填充评分'}
          </button>
          <div className="mobile-score-list">
            {options.map((option) => (
              <fieldset key={option.id} className="mobile-score-card" aria-label={`${option.label}评分`}>
                <legend>{option.label}</legend>
                {state.criteria.map((criterion) => (
                  <label key={criterion.id}>
                    <span>{criterion.name}<small>{criterion.weight}%</small></span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      placeholder="—"
                      aria-label={`${option.label}的${criterion.name}评分`}
                      value={state.scores[option.id]?.[criterion.id] ?? ''}
                      onChange={(event) => dispatch({
                        type: 'set-score',
                        optionId: option.id,
                        criterionId: criterion.id,
                        score: Number(event.target.value),
                      })}
                    />
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
          {error ? <p className="mobile-form-error" role="alert">{error}</p> : null}
          <button className="mobile-step-back" type="button" onClick={() => setStep(1)}>返回修改权重</button>
          <MobileStickyAction label="开始科学分析" onClick={startAnalysis} />
        </>
      )}
    </section>
  )
}
