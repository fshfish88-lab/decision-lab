# DECISION LAB V1.5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a complete local-first V1.5 with upgraded history, statistics, achievements, sharing, motion polish, and an AI mode that is ready for a future server API without fabricating results.

**Architecture:** Keep `DecisionResult` as the single source for completed decisions, migrate its LocalStorage envelope from V1 to V2, and derive statistics and achievements through pure functions. Add sharing and AI behind focused service interfaces so browser failures or a missing AI endpoint never affect the three deterministic modes.

**Tech Stack:** React 19, TypeScript strict mode, React Router, Tailwind/CSS custom properties, Framer Motion, Lucide React, Vitest, Testing Library, browser Canvas and Clipboard APIs.

---

## File map

- `src/types/decision.ts`: V1.5 decision, history, behavior, and AI mode types.
- `src/storage/history.ts`: validated V1/V2 read, V2 write, regret/share mutations.
- `src/storage/history.test.ts`: migration, validation, idempotency, and failure tests.
- `src/analytics/statistics.ts`: pure statistics calculations.
- `src/analytics/statistics.test.ts`: date-boundary, tie, distribution, and trend tests.
- `src/achievements/achievements.ts`: pure achievement definitions and progress evaluation.
- `src/achievements/achievements.test.ts`: all six unlock rules.
- `src/state/decisionReducer.ts`: restore a historical draft and support AI selection.
- `src/pages/HistoryPage.tsx`: filter, detail, delete, clear, and reuse interactions.
- `src/pages/HistoryPage.test.tsx`: detail and reuse component coverage.
- `src/pages/StatisticsPage.tsx`: real-data KPI, trend, distribution, and achievement UI.
- `src/pages/StatisticsPage.test.tsx`: empty and populated statistics states.
- `src/sharing/shareCard.ts`: text model, Canvas PNG generation, and download helper.
- `src/sharing/shareCard.test.ts`: deterministic text and Canvas failure coverage.
- `src/components/results/ResultShell.tsx`: regret, copy, and download controls.
- `src/components/results/ResultShell.test.tsx`: result actions and status feedback.
- `src/ai/aiDecisionClient.ts`: future server boundary and default `not_configured` client.
- `src/ai/aiDecisionClient.test.ts`: missing endpoint and response validation tests.
- `src/pages/AiPage.tsx`: AI requirement input and unavailable/error states.
- `src/pages/AiPage.test.tsx`: form validation and no-fake-result coverage.
- `src/pages/HomePage.tsx`: enable the AI mode card and route to `/ai`.
- `src/App.tsx`: add `/statistics` and `/ai` routes.
- `src/components/AppShell.tsx`: statistics navigation and V1.5 label.
- `src/index.css`: V1.5 responsive layouts, states, and reduced-motion rules.
- `src/App.test.tsx`: navigation and regression flow coverage.
- `过程文件文件夹/验证记录/2026-08-13-v1.5/验证记录.md`: actual command and browser QA evidence.

### Task 1: Migrate local history to V2

**Files:**
- Modify: `src/types/decision.ts`
- Modify: `src/storage/history.ts`
- Modify: `src/storage/history.test.ts`

- [ ] **Step 1: Write failing migration and behavior tests**

Add tests that store a V1 envelope and expect a readable record with `shareCount: 0`; call regret twice and expect the first timestamp to remain; record two successful shares and expect `shareCount: 2`.

