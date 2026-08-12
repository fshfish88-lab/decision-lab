import type { CSSProperties } from 'react'

interface MetricRingProps {
  label: string
  value: number
  inverse?: boolean
}

export function MetricRing({ label, value, inverse = false }: MetricRingProps): React.JSX.Element {
  const displayValue = Math.round(value)
  const ringValue = inverse ? 100 - displayValue : displayValue
  const ringStyle = {
    '--metric-value': `${ringValue * 3.6}deg`,
  } as CSSProperties

  return (
    <article className="metric-card">
      <span>{label}</span>
      <div className="metric-ring" style={ringStyle}>
        <strong>{displayValue}%</strong>
      </div>
      <small>{inverse ? '越低越安心' : '当前测算值'}</small>
    </article>
  )
}
