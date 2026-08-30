import { useCallback, useEffect, useMemo, useReducer, useRef, type PropsWithChildren } from 'react'
import { useLocation, useNavigate, useNavigationType, type NavigateOptions, type To } from 'react-router-dom'

import { MobileNavigationContext, type MobileNavigationValue } from './MobileNavigationContext'
import {
  initialMobileNavigationState,
  mobileNavigationReducer,
  type MobileNavigationType,
} from './mobileNavigationState'

const EXIT_WINDOW_MS = 2000

export function MobileNavigationProvider({ children }: PropsWithChildren): React.JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  const [state, dispatch] = useReducer(mobileNavigationReducer, initialMobileNavigationState)
  const previousLocationKeyRef = useRef<string | null>(null)
  const overlaySequenceRef = useRef(0)
  const overlayCallbacksRef = useRef(new Map<string, () => void>())
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const exitTokenRef = useRef(0)

  const clearExitTimer = useCallback((): void => {
    if (exitTimerRef.current !== null) {
      clearTimeout(exitTimerRef.current)
      exitTimerRef.current = null
    }
  }, [])

  const clearExitPending = useCallback((): void => {
    clearExitTimer()
    dispatch({ type: 'exit-cleared' })
  }, [clearExitTimer])

  useEffect(() => {
    if (previousLocationKeyRef.current === null) {
      previousLocationKeyRef.current = location.key
      if (location.pathname !== '/') clearExitPending()
      return
    }
    if (previousLocationKeyRef.current === location.key) return
    previousLocationKeyRef.current = location.key
    if (location.pathname !== '/') clearExitTimer()
    dispatch({
      type: 'route-committed',
      navigationType: navigationType as MobileNavigationType,
      pathname: location.pathname,
    })
  }, [clearExitPending, clearExitTimer, location.key, location.pathname, navigationType])

  useEffect(() => () => {
    clearExitTimer()
    overlayCallbacksRef.current.clear()
  }, [clearExitTimer])

  const navigateForward = useCallback((to: To, options?: NavigateOptions): void => {
    if (typeof to === 'string' && to === location.pathname) return
    dispatch({ type: 'direction-set', direction: 'forward' })
    navigate(to, options)
  }, [location.pathname, navigate])

  const navigateBack = useCallback((): void => {
    dispatch({ type: 'direction-set', direction: 'back' })
    if (state.historyDepth > 0) {
      navigate(-1)
      return
    }
    if (location.pathname !== '/') navigate('/', { replace: true })
  }, [location.pathname, navigate, state.historyDepth])

  const registerOverlay = useCallback((close: () => void): (() => void) => {
    const id = `mobile-overlay-${overlaySequenceRef.current += 1}`
    let registered = true
    overlayCallbacksRef.current.set(id, close)
    dispatch({ type: 'overlay-added', id })

    return (): void => {
      if (!registered) return
      registered = false
      overlayCallbacksRef.current.delete(id)
      dispatch({ type: 'overlay-removed', id })
    }
  }, [])

  const closeTopOverlay = useCallback((): boolean => {
    const id = state.overlayIds.at(-1)
    if (!id) return false
    const close = overlayCallbacksRef.current.get(id)
    overlayCallbacksRef.current.delete(id)
    dispatch({ type: 'overlay-removed', id })
    close?.()
    return true
  }, [state.overlayIds])

  const armExit = useCallback((): void => {
    clearExitTimer()
    const token = exitTokenRef.current += 1
    dispatch({ type: 'exit-armed', token })
    exitTimerRef.current = setTimeout(() => {
      exitTimerRef.current = null
      dispatch({ type: 'exit-cleared', token })
    }, EXIT_WINDOW_MS)
  }, [clearExitTimer])

  const value = useMemo<MobileNavigationValue>(() => ({
    direction: state.direction,
    historyDepth: state.historyDepth,
    exitPending: state.exitPending,
    isRoot: location.pathname === '/',
    navigateForward,
    navigateBack,
    registerOverlay,
    closeTopOverlay,
    armExit,
    clearExitPending,
  }), [
    armExit,
    clearExitPending,
    closeTopOverlay,
    location.pathname,
    navigateBack,
    navigateForward,
    registerOverlay,
    state.direction,
    state.exitPending,
    state.historyDepth,
  ])

  return <MobileNavigationContext.Provider value={value}>{children}</MobileNavigationContext.Provider>
}
