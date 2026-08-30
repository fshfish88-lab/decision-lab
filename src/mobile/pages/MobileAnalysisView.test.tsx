import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MobileAnalysisView } from './MobileAnalysisView'

describe('MobileAnalysisView', () => {
  it('shows readable progress and status without desktop console chrome', () => {
    render(
      <MobileAnalysisView
        mode="random"
        title="正在启动命运抽签"
        description="没有偏好，只有一次等概率落点。"
        steps={['正在洗牌', '生成随机指纹', '确认落点']}
        conclusion="命运确认。"
      />,
    )

    expect(screen.getByRole('heading', { name: '正在启动命运抽签' })).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: '决策分析进度' })).toBeInTheDocument()
    expect(screen.getByText('命运确认。')).toBeInTheDocument()
    expect(screen.queryByText('PROCESSING')).not.toBeInTheDocument()
  })
})
