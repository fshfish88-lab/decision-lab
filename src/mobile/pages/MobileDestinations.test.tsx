import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { AboutPage } from '../../pages/AboutPage'
import { HistoryPage } from '../../pages/HistoryPage'
import { NotFoundPage } from '../../pages/NotFoundPage'
import { StatisticsPage } from '../../pages/StatisticsPage'
import { PlatformContext } from '../../platform/PlatformContext'
import { DecisionProvider } from '../../state/DecisionProvider'

function renderAppPage(page: React.ReactNode): void {
  render(
    <MemoryRouter>
      <PlatformContext.Provider value="app">
        <DecisionProvider>{page}</DecisionProvider>
      </PlatformContext.Provider>
    </MemoryRouter>,
  )
}

describe('mobile top-level destinations', () => {
  beforeEach(() => localStorage.clear())

  it('renders an app-specific empty history state', () => {
    renderAppPage(<HistoryPage />)
    expect(screen.getByRole('heading', { name: '决策记录' })).toBeInTheDocument()
    expect(screen.getByText('还没有决策记录')).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveClass('mobile-history')
  })

  it('renders mobile statistics without demonstration data', () => {
    renderAppPage(<StatisticsPage now={new Date('2026-08-30T00:00:00.000Z')} />)
    expect(screen.getByRole('heading', { name: '统计' })).toBeInTheDocument()
    expect(screen.getByText('还没有足够的决策数据')).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveClass('mobile-statistics')
  })

  it('renders real app information without a fake settings page', () => {
    renderAppPage(<AboutPage />)
    expect(screen.getByRole('heading', { name: '关于 Decision Lab' })).toBeInTheDocument()
    expect(screen.getByText('版本 1.5.0')).toBeInTheDocument()
    expect(screen.queryByText('设置')).not.toBeInTheDocument()
  })

  it('offers an explicit recovery action for invalid routes', () => {
    renderAppPage(<NotFoundPage />)
    expect(screen.getByRole('heading', { name: '这个页面不存在' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回决策首页' })).toHaveAttribute('href', '/')
  })
})
