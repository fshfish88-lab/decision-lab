# DECISION LAB AI Frontend Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Connect the two deployed Decision Lab AI endpoints, add optional AI deep analysis to the three local modes, and turn the fourth AI mode into a direct-advice flow with its own result page and history support.

**Architecture:** A single validated AI API client owns both production endpoints and errors. Pure prompt builders serialize complete local or direct-decision context into the deployed content request field. Local-mode AI analysis remains ephemeral inside a read-only Bento panel, while direct AI advice becomes a validated DecisionResult with AI-specific details and uses the existing history, result actions, statistics, and sharing flows.

**Tech Stack:** React 19, TypeScript strict mode, Vite, Vitest, Testing Library, Framer Motion, Lucide React, Tailwind/CSS design system, LocalStorage, GitHub Pages.

---

## File map

- Create src/ai/aiPromptBuilders.ts: pure prompt construction for deep analysis and direct advice.
- Create src/ai/aiPromptBuilders.test.ts: prompt completeness and tone tests.
- Create src/ai/aiApiClient.ts: production endpoints, 20-second timeout, response validation, and typed errors.
- Create src/ai/aiApiClient.test.ts: endpoint, payload, response, timeout, rate-limit, and invalid-response tests.
- Delete src/ai/aiDecisionClient.ts and src/ai/aiDecisionClient.test.ts after all imports move to the formal API client.
- Create src/components/results/AiDeepAnalysisPanel.tsx: optional read-only AI enrichment for local results.
- Create src/components/results/AiDeepAnalysisPanel.test.tsx: no-auto-request, loading, success, failure, and retry tests.
- Create src/components/results/AiResult.tsx: direct AI recommendation Bento UI.
- Extend src/components/results/results.test.tsx: AI result rendering coverage.
- Modify src/types/decision.ts: API data and AI result detail types.
- Modify src/services/decisionEngine.ts: create a validated AI DecisionResult.
- Modify src/services/decisionEngine.test.ts: AI recommendation mapping and rejection tests.
- Modify src/pages/AiPage.tsx: direct-decision context form, loading experience, result creation, persistence, and navigation.
- Replace src/pages/AiPage.test.tsx: direct AI happy path and error behavior.
- Modify src/pages/HomePage.tsx and src/pages/HomePage.test.tsx: activate and relabel the fourth mode.
- Modify src/pages/ResultPage.tsx: render AI result, add local deep-analysis panel, and route AI reruns correctly.
- Modify src/App.test.tsx: full AI decision and local deep-analysis regression flows.
- Modify src/sharing/shareCard.ts and src/sharing/shareCard.test.ts: call AI confidence “推荐强度”.
- Modify src/storage/history.ts and src/storage/history.test.ts: validate stored AI detail records.
- Modify src/index.css: both independent Bento systems, loading state, responsive behavior, focus, and reduced motion.
- Modify README.md: document the production AI flow and privacy boundary.

### Task 1: Define AI contracts and prompt builders

**Files:**
- Modify: src/types/decision.ts
- Create: src/ai/aiPromptBuilders.ts
- Create: src/ai/aiPromptBuilders.test.ts

- [ ] **Step 1: Write failing prompt-builder tests**

Create src/ai/aiPromptBuilders.test.ts with concrete assertions:

~~~ts
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
~~~

- [ ] **Step 2: Run the tests and verify the red state**

Run:

~~~powershell
npm.cmd run test:run -- src/ai/aiPromptBuilders.test.ts
~~~

Expected: FAIL because aiPromptBuilders.ts and its exports do not exist.

- [ ] **Step 3: Add shared AI data types and implement the builders**

Add these public contracts to src/types/decision.ts:

~~~ts
export interface AiDeepAnalysisData {
  overview: string
  key_factors: string[]
  risks: string[]
  hidden_conflicts: string[]
  scenarios: string[]
  next_steps: string[]
}

