import { ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { MysticResult } from '../components/results/MysticResult'
import { RandomResult } from '../components/results/RandomResult'
import { ResultShell } from '../components/results/ResultShell'
import { ScientificResult } from '../components/results/ScientificResult'
import { useDecision } from '../state/DecisionContext'

export function ResultPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { state, dispatch } = useDecision()
  const result = state.result

  if (!result) {
    return (
      <main className="empty-state">
        <span className="empty-state__icon"><ShieldCheck size={24} /></span>
        <h1>当前没有决策结果</h1>
        <p>系统不会为了填满页面而编造一个答案。</p>
        <button className="secondary-action" type="button" onClick={() => navigate('/')}>开始一次决定</button>
      </main>
    )
  }

  const rerunPath = result.mode === 'scientific' ? '/science' : '/analysis'

  function rerun(): void {
    dispatch({ type: 'clear-result' })
    navigate(rerunPath)
  }

  return (
    <ResultShell
      result={result}
      onRerun={rerun}
      onReturnHome={() => navigate('/')}
    >
      {result.mode === 'random' ? (
        <RandomResult result={result} />
      ) : result.mode === 'scientific' ? (
        <ScientificResult result={result} />
      ) : (
        <MysticResult result={result} />
      )}
    </ResultShell>
  )
}