```ts
it('reads V1 and writes V2 without losing the decision', () => {
  const storage = new MemoryStorage()
  storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify({ version: 1, items: [createItem('1')] }))
  expect(readHistory(storage)[0]).toMatchObject({ id: '1', shareCount: 0 })
  saveHistoryItem(readHistory(storage)[0], storage)
  expect(JSON.parse(storage.getItem(HISTORY_STORAGE_KEY) ?? '{}').version).toBe(2)
})

it('records regret once and counts successful shares', () => {
  const storage = new MemoryStorage()
  saveHistoryItem(createItem('1'), storage)
  markHistoryItemRegretted('1', '2026-08-13T08:00:00.000Z', storage)
  markHistoryItemRegretted('1', '2026-08-13T09:00:00.000Z', storage)
  incrementHistoryItemShare('1', '2026-08-13T10:00:00.000Z', storage)
  incrementHistoryItemShare('1', '2026-08-13T11:00:00.000Z', storage)
  expect(readHistory(storage)[0]).toMatchObject({
    regrettedAt: '2026-08-13T08:00:00.000Z',
    shareCount: 2,
    lastSharedAt: '2026-08-13T11:00:00.000Z',
  })
})
```

- [ ] **Step 2: Run the storage test and verify red**

Run: `npm.cmd run test:run -- src/storage/history.test.ts`  
Expected: FAIL because the V2 behavior fields and mutation functions do not exist.

- [ ] **Step 3: Add V2 types and validated normalization**

Add these fields and envelope beside the existing result types:

```ts
export interface DecisionBehavior {
  regrettedAt?: string
  shareCount: number
  lastSharedAt?: string
}

export type DecisionHistoryItem = DecisionResult & DecisionBehavior

export interface HistoryStoreV2 {
  version: 2
  items: DecisionHistoryItem[]
}
```

Replace the V1 cast in `readHistory` with a normalizer that verifies string IDs, ISO-compatible dates, two options, a valid local mode, and a winner. Normalize `shareCount` to a non-negative integer and preserve V1 records with zero shares. Write only `{ version: 2, items }`.

Export exact mutation signatures:

```ts
export function markHistoryItemRegretted(
  id: string,
  regrettedAt = new Date().toISOString(),
  storage: Storage | undefined = defaultStorage(),
): DecisionHistoryItem | undefined

export function incrementHistoryItemShare(
  id: string,
  sharedAt = new Date().toISOString(),
  storage: Storage | undefined = defaultStorage(),
): DecisionHistoryItem | undefined
```

Both functions read the current list, update only the matching record, persist V2, and return the updated record. Regret keeps an existing `regrettedAt` unchanged.

- [ ] **Step 4: Run storage tests and verify green**

Run: `npm.cmd run test:run -- src/storage/history.test.ts`  
Expected: all history tests PASS and the existing 50-record limit remains green.

- [ ] **Step 5: Commit**

```powershell
git add src/types/decision.ts src/storage/history.ts src/storage/history.test.ts
git commit -m "feat: migrate decision history to v2"
```

### Task 2: Add pure statistics and achievements

**Files:**
- Create: `src/analytics/statistics.ts`
- Create: `src/analytics/statistics.test.ts`
- Create: `src/achievements/achievements.ts`
- Create: `src/achievements/achievements.test.ts`

- [ ] **Step 1: Write failing statistics tests**

Use fixed local dates and assert exact output:

```ts
const now = new Date('2026-08-13T12:00:00+08:00')
const summary = calculateStatistics(history, now)
expect(summary.monthCount).toBe(2)
expect(summary.regretCount).toBe(1)
expect(summary.obedienceRate).toBe(50)
expect(summary.favoriteModes).toEqual(['random', 'scientific'])
expect(summary.trend).toHaveLength(7)
expect(summary.trend.at(-1)?.dateKey).toBe('2026-08-13')
```

Also cover empty history (`obedienceRate: null`), a single favorite mode, and records outside the current month and seven-day window.

- [ ] **Step 2: Run statistics tests and verify red**

Run: `npm.cmd run test:run -- src/analytics/statistics.test.ts`  
Expected: FAIL because `calculateStatistics` is missing.

- [ ] **Step 3: Implement the statistics contract**

