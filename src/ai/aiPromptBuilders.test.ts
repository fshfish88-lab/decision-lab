import { describe, expect, it } from 'vitest'

import type { DecisionResult } from '../types/decision'
import { buildDeepAnalysisContent, buildDirectDecisionContent } from './aiPromptBuilders'

const randomResult: DecisionResult = {
  id: 'random-1',
  createdAt: '2026-08-13T08:00:00.000Z',
  question: '今晚吃什么？',
  options: [
    { id: 'hotpot', label: '火锅' },
    { id: 'sushi', label: '日料' },
  ],
  mode: 'random',
  winner: { id: 'hotpot', label: '火锅' },
  explanation: '等概率抽中火锅。',
  confidence: 100,
  metrics: [],
  details: {
    type: 'random',
    sample: 0.1,
    winningIndex: 0,
    fingerprint: '1999-9999',
    drawNumber: '#100000',
    probability: 0.5,
  },
}

describe('AI prompt builders', () => {
  it('includes the complete local result and forbids overriding it', () => {
    const content = buildDeepAnalysisContent(randomResult)

    expect(content).toContain('任务类型：AI 深度分析')
    expect(content).toContain('决策问题：今晚吃什么？')
    expect(content).toContain('候选项：火锅、日料')
    expect(content).toContain('本地最终结果：火锅')
    expect(content).toContain('理论概率：50.00%')
    expect(content).toContain('不能修改、替换或否定本地最终结果')
    expect(content).toContain('幽默不能遮盖结论、风险和行动建议')
  })

  it('requires direct advice to select one existing option', () => {
    const content = buildDirectDecisionContent({
      question: '今晚吃什么？',
      options: randomResult.options,
      context: '预算 100 元，今天很累，想吃肉。',
    })

    expect(content).toContain('任务类型：AI 直接决策')
    expect(content).toContain('只能从候选项中选择一个最终建议')
    expect(content).toContain('预算 100 元，今天很累，想吃肉。')
    expect(content).toContain('果断、聪明、略带调侃')
  })
})
