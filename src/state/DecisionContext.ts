import { createContext, useContext } from 'react'
import type { Dispatch } from 'react'

import type { DecisionAction, DecisionState } from './decisionReducer'

export interface DecisionContextValue {
  state: DecisionState
  dispatch: Dispatch<DecisionAction>
}

export const DecisionContext = createContext<DecisionContextValue | null>(null)

export function useDecision(): DecisionContextValue {
  const context = useContext(DecisionContext)
  if (!context) {
    throw new Error('useDecision 必须在 DecisionProvider 内使用')
  }
  return context
}
