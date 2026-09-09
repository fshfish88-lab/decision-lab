import { fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { MobileNavigationProvider } from './MobileNavigationProvider'
import { MobileRouteTransition } from './MobileRouteTransition'
import { useMobileNavigation } from './MobileNavigationContext'

function Destination({ mounted, unmounted }: { mounted: () => void; unmounted: () => void }): React.JSX.Element {
  useEffect(() => { mounted(); return unmounted }, [mounted, unmounted])
  return <h1>统计页面</h1>
}

function Harness({ mounted, unmounted }: { mounted: () => void; unmounted: () => void }): React.JSX.Element {
  const { navigateForward, armExit } = useMobileNavigation()
  return <>
    <button onClick={() => navigateForward('/statistics')}>统计</button>
    <button onClick={() => navigateForward('/about')}>关于</button>
    <button onClick={armExit}>更新导航状态</button>
    <MobileRouteTransition>
      <Routes>
        <Route path="/" element={<h1>首页</h1>} />
        <Route path="/statistics" element={<Destination mounted={mounted} unmounted={unmounted} />} />
        <Route path="/about" element={<h1>关于页面</h1>} />
      </Routes>
    </MobileRouteTransition>
  </>
}

describe('mobile route lifecycle during animation', () => {
  it('mounts a destination once and removes it immediately on the next navigation', () => {
    const mounted = vi.fn()
    const unmounted = vi.fn()
    render(<MemoryRouter><MobileNavigationProvider><Harness mounted={mounted} unmounted={unmounted} /></MobileNavigationProvider></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: '统计' }))
    expect(screen.getAllByRole('heading', { name: '统计页面' })).toHaveLength(1)
    expect(mounted).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: '关于' }))
    expect(unmounted).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('heading', { name: '统计页面' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: '关于页面' })).toHaveLength(1)
  })

  it('keeps primary motion stable when navigation bookkeeping rerenders', () => {
    const { container } = render(<MemoryRouter><MobileNavigationProvider><Harness mounted={vi.fn()} unmounted={vi.fn()} /></MobileNavigationProvider></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: '统计' }))
    const scene = container.querySelector('.mobile-route-transition:last-child')
    expect(scene).toHaveAttribute('data-motion-kind', 'primary')
    fireEvent.click(screen.getByRole('button', { name: '更新导航状态' }))
    expect(scene).toHaveAttribute('data-motion-kind', 'primary')
  })
})