```ts
export interface StatisticsSummary {
  totalCount: number
  monthCount: number
  regretCount: number
  obedienceRate: number | null
  favoriteModes: DecisionMode[]
  distribution: Array<{ mode: DecisionMode; count: number; percentage: number }>
  trend: Array<{ dateKey: string; label: string; count: number }>
}

export function calculateStatistics(
  history: DecisionHistoryItem[],
  now = new Date(),
): StatisticsSummary
```

Use local calendar boundaries, never UTC string slicing, so Asia/Shanghai midnight records land on the correct day.

- [ ] **Step 4: Write failing achievement tests**

Create generated histories and check each threshold plus the last-five rule:

```ts
expect(evaluateAchievements(makeHistory({ total: 1 })).find((item) => item.id === 'first-decision')?.unlocked).toBe(true)
expect(evaluateAchievements(makeHistory({ random: 20 })).find((item) => item.id === 'random-servant')?.unlocked).toBe(true)
expect(evaluateAchievements(makeHistory({ latestFiveRegretted: false })).find((item) => item.id === 'obedient-five')?.unlocked).toBe(true)
```

- [ ] **Step 5: Implement six achievement definitions**

```ts
export type AchievementId =
  | 'first-decision'
  | 'ten-decisions'
  | 'random-servant'
  | 'science-believer'
  | 'mystic-reader'
  | 'obedient-five'

export interface AchievementStatus {
  id: AchievementId
  title: string
  description: string
  progress: number
  target: number
  unlocked: boolean
}

export function evaluateAchievements(history: DecisionHistoryItem[]): AchievementStatus[]
```

The last achievement unlocks only when at least five records exist and none of the newest five has `regrettedAt`.

- [ ] **Step 6: Run both pure-function suites**

Run: `npm.cmd run test:run -- src/analytics/statistics.test.ts src/achievements/achievements.test.ts`  
Expected: all tests PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/analytics src/achievements
git commit -m "feat: derive local statistics and achievements"
```

### Task 3: Upgrade history detail and reuse

**Files:**
- Modify: `src/state/decisionReducer.ts`
- Modify: `src/state/decisionReducer.test.ts`
- Modify: `src/pages/HistoryPage.tsx`
- Create: `src/pages/HistoryPage.test.tsx`

- [ ] **Step 1: Write failing reducer and history UI tests**

```ts
expect(decisionReducer(initialDecisionState, {
  type: 'restore-draft',
  draft: { question: '今晚吃什么？', options, mode: 'random' },
})).toMatchObject({ question: '今晚吃什么？', options, mode: 'random', result: null })
```

Render one history record, expand “查看详情”, assert explanation and behavior status, then click “再次使用” and assert navigation to `/` and restored input values.

- [ ] **Step 2: Run focused tests and verify red**

Run: `npm.cmd run test:run -- src/state/decisionReducer.test.ts src/pages/HistoryPage.test.tsx`  
Expected: FAIL because `restore-draft` and history detail controls are absent.

- [ ] **Step 3: Add a typed draft restore action**

```ts
| {
    type: 'restore-draft'
    draft: Pick<DecisionState, 'question' | 'options' | 'mode'>
  }
```

Its reducer branch copies the supplied options, clears scores and result, and restores default criteria.

- [ ] **Step 4: Implement expandable detail and reuse**

Keep filter/delete/clear behavior. Add one expanded record ID in page state. Detail shows explanation, all options, timestamp, regret status, and share count. “再次使用” dispatches `restore-draft` and navigates to `/`; AI is not present in history before a real result exists.

- [ ] **Step 5: Run focused tests and verify green**

Run: `npm.cmd run test:run -- src/state/decisionReducer.test.ts src/pages/HistoryPage.test.tsx`  
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/state/decisionReducer.ts src/state/decisionReducer.test.ts src/pages/HistoryPage.tsx src/pages/HistoryPage.test.tsx
git commit -m "feat: add history detail and decision reuse"
```

### Task 4: Build the statistics and achievement page

**Files:**
- Create: `src/pages/StatisticsPage.tsx`
- Create: `src/pages/StatisticsPage.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/AppShell.tsx`

