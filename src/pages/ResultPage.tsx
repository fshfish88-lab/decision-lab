import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { MysticResult } from '../components/results/MysticResult'
import { AiDeepAnalysisPanel } from '../components/results/AiDeepAnalysisPanel'
import { AiResult } from '../components/results/AiResult'
import { RandomResult } from '../components/results/RandomResult'
import { ResultShell } from '../components/results/ResultShell'
import { ScientificResult } from '../components/results/ScientificResult'
import { MobileResultShell } from '../mobile/components/MobileResultShell'
import { usePlatform } from '../platform/PlatformContext'
import { nativeShareCard } from '../sharing/nativeShareCard'
import { buildShareText, downloadBlob, renderShareCardBlob } from '../sharing/shareCard'
import { useDecision } from '../state/DecisionContext'
import {
  incrementHistoryItemShare,
  markHistoryItemRegretted,
  readHistory,
} from '../storage/history'

export function ResultPage(): React.JSX.Element {
  const navigate = useNavigate()
  const platform = usePlatform()
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
    const EmptyStateElement = platform === 'app' ? 'section' : 'main'
    return (
      <EmptyStateElement className={platform === 'app' ? 'mobile-empty-state' : 'empty-state'}>
        <span className="empty-state__icon"><ShieldCheck size={24} /></span>
        <h1>当前没有决策结果</h1>
        <p>系统不会为了填满页面而编造一个答案。</p>
        <button className="secondary-action" type="button" onClick={() => navigate('/')}>开始一次决定</button>
      </EmptyStateElement>
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
    dispatch({ type: 'restore-result-draft', result: decisionResult })
    navigate(rerunPath)
  }

  function changeMode(): void {
    dispatch({ type: 'restore-result-draft', result: decisionResult, selectMode: true })
    navigate('/', { state: { focusTarget: 'mode' } })
  }

  function editOptions(): void {
    dispatch({ type: 'restore-result-draft', result: decisionResult })
    navigate('/', { state: { focusTarget: 'input' } })
  }

  function regret(): void {
    const updated = markHistoryItemRegretted(decisionResult.id)
    if (updated?.regrettedAt) setRegretted(true)
  }

  async function copyResult(): Promise<void> {
    if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable')
    await navigator.clipboard.writeText(buildShareText(decisionResult))
  }

  async function downloadShareCard(): Promise<void> {
    const blob = await renderShareCardBlob(decisionResult)
    downloadBlob(blob, `decision-lab-${decisionResult.id}.png`)
  }

  const resultContent = (
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
  )

  if (platform === 'app') {
    return (
      <MobileResultShell
        result={decisionResult}
        onRerun={rerun}
        onReturnHome={() => navigate('/')}
        onChangeMode={changeMode}
        onEditOptions={editOptions}
        onRegret={regret}
        onCopy={copyResult}
        renderShareCard={renderShareCardBlob}
        saveShareCard={(base64) => nativeShareCard.saveImage({ base64 })}
        shareShareCard={(base64) => nativeShareCard.shareImage({ base64 })}
        onShareChooserOpened={() => {
          incrementHistoryItemShare(decisionResult.id)
        }}
        regretted={regretted}
      >
        {resultContent}
      </MobileResultShell>
    )
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
      {resultContent}
    </ResultShell>
  )
}
