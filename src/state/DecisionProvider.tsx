import { useMemo, useReducer } from 'react'
import type { PropsWithChildren } from 'react'

import { DecisionContext } from './DecisionContext'
import { decisionReducer, initialDecisionState } from './decisionReducer'

export function DecisionProvider({ children }: PropsWithChildren): React.JSX.Element {
  const [state, dispatch] = useReducer(decisionReducer, initialDecisionState)
  const value = useMemo(() => ({ state, dispatch }), [state])

  return <DecisionContext.Provider value={value}>{children}</DecisionContext.Provider>
}
