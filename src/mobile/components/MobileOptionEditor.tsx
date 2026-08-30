import { Plus, X } from 'lucide-react'

import type { DecisionOption } from '../../types/decision'

interface MobileOptionEditorProps {
  options: DecisionOption[]
  onChange: (id: string, label: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
}

export function MobileOptionEditor({
  options,
  onChange,
  onAdd,
  onRemove,
}: MobileOptionEditorProps): React.JSX.Element {
  return (
    <div className="mobile-option-editor">
      <div className="mobile-option-editor__list">
        {options.map((option, index) => (
          <div className="mobile-option-row" key={option.id}>
            <label className="sr-only" htmlFor={`mobile-${option.id}`}>
              选项 {index + 1}
            </label>
            <span className="mobile-option-row__number" aria-hidden="true">{index + 1}</span>
            <input
              id={`mobile-${option.id}`}
              type="text"
              maxLength={30}
              required
              placeholder={`输入选项 ${index + 1}`}
              value={option.label}
              onChange={(event) => onChange(option.id, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && options.length < 10) {
                  event.preventDefault()
                  onAdd()
                }
              }}
            />
            <button
              type="button"
              aria-label={`删除选项 ${index + 1}`}
              disabled={options.length <= 2}
              onClick={() => onRemove(option.id)}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      <div className="mobile-option-editor__footer">
        <button type="button" disabled={options.length >= 10} onClick={onAdd}>
          <Plus size={18} aria-hidden="true" />
          添加选项
        </button>
        <span>{options.length} / 10</span>
      </div>
    </div>
  )
}
