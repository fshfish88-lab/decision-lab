import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { MobileNavigationContext, type MobileNavigationValue } from './MobileNavigationContext'
import { MobileRouteTransition } from './MobileRouteTransition'

const motionSettings = vi.hoisted(() => ({ reduced: false }))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children, mode }: { children: React.ReactNode; mode: string }) => (
    <div data-testid="presence" data-mode={mode}>{children}</div>
  ),
  motion: {
    div: ({
      children,
      initial,
      exit,
      transition,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
      initial: { x: number }
      exit: { x: number }
      transition: { duration: number }
    }) => (
      <div
        {...props}
        data-testid="motion-page"
        data-initial-x={initial.x}
        data-exit-x={exit.x}
        data-duration={transition.duration}
      >
        {children}
      </div>
    ),
  },
  useReducedMotion: () => motionSettings.reduced,
}))

function navigationValue(direction: 'forward' | 'back'): MobileNavigationValue {
  return {
    direction,
    historyDepth: 0,
    exitPending: false,
    isRoot: true,
    navigateForward: vi.fn(),
    navigateBack: vi.fn(),
    registerOverlay: vi.fn(() => vi.fn()),
    closeTopOverlay: vi.fn(() => false),
    armExit: vi.fn(),
    clearExitPending: vi.fn(),
  }
}

function renderTransition(direction: 'forward' | 'back') {
  return render(
    <MemoryRouter>
      <MobileNavigationContext.Provider value={navigationValue(direction)}>
        <MobileRouteTransition><p>页面内容</p></MobileRouteTransition>
      </MobileNavigationContext.Provider>
    </MemoryRouter>,
  )
}

describe('MobileRouteTransition', () => {
  it('uses sync presence and opposite subtle offsets for forward and back', () => {
    motionSettings.reduced = false
    const forward = renderTransition('forward')
    expect(screen.getByTestId('presence')).toHaveAttribute('data-mode', 'sync')
    expect(screen.getByTestId('motion-page')).toHaveAttribute('data-initial-x', '10')
    expect(screen.getByTestId('motion-page')).toHaveAttribute('data-exit-x', '-10')
    expect(screen.getByTestId('motion-page')).toHaveAttribute('data-duration', '0.22')
    forward.unmount()

    renderTransition('back')
    expect(screen.getByTestId('motion-page')).toHaveAttribute('data-initial-x', '-10')
    expect(screen.getByTestId('motion-page')).toHaveAttribute('data-exit-x', '10')
  })

  it('removes horizontal motion when reduced motion is requested', () => {
    motionSettings.reduced = true
    renderTransition('forward')
    expect(screen.getByTestId('motion-page')).toHaveAttribute('data-initial-x', '0')
    expect(screen.getByTestId('motion-page')).toHaveAttribute('data-exit-x', '0')
    expect(screen.getByTestId('motion-page')).toHaveAttribute('data-duration', '0.08')
    motionSettings.reduced = false
  })
})