- [ ] **Step 1: Write failing page tests**

For empty storage, assert “还没有足够的决策数据”. For populated storage, assert the exact KPI labels, `50.0%`, mode distribution counts, seven trend bars with accessible labels, and all six achievement titles.

- [ ] **Step 2: Run the page test and verify red**

Run: `npm.cmd run test:run -- src/pages/StatisticsPage.test.tsx`  
Expected: FAIL because the page is missing.

- [ ] **Step 3: Implement `StatisticsPage`**

Read history once on mount, call `calculateStatistics` and `evaluateAchievements` through `useMemo`, and render:

```tsx
<main className="statistics-page">
  <header className="page-heading">...</header>
  {history.length === 0 ? <EmptyStatistics /> : <StatisticsDashboard summary={summary} />}
  <AchievementGrid achievements={achievements} />
</main>
```

Use semantic text plus CSS bars. Each trend bar must expose `aria-label={`${label}：${count} 次决策`}`. Do not add Recharts.

- [ ] **Step 4: Wire navigation and route**

Add `<Route path="/statistics" element={<StatisticsPage />} />`, a BarChart3 navigation item labeled “统计分析”, and update the footer to `DECISION LAB · V1.5`.

- [ ] **Step 5: Run page and app tests**

Run: `npm.cmd run test:run -- src/pages/StatisticsPage.test.tsx src/App.test.tsx`  
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/pages/StatisticsPage.tsx src/pages/StatisticsPage.test.tsx src/App.tsx src/components/AppShell.tsx
git commit -m "feat: add statistics and achievement dashboard"
```

### Task 5: Add regret and sharing actions

**Files:**
- Create: `src/sharing/shareCard.ts`
- Create: `src/sharing/shareCard.test.ts`
- Modify: `src/components/results/ResultShell.tsx`
- Create: `src/components/results/ResultShell.test.tsx`
- Modify: `src/pages/ResultPage.tsx`

- [ ] **Step 1: Write failing sharing service tests**

```ts
expect(buildShareText(result)).toContain('系统最终决定：火锅')
expect(buildShareText(result)).toContain('随机模式')
await expect(renderShareCardBlob(result, () => null)).rejects.toThrow('无法创建分享画布')
```

Mock a 1080 × 1350 canvas context and assert `canvas.width`, `canvas.height`, and a returned PNG Blob.

- [ ] **Step 2: Run sharing tests and verify red**

Run: `npm.cmd run test:run -- src/sharing/shareCard.test.ts`  
Expected: FAIL because the sharing service is missing.

- [ ] **Step 3: Implement deterministic share services**

Export exact functions:

```ts
export function buildShareText(result: DecisionResult): string
export function renderShareCardBlob(
  result: DecisionResult,
  createCanvas: () => HTMLCanvasElement | null = () => document.createElement('canvas'),
): Promise<Blob>
export function downloadBlob(blob: Blob, filename: string): void
```

Draw the current brand colors, question, mode, winner, confidence, the sentence “不要再纠结了。”, and a personal-reference disclaimer. Use `canvas.toBlob(..., 'image/png')`; reject if the canvas, context, or Blob is unavailable.

- [ ] **Step 4: Write failing result action tests**

Render `ResultShell` with mocked callbacks. Click “我后悔了” twice and expect one callback; click copy and download and assert success status text. Reject the copy promise and assert an error message.

- [ ] **Step 5: Implement result actions**

Add callbacks with these signatures:

```ts
onRegret: () => void
onCopy: () => Promise<void>
onDownload: () => Promise<void>
regretted: boolean
```

`ResultPage` calls `markHistoryItemRegretted` once, uses `navigator.clipboard.writeText(buildShareText(result))`, and only calls `incrementHistoryItemShare` after copy or PNG download succeeds. Keep failures local to an `aria-live="polite"` status.

- [ ] **Step 6: Run focused tests**

Run: `npm.cmd run test:run -- src/sharing/shareCard.test.ts src/components/results/ResultShell.test.tsx`  
Expected: all tests PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/sharing src/components/results/ResultShell.tsx src/components/results/ResultShell.test.tsx src/pages/ResultPage.tsx
git commit -m "feat: add regret and share card actions"
```

