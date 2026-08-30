export type MobileNavigationDirection = 'forward' | 'back'
export type MobileNavigationType = 'PUSH' | 'REPLACE' | 'POP'

export interface MobileNavigationState {
  direction: MobileNavigationDirection
  historyDepth: number
  overlayIds: string[]
  exitPending: boolean
  exitToken: number
}

export type MobileNavigationAction =
  | { type: 'route-committed'; navigationType: MobileNavigationType; pathname: string }
  | { type: 'direction-set'; direction: MobileNavigationDirection }
  | { type: 'overlay-added'; id: string }
  | { type: 'overlay-removed'; id: string }
  | { type: 'exit-armed'; token: number }
  | { type: 'exit-cleared'; token?: number }

export const initialMobileNavigationState: MobileNavigationState = {
  direction: 'forward',
  historyDepth: 0,
  overlayIds: [],
  exitPending: false,
  exitToken: 0,
}

export function mobileNavigationReducer(
  state: MobileNavigationState,
  action: MobileNavigationAction,
): MobileNavigationState {
  switch (action.type) {
    case 'route-committed': {
      const historyDepth = action.navigationType === 'PUSH'
        ? state.historyDepth + 1
        : action.navigationType === 'POP'
          ? Math.max(0, state.historyDepth - 1)
          : state.historyDepth
      const direction = action.navigationType === 'PUSH'
        ? 'forward'
        : action.navigationType === 'POP'
          ? 'back'
          : state.direction
      return {
        ...state,
        historyDepth,
        direction,
        exitPending: action.pathname === '/' ? state.exitPending : false,
      }
    }
    case 'direction-set':
      return { ...state, direction: action.direction }
    case 'overlay-added':
      return state.overlayIds.includes(action.id)
        ? state
        : { ...state, overlayIds: [...state.overlayIds, action.id] }
    case 'overlay-removed': {
      const overlayIds = state.overlayIds.filter((id) => id !== action.id)
      return overlayIds.length === state.overlayIds.length ? state : { ...state, overlayIds }
    }
    case 'exit-armed':
      return { ...state, exitPending: true, exitToken: action.token }
    case 'exit-cleared':
      return action.token !== undefined && action.token !== state.exitToken
        ? state
        : { ...state, exitPending: false }
  }
}
