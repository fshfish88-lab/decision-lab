import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { PropsWithChildren } from 'react'
import { useLocation } from 'react-router-dom'

import { useMobileNavigation } from './MobileNavigationContext'

export function MobileRouteTransition({ children }: PropsWithChildren): React.JSX.Element {
  const location = useLocation()
  const { direction } = useMobileNavigation()
  const reducedMotion = Boolean(useReducedMotion())
  const initialX = reducedMotion ? 0 : direction === 'back' ? -10 : 10
  const exitX = reducedMotion ? 0 : direction === 'back' ? 10 : -10

  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={location.key}
        className="mobile-route-transition"
        data-route-key={location.key}
        initial={{ opacity: 0, x: initialX }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: exitX }}
        transition={{ duration: reducedMotion ? 0.08 : 0.22, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
