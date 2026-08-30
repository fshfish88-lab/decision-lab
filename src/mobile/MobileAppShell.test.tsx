import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

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

    expect(screen.getByRole('main')).toHaveTextContent('页面内容')
  })
})
