interface MobileStickyActionProps {
  label: string
  disabled?: boolean
  helperText?: string | null
  onClick: () => void
}

export function MobileStickyAction({
  label,
  disabled = false,
  helperText,
  onClick,
}: MobileStickyActionProps): React.JSX.Element {
  return (
    <div className="mobile-sticky-action">
      {helperText ? <p>{helperText}</p> : null}
      <button type="button" disabled={disabled} onClick={onClick}>
        {label}
      </button>
    </div>
  )
}
