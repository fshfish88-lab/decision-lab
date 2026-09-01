import { fireEvent, render, screen } from '@testing-library/react'
import { useLayoutEffect } from 'react'
import { Link, MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ScrollToTop } from './ScrollToTop'

function LayoutProbe({ onLayout }: { onLayout: (pathname: string) => void }): React.JSX.Element {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    onLayout(pathname)
  }, [onLayout, pathname])

  return <Link to="/">决策</Link>
}

describe('ScrollToTop', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resets scroll before the destination route reaches its layout phase', () => {
    let scrollPosition = 0
    const positionsSeenByRoute = new Map<string, number>()

    vi.spyOn(window, 'scrollTo').mockImplementation(((options?: ScrollToOptions) => {
      scrollPosition = options?.top ?? 0
    }) as typeof window.scrollTo)

    render(
      <MemoryRouter initialEntries={['/history']}>
        <ScrollToTop />
        <LayoutProbe onLayout={(pathname) => positionsSeenByRoute.set(pathname, scrollPosition)} />
      </MemoryRouter>,
    )

    scrollPosition = 354
    fireEvent.click(screen.getByRole('link', { name: '决策' }))

    expect(positionsSeenByRoute.get('/')).toBe(0)
  })
})
