import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { useMobileNavigation } from './MobileNavigationContext'
import { MobileNavigationProvider } from './MobileNavigationProvider'

function NavigationHarness({ overlayLog }: { overlayLog: string[] }): React.JSX.Element {
  const navigation = useMobileNavigation()
  const routerNavigate = useNavigate()

  return (
    <>
      <output data-testid="depth">{navigation.historyDepth}</output>
      <output data-testid="direction">{navigation.direction}</output>
      <button type="button" onClick={() => navigation.navigateForward('/history')}>push</button>
      <button type="button" onClick={() => routerNavigate('/statistics', { replace: true })}>replace</button>
      <button type="button" onClick={navigation.navigateBack}>back</button>
      <button type="button" onClick={() => navigation.registerOverlay(() => overlayLog.push('first'))}>first overlay</button>
      <button type="button" onClick={() => navigation.registerOverlay(() => overlayLog.push('second'))}>second overlay</button>
      <button type="button" onClick={navigation.closeTopOverlay}>close overlay</button>
    </>
  )
}

describe('MobileNavigationProvider', () => {
  it('tracks internal PUSH, REPLACE, and POP navigation depth and direction', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <MobileNavigationProvider>
          <NavigationHarness overlayLog={[]} />
        </MobileNavigationProvider>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('depth')).toHaveTextContent('0')
    fireEvent.click(screen.getByRole('button', { name: 'push' }))
    expect(screen.getByTestId('depth')).toHaveTextContent('1')
    expect(screen.getByTestId('direction')).toHaveTextContent('forward')

    fireEvent.click(screen.getByRole('button', { name: 'replace' }))
    expect(screen.getByTestId('depth')).toHaveTextContent('1')

    fireEvent.click(screen.getByRole('button', { name: 'back' }))
    expect(screen.getByTestId('depth')).toHaveTextContent('0')
    expect(screen.getByTestId('direction')).toHaveTextContent('back')
  })

  it('closes registered overlays in last-in-first-out order', () => {
    const overlayLog: string[] = []
    render(
      <MemoryRouter>
        <MobileNavigationProvider>
          <NavigationHarness overlayLog={overlayLog} />
        </MobileNavigationProvider>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'first overlay' }))
    fireEvent.click(screen.getByRole('button', { name: 'second overlay' }))
    fireEvent.click(screen.getByRole('button', { name: 'close overlay' }))
    fireEvent.click(screen.getByRole('button', { name: 'close overlay' }))

    expect(overlayLog).toEqual(['second', 'first'])
  })

  it('clears the home exit window after two seconds', () => {
    vi.useFakeTimers()
    function ExitHarness(): React.JSX.Element {
      const navigation = useMobileNavigation()
      return (
        <>
          <output>{navigation.exitPending ? 'armed' : 'clear'}</output>
          <button type="button" onClick={navigation.armExit}>arm</button>
        </>
      )
    }

    render(
      <MemoryRouter>
        <MobileNavigationProvider><ExitHarness /></MobileNavigationProvider>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'arm' }))
    expect(screen.getByText('armed')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(2000))
    expect(screen.getByText('clear')).toBeInTheDocument()
    vi.useRealTimers()
  })
})
