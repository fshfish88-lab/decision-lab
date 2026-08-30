import { ArrowLeft } from 'lucide-react'

interface MobilePageHeaderProps {
  title: string
  eyebrow?: string
  onBack?: () => void
}

export function MobilePageHeader({ title, eyebrow, onBack }: MobilePageHeaderProps): React.JSX.Element {
  return (
    <header className="mobile-page-header">
      {onBack ? (
        <button type="button" aria-label="返回" onClick={onBack}>
          <ArrowLeft size={21} aria-hidden="true" />
        </button>
      ) : null}
      <div>
        {eyebrow ? <span>{eyebrow}</span> : null}
        <h1>{title}</h1>
      </div>
    </header>
  )
}
