import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MobileNavigationProvider } from '../mobile/navigation/MobileNavigationProvider'
import { PlatformContext } from '../platform/PlatformContext'
import { DecisionContext } from '../state/DecisionContext'
import { initialDecisionState } from '../state/decisionReducer'
import { readHistory, saveHistoryItem } from '../storage/history'
import type { DecisionResult } from '../types/decision'
import { ResultPage } from './ResultPage'

const shareMocks = vi.hoisted(() => ({
  render: vi.fn(async () => new Blob(['png'], { type: 'image/png' })),
  save: vi.fn(async () => ({ uri: 'content://saved', fileName: 'card.png' })),
  share: vi.fn(async () => ({ chooserOpened: true as const })),
}))

vi.mock('../sharing/shareCard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../sharing/shareCard')>()),
  renderShareCardBlob: shareMocks.render,
}))

vi.mock('../sharing/nativeShareCard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../sharing/nativeShareCard')>()),
  nativeShareCard: {
    saveImage: shareMocks.save,
    shareImage: shareMocks.share,
  },
}))

const result: DecisionResult = {
  id: 'result-share-count',
  createdAt: '2026-08-30T05:00:00.000Z',
  question: '今晚吃什么？',
  options: [{ id: 'one', label: '火锅' }, { id: 'two', label: '日料' }],
  mode: 'random',
  winner: { id: 'one', label: '火锅' },
  explanation: '等概率随机抽取。',
  confidence: 50,
  metrics: [],
}

describe('ResultPage mobile sharing', () => {
  beforeEach(() => {
    localStorage.clear()
    saveHistoryItem(result)
    shareMocks.render.mockClear()
    shareMocks.save.mockClear()
    shareMocks.share.mockClear()
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:preview') })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
  })

  it('does not count album saves and counts only a successfully opened system chooser', async () => {
    render(
      <MemoryRouter initialEntries={['/result']}>
        <DecisionContext.Provider value={{ state: { ...initialDecisionState, result }, dispatch: vi.fn() }}>
          <PlatformContext.Provider value="app">
            <MobileNavigationProvider>
              <ResultPage />
            </MobileNavigationProvider>
          </PlatformContext.Provider>
        </DecisionContext.Provider>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: '分享结果卡' }))
    await waitFor(() => expect(screen.getByRole('button', { name: '保存到相册' })).toBeEnabled())

    fireEvent.click(screen.getByRole('button', { name: '保存到相册' }))
    await waitFor(() => expect(shareMocks.save).toHaveBeenCalledOnce())
    expect(readHistory()[0].shareCount).toBe(0)

    fireEvent.click(screen.getByRole('button', { name: '系统分享' }))
    await waitFor(() => expect(shareMocks.share).toHaveBeenCalledOnce())
    expect(readHistory()[0].shareCount).toBe(1)
  })
})
