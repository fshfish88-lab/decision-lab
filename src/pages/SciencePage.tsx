import { ArrowLeft, ArrowRight, BarChart3, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { createScientificResult } from '../services/decisionEngine'
import { useDecision } from '../state/DecisionContext'

export function SciencePage(): React.JSX.Element {
  const navigate = useNavigate()
  const { state, dispatch } = useDecision()
  const [error, setError] = useState('')
  const options = useMemo(
    () => state.options.filter((option) => option.label.trim()),
    [state.options],
  )
  const totalWeight = state.criteria.reduce((sum, criterion) => sum + criterion.weight, 0)

  function updateCriterion(id: string, field: 'name' | 'weight', value: string): void {
    dispatch({
      type: 'set-criteria',
      criteria: state.criteria.map((criterion) =>
        criterion.id === id
          ? { ...criterion, [field]: field === 'weight' ? Number(value) : value }
          : criterion,
      ),
    })
  }

  function addCriterion(): void {
    if (state.criteria.length >= 6) return
    const id = `criterion-${state.criteria.length + 1}`
    dispatch({
      type: 'set-criteria',
      criteria: [...state.criteria, { id, name: '新指标', weight: 0 }],
    })
  }

  function removeCriterion(id: string): void {
    if (state.criteria.length <= 2) return
    dispatch({
      type: 'set-criteria',
      criteria: state.criteria.filter((criterion) => criterion.id !== id),
    })
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
      <main className="empty-state">
        <span className="empty-state__icon"><BarChart3 size={24} /></span>
        <h1>科学模式需要至少两个选项</h1>
        <button className="secondary-action" type="button" onClick={() => navigate('/')}>返回输入</button>
      </main>
    )
  }

  return (
    <main className="science-page">
      <button className="back-button" type="button" onClick={() => navigate('/')}>
        <ArrowLeft size={17} />返回输入
      </button>
      <header className="page-heading page-heading--split">
        <div>
          <span className="section-index">SCIENTIFIC MODE / WEIGHTED SCORE</span>
          <h1>科学模式</h1>
          <p>设置指标和权重，再为每个候选项打 1～10 分。</p>
        </div>
        <div className={`weight-total${totalWeight === 100 ? ' is-valid' : ''}`}>
          <span>当前权重总和</span>
          <strong>{totalWeight}%</strong>
          <small>{totalWeight === 100 ? '可以开始计算' : '必须调整为 100%'}</small>
        </div>
      </header>

      <section className="science-card" aria-labelledby="criteria-heading">
        <div className="science-card__heading">
          <div>
            <span className="step-number">STEP 01</span>
            <h2 id="criteria-heading">评价指标与权重</h2>
          </div>
          <button className="text-button" type="button" disabled={state.criteria.length >= 6} onClick={addCriterion}>
            <Plus size={16} />添加指标
          </button>
        </div>
        <div className="criteria-list">
          {state.criteria.map((criterion, index) => (
            <div className="criterion-row" key={criterion.id}>
              <span className="criterion-row__index">{String(index + 1).padStart(2, '0')}</span>
              <label>
                <span>指标名称</span>
                <input value={criterion.name} maxLength={12} onChange={(event) => updateCriterion(criterion.id, 'name', event.target.value)} />
              </label>
              <label className="criterion-weight">
                <span>{criterion.name}权重</span>
                <input type="range" min="0" max="100" step="5" value={criterion.weight} onChange={(event) => updateCriterion(criterion.id, 'weight', event.target.value)} />
              </label>
              <label className="weight-input">
                <span className="sr-only">{criterion.name}权重数值</span>
                <input type="number" min="0" max="100" value={criterion.weight} onChange={(event) => updateCriterion(criterion.id, 'weight', event.target.value)} />
                <span>%</span>
              </label>
              <button className="icon-button" type="button" aria-label={`删除指标 ${criterion.name}`} disabled={state.criteria.length <= 2} onClick={() => removeCriterion(criterion.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="science-card" aria-labelledby="scores-heading">
        <div className="science-card__heading">
          <div>
            <span className="step-number">STEP 02</span>
            <h2 id="scores-heading">为候选项评分</h2>
          </div>
          <p>1 分较低，10 分较高</p>
        </div>
        <div className="score-table-wrap">
          <table className="score-table">
            <thead>
              <tr>
                <th>候选项</th>
                {state.criteria.map((criterion) => <th key={criterion.id}>{criterion.name}<small>{criterion.weight}%</small></th>)}
              </tr>
            </thead>
            <tbody>
              {options.map((option) => (
                <tr key={option.id}>
                  <th>{option.label}</th>
                  {state.criteria.map((criterion) => (
                    <td key={criterion.id}>
                      <label>
                        <span className="sr-only">{option.label}的{criterion.name}评分</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          placeholder="—"
                          value={state.scores[option.id]?.[criterion.id] ?? ''}
                          onChange={(event) => dispatch({
                            type: 'set-score',
                            optionId: option.id,
                            criterionId: criterion.id,
                            score: Number(event.target.value),
                          })}
                        />
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-action" type="button" onClick={startAnalysis}>
        <span>开始科学分析</span><ArrowRight size={19} />
      </button>
    </main>
  )
}
