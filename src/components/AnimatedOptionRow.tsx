import { motion, useIsPresent, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

interface AnimatedOptionRowProps {
  children: ReactNode
  gap: number
}

// Animate the row's occupied space so both following rows and the footer move together.
export function AnimatedOptionRow({ children, gap }: AnimatedOptionRowProps): React.JSX.Element {
  const reducedMotion = useReducedMotion()
  const isPresent = useIsPresent()

  return (
    <motion.div
      className="option-editor__animated-row"
      inert={!isPresent}
      initial={reducedMotion ? false : { height: 0, opacity: 0, marginBottom: 0 }}
      animate={{ height: 'auto', opacity: 1, marginBottom: gap }}
      exit={{ height: 0, opacity: 0, marginBottom: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