export interface AiDecisionData {
  recommended_option: string
  confidence: number
  verdict: string
  core_reasons: string[]
  main_tradeoff: string
  conditions_to_reconsider: string[]
  action_plan: string[]
}

export interface AiResultDetails {
  type: 'ai'
  context: string
  advice: AiDecisionData
}
~~~

Extend DecisionResultDetails with AiResultDetails. Remove the old AiDecisionRequest, AiCriterionSuggestion, and AiDecisionSuggestion contracts after their callers are replaced in Task 5.

Implement src/ai/aiPromptBuilders.ts with:

~~~ts
import type { DecisionOption, DecisionResult } from '../types/decision'

const VOICE_RULES = [
  '表达风格：果断、聪明、略带调侃，符合 DECISION LAB 的冷幽默。',
  '幽默不能遮盖结论、风险和行动建议。',
  '禁止低幼梗、攻击性表达、虚构事实和虚构数据。',
  '涉及健康、安全、法律或财务时收敛幽默并明确风险。',
].join('\n')

function optionLabels(options: DecisionOption[]): string {
  return options.map((option) => option.label.trim()).join('、')
}

function localDetails(result: DecisionResult): string {
  if (result.details?.type === 'random') {
    return [
      '模式数据：等概率随机抽取',
      '理论概率：' + (result.details.probability * 100).toFixed(2) + '%',
      '抽签编号：' + result.details.drawNumber,
      '随机指纹：' + (result.details.fingerprint ?? '旧记录未提供'),
    ].join('\n')
  }
  if (result.details?.type === 'scientific') {
    const ranking = result.ranking?.map((item) =>
      String(item.rank) + '. ' + item.label + '：' + item.score.toFixed(2),
    ).join('\n') ?? '未提供排名'
    const contributions = result.details.contributions.map((item) =>
      item.name + '：权重 ' + item.weight + '%，评分 ' + item.score +
      '，贡献 ' + item.contribution.toFixed(2),
    ).join('\n')
    return '完整排名：\n' + ranking + '\n获胜项指标贡献：\n' + contributions
  }
  if (result.details?.type === 'mystic') {
    const evidence = result.details.evidence.map((item) =>
      item.title + '：' + item.description + '（' + item.reading + '）',
    ).join('\n')
    return [
      '娱乐声明：本模式仅供娱乐，以下玄学数据不是事实。',
      '玄学证据：\n' + evidence,
      result.details.favorable,
      result.details.avoid,
    ].join('\n')
  }
  return '模式数据：当前记录未提供额外详情。'
}

export function buildDeepAnalysisContent(result: DecisionResult): string {
  return [
    '任务类型：AI 深度分析',
    '硬性规则：本地算法结果是最终事实，不能修改、替换或否定本地最终结果。',
    '请解释现实优缺点、风险、隐藏冲突、可能情景和下一步。',
    '决策问题：' + result.question,
    '候选项：' + optionLabels(result.options),
    '本地模式：' + result.mode,
    '本地最终结果：' + result.winner.label,
    '本地解释：' + result.explanation,
    localDetails(result),
    '额外背景：未提供额外背景。',
    VOICE_RULES,
  ].join('\n\n')
}

export function buildDirectDecisionContent(input: {
  question: string
  options: DecisionOption[]
  context: string
}): string {
  return [
    '任务类型：AI 直接决策',
    '硬性规则：只能从候选项中选择一个最终建议，recommended_option 必须与候选项文字完全一致。',
    '决策问题：' + (input.question.trim() || '这次决定'),
    '候选项：' + optionLabels(input.options),
    '用户背景：' + input.context.trim(),
    '请给出明确结论、核心理由、主要取舍、重新考虑条件和可执行行动计划。',
    VOICE_RULES,
  ].join('\n\n')
}
~~~

- [ ] **Step 4: Run focused tests**

Run:

~~~powershell
npm.cmd run test:run -- src/ai/aiPromptBuilders.test.ts
~~~

Expected: 2 tests pass.

- [ ] **Step 5: Commit the contracts and builders**

