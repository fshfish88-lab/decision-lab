import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DecisionMachine } from './DecisionMachine'
import { getNextTicketIndex } from './decisionMachineTickets'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('DecisionMachine', () => {
  it('picks a different ticket from the current one', () => {
    expect(getNextTicketIndex(0, 6, 0)).toBe(1)
    expect(getNextTicketIndex(2, 6, 0.999)).not.toBe(2)
  })

  it('prints a new ticket after one cycle', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    render(<DecisionMachine />)

    expect(screen.getByText('RESULT NO. 0001')).toBeInTheDocument()
    expect(screen.getByText('火锅')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(4200))

    expect(screen.getByText('RESULT NO. 0002')).toBeInTheDocument()
    expect(screen.getByText('去散步')).toBeInTheDocument()
  })
})
