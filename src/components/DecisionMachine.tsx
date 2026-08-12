import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

const TICKETS = ['火锅', '去散步', '买吧', '睡觉', '不去了', '再想五分钟'] as const
const TICKET_INTERVAL_MS = 4200

export function getNextTicketIndex(
  currentIndex: number,
  ticketCount: number,
  randomValue = Math.random(),
): number {
  if (ticketCount <= 1) return 0

  const normalizedRandom = Math.min(Math.max(randomValue, 0), 0.999999)
  const offset = Math.floor(normalizedRandom * (ticketCount - 1)) + 1
  return (currentIndex + offset) % ticketCount
}

export function DecisionMachine(): React.JSX.Element {
  const reducedMotion = useReducedMotion()
  const [ticket, setTicket] = useState({ index: 0, serial: 1 })

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTicket((current) => ({
        index: getNextTicketIndex(current.index, TICKETS.length),
        serial: current.serial + 1,
      }))
    }, TICKET_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <motion.div
      className="decision-machine"
      role="img"
      aria-label="DECIDE FOR YOU 决策终端"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="decision-machine__orbit decision-machine__orbit--one" />
      <div className="decision-machine__orbit decision-machine__orbit--two" />
      <motion.div
        className="decision-machine__body"
        animate={
          reducedMotion || ticket.serial === 1
            ? undefined
            : { x: [0, -3, 3, -1, 0], rotate: [0, -0.6, 0.6, 0] }
        }
        transition={{ duration: 0.42, ease: 'easeInOut' }}
      >
        <div className="decision-machine__screen">
          <span>DECIDE</span>
          <span>FOR YOU</span>
        </div>
        <div className="decision-machine__slot" />
        <motion.div
          key={ticket.serial}
          className="decision-machine__ticket"
          initial={reducedMotion ? false : { y: -24, scaleY: 0.45, opacity: 0.2 }}
          animate={{ y: 0, scaleY: 1, opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.58, ease: [0.22, 1, 0.36, 1] }}
        >
          <span>RESULT NO. {String(ticket.serial).padStart(4, '0')}</span>
          <strong>{TICKETS[ticket.index]}</strong>
          <i />
        </motion.div>
      </motion.div>
      <span className="decision-machine__status">SYSTEM READY</span>
    </motion.div>
  )
}
