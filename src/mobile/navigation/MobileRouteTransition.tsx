import { useReducedMotion } from 'framer-motion'
import { useState, type CSSProperties, type PropsWithChildren } from 'react'
import { useLocation } from 'react-router-dom'

import { useMobileNavigation } from './MobileNavigationContext'
import { getMobileRouteMotion } from './mobilePrimaryNavigationMotion'

export function MobileRouteTransition({ children }: PropsWithChildren): React.JSX.Element {
  const location = useLocation()
  const { direction } = useMobileNavigation()
  const reducedMotion = Boolean(useReducedMotion())
  const [scene, setScene] = useState(() => ({
    key: location.key,
    pathname: location.pathname,
    entering: false,
    motion: getMobileRouteMotion(location.pathname, location.pathname, direction, false),
  }))

  // Capture direction once per navigation, before committing the new scene.
  // Provider bookkeeping and page state updates must not retarget an animation.
  let current = scene
  if (scene.key !== location.key) {
    current = {
      key: location.key,
      pathname: location.pathname,
      entering: scene.pathname !== location.pathname,
      motion: getMobileRouteMotion(scene.pathname, location.pathname, direction, false),
    }
    setScene(current)
  }

  const style = {
    '--route-enter-x': `${current.motion.enterX}px`,
    '--route-enter-opacity': current.motion.enterOpacity,
    animationDuration: `${current.motion.duration}s`,
    animationTimingFunction: current.motion.ease,
  } as CSSProperties

  // Keep a single live router subtree. Retained exit trees observe the new
  // router context too, mounting the destination twice and replaying effects.
  return (
    <div
      key={current.key}
      className={`mobile-route-transition${current.entering && !reducedMotion ? ' is-entering' : ''}`}
      data-motion-kind={current.motion.kind}
      data-route-key={current.key}
      style={style}
    >
      {children}
    </div>
  )
}