### Task 6: Add the API-ready AI mode

**Files:**
- Modify: `src/types/decision.ts`
- Create: `src/ai/aiDecisionClient.ts`
- Create: `src/ai/aiDecisionClient.test.ts`
- Create: `src/pages/AiPage.tsx`
- Create: `src/pages/AiPage.test.tsx`
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/pages/HomePage.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/AnalysisPage.tsx`
- Modify: `src/components/results/ResultShell.tsx`
- Modify: `src/pages/HistoryPage.tsx`

- [ ] **Step 1: Write failing client tests**

```ts
await expect(createAiDecisionClient().analyze(request)).rejects.toMatchObject({ code: 'not_configured' })
await expect(createAiDecisionClient('/api/decision', invalidFetch).analyze(request)).rejects.toMatchObject({ code: 'invalid_response' })
```

- [ ] **Step 2: Define AI request and response types**

Extend `DecisionMode` with `'ai'` and add:

```ts
export interface AiDecisionRequest {
  question: string
  options: DecisionOption[]
  requirements: string
}

export interface AiCriterionSuggestion {
  id: string
  name: string
  weight: number
  reason: string
}

export interface AiDecisionSuggestion {
  constraints: string[]
  criteria: AiCriterionSuggestion[]
}
```

Update every exhaustive mode label/config map in the same commit so TypeScript stays green. `AnalysisPage` must reject `ai` by returning the existing empty state; no AI result is created locally.

- [ ] **Step 3: Implement the client boundary**

```ts
export type AiDecisionErrorCode = 'not_configured' | 'network' | 'timeout' | 'invalid_response'

export class AiDecisionError extends Error {
  constructor(public readonly code: AiDecisionErrorCode, message: string) {
    super(message)
  }
}

