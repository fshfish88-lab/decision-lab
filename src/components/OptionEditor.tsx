import { GripVertical, Plus, X } from 'lucide-react'

import type { DecisionOption } from '../types/decision'

interface OptionEditorProps {
  options: DecisionOption[]
  onChange: (id: string, label: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
}

export function OptionEditor({
  options,
  onChange,
  onAdd,
  onRemove,
}: OptionEditorProps): React.JSX.Element {
  return (
    <div className="option-editor">
      <div className="option-editor__list">
        {options.map((option, index) => (
          <div className="option-row" key={option.id}>
            <GripVertical className="option-row__grip" size={17} aria-hidden="true" />
            <label className="sr-only" htmlFor={option.id}>
              选项 {index + 1}
            </label>
            <input
              id={option.id}
              type="text"
              maxLength={30}
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
              className="icon-button"
              type="button"
              aria-label={`删除选项 ${index + 1}`}
              disabled={options.length <= 2}
              onClick={() => onRemove(option.id)}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <div className="option-editor__footer">
        <button
          className="text-button"
          type="button"
          disabled={options.length >= 10}
          onClick={onAdd}
        >
          <Plus size={16} />
          添加选项
        </button>
        <span>{options.length} / 10</span>
      </div>
    </div>
  )
}
