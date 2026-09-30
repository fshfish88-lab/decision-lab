import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

afterEach(() => vi.restoreAllMocks())

it('contains render failures and restores children when retry succeeds', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  let crash = true
  function Child(): React.JSX.Element {
    if (crash) throw new Error('injected render failure')
    return <p>页面已恢复</p>
  }
  render(<ErrorBoundary><Child /></ErrorBoundary>)
  expect(screen.getByRole('alert')).toHaveTextContent('这次分析没能完成')
  expect(screen.getByRole('button', { name: '返回首页' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '重试一次' }))
  expect(screen.getByRole('alert')).toBeInTheDocument()
  crash = false
  fireEvent.click(screen.getByRole('button', { name: '重试一次' }))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(screen.getByText('页面已恢复')).toBeInTheDocument()
})