export function createAiDecisionClient(
  endpoint = import.meta.env.VITE_AI_API_URL,
  fetcher: typeof fetch = fetch,
): { analyze(request: AiDecisionRequest): Promise<AiDecisionSuggestion> }
```

An empty endpoint throws `not_configured`. Configured requests use POST JSON, an AbortController timeout, and runtime validation. No API key or Authorization header is read from the browser.

- [ ] **Step 4: Write failing AI page tests**

Assert that the page shows “AI 服务尚未接入”, keeps submit disabled with fewer than two options or no requirement text, and never shows a fabricated recommendation.

- [ ] **Step 5: Implement and route the AI page**

Enable the home AI card with `mode="ai"`; selecting it keeps the normal option editor and changes the CTA to “交给 AI 理解”. Starting navigates to `/ai`. `AiPage` reuses the draft question/options, collects requirement text, displays privacy copy, and calls the injected/default client only when configured. Its error copy maps every error code to a specific message and links back to the three local modes.

- [ ] **Step 6: Run AI and home tests**

Run: `npm.cmd run test:run -- src/ai/aiDecisionClient.test.ts src/pages/AiPage.test.tsx src/pages/HomePage.test.tsx`  
Expected: all tests PASS and no AI history item is created.

- [ ] **Step 7: Commit**

```powershell
git add src/types/decision.ts src/ai src/pages/AiPage.tsx src/pages/AiPage.test.tsx src/pages/HomePage.tsx src/pages/HomePage.test.tsx src/App.tsx src/pages/AnalysisPage.tsx src/components/results/ResultShell.tsx src/pages/HistoryPage.tsx
git commit -m "feat: add api-ready ai mode"
```

### Task 7: Apply V1.5 visual, motion, and responsive polish

**Files:**
- Modify: `src/index.css`
- Modify: `src/pages/StatisticsPage.tsx`
- Modify: `src/pages/HistoryPage.tsx`
- Modify: `src/components/results/ResultShell.tsx`
- Modify: `src/pages/AiPage.tsx`

- [ ] **Step 1: Add focused V1.5 styles**

Use existing CSS variables and add blocks for `.statistics-page`, `.statistics-kpi-grid`, `.trend-chart`, `.distribution-list`, `.achievement-grid`, `.achievement-card`, `.history-item__details`, `.result-share-actions`, `.result-status`, and `.ai-page`. Preserve 20px large-card radii, light borders, and restrained shadows.

- [ ] **Step 2: Add motion without blocking input**

Use Framer Motion only for page/card entrance and first achievement unlock. Keep duration at 0.2–0.45s and do not add artificial waits. Statistics numbers may animate visually while their accessible text contains the final value immediately.

- [ ] **Step 3: Add the reduced-motion override**

```css
@media (prefers-reduced-motion: reduce) {
  .statistics-page *,
  .achievement-card,
  .history-item__details,
  .result-share-actions,
  .ai-page * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 4: Add 375px layout rules**

At `max-width: 640px`, use one KPI column, one achievement column, stacked result actions, full-width history detail controls, and `min-width: 0` on text containers. Keep all buttons at least 44px tall and prevent long option labels from causing overflow with `overflow-wrap: anywhere`.

- [ ] **Step 5: Run the full automated suite**

Run: `npm.cmd run lint`  
Expected: exit 0 with zero warnings.

Run: `npm.cmd run typecheck`  
Expected: exit 0.

Run: `npm.cmd run test:run`  
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/index.css src/pages/StatisticsPage.tsx src/pages/HistoryPage.tsx src/components/results/ResultShell.tsx src/pages/AiPage.tsx
git commit -m "style: polish v1.5 responsive experiences"
```

### Task 8: Perform final build and real-browser verification

**Files:**
- Modify: `src/App.test.tsx`
- Create: `过程文件文件夹/验证记录/2026-08-13-v1.5/验证记录.md`
- Create: `过程文件文件夹/验证记录/2026-08-13-v1.5/desktop-1920x1080.png`
- Create: `过程文件文件夹/验证记录/2026-08-13-v1.5/mobile-375x812.png`

- [ ] **Step 1: Add the V1.5 end-to-end component regression**

Extend `App.test.tsx` with one local decision flow that marks regret, copies a result, opens statistics, and verifies the updated KPI and unlocked “初次见面” achievement. Mock Clipboard and Canvas explicitly; do not weaken existing random/scientific/mystic assertions.

- [ ] **Step 2: Run all required commands**

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:run
npm.cmd run build
```

Expected: every command exits 0; Vite produces `dist/` with no TypeScript or bundle errors.

- [ ] **Step 3: Verify desktop in Chrome or Edge**

At 1920 × 1080, run one local decision; verify regret idempotency, PNG download, Clipboard success, history detail/reuse, statistics, achievements, AI unconfigured state, navigation, and zero console errors or warnings. Save the screenshot in the specified process folder.

- [ ] **Step 4: Verify 375px mobile**

At 375 × 812, repeat navigation through home, result, history detail, statistics, and AI. Confirm no page-level horizontal overflow, no clipped action text, navigation closes after selection, and every interactive target is at least 44px. Save the screenshot in the specified process folder.

- [ ] **Step 5: Write exact evidence**

Record command exit codes, test counts, build output summary, tested browser, viewport sizes, console status, overflow result, and known remaining limitation: the real AI Serverless API is not connected.

- [ ] **Step 6: Commit final verification changes**

```powershell
git add src/App.test.tsx
git commit -m "test: verify decision lab v1.5"
```

The verification record and screenshots stay in the workspace-level `过程文件文件夹/` outside this Git repository. Do not commit `dist/`, browser profiles, downloaded share PNGs, npm cache, or temporary logs.
