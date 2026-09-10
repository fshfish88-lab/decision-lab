import { AnimatePresence } from 'framer-motion'
import { GripVertical, Plus, X } from 'lucide-react'

import type { DecisionOption } from '../types/decision'
import { AnimatedOptionRow } from './AnimatedOptionRow'

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
        <AnimatePresence initial={false}>
          {options.map((option, index) => (
            <AnimatedOptionRow key={option.id} gap={index === options.length - 1 ? 0 : 9}>
              <div className="option-row">
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
                  onClick={() => {
                    document.getElementById(options[index + 1]?.id ?? options[index - 1]?.id)?.focus()
                    onRemove(option.id)
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </AnimatedOptionRow>
          ))}
        </AnimatePresence>
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
