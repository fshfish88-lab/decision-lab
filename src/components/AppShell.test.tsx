import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AppShell } from './AppShell'

describe('AppShell', () => {
  it('shows the ICP filing link in the site footer', () => {
    render(
      <MemoryRouter>
        <AppShell>
          <main>页面内容</main>
        </AppShell>
      </MemoryRouter>,
    )

    const filingLink = screen.getByRole('link', { name: '浙ICP备2026067685号-1' })

    expect(filingLink).toHaveAttribute('href', 'https://beian.miit.gov.cn/')
    expect(filingLink).toHaveAttribute('target', '_blank')
    expect(filingLink).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
