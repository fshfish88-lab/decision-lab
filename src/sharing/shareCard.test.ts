import { describe, expect, it, vi } from 'vitest'

import type { DecisionResult } from '../types/decision'
import { buildShareText, renderShareCardBlob } from './shareCard'

const result: DecisionResult = {
  id: 'share-1',
  createdAt: '2026-08-13T08:00:00.000Z',
  question: '今晚吃什么？',
  options: [
    { id: 'hotpot', label: '火锅' },
    { id: 'sushi', label: '日料' },
  ],
  mode: 'random',
  winner: { id: 'hotpot', label: '火锅' },
  explanation: '等概率抽取后，火锅胜出。',
  confidence: 100,
  metrics: [],
}

describe('share card service', () => {
  it('builds deterministic, honest result text', () => {
    expect(buildShareText(result)).toBe([
      'DECISION LAB',
      '今晚吃什么？',
      '系统最终决定：火锅',
      '决策模式：随机模式',
      '可信度：100.0%',
      '不要再纠结了。',
      '结果仅供个人决策参考。',
    ].join('\n'))
  })

  it('renders a 1080 by 1350 PNG blob', async () => {
    const canvas = document.createElement('canvas')
    const context = {
      fillStyle: '',
      font: '',
      textAlign: 'left',
      fillRect: vi.fn(),
      fillText: vi.fn(),
    }
    Object.defineProperty(canvas, 'getContext', { value: () => context })
    Object.defineProperty(canvas, 'toBlob', {
      value: (callback: BlobCallback) => callback(new Blob(['png'], { type: 'image/png' })),
    })

    const blob = await renderShareCardBlob(result, () => canvas)

    expect(canvas.width).toBe(1080)
    expect(canvas.height).toBe(1350)
    expect(blob.type).toBe('image/png')
    expect(context.fillText).toHaveBeenCalledWith('火锅', 540, 720)
  })

  it('reports unavailable canvas creation instead of hiding the failure', async () => {
    await expect(renderShareCardBlob(result, () => null)).rejects.toThrow('无法创建分享画布')
  })
})
