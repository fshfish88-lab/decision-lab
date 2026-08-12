import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

import {
  DECISION_MACHINE_TICKET_INTERVAL_MS,
  DECISION_MACHINE_TICKETS,
  getNextTicketIndex,
} from './decisionMachineTickets'

export function DecisionMachine(): React.JSX.Element {
  const reducedMotion = useReducedMotion()
  const [ticket, setTicket] = useState({ index: 0, serial: 1 })

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTicket((current) => ({
        index: getNextTicketIndex(current.index, DECISION_MACHINE_TICKETS.length),
        serial: current.serial + 1,
      }))
    }, DECISION_MACHINE_TICKET_INTERVAL_MS)

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
        className="decision-machine__body-motion"
        animate={
          reducedMotion || ticket.serial === 1
            ? undefined
            : { x: [0, -3, 3, -1, 0], rotate: [0, -0.6, 0.6, 0] }
        }
        transition={{ duration: 0.42, ease: 'easeInOut' }}
      >
        <div className="decision-machine__body">
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
          <strong>{DECISION_MACHINE_TICKETS[ticket.index]}</strong>
          <i />
        </motion.div>
        </div>
      </motion.div>
      <span className="decision-machine__status">SYSTEM READY</span>
    </motion.div>
  )
}
