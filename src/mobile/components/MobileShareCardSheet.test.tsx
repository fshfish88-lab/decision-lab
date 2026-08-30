import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DecisionResult } from '../../types/decision'
import { MobileNavigationContext, type MobileNavigationValue } from '../navigation/MobileNavigationContext'
import { MobileShareCardSheet } from './MobileShareCardSheet'

const result: DecisionResult = {
  id: 'result-1',
  createdAt: '2026-08-30T05:00:00.000Z',
  question: '今晚吃什么？',
  options: [{ id: 'one', label: '火锅' }, { id: 'two', label: '日料' }],
  mode: 'random',
  winner: { id: 'one', label: '火锅' },
  explanation: '等概率随机抽取。',
  confidence: 50,
  metrics: [],
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function navigationValue(registerOverlay = vi.fn(() => vi.fn())): MobileNavigationValue {
  return {
    direction: 'forward',
    historyDepth: 1,
    exitPending: false,
    isRoot: false,
    navigateForward: vi.fn(),
    navigateBack: vi.fn(),
    registerOverlay,
    closeTopOverlay: vi.fn(() => false),
    armExit: vi.fn(),
    clearExitPending: vi.fn(),
  }
}

describe('MobileShareCardSheet', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:preview') })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
  })

  it('opens in a generating state before enabling native actions', async () => {
    const generation = deferred<Blob>()
    render(
      <MobileNavigationContext.Provider value={navigationValue()}>
        <MobileShareCardSheet
          result={result}
          onClose={vi.fn()}
          renderShareCard={() => generation.promise}
          saveShareCard={vi.fn()}
          shareShareCard={vi.fn()}
          onShareChooserOpened={vi.fn()}
        />
      </MobileNavigationContext.Provider>,
    )

    expect(screen.getByText('正在生成分享卡')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '保存到相册' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '系统分享' })).toBeDisabled()

    generation.resolve(new Blob(['png'], { type: 'image/png' }))
    await waitFor(() => expect(screen.getByAltText('Decision Lab 分享卡预览')).toHaveAttribute('src', 'blob:preview'))
    expect(screen.getByRole('button', { name: '保存到相册' })).toBeEnabled()
  })

  it('saves without counting a share and counts only a successfully opened chooser', async () => {
    const saveShareCard = vi.fn().mockResolvedValue({ uri: 'content://saved', fileName: 'card.png' })
    const shareShareCard = vi.fn().mockResolvedValue({ chooserOpened: true })
    const onShareChooserOpened = vi.fn()
    render(
      <MobileNavigationContext.Provider value={navigationValue()}>
        <MobileShareCardSheet
          result={result}
          onClose={vi.fn()}
          renderShareCard={vi.fn().mockResolvedValue(new Blob(['png'], { type: 'image/png' }))}
          saveShareCard={saveShareCard}
          shareShareCard={shareShareCard}
          onShareChooserOpened={onShareChooserOpened}
        />
      </MobileNavigationContext.Provider>,
    )

    await waitFor(() => expect(screen.getByRole('button', { name: '保存到相册' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: '保存到相册' }))
    await waitFor(() => expect(screen.getByText('已保存到相册')).toBeInTheDocument())
    expect(onShareChooserOpened).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '系统分享' }))
    await waitFor(() => expect(screen.getByText('已打开系统分享面板')).toBeInTheDocument())
    expect(onShareChooserOpened).toHaveBeenCalledOnce()
  })

  it('registers as the top overlay and cleans its preview on close', async () => {
    const unregister = vi.fn()
    const registerOverlay = vi.fn(() => unregister)
    const onClose = vi.fn()
    const rendered = render(
      <MobileNavigationContext.Provider value={navigationValue(registerOverlay)}>
        <MobileShareCardSheet
          result={result}
          onClose={onClose}
          renderShareCard={vi.fn().mockResolvedValue(new Blob(['png'], { type: 'image/png' }))}
          saveShareCard={vi.fn()}
          shareShareCard={vi.fn()}
          onShareChooserOpened={vi.fn()}
        />
      </MobileNavigationContext.Provider>,
    )

    await waitFor(() => expect(registerOverlay).toHaveBeenCalledWith(onClose))
    await waitFor(() => expect(screen.getByAltText('Decision Lab 分享卡预览')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: '关闭分享结果卡' }))
    expect(onClose).toHaveBeenCalledOnce()

    rendered.unmount()
    expect(unregister).toHaveBeenCalledOnce()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
  })

  it('shows stable generation and native action failures', async () => {
    const rendered = render(
      <MobileNavigationContext.Provider value={navigationValue()}>
        <MobileShareCardSheet
          result={result}
          onClose={vi.fn()}
          renderShareCard={vi.fn().mockRejectedValue(new Error('canvas failed'))}
          saveShareCard={vi.fn()}
          shareShareCard={vi.fn()}
          onShareChooserOpened={vi.fn()}
        />
      </MobileNavigationContext.Provider>,
    )
    await waitFor(() => expect(screen.getByText('分享卡生成失败，请稍后重试')).toBeInTheDocument())
    rendered.unmount()

    render(
      <MobileNavigationContext.Provider value={navigationValue()}>
        <MobileShareCardSheet
          result={result}
          onClose={vi.fn()}
          renderShareCard={vi.fn().mockResolvedValue(new Blob(['png'], { type: 'image/png' }))}
          saveShareCard={vi.fn().mockRejectedValue({ code: 'PERMISSION_DENIED' })}
          shareShareCard={vi.fn().mockRejectedValue({ code: 'NO_SHARE_TARGET' })}
          onShareChooserOpened={vi.fn()}
        />
      </MobileNavigationContext.Provider>,
    )
    await waitFor(() => expect(screen.getByRole('button', { name: '保存到相册' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: '保存到相册' }))
    await waitFor(() => expect(screen.getByText('未获得图片保存权限')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: '系统分享' }))
    await waitFor(() => expect(screen.getByText('没有找到可用的分享应用')).toBeInTheDocument())
  })
})
