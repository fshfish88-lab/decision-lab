import { fireEvent, render, screen } from '@testing-library/react'
import type { HTMLAttributes, ReactNode } from 'react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MobileNavigationContext, type MobileNavigationValue } from './MobileNavigationContext'
import type { MobileRouteMotion } from './mobilePrimaryNavigationMotion'
import { MobileRouteTransition } from './MobileRouteTransition'

const motionSettings = vi.hoisted(() => ({ reduced: false }))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children, mode, initial }: {
    children: ReactNode
    mode: string
    initial: boolean
    custom?: MobileRouteMotion
  }) => (
    <div data-testid="presence" data-mode={mode} data-initial={String(initial)}>{children}</div>
  ),
  motion: {
    div: ({
      children,
      custom,
      variants,
      initial,
      exit,
      transition,
      ...props
    }: HTMLAttributes<HTMLDivElement> & {
      children?: ReactNode
      custom?: MobileRouteMotion
      variants?: {
        enter: (motion: MobileRouteMotion) => { x: number | string }
        exit: (motion: MobileRouteMotion) => { x: number | string }
      }
      initial: unknown
      exit: unknown
      transition: { duration: number }
    }) => {
      const initialX = custom && variants && initial === 'enter'
        ? variants.enter(custom).x
        : typeof initial === 'object' && initial && 'x' in initial
          ? String(initial.x)
          : undefined
      const exitX = custom && variants && exit === 'exit'
        ? variants.exit(custom).x
        : typeof exit === 'object' && exit && 'x' in exit
          ? String(exit.x)
          : undefined
      return (
        <div
          {...props}
          data-testid="motion-page"
          data-initial-x={initialX}
          data-exit-x={exitX}
          data-duration={transition.duration}
        >
          {children}
        </div>
      )
    },
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

function Harness({ target }: { target: string }): React.JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <button type="button" onClick={() => navigate(target)}>切换</button>
      <MobileRouteTransition><p>{location.pathname}</p></MobileRouteTransition>
    </>
  )
}

function renderTransition(from: string, to: string, direction: 'forward' | 'back' = 'forward') {
  return render(
    <MemoryRouter initialEntries={[from]}>
      <MobileNavigationContext.Provider value={navigationValue(direction)}>
        <Harness target={to} />
      </MobileNavigationContext.Provider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  motionSettings.reduced = false
})

describe('MobileRouteTransition', () => {
  it('uses a forward full-width scene for later primary destinations', () => {
    renderTransition('/', '/statistics')
    expect(screen.getByTestId('presence')).toHaveAttribute('data-initial', 'false')
    fireEvent.click(screen.getByRole('button', { name: '切换' }))
    expect(screen.getByTestId('presence')).toHaveAttribute('data-mode', 'popLayout')
    expect(screen.getByTestId('motion-page')).toHaveAttribute('data-initial-x', '100%')
    expect(screen.getByTestId('motion-page')).toHaveAttribute('data-exit-x', '-100%')
    expect(screen.getByTestId('motion-page')).toHaveAttribute('data-duration', '0.26')
    expect(screen.getByTestId('motion-page')).toHaveAttribute('data-motion-kind', 'primary')
  })

  it('uses a backward full-width scene for earlier primary destinations', () => {
    renderTransition('/about', '/history')
    fireEvent.click(screen.getByRole('button', { name: '切换' }))
    expect(screen.getByTestId('motion-page')).toHaveAttribute('data-initial-x', '-100%')
    expect(screen.getByTestId('motion-page')).toHaveAttribute('data-exit-x', '100%')
  })

  it('keeps the subtle forward and back motion for flow boundaries', () => {
    const forward = renderTransition('/', '/science')
    fireEvent.click(screen.getByRole('button', { name: '切换' }))
    expect(screen.getByTestId('motion-page')).toHaveAttribute('data-initial-x', '10')
    expect(screen.getByTestId('motion-page')).toHaveAttribute('data-duration', '0.22')
    forward.unmount()

    renderTransition('/science', '/', 'back')
    fireEvent.click(screen.getByRole('button', { name: '切换' }))
    expect(screen.getByTestId('motion-page')).toHaveAttribute('data-initial-x', '-10')
    expect(screen.getByTestId('motion-page')).toHaveAttribute('data-exit-x', '10')
  })

  it('removes horizontal motion when reduced motion is requested', () => {
    motionSettings.reduced = true
    renderTransition('/', '/statistics')
    fireEvent.click(screen.getByRole('button', { name: '切换' }))
    expect(screen.getByTestId('motion-page')).toHaveAttribute('data-initial-x', '0')
    expect(screen.getByTestId('motion-page')).toHaveAttribute('data-exit-x', '0')
    expect(screen.getByTestId('motion-page')).toHaveAttribute('data-duration', '0.08')
  })
})
