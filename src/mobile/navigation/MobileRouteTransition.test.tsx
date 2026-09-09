import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MobileNavigationContext, type MobileNavigationValue } from './MobileNavigationContext'
import { MobileRouteTransition } from './MobileRouteTransition'

const motionSettings = vi.hoisted(() => ({ reduced: false }))
vi.mock('framer-motion', () => ({ useReducedMotion: () => motionSettings.reduced }))

function Harness({ target }: { target: string }): React.JSX.Element {
  const navigate = useNavigate()
  return <>
    <button onClick={() => navigate(target)}>切换</button>
    <MobileRouteTransition><input aria-label="页面输入" /></MobileRouteTransition>
  </>
}

function setup(from: string, to: string, direction: 'forward' | 'back' = 'forward') {
  const value: MobileNavigationValue = {
    direction, historyDepth: 0, exitPending: false, isRoot: true,
    navigateForward: vi.fn(), navigateBack: vi.fn(), registerOverlay: vi.fn(() => vi.fn()),
    closeTopOverlay: vi.fn(() => false), armExit: vi.fn(), clearExitPending: vi.fn(),
  }
  const result = render(<MemoryRouter initialEntries={[from]}>
    <MobileNavigationContext.Provider value={value}><Harness target={to} /></MobileNavigationContext.Provider>
  </MemoryRouter>)
  const scene = () => result.container.querySelector('.mobile-route-transition') as HTMLElement
  return { ...result, scene }
}

afterEach(() => { motionSettings.reduced = false })

describe('MobileRouteTransition', () => {
  it('does not animate initial launch, then enters from the primary route direction', () => {
    const { scene } = setup('/', '/statistics')
    expect(scene()).not.toHaveClass('is-entering')
    fireEvent.click(screen.getByRole('button', { name: '切换' }))
    expect(scene()).toHaveClass('is-entering')
    expect(scene().style.getPropertyValue('--route-enter-x')).toBe('24px')
    expect(scene()).toHaveAttribute('data-motion-kind', 'primary')
  })

  it('enters earlier primary destinations from the left', () => {
    const { scene } = setup('/about', '/history')
    fireEvent.click(screen.getByRole('button', { name: '切换' }))
    expect(scene().style.getPropertyValue('--route-enter-x')).toBe('-24px')
  })

  it('keeps back navigation subtle at flow boundaries', () => {
    const { scene } = setup('/science', '/', 'back')
    fireEvent.click(screen.getByRole('button', { name: '切换' }))
    expect(scene().style.getPropertyValue('--route-enter-x')).toBe('-10px')
    expect(scene()).toHaveAttribute('data-motion-kind', 'flow')
  })

  it('does not animate when reduced motion is requested', () => {
    motionSettings.reduced = true
    const { scene } = setup('/', '/statistics')
    fireEvent.click(screen.getByRole('button', { name: '切换' }))
    expect(scene()).not.toHaveClass('is-entering')
  })
})
