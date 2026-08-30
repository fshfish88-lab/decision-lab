import { Download, LoaderCircle, Share2, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { blobToBase64, nativeShareCardErrorMessage } from '../../sharing/nativeShareCard'
import type { DecisionResult } from '../../types/decision'
import { useMobileNavigation } from '../navigation/MobileNavigationContext'

type ShareSheetState =
  | { phase: 'generating' }
  | { phase: 'ready'; blob: Blob; base64: string; previewUrl: string }
  | { phase: 'acting'; action: 'save' | 'share'; blob: Blob; base64: string; previewUrl: string }
  | { phase: 'error'; message: string }

interface MobileShareCardSheetProps {
  result: DecisionResult
  onClose: () => void
  renderShareCard: (result: DecisionResult) => Promise<Blob>
  saveShareCard: (base64: string) => Promise<{ uri: string; fileName: string }>
  shareShareCard: (base64: string) => Promise<{ chooserOpened: true }>
  onShareChooserOpened: () => void
}

const pendingCards = new Map<string, Promise<Blob>>()

function getPendingCard(
  result: DecisionResult,
  renderShareCard: (result: DecisionResult) => Promise<Blob>,
): Promise<Blob> {
  const existing = pendingCards.get(result.id)
  if (existing) return existing
  const pending = renderShareCard(result)
  pendingCards.set(result.id, pending)
  const clear = (): void => {
    if (pendingCards.get(result.id) === pending) pendingCards.delete(result.id)
  }
  void pending.then(clear, clear)
  return pending
}

export function MobileShareCardSheet({
  result,
  onClose,
  renderShareCard,
  saveShareCard,
  shareShareCard,
  onShareChooserOpened,
}: MobileShareCardSheetProps): React.JSX.Element {
  const { registerOverlay } = useMobileNavigation()
  const requestIdRef = useRef(0)
  const previewUrlRef = useRef<string | null>(null)
  const [state, setState] = useState<ShareSheetState>({ phase: 'generating' })
  const [status, setStatus] = useState('')

  const generate = useCallback(async (): Promise<void> => {
    const requestId = requestIdRef.current += 1
    setState({ phase: 'generating' })
    setStatus('')
    try {
      const blob = await getPendingCard(result, renderShareCard)
      const base64 = await blobToBase64(blob)
      if (requestId !== requestIdRef.current) return
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      const previewUrl = URL.createObjectURL(blob)
      previewUrlRef.current = previewUrl
      setState({ phase: 'ready', blob, base64, previewUrl })
    } catch {
      if (requestId === requestIdRef.current) {
        setState({ phase: 'error', message: '分享卡生成失败，请稍后重试' })
      }
    }
  }, [renderShareCard, result])

  useEffect(() => {
    void generate()
    return () => {
      requestIdRef.current += 1
    }
  }, [generate])

  useEffect(() => registerOverlay(onClose), [onClose, registerOverlay])

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
  }, [])

  async function runAction(action: 'save' | 'share'): Promise<void> {
    if (state.phase !== 'ready') return
    const readyState = state
    setState({ ...readyState, phase: 'acting', action })
    setStatus('')
    try {
      if (action === 'save') {
        await saveShareCard(readyState.base64)
        setStatus('已保存到相册')
      } else {
        const response = await shareShareCard(readyState.base64)
        if (response.chooserOpened) onShareChooserOpened()
        setStatus('已打开系统分享面板')
      }
    } catch (error) {
      setStatus(nativeShareCardErrorMessage(error))
    } finally {
      setState(readyState)
    }
  }

  const ready = state.phase === 'ready'
  const previewUrl = state.phase === 'ready' || state.phase === 'acting' ? state.previewUrl : null

  return (
    <div className="mobile-share-sheet__backdrop">
      <section className="mobile-share-sheet" role="dialog" aria-modal="true" aria-labelledby="mobile-share-title">
        <header className="mobile-share-sheet__header">
          <div>
            <span>RESULT CARD</span>
            <h2 id="mobile-share-title">分享结果卡</h2>
          </div>
          <button type="button" aria-label="关闭分享结果卡" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="mobile-share-sheet__preview">
          {state.phase === 'generating' ? (
            <div className="mobile-share-sheet__loading" role="status">
              <LoaderCircle size={24} aria-hidden="true" />
              <strong>正在生成分享卡</strong>
              <span>把这次决定整理成一张 1080×1350 PNG</span>
            </div>
          ) : state.phase === 'error' ? (
            <div className="mobile-share-sheet__error" role="alert">
              <strong>{state.message}</strong>
              <button type="button" onClick={() => void generate()}>重新生成</button>
            </div>
          ) : previewUrl ? (
            <img src={previewUrl} alt="Decision Lab 分享卡预览" />
          ) : null}
        </div>

        <div className="mobile-share-sheet__actions">
          <button type="button" disabled={!ready} onClick={() => void runAction('save')}>
            <Download size={18} aria-hidden="true" />保存到相册
          </button>
          <button className="is-primary" type="button" disabled={!ready} onClick={() => void runAction('share')}>
            <Share2 size={18} aria-hidden="true" />系统分享
          </button>
        </div>
        <p className="mobile-share-sheet__status" aria-live="polite">{status}</p>
      </section>
    </div>
  )
}
