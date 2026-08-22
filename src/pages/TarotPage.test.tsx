import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DecisionContext } from '../state/DecisionContext'
import { initialDecisionState } from '../state/decisionReducer'
import { HISTORY_STORAGE_KEY } from '../storage/history'
import { TarotPage } from './TarotPage'

describe('TarotPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  afterEach(() => vi.restoreAllMocks())

  it('shows seven card backs and waits for the user before creating a result', async () => {
    const user = userEvent.setup()
    const dispatch = vi.fn()
    render(
      <MemoryRouter initialEntries={['/tarot']}>
        <DecisionContext.Provider
          value={{
            state: {
              ...initialDecisionState,
              question: '今晚吃什么？',
              mode: 'mystic',
              options: [
                { id: 'hotpot', label: '火锅' },
                { id: 'sushi', label: '日料' },
                { id: 'barbecue', label: '烧烤' },
              ],
            },
            dispatch,
          }}
        >
          <TarotPage />
        </DecisionContext.Provider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '凭第一感觉，选择一张' })).toBeInTheDocument()
    const cards = screen.getAllByRole('button', { name: /选择第 \d 张塔罗牌/ })
    expect(cards).toHaveLength(7)
    expect(screen.queryByText('正位')).not.toBeInTheDocument()
    expect(screen.queryByText('逆位')).not.toBeInTheDocument()
    expect(screen.queryByTestId(/tarot-artwork-/)).not.toBeInTheDocument()
    expect(screen.queryByText('牌面含义')).not.toBeInTheDocument()
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'set-result' }))
    expect(localStorage.getItem(HISTORY_STORAGE_KEY)).toBeNull()

    await user.click(cards[0])

    expect(screen.getByRole('heading', { name: '你的牌已翻开' })).toBeInTheDocument()
    expect(screen.getAllByText('正位').length).toBeGreaterThan(0)
    expect(screen.getByText('本轮指向')).toBeInTheDocument()
    expect(screen.getAllByTestId(/tarot-artwork-/)).toHaveLength(1)
    expect(screen.getByText('牌面含义')).toBeInTheDocument()
    expect(screen.getByText('牌已经翻开，反悔不在本轮服务范围内。')).toBeInTheDocument()
    expect(screen.queryByText(/科学部门/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '查看完整结果' })).toBeInTheDocument()
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'set-result' }))
    expect(JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) ?? '{}').items).toHaveLength(1)
  })

  it('shows an empty state when the draft is not ready for tarot', () => {
    render(
      <MemoryRouter initialEntries={['/tarot']}>
        <DecisionContext.Provider
          value={{ state: initialDecisionState, dispatch: vi.fn() }}
        >
          <TarotPage />
        </DecisionContext.Provider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '还没有可用的塔罗牌阵' })).toBeInTheDocument()
    expect(screen.queryAllByRole('button', { name: /选择第 \d 张塔罗牌/ })).toHaveLength(0)
  })
})
