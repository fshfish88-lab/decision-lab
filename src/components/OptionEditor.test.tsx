import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { MobileOptionEditor } from '../mobile/components/MobileOptionEditor'
import { OptionEditor } from './OptionEditor'

describe.each([['web', OptionEditor], ['app', MobileOptionEditor]] as const)('%s option editing', (_, Editor) => {
  function Harness(): React.JSX.Element {
    const [options, setOptions] = useState([
      { id: 'one', label: '看展' },
      { id: 'two', label: '爬山' },
      { id: 'three', label: '骑行' },
    ])
    return (
      <Editor
        options={options}
        onChange={(id, label) => setOptions(current => current.map(option => option.id === id ? { ...option, label } : option))}
        onAdd={() => setOptions(current => [...current, { id: crypto.randomUUID(), label: '' }])}
        onRemove={id => setOptions(current => current.filter(option => option.id !== id))}
      />
    )
  }

  it('keeps surviving input identity and keyboard focus while the removed row exits', async () => {
    const user = userEvent.setup()
    const { container } = render(<Harness />)
    const survivingInput = screen.getByDisplayValue('骑行')
    await user.click(screen.getByRole('button', { name: '删除选项 2' }))
    expect(survivingInput).toHaveFocus()
    expect(container.querySelector('[inert]')).toBeInTheDocument()
    await user.type(survivingInput, '到公园')
    expect(survivingInput).toHaveValue('骑行到公园')
    await waitFor(() => expect(screen.queryByDisplayValue('爬山')).not.toBeInTheDocument())
    expect(screen.getByLabelText('选项 2')).toBe(survivingInput)
    expect(screen.getAllByRole('button', { name: /删除选项/ }).every(button => button.hasAttribute('disabled'))).toBe(true)
  })

  it('allows typing into an added row immediately without losing the existing values', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: '添加选项' }))
    await user.type(screen.getByLabelText('选项 4'), '喝茶')
    expect(screen.getByLabelText('选项 4')).toHaveValue('喝茶')
    expect(screen.getByLabelText('选项 1')).toHaveValue('看展')
    expect(screen.getByLabelText('选项 3')).toHaveValue('骑行')
  })
})
