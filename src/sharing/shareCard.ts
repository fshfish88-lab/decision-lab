import type { DecisionMode, DecisionResult } from '../types/decision'

const MODE_LABELS: Record<DecisionMode, string> = {
  random: '随机模式',
  scientific: '科学模式',
  mystic: '玄学模式',
  ai: 'AI 模式',
}

function shareMetric(result: DecisionResult): string {
  switch (result.mode) {
    case 'random':
      return `等概率抽取，每项 ${(100 / result.options.length).toFixed(2)}%`
    case 'scientific': {
      const score = result.ranking?.find((item) => item.optionId === result.winner.id)?.score
      return score === undefined ? '加权评分结果' : `加权得分：${score.toFixed(2)} / 10`
    }
    case 'mystic':
      return '塔罗解读仅供娱乐'
    case 'ai':
      return `推荐强度：${result.confidence.toFixed(1)}%`
  }
}

export function buildShareText(result: DecisionResult): string {
  return [
    'DECISION LAB',
    result.question,
    `系统最终决定：${result.winner.label}`,
    `决策模式：${MODE_LABELS[result.mode]}`,
    shareMetric(result),
    '不要再纠结了。',
    '结果仅供个人决策参考。',
  ].join('\n')
}

export function renderShareCardBlob(
  result: DecisionResult,
  createCanvas: () => HTMLCanvasElement | null = () => document.createElement('canvas'),
): Promise<Blob> {
  const canvas = createCanvas()
  if (!canvas) return Promise.reject(new Error('无法创建分享画布'))

  canvas.width = 1080
  canvas.height = 1350
  const context = canvas.getContext('2d')
  if (!context) return Promise.reject(new Error('浏览器不支持分享画布'))

  context.fillStyle = '#F7F8FC'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#FFFFFF'
  context.fillRect(72, 72, 936, 1206)
  context.textAlign = 'center'

  context.fillStyle = '#7268F2'
  context.font = '600 28px Inter, sans-serif'
  context.fillText('DECISION LAB / V1.5', 540, 160)

  context.fillStyle = '#747782'
  context.font = '400 30px sans-serif'
  context.fillText('系统收到了一项人类难题', 540, 300)

  context.fillStyle = '#14151A'
  context.font = '600 52px sans-serif'
  context.fillText(result.question.slice(0, 30), 540, 410)

  context.fillStyle = '#747782'
  context.font = '500 28px sans-serif'
  context.fillText('系统最终决定', 540, 590)

  context.fillStyle = '#14151A'
  context.font = '700 88px sans-serif'
  context.fillText(result.winner.label.slice(0, 18), 540, 720)

  context.fillStyle = '#111527'
  context.font = '600 30px sans-serif'
  context.fillText(`${MODE_LABELS[result.mode]} · ${shareMetric(result)}`, 540, 850)

  context.fillStyle = '#747782'
  context.font = '400 34px sans-serif'
  context.fillText('不要再纠结了。', 540, 1040)
  context.font = '400 24px sans-serif'
  context.fillText('结果仅供个人决策参考', 540, 1160)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('分享卡生成失败'))
    }, 'image/png')
  })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
