import { render, screen, waitFor } from '@testing-library/react'
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
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    })
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

  it('adds optional AI analysis without replacing a local random result', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        type: 'deep-analysis',
        data: {
          overview: '这次抽签值得接受。',
          key_factors: ['你看到火锅时没有反对'],
          risks: ['预算可能略高'],
          hidden_conflicts: ['省钱和满足感正在开会'],
          scenarios: ['疲惫时直接接受更省心'],
          next_steps: ['关掉第二个外卖软件'],
        },
      }),
    } as Response))
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
    await screen.findByRole('heading', { name: '决策结果' })

    expect(screen.getAllByText('火锅').length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'AI 深度分析' }))

    expect(await screen.findByText('这次抽签值得接受。')).toBeInTheDocument()
    expect(screen.getAllByText('火锅').length).toBeGreaterThan(0)
    expect(screen.getByText('命运选择了它').nextElementSibling).toHaveTextContent('火锅')
  })

  it('gets a direct AI decision, renders its own result, and stores it in history', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        type: 'decision',
        data: {
          recommended_option: '火锅',
          confidence: 89,
          verdict: '今天已经够累了，别再把晚饭做成第二份工作。',
          core_reasons: ['满足感更高', '不用继续比较菜单'],
          main_tradeoff: '会比日料多花一点时间。',
          conditions_to_reconsider: ['预算突然收紧'],
          action_plan: ['现在订位', '十分钟内出门'],
        },
      }),
    } as Response))
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
    await user.click(screen.getByRole('button', { name: /AI 模式/ }))
    await user.click(screen.getByRole('button', { name: '让 AI 替我决定' }))
    await user.type(screen.getByLabelText('补充你的真实情况'), '预算 100 元，今天很累。')
    await user.click(screen.getByRole('button', { name: '让 AI 替我决定' }))

    expect(await screen.findByRole('heading', { name: 'AI 最终建议' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '火锅' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'AI 深度分析' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: '决策记录' }))
    expect(screen.getByText('今晚吃什么？')).toBeInTheDocument()
    expect(screen.getByText('火锅')).toBeInTheDocument()
  })

  it('records regret and reflects the real decision in V1.5 statistics and achievements', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <DecisionProvider>
          <AppRoutes />
        </DecisionProvider>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('选项 1'), '马上出门')
    await user.type(screen.getByLabelText('选项 2'), '再躺十分钟')
    await user.click(screen.getByRole('button', { name: /随机模式/ }))
    await user.click(screen.getByRole('button', { name: '交给命运' }))
    await screen.findByRole('heading', { name: '决策结果' })

    await user.click(screen.getByRole('button', { name: '我后悔了' }))
    expect(screen.getByText('反悔已记录，系统表示并不意外')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: '统计分析' }))

    expect(screen.getByRole('heading', { name: '统计分析' })).toBeInTheDocument()
    expect(screen.getByText('成就解锁：初次见面')).toBeInTheDocument()
    expect(screen.getByText('系统已如实记录').previousElementSibling).toHaveTextContent('1')
    expect(screen.getByText('决定之后没有反悔').previousElementSibling).toHaveTextContent('0.0%')
  })

  it('keeps the draft but clears the selected mode when changing mode from a result', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <DecisionProvider>
          <AppRoutes />
        </DecisionProvider>
      </MemoryRouter>,
    )

    await user.type(screen.getByPlaceholderText('例如：今晚吃什么？'), '周末去哪儿？')
    await user.type(screen.getByLabelText('选项 1'), '逛博物馆')
    await user.type(screen.getByLabelText('选项 2'), '去公园')
    await user.click(screen.getByRole('button', { name: /随机模式/ }))
    await user.click(screen.getByRole('button', { name: '交给命运' }))
    await screen.findByRole('heading', { name: '决策结果' })

    await user.click(screen.getByRole('button', { name: '换一种模式' }))

    expect(screen.getByPlaceholderText('例如：今晚吃什么？')).toHaveValue('周末去哪儿？')
    expect(screen.getByLabelText('选项 1')).toHaveValue('逛博物馆')
    expect(screen.getByLabelText('选项 2')).toHaveValue('去公园')
    expect(screen.getByRole('button', { name: /随机模式/ })).toHaveAttribute('aria-pressed', 'false')
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled())
    expect(vi.mocked(Element.prototype.scrollIntoView).mock.instances.at(-1)).toHaveAttribute('id', 'mode-selection')
  })

  it('keeps the selected mode when editing options from a result', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <DecisionProvider>
          <AppRoutes />
        </DecisionProvider>
      </MemoryRouter>,
    )

    await user.type(screen.getByPlaceholderText('例如：今晚吃什么？'), '周末去哪儿？')
    await user.type(screen.getByLabelText('选项 1'), '逛博物馆')
    await user.type(screen.getByLabelText('选项 2'), '去公园')
    await user.click(screen.getByRole('button', { name: /随机模式/ }))
    await user.click(screen.getByRole('button', { name: '交给命运' }))
    await screen.findByRole('heading', { name: '决策结果' })

    await user.click(screen.getByRole('button', { name: '修改选项' }))

    expect(screen.getByPlaceholderText('例如：今晚吃什么？')).toHaveValue('周末去哪儿？')
    expect(screen.getByLabelText('选项 1')).toHaveValue('逛博物馆')
    expect(screen.getByLabelText('选项 2')).toHaveValue('去公园')
    expect(screen.getByRole('button', { name: /随机模式/ })).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled())
    expect(vi.mocked(Element.prototype.scrollIntoView).mock.instances.at(-1)).toHaveAttribute('id', 'decision-input')
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
