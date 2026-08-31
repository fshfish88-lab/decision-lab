import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AboutPage } from '../pages/AboutPage'
import { PlatformContext } from '../platform/PlatformContext'
import { MobileAppShell } from './MobileAppShell'

function renderShell(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <MobileAppShell>
        <p>页面内容</p>
      </MobileAppShell>
    </MemoryRouter>,
  )
}

describe('MobileAppShell', () => {
  it('shows four real destinations and marks the decision tab active', () => {
    renderShell('/')

    const navigation = screen.getByRole('navigation', { name: 'App 主导航' })
    expect(navigation).toHaveTextContent('决策')
    expect(navigation).toHaveTextContent('记录')
    expect(navigation).toHaveTextContent('统计')
    expect(navigation).toHaveTextContent('关于')
    expect(screen.getByRole('link', { name: '决策' })).toHaveAttribute('aria-current', 'page')
  })

  it('marks history as the active destination', () => {
    renderShell('/history')

    expect(screen.getByRole('link', { name: '记录' })).toHaveAttribute('aria-current', 'page')
  })

  it('hides bottom navigation on flow routes and offers a back action', () => {
    renderShell('/science')

    expect(screen.queryByRole('navigation', { name: 'App 主导航' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '返回' })).toBeInTheDocument()
  })

  it('wraps routed content in a semantic main region', () => {
    renderShell('/')

    const main = screen.getByRole('main')
    const navigation = screen.getByRole('navigation', { name: 'App 主导航' })
    expect(main).toHaveTextContent('页面内容')
    expect(main.querySelector('.mobile-route-transition')).toHaveTextContent('页面内容')
    expect(navigation.closest('.mobile-route-transition')).toBeNull()
  })

  it('keeps exactly one main landmark when a destination supplies page markup', () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <PlatformContext.Provider value="app">
          <MobileAppShell>
            <AboutPage />
          </MobileAppShell>
        </PlatformContext.Provider>
      </MemoryRouter>,
    )

    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it('renders one indicator on primary routes and none on flow routes', () => {
    const primary = renderShell('/statistics')
    expect(screen.getAllByTestId('mobile-navigation-indicator')).toHaveLength(1)
    expect(screen.getByRole('navigation', { name: 'App 主导航' })).toHaveClass('mobile-app__navigation')
    primary.unmount()

    renderShell('/science')
    expect(screen.queryByTestId('mobile-navigation-indicator')).not.toBeInTheDocument()
  })
})