~~~powershell
git add src/types/decision.ts src/ai/aiPromptBuilders.ts src/ai/aiPromptBuilders.test.ts
git commit -m "feat: add AI contracts and prompt builders"
~~~

### Task 2: Build the validated production AI client

**Files:**
- Create: src/ai/aiApiClient.ts
- Create: src/ai/aiApiClient.test.ts

- [ ] **Step 1: Write failing client contract tests**

Cover both endpoints and all error classes:

~~~ts
import { describe, expect, it, vi } from 'vitest'

import { AI_ENDPOINTS, AiApiError, createAiApiClient } from './aiApiClient'

const deepPayload = {
  success: true,
  type: 'deep-analysis',
  data: {
    overview: '火锅值得接受。',
    key_factors: ['想吃肉'],
    risks: ['预算略高'],
    hidden_conflicts: ['满足感与预算冲突'],
    scenarios: ['疲惫时更适合直接决定'],
    next_steps: ['现在去订位'],
  },
}

describe('createAiApiClient', () => {
  it('posts content to the deep-analysis endpoint', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => deepPayload,
    } as Response)
    const client = createAiApiClient(fetcher)

    await expect(client.deepAnalyze('完整上下文')).resolves.toEqual(deepPayload.data)
    expect(fetcher).toHaveBeenCalledWith(
      AI_ENDPOINTS.deepAnalysis,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ content: '完整上下文' }),
      }),
    )
  })

  it('maps HTTP 429 to a rate-limited error', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 429 } as Response)
    await expect(createAiApiClient(fetcher).decide('内容'))
      .rejects.toEqual(expect.objectContaining<Partial<AiApiError>>({ code: 'rate_limited' }))
  })

  it('rejects an invalid structured response', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, result: '旧接口文本' }),
    } as Response)
    await expect(createAiApiClient(fetcher).deepAnalyze('内容'))
      .rejects.toEqual(expect.objectContaining<Partial<AiApiError>>({ code: 'invalid_response' }))
  })
})
~~~

Also add a decision success case and an AbortError timeout case using fake timers.

- [ ] **Step 2: Run client tests and verify failure**

~~~powershell
npm.cmd run test:run -- src/ai/aiApiClient.test.ts
~~~

Expected: FAIL because aiApiClient.ts does not exist.

- [ ] **Step 3: Implement endpoints, validation, and errors**

Create src/ai/aiApiClient.ts with these stable exports:

~~~ts
import type { AiDecisionData, AiDeepAnalysisData } from '../types/decision'

export const AI_ENDPOINTS = {
  deepAnalysis: 'https://api.fshfish.com/api/ai/deep-analysis',
  decision: 'https://api.fshfish.com/api/ai/decision',
} as const

export type AiApiErrorCode =
  | 'network'
  | 'timeout'
  | 'rate_limited'
  | 'invalid_response'

export class AiApiError extends Error {
  constructor(public readonly code: AiApiErrorCode, message: string) {
    super(message)
    this.name = 'AiApiError'
  }
}

export interface AiApiClient {
  deepAnalyze(content: string): Promise<AiDeepAnalysisData>
  decide(content: string): Promise<AiDecisionData>
}
~~~

Implement a private request function that:

1. Creates an AbortController and aborts after 20,000 ms.
2. POSTs JSON.stringify({ content }) with Content-Type application/json.
3. Maps status 429 to rate_limited and other non-OK responses to network.
4. Parses JSON in the same try/catch.
5. Validates success, the endpoint-specific type, finite confidence within 0–100, required strings, and arrays containing only strings.
6. Clears the timer in finally.

Return only payload.data so components never depend on transport wrappers.

- [ ] **Step 4: Run focused client tests**

~~~powershell
npm.cmd run test:run -- src/ai/aiApiClient.test.ts
~~~

Expected: all endpoint, rate-limit, timeout, and response validation tests pass.

- [ ] **Step 5: Commit the client**

~~~powershell
git add src/ai/aiApiClient.ts src/ai/aiApiClient.test.ts
git commit -m "feat: add validated production AI client"
~~~

