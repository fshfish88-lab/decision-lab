import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AppRoutes } from './App'
import { DecisionProvider } from './state/DecisionProvider'

describe('DECISION LAB flow', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('runs a mystic decision, shows the result, and stores it in history', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <DecisionProvider>
          <AppRoutes />
        </DecisionProvider>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('选项 1'), '火锅')
    await user.type(screen.getByLabelText('选项 2'), '日料')
    await user.type(screen.getByPlaceholderText('例如：今晚吃什么？'), '今晚吃什么？')
    await user.click(screen.getByRole('button', { name: /玄学模式/ }))
    await user.click(screen.getByRole('button', { name: '开始做法' }))

    expect(screen.getByRole('heading', { name: '正在连接命运频道' })).toBeInTheDocument()

    expect(await screen.findByRole('heading', { name: '决策结果' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '火锅' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '命运星盘' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '玄学证据' })).toBeInTheDocument()
    expect(screen.getByText(/仅供娱乐/)).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: '决策记录' }))
    expect(screen.getByText('今晚吃什么？')).toBeInTheDocument()
    expect(screen.getByText('火锅')).toBeInTheDocument()
  })

  it('completes the scientific scoring flow and shows a full ranking', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <DecisionProvider>
          <AppRoutes />
        </DecisionProvider>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('选项 1'), '火锅')
    await user.type(screen.getByLabelText('选项 2'), '日料')
    await user.click(screen.getByRole('button', { name: /科学模式/ }))
    await user.click(screen.getByRole('button', { name: '开始计算' }))

    expect(screen.getByRole('heading', { name: '科学模式' })).toBeInTheDocument()
    expect(screen.getByText('当前权重总和')).toBeInTheDocument()

    for (const criterion of ['喜欢程度', '价格友好', '距离便利', '执行便利']) {
      await user.type(screen.getByLabelText(`火锅的${criterion}评分`), '9')
      await user.type(screen.getByLabelText(`日料的${criterion}评分`), '6')
    }

    await user.click(screen.getByRole('button', { name: '开始科学分析' }))

    expect(await screen.findByRole('heading', { name: '决策结果' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '火锅' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '完整排名' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '指标贡献' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '方案评分对比' })).toBeInTheDocument()
    expect(screen.getAllByText('9.00').length).toBeGreaterThan(0)
  })

  it('runs an equal-probability random draw and exposes the draw landing', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <DecisionProvider>
          <AppRoutes />
        </DecisionProvider>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('选项 1'), '火锅')
    await user.type(screen.getByLabelText('选项 2'), '日料')
    await user.click(screen.getByRole('button', { name: /随机模式/ }))
    await user.click(screen.getByRole('button', { name: '交给命运' }))

    expect(screen.getByRole('heading', { name: '正在启动命运抽签' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '决策结果' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '命运落点' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '所有候选项概率' })).toBeInTheDocument()
  })

  it('resets the scroll position when the route changes', async () => {
    const user = userEvent.setup()
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    render(
      <MemoryRouter initialEntries={['/']}>
        <DecisionProvider>
          <AppRoutes />
        </DecisionProvider>
      </MemoryRouter>,
    )
    scrollTo.mockClear()

    await user.click(screen.getByRole('link', { name: '关于' }))

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' })
  })
})
