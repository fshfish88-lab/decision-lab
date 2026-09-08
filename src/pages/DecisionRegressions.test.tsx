import { useEffect } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { MobileNavigationProvider } from '../mobile/navigation/MobileNavigationProvider'
import { PlatformContext, type AppPlatform } from '../platform/PlatformContext'
import { useDecision } from '../state/DecisionContext'
import { DecisionProvider } from '../state/DecisionProvider'
import { saveHistoryItem } from '../storage/history'
import type { DecisionResult } from '../types/decision'
import { ResultPage } from './ResultPage'
import { SciencePage } from './SciencePage'

const historical: DecisionResult = {
  id: 'historical', question: '原来的问题', createdAt: '2026-09-08T00:00:00Z',
  mode: 'random', options: [{ id: 'a', label: '原选项 A' }, { id: 'b', label: '原选项 B' }],
  winner: { id: 'a', label: '原选项 A' }, explanation: '等概率', confidence: 100, metrics: [],
}

function SeedDraft(): null {
  const { dispatch } = useDecision()
  useEffect(() => {
    dispatch({ type: 'restore-draft', draft: { question: '不同的问题', mode: 'scientific',
      options: [{ id: 'x', label: '其他选项 X' }, { id: 'y', label: '其他选项 Y' }] } })
  }, [dispatch])
  return null
}

function DraftProbe(): React.JSX.Element {
  const { state } = useDecision()
  return <pre data-testid="draft">{JSON.stringify(state)}</pre>
}

function setup(platform: AppPlatform, path: string, seed = false): void {
  render(<MemoryRouter initialEntries={[path]}><DecisionProvider>
    <PlatformContext.Provider value={platform}><MobileNavigationProvider>
      {seed ? <SeedDraft /> : null}
      <Routes>
        <Route path="/result" element={<ResultPage />} />
        <Route path="/science" element={<SciencePage />} />
        <Route path="*" element={<DraftProbe />} />
      </Routes>
    </MobileNavigationProvider></PlatformContext.Provider>
  </DecisionProvider></MemoryRouter>)
}

describe.each<AppPlatform>(['web', 'app'])('%s decision regressions', (platform) => {
  beforeEach(() => { localStorage.clear(); saveHistoryItem(historical) })

  it('reruns the displayed history after an empty-state reload', () => {
    setup(platform, '/result')
    fireEvent.click(screen.getByRole('button', { name: '再来一次' }))
    expect(JSON.parse(screen.getByTestId('draft').textContent!)).toMatchObject({
      question: historical.question, options: historical.options, mode: 'random', result: null,
    })
  })

  it.each(['修改选项', '换一种模式'])('restores the displayed historical options for %s, not a different draft', (action) => {
    setup(platform, '/result?id=historical', true)
    fireEvent.click(screen.getByRole('button', { name: action }))
    expect(JSON.parse(screen.getByTestId('draft').textContent!)).toMatchObject({
      question: historical.question, options: historical.options,
      mode: action === '换一种模式' ? null : 'random', result: null,
    })
  })

  it('edits criteria independently after add-delete-add', () => {
    setup(platform, '/science', true)
    fireEvent.click(screen.getByRole('button', { name: '添加指标' }))
    fireEvent.change(screen.getAllByRole('textbox', { name: '指标名称' }).at(-1)!, { target: { value: '保留指标' } })
    fireEvent.click(screen.getByRole('button', { name: '删除指标 喜欢程度' }))
    fireEvent.click(screen.getByRole('button', { name: '添加指标' }))
    fireEvent.change(screen.getAllByRole('textbox', { name: '指标名称' }).at(-1)!, { target: { value: '单独编辑' } })
    expect(screen.getAllByRole('textbox', { name: '指标名称' }).map(input => (input as HTMLInputElement).value))
      .toEqual(['价格友好', '距离便利', '执行便利', '保留指标', '单独编辑'])
  })
})
