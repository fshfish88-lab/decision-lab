import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { MysticResult } from '../components/results/MysticResult'
import { AiDeepAnalysisPanel } from '../components/results/AiDeepAnalysisPanel'
import { AiResult } from '../components/results/AiResult'
import { RandomResult } from '../components/results/RandomResult'
import { ResultShell } from '../components/results/ResultShell'
import { ScientificResult } from '../components/results/ScientificResult'
import { buildShareText, downloadBlob, renderShareCardBlob } from '../sharing/shareCard'
import { useDecision } from '../state/DecisionContext'
import {
  incrementHistoryItemShare,
  markHistoryItemRegretted,
  readHistory,
} from '../storage/history'

export function ResultPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { state, dispatch } = useDecision()
  const requestedResultId = searchParams.get('id')
  const history = readHistory()
  const result = requestedResultId
    ? history.find((item) => item.id === requestedResultId) ?? null
    : state.result ?? history[0] ?? null
  const [regretted, setRegretted] = useState(() => (
    result ? Boolean(readHistory().find((item) => item.id === result.id)?.regrettedAt) : false
  ))

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

  const decisionResult = result
  const rerunPath = decisionResult.mode === 'scientific'
    ? '/science'
    : decisionResult.mode === 'mystic'
      ? '/tarot'
    : decisionResult.mode === 'ai'
      ? '/ai'
      : '/analysis'

  function rerun(): void {
    dispatch({ type: 'clear-result' })
    navigate(rerunPath)
  }

  function changeMode(): void {
    dispatch({ type: 'prepare-mode-selection' })
    navigate('/', { state: { focusTarget: 'mode' } })
  }

  function editOptions(): void {
    dispatch({ type: 'clear-result' })
    navigate('/', { state: { focusTarget: 'input' } })
  }

  function regret(): void {
    const updated = markHistoryItemRegretted(decisionResult.id)
    if (updated?.regrettedAt) setRegretted(true)
  }

  async function copyResult(): Promise<void> {
    if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable')
    await navigator.clipboard.writeText(buildShareText(decisionResult))
    incrementHistoryItemShare(decisionResult.id)
  }

  async function downloadShareCard(): Promise<void> {
    const blob = await renderShareCardBlob(decisionResult)
    downloadBlob(blob, `decision-lab-${decisionResult.id}.png`)
    incrementHistoryItemShare(decisionResult.id)
  }

  return (
    <ResultShell
      result={decisionResult}
      onRerun={rerun}
      onReturnHome={() => navigate('/')}
      onChangeMode={changeMode}
      onEditOptions={editOptions}
      onRegret={regret}
      onCopy={copyResult}
      onDownload={downloadShareCard}
      regretted={regretted}
    >
      <>
        {decisionResult.mode === 'random' ? (
          <RandomResult result={decisionResult} />
        ) : decisionResult.mode === 'scientific' ? (
          <ScientificResult result={decisionResult} />
        ) : decisionResult.mode === 'mystic' ? (
          <MysticResult result={decisionResult} />
        ) : (
          <AiResult result={decisionResult} />
        )}
        {decisionResult.mode !== 'ai' ? <AiDeepAnalysisPanel result={decisionResult} /> : null}
      </>
    </ResultShell>
  )
}