### Task 3: Add the local-mode AI deep-analysis Bento

**Files:**
- Create: src/components/results/AiDeepAnalysisPanel.tsx
- Create: src/components/results/AiDeepAnalysisPanel.test.tsx

- [ ] **Step 1: Write failing interaction tests**

Use an injected AiApiClient and assert no request occurs on mount:

~~~tsx
const client: AiApiClient = {
  deepAnalyze: vi.fn().mockResolvedValue({
    overview: '这次抽签暴露了你的真实偏好。',
    key_factors: ['你看到火锅时没有立刻反对'],
    risks: ['预算可能更高'],
    hidden_conflicts: ['想省钱但也想获得满足感'],
    scenarios: ['今晚很累时，接受结果更省心'],
    next_steps: ['关掉第二个外卖软件'],
  }),
  decide: vi.fn(),
}

render(<AiDeepAnalysisPanel result={randomResult} client={client} />)
expect(client.deepAnalyze).not.toHaveBeenCalled()
await user.click(screen.getByRole('button', { name: 'AI 深度分析' }))
expect(screen.getByRole('button', { name: /正在分析/ })).toBeDisabled()
expect(await screen.findByRole('heading', { name: 'AI 分析总览' })).toBeInTheDocument()
expect(screen.getByText('关掉第二个外卖软件')).toBeInTheDocument()
~~~

Add a rejected request test that shows “请求有点太密集，请稍后再试。” for rate_limited and allows a second click.

- [ ] **Step 2: Run the component test and verify failure**

~~~powershell
npm.cmd run test:run -- src/components/results/AiDeepAnalysisPanel.test.tsx
~~~

Expected: FAIL because AiDeepAnalysisPanel does not exist.

- [ ] **Step 3: Implement the read-only panel**

Create AiDeepAnalysisPanel with:

~~~tsx
interface AiDeepAnalysisPanelProps {
  result: DecisionResult
  client?: AiApiClient
}

