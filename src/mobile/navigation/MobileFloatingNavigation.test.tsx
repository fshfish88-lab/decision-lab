import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MobileFloatingNavigation } from './MobileFloatingNavigation'
import { MobileNavigationContext, type MobileNavigationValue } from './MobileNavigationContext'

const motionSettings = vi.hoisted(() => ({ reduced: false }))

vi.mock('framer-motion', () => ({ useReducedMotion: () => motionSettings.reduced }))

function navigationValue(navigateForward = vi.fn()): MobileNavigationValue {
  return {
    direction: 'forward',
    historyDepth: 0,
    exitPending: false,
    isRoot: true,
    navigateForward,
    navigateBack: vi.fn(),
    registerOverlay: vi.fn(() => vi.fn()),
    closeTopOverlay: vi.fn(() => false),
    armExit: vi.fn(),
    clearExitPending: vi.fn(),
  }
}

function renderNavigation(pathname: string, value = navigationValue()) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <MobileNavigationContext.Provider value={value}>
        <MobileFloatingNavigation />
      </MobileNavigationContext.Provider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  motionSettings.reduced = false
})

describe('MobileFloatingNavigation', () => {
  it('renders one indicator at the active route and keeps aria-current on the link', () => {
    renderNavigation('/statistics')

    expect(screen.getByRole('navigation', { name: 'App 主导航' })).toBeInTheDocument()
    expect(screen.getAllByTestId('mobile-navigation-indicator')).toHaveLength(1)
    expect(screen.getByTestId('mobile-navigation-indicator')).toHaveAttribute('data-active-index', '2')
    expect(screen.getByTestId('mobile-navigation-indicator')).toHaveStyle({ transform: 'translateX(200%)' })
    expect(screen.getByRole('link', { name: '统计' })).toHaveAttribute('aria-current', 'page')

  })

  it('does not navigate when the current destination is clicked', () => {
    const navigateForward = vi.fn()
    renderNavigation('/statistics', navigationValue(navigateForward))

    fireEvent.click(screen.getByRole('link', { name: '统计' }))

    expect(navigateForward).not.toHaveBeenCalled()
  })

  it('removes indicator and press animation for reduced motion', () => {
    motionSettings.reduced = true
    renderNavigation('/')

    expect(screen.getByTestId('mobile-navigation-indicator')).toHaveStyle({ transition: 'none' })
    expect(screen.getByTestId('mobile-navigation-target-决策')).not.toHaveAttribute('data-while-tap-scale')
  })
})
