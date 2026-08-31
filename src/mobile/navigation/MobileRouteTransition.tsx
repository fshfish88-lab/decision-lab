import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useLayoutEffect, useRef, type PropsWithChildren } from 'react'
import { useLocation } from 'react-router-dom'

import { useMobileNavigation } from './MobileNavigationContext'
import { getMobileRouteMotion, type MobileRouteMotion } from './mobilePrimaryNavigationMotion'

const pageVariants = {
  enter: (routeMotion: MobileRouteMotion) => ({
    opacity: routeMotion.enterOpacity,
    x: routeMotion.enterX,
  }),
  center: { opacity: 1, x: 0 },
  exit: (routeMotion: MobileRouteMotion) => ({
    opacity: routeMotion.kind === 'primary' ? 0.98 : 0,
    x: routeMotion.exitX,
  }),
}

export function MobileRouteTransition({ children }: PropsWithChildren): React.JSX.Element {
  const location = useLocation()
  const { direction } = useMobileNavigation()
  const reducedMotion = Boolean(useReducedMotion())
  const previousPathnameRef = useRef(location.pathname)
  const routeMotion = getMobileRouteMotion(
    previousPathnameRef.current,
    location.pathname,
    direction,
    reducedMotion,
  )

  useLayoutEffect(() => {
    previousPathnameRef.current = location.pathname
  }, [location.pathname])

  return (
    <AnimatePresence mode="popLayout" initial={false} custom={routeMotion}>
      <motion.div
        key={location.key}
        className="mobile-route-transition"
        data-motion-kind={routeMotion.kind}
        data-route-key={location.key}
        custom={routeMotion}
        variants={pageVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: routeMotion.duration, ease: routeMotion.ease }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
