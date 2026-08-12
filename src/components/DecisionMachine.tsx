import { motion } from 'framer-motion'

export function DecisionMachine(): React.JSX.Element {
  return (
    <motion.div
      className="decision-machine"
      aria-label="DECIDE FOR YOU 决策终端"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="decision-machine__orbit decision-machine__orbit--one" />
      <div className="decision-machine__orbit decision-machine__orbit--two" />
      <div className="decision-machine__body">
        <div className="decision-machine__screen">
          <span>DECIDE</span>
          <span>FOR YOU</span>
        </div>
        <div className="decision-machine__slot" />
        <div className="decision-machine__ticket">
          <span>RESULT NO. 0001</span>
          <strong>火锅</strong>
          <i />
        </div>
      </div>
      <span className="decision-machine__status">SYSTEM READY</span>
    </motion.div>
  )
}