export function AiDeepAnalysisPanel({
  result,
  client = createAiApiClient(),
}: AiDeepAnalysisPanelProps): React.JSX.Element {
  const [analysis, setAnalysis] = useState<AiDeepAnalysisData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState('')

  async function analyze(): Promise<void> {
    if (submitting) return
    setSubmitting(true)
    setStatus('')
    try {
      setAnalysis(await client.deepAnalyze(buildDeepAnalysisContent(result)))
    } catch (error) {
      const code = error instanceof AiApiError ? error.code : 'network'
      setStatus(ERROR_COPY[code])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={'ai-deep-analysis ai-deep-analysis--' + result.mode}>
      <div className="ai-deep-analysis__heading">
        <div>
          <span className="section-index">AI LAYER / OPTIONAL</span>
          <h2>AI 深度分析</h2>
          <p>原结果不会改变，AI 只负责把现实问题说得更明白一点。</p>
        </div>
        <button type="button" className="secondary-action" disabled={submitting} onClick={() => void analyze()}>
          {submitting ? '正在分析你的纠结' : analysis ? '重新分析' : 'AI 深度分析'}
        </button>
      </div>
      <p className="ai-form-status" aria-live="polite">{status}</p>
      {analysis ? (
        <div className="ai-deep-analysis__grid" role="region" aria-label="AI 深度分析结果">
          <article className="ai-deep-analysis__overview">
            <h3>AI 分析总览</h3>
            <p>{analysis.overview}</p>
          </article>
          {[
            ['关键因素', analysis.key_factors],
            ['现实风险', analysis.risks],
            ['隐藏冲突', analysis.hidden_conflicts],
            ['可能情景', analysis.scenarios],
            ['下一步建议', analysis.next_steps],
          ].map(([title, items]) => (
            <article key={title as string}>
              <h3>{title}</h3>
              <ul>{(items as string[]).map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
~~~

Keep result read-only: the component accepts no dispatch and no result mutation callback. Use mode-specific CSS modifiers only for accents, not for separate response contracts.

- [ ] **Step 4: Run focused component tests**

~~~powershell
npm.cmd run test:run -- src/components/results/AiDeepAnalysisPanel.test.tsx
~~~

Expected: no-auto-request, loading, Bento success, error copy, and retry tests pass.

- [ ] **Step 5: Commit the panel**

~~~powershell
git add src/components/results/AiDeepAnalysisPanel.tsx src/components/results/AiDeepAnalysisPanel.test.tsx
git commit -m "feat: add AI deep analysis Bento"
~~~

### Task 4: Integrate deep analysis without changing local results

**Files:**
- Modify: src/pages/ResultPage.tsx
- Modify: src/App.test.tsx
- Modify: src/components/results/ResultShell.test.tsx

- [ ] **Step 1: Add a failing full-flow regression test**

In src/App.test.tsx, mock global fetch only after the random result is visible, click AI 深度分析, and assert:

~~~tsx
const originalWinner = screen.getByRole('heading', { name: '火锅' })
expect(originalWinner).toBeInTheDocument()

await user.click(screen.getByRole('button', { name: 'AI 深度分析' }))
expect(await screen.findByText('这次抽签值得接受。')).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '火锅' })).toBeInTheDocument()
expect(screen.queryByRole('heading', { name: '日料' })).not.toBeInTheDocument()
~~~

Also assert the CTA does not exist when result.mode is ai.

- [ ] **Step 2: Run the targeted integration tests and verify failure**

~~~powershell
npm.cmd run test:run -- src/App.test.tsx src/components/results/ResultShell.test.tsx
~~~

Expected: FAIL because ResultPage does not render the panel.

- [ ] **Step 3: Wire the panel into ResultPage**

Render mode-specific content and the optional panel as siblings:

~~~tsx
<>
  {decisionResult.mode === 'random' ? (
    <RandomResult result={decisionResult} />
  ) : decisionResult.mode === 'scientific' ? (
    <ScientificResult result={decisionResult} />
  ) : (
    <MysticResult result={decisionResult} />
  )}
  <AiDeepAnalysisPanel result={decisionResult} />
</>
~~~

At this point no AI DecisionResult can be created yet, so this commit remains type-safe and focused on the three existing result branches. Do not modify RandomResult, ScientificResult, or MysticResult.

- [ ] **Step 4: Run the local-mode integration suite**

~~~powershell
npm.cmd run test:run -- src/App.test.tsx src/components/results/AiDeepAnalysisPanel.test.tsx src/components/results/results.test.tsx
~~~

Expected: existing three-mode flows pass and deep analysis leaves the original winner visible.

- [ ] **Step 5: Commit the integration**

~~~powershell
git add src/pages/ResultPage.tsx src/App.test.tsx src/components/results/ResultShell.test.tsx
git commit -m "feat: add optional AI analysis to local results"
~~~

### Task 5: Turn AI mode into direct advice

**Files:**
- Modify: src/services/decisionEngine.ts
- Modify: src/services/decisionEngine.test.ts
- Modify: src/pages/AiPage.tsx
- Replace: src/pages/AiPage.test.tsx
- Modify: src/pages/HomePage.tsx
- Modify: src/pages/HomePage.test.tsx
- Delete: src/ai/aiDecisionClient.ts
- Delete: src/ai/aiDecisionClient.test.ts

- [ ] **Step 1: Write failing result-construction and page tests**

Add a service test:

~~~ts
expect(createAiResult({
  question: '今晚吃什么？',
  options,
  context: '很累，想吃肉。',
  advice: {
    recommended_option: '火锅',
    confidence: 89,
    verdict: '今晚更适合火锅。',
    core_reasons: ['满足感优先'],
    main_tradeoff: '预算略高',
    conditions_to_reconsider: ['预算不足'],
    action_plan: ['现在去订位'],
  },
  now: () => new Date('2026-08-13T08:00:00.000Z'),
  makeId: () => 'ai-1',
})).toMatchObject({
  mode: 'ai',
  winner: { label: '火锅' },
  confidence: 89,
  details: { type: 'ai', context: '很累，想吃肉。' },
})
~~~

Add a rejection assertion when recommended_option is not one of the option labels.

Replace the old AiPage unavailable test with an injected-client happy path that submits context, disables the button during the promise, dispatches a result, writes history, and navigates to /result. Add a rate-limit failure test that preserves the textarea.

- [ ] **Step 2: Run focused tests and verify failure**

~~~powershell
npm.cmd run test:run -- src/services/decisionEngine.test.ts src/pages/AiPage.test.tsx src/pages/HomePage.test.tsx
~~~

Expected: FAIL because createAiResult and the direct-advice UI do not exist.

- [ ] **Step 3: Implement direct result construction and the AI form**

Add createAiResult to decisionEngine.ts. It must trim labels, find exactly one existing option, reject unmatched advice, set metrics to an empty array, set explanation to advice.verdict, and store:

~~~ts
details: {
  type: 'ai',
  context: input.context.trim(),
  advice: input.advice,
}
~~~

Rewrite AiPage to:

1. Keep the existing two-valid-options guard.
2. Show the question and candidate summary.
3. Require 1–500 characters of context.
4. Build content with buildDirectDecisionContent.
5. Call client.decide.
6. Create the AI result, dispatch set-result, saveHistoryItem, and navigate('/result').
7. While pending, replace the form body with an accessible AI thinking console whose text rotates without delaying a completed request.
8. Preserve the input and show mapped error text on failure.

Update HomePage AI content:

~~~tsx
const CTA_LABELS = {
  random: '交给命运',
  scientific: '开始计算',
  mystic: '开始做法',
  ai: '让 AI 替我决定',
}
~~~

Use tag “在线顾问”, description “理解你的情况，直接给出建议。” and aside “这次真的有用”.

Delete the old suggestion client and tests only after rg confirms no imports remain:

~~~powershell
rg "aiDecisionClient|AiDecisionSuggestion|AiDecisionRequest" src
~~~

- [ ] **Step 4: Run direct AI focused tests**

~~~powershell
npm.cmd run test:run -- src/services/decisionEngine.test.ts src/pages/AiPage.test.tsx src/pages/HomePage.test.tsx
~~~

Expected: direct advice, invalid recommendation, loading, persistence, navigation, and error tests pass.

- [ ] **Step 5: Commit the direct AI flow**

~~~powershell
git add src/services/decisionEngine.ts src/services/decisionEngine.test.ts src/pages/AiPage.tsx src/pages/AiPage.test.tsx src/pages/HomePage.tsx src/pages/HomePage.test.tsx src/ai
git commit -m "feat: turn AI mode into direct advice"
~~~

### Task 6: Add the AI-specific result and history-compatible behavior

**Files:**
- Create: src/components/results/AiResult.tsx
- Modify: src/components/results/results.test.tsx
- Modify: src/pages/ResultPage.tsx
- Modify: src/storage/history.ts
- Modify: src/storage/history.test.ts
- Modify: src/sharing/shareCard.ts
- Modify: src/sharing/shareCard.test.ts
- Modify: src/App.test.tsx

- [ ] **Step 1: Write failing AI result, storage, and full-flow tests**

Render an AI result and assert independent cards:

~~~tsx
expect(screen.getByRole('heading', { name: 'AI 最终建议' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '火锅' })).toBeInTheDocument()
expect(screen.getByText('推荐强度 89%')).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '为什么推荐' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '需要接受' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '重新考虑条件' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '下一步行动' })).toBeInTheDocument()
~~~

Add a history round-trip test that writes an AI result with details and reads the same typed fields. Add a share-text assertion that AI uses “推荐强度：89.0%” while local modes retain “可信度”.

Add an App flow with a mocked decision endpoint:

~~~tsx
await user.click(screen.getByRole('button', { name: /AI 模式/ }))
await user.click(screen.getByRole('button', { name: '让 AI 替我决定' }))
await user.type(screen.getByLabelText('补充你的真实情况'), '预算 100 元，今天很累。')
await user.click(screen.getByRole('button', { name: '让 AI 替我决定' }))
expect(await screen.findByRole('heading', { name: 'AI 最终建议' })).toBeInTheDocument()
await user.click(screen.getByRole('link', { name: '决策记录' }))
expect(screen.getByText('火锅')).toBeInTheDocument()
~~~

- [ ] **Step 2: Run the focused suite and verify failure**

~~~powershell
npm.cmd run test:run -- src/components/results/results.test.tsx src/storage/history.test.ts src/sharing/shareCard.test.ts src/App.test.tsx
~~~

Expected: FAIL because AiResult and AI-specific persistence/rendering are incomplete.

- [ ] **Step 3: Implement the AI Bento and compatibility rules**

Create AiResult.tsx. Narrow details first:

~~~tsx
export function AiResult({ result }: { result: DecisionResult }): React.JSX.Element {
  if (result.details?.type !== 'ai') {
    return <section className="ai-result-error">AI 结果详情不完整，本次不展示推测内容。</section>
  }
  const advice = result.details.advice
  return (
    <div className="ai-result">
      <section className="ai-result-hero">
        <span className="section-index">AI DECISION / DIRECT ADVICE</span>
        <h2>AI 最终建议</h2>
        <strong>{result.winner.label}</strong>
        <p>推荐强度 {advice.confidence}%</p>
      </section>
      <div className="ai-result-grid">
        <section>
          <h2>核心判断</h2>
          <p>{advice.verdict}</p>
        </section>
        <section>
          <h2>为什么推荐</h2>
          <ul>{advice.core_reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        </section>
        <section>
          <h2>需要接受</h2>
          <p>{advice.main_tradeoff}</p>
        </section>
        <section>
          <h2>重新考虑条件</h2>
          <ul>{advice.conditions_to_reconsider.map((condition) => <li key={condition}>{condition}</li>)}</ul>
        </section>
        <section>
          <h2>下一步行动</h2>
          <ol>{advice.action_plan.map((action) => <li key={action}>{action}</li>)}</ol>
        </section>
      </div>
    </div>
  )
}
~~~

Update ResultPage:

- Render AiResult for mode ai.
- Set rerunPath to /ai for AI results.
- Do not render AiDeepAnalysisPanel for AI results.

Update history normalization to validate AI details before accepting a stored AI item. Preserve V1/V2 non-AI compatibility. Update share text and canvas label based on result.mode.

- [ ] **Step 4: Run the AI result and compatibility suite**

~~~powershell
npm.cmd run test:run -- src/components/results/results.test.tsx src/storage/history.test.ts src/sharing/shareCard.test.ts src/App.test.tsx
~~~

Expected: AI result, history round-trip, share wording, rerun routing, and existing local flows pass.

- [ ] **Step 5: Commit the AI result**

~~~powershell
git add src/components/results/AiResult.tsx src/components/results/results.test.tsx src/pages/ResultPage.tsx src/storage/history.ts src/storage/history.test.ts src/sharing/shareCard.ts src/sharing/shareCard.test.ts src/App.test.tsx
git commit -m "feat: add AI-specific result experience"
~~~

### Task 7: Style both AI Bento systems and loading states

**Files:**
- Modify: src/index.css
- Modify: src/pages/AiPage.test.tsx
- Modify: src/components/results/AiDeepAnalysisPanel.test.tsx

- [ ] **Step 1: Add failing semantic and responsive hooks**

Assert stable class and landmark hooks rather than visual pixels:

~~~tsx
expect(screen.getByRole('region', { name: 'AI 深度分析结果' }))
  .toHaveClass('ai-deep-analysis')
expect(screen.getByRole('main')).toHaveClass('ai-page')
expect(screen.getByRole('status')).toHaveTextContent(/正在理解你的纠结/)
~~~

- [ ] **Step 2: Run tests and verify the missing hooks**

~~~powershell
npm.cmd run test:run -- src/pages/AiPage.test.tsx src/components/results/AiDeepAnalysisPanel.test.tsx
~~~

Expected: FAIL until the semantic classes and status region are present.

- [ ] **Step 3: Add responsive styling**

In src/index.css add focused styles for:

- .ai-deep-analysis and its six cards.
- .ai-deep-analysis--random, --scientific, and --mystic accents.
- .ai-thinking-console with reduced-motion fallbacks.
- .ai-result, .ai-result-hero, .ai-result-grid, and action-plan numbering.
- Long-text wrapping with overflow-wrap: anywhere.
- Desktop two-column grids, collapsing to one column below 720px.
- 44px minimum interactive controls and visible focus states.
- No fixed widths that can overflow 375px.

Keep the existing Light Lab palette: AI background #E8F4DF and accent #72A95A. Do not introduce glassmorphism, neon, dark chat UI, or emoji as formal icons.

- [ ] **Step 4: Run component and type checks**

~~~powershell
npm.cmd run test:run -- src/pages/AiPage.test.tsx src/components/results/AiDeepAnalysisPanel.test.tsx src/components/results/results.test.tsx
npm.cmd run typecheck
~~~

Expected: all focused tests pass and TypeScript exits 0.

- [ ] **Step 5: Commit visual integration**

~~~powershell
git add src/index.css src/pages/AiPage.test.tsx src/components/results/AiDeepAnalysisPanel.test.tsx
git commit -m "style: polish AI Bento experiences"
~~~

### Task 8: Complete regression, real API QA, documentation, and release

**Files:**
- Modify: README.md
- Create: 过程文件文件夹/验证记录/2026-08-13-ai-integration/验证记录.md outside the product repository.

- [ ] **Step 1: Update README with the real AI boundary**

Document:

- The two production endpoint paths.
- The browser never receives a DeepSeek key.
- Local modes remain deterministic/local and AI analysis is optional.
- AI direct advice is saved in local history.
- AI output is advisory and serious high-stakes decisions require independent verification.

- [ ] **Step 2: Run the complete automated gate**

Run each command and require exit code 0:

~~~powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:run
npm.cmd run test:pages
~~~

Expected: zero lint warnings, zero TypeScript errors, all Vitest files pass, and the GitHub Pages asset verifier succeeds.

- [ ] **Step 3: Test each real endpoint once**

Use the production front-end client or equivalent PowerShell POST with one small decision. Confirm:

- deep-analysis returns success true, type deep-analysis, and all six data fields.
- decision returns success true, type decision, and the recommendation exactly matches a supplied option.
- No API key appears in request payloads, built assets, source maps, or repository history.

Record only response shape and non-sensitive excerpts. Do not copy server secrets into logs.

- [ ] **Step 4: Perform browser QA**

Run the production build locally and use Playwright at desktop and 375x812:

1. Complete random mode and request deep analysis.
2. Confirm original winner remains unchanged.
3. Complete AI direct mode and confirm the AI Bento.
4. Open history and confirm the AI record.
5. Exercise a mocked or controlled failure and retry.
6. Check no horizontal page overflow.
7. Check console errors and warnings are zero.
8. Capture screenshots into the process verification folder, not the product source tree.

- [ ] **Step 5: Commit documentation and verification notes**

~~~powershell
git add README.md
git commit -m "docs: document Decision Lab AI integration"
git status --short
~~~

Expected: product worktree is clean. The process verification folder may remain outside the repository as project evidence.

- [ ] **Step 6: Publish through the existing GitHub workflow**

Push feature/ai-integration, open a pull request into main, verify the diff contains no secrets, merge after checks pass, and wait for the GitHub Pages workflow. Confirm:

- PR is merged.
- Pages deployment conclusion is success.
- https://fshfish88-lab.github.io/decision-lab/ returns HTTP 200.
- Online browser QA repeats both AI paths against the deployed asset.

Do not update any other hosting target.
