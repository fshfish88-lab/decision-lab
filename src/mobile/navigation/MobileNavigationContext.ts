import { createContext, useContext } from 'react'
import type { NavigateOptions, To } from 'react-router-dom'

import type { MobileNavigationDirection } from './mobileNavigationState'

export interface MobileNavigationValue {
  direction: MobileNavigationDirection
  historyDepth: number
  exitPending: boolean
  isRoot: boolean
  navigateForward: (to: To, options?: NavigateOptions) => void
  navigateBack: () => void
  registerOverlay: (close: () => void) => () => void
  closeTopOverlay: () => boolean
  armExit: () => void
  clearExitPending: () => void
}

export const MobileNavigationContext = createContext<MobileNavigationValue | null>(null)

export function useMobileNavigation(): MobileNavigationValue {
  const value = useContext(MobileNavigationContext)
  if (!value) throw new Error('useMobileNavigation must be used within MobileNavigationProvider')
  return value
}
