import { motion, useReducedMotion } from 'framer-motion'

import './randomDrawVisual.css'

interface RandomDrawVisualProps {
  winner: string
}

// These three tickets are decorative. The decision engine has already drawn
// the winner; animation never samples candidates or changes that result.
export function RandomDrawVisual({ winner }: RandomDrawVisualProps): React.JSX.Element {
  const reducedMotion = useReducedMotion()

  return (
    <div className="random-draw" aria-hidden="true">
      <div className="random-draw__stage">
        {[-1, 1].map((side) => (
          <motion.div
            className="random-draw__ticket random-draw__ticket--back"
            key={side}
            initial={false}
            animate={reducedMotion
              ? { x: side * 13, y: 5, rotate: side * 5, opacity: 0.5 }
              : {
                  x: [side * 18, side * 51, -side * 37, side * 44, side * 13, side * 13],
                  y: [5, -3, 9, -2, 5, 5],
                  rotate: [side * 5, side * 13, -side * 9, side * 11, side * 5, side * 5],
                  opacity: [0.7, 1, 0.85, 1, 0.5, 0.5],
                }}
            transition={{ duration: reducedMotion ? 0 : 1.65, times: [0, 0.2, 0.4, 0.62, 0.85, 1], ease: 'easeInOut' }}
          >
            <span>DECISION LAB</span><i /><i />
          </motion.div>
        ))}
        <motion.div
          className="random-draw__ticket random-draw__ticket--front"
          initial={false}
          animate={reducedMotion
            ? { y: 0, rotate: 0 }
            : { y: [0, -5, 3, -4, 0], rotate: [0, -3, 3, -2, 0] }}
          transition={{ duration: reducedMotion ? 0 : 1.4, ease: 'easeInOut' }}
        >
          <span>ONE DRAW / EQUAL CHANCE</span>
          <motion.div
            className="random-draw__seal"
            initial={reducedMotion ? false : { opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: reducedMotion ? 0 : 1.3, duration: reducedMotion ? 0 : 0.15 }}
          >
            <i /><i /><i />
          </motion.div>
          <motion.div
            className="random-draw__answer"
            initial={reducedMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reducedMotion ? 0 : 1.4, duration: reducedMotion ? 0 : 0.35, ease: 'easeOut' }}
          >
            <strong>{winner}</strong>
            <small>命运确认</small>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
