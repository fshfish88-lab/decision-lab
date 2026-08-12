# Mode-Specific Decision Experiences Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the shared analysis/result template with distinct random, scientific, and mystic experiences while preserving the existing decision flow, local history, responsive layout, and GitHub Pages deployment.

**Architecture:** Keep `ResultPage` as the route guard and mode dispatcher, move shared toolbar/actions into `ResultShell`, and give every implemented mode its own result component. Extend `DecisionResult` with optional mode-specific details so new decisions carry honest display data while old version-1 LocalStorage records still render through component fallbacks.

**Tech Stack:** React 19, TypeScript strict mode, React Router, Framer Motion, Lucide Icons, CSS, Vitest, Testing Library, Playwright CLI, GitHub Actions/Pages.

---

## File map

**Create:**

- `src/components/results/ResultShell.tsx` — shared result toolbar, question heading, and actions.
- `src/components/results/RandomResult.tsx` — draw landing, probability, seed, and random commentary.
- `src/components/results/ScientificResult.tsx` — score, ranking, contribution bars, and comparison matrix.
- `src/components/results/MysticResult.tsx` — destiny report, orbit chart, evidence, and favorable/avoid advice.
- `src/components/results/results.test.tsx` — mode-content and legacy-fallback component tests.
- `src/pages/AnalysisPage.test.tsx` — mode-specific analysis copy tests.

**Modify:**

- `src/types/decision.ts` — optional mode detail union.
- `src/algorithms/random.ts` and `src/algorithms/random.test.ts` — expose the actual sampled draw.
- `src/services/decisionEngine.ts` and `src/services/decisionEngine.test.ts` — generate stable display details.
- `src/pages/AnalysisPage.tsx` — mode configuration and distinct progress visuals.
- `src/pages/ResultPage.tsx` — route guard and independent component dispatch.
- `src/App.test.tsx` — assert the three complete flows land on different result structures.
- `src/index.css` — mode-specific Bento layouts and responsive rules.

## Task 1: Capture honest random draw metadata

**Files:**

- Modify: `src/algorithms/random.test.ts`
- Modify: `src/algorithms/random.ts`
- Modify: `src/types/decision.ts`
- Modify: `src/services/decisionEngine.test.ts`
- Modify: `src/services/decisionEngine.ts`

- [ ] **Step 1: Write the failing random draw test**

Add this behavior to `src/algorithms/random.test.ts`:

```ts
import { chooseRandomOption, cleanOptions, drawRandomOption } from './random'

it('returns the exact sample and landing index used by the draw', () => {
  const draw = drawRandomOption(['火锅', '日料', '烧烤'], () => 0.7)

  expect(draw).toEqual({
    winner: '烧烤',
    sample: 0.7,
    winningIndex: 2,
    optionCount: 3,
  })
})
```

- [ ] **Step 2: Run the test and verify the RED state**

Run:

```powershell
npm.cmd run test:run -- src/algorithms/random.test.ts
```

Expected: failure because `drawRandomOption` is not exported.

- [ ] **Step 3: Implement the random draw API**

Add to `src/algorithms/random.ts` and make `chooseRandomOption` delegate to it:

```ts
export interface RandomDraw {
  winner: string
  sample: number
  winningIndex: number
  optionCount: number
}

export function drawRandomOption(
  options: string[],
  random: () => number = Math.random,
): RandomDraw {
  const validOptions = cleanOptions(options)
  if (validOptions.length < 2) throw new Error('至少需要两个有效选项')

  const sample = random()
  if (sample < 0 || sample >= 1) {
    throw new Error('随机源必须返回 [0, 1) 区间内的数值')
  }

  const winningIndex = Math.floor(sample * validOptions.length)
  return {
    winner: validOptions[winningIndex],
    sample,
    winningIndex,
    optionCount: validOptions.length,
  }
}

export function chooseRandomOption(
  options: string[],
  random: () => number = Math.random,
): string {
  return drawRandomOption(options, random).winner
}
```

- [ ] **Step 4: Add mode-detail types**

Add the following to `src/types/decision.ts` and add `details?: DecisionResultDetails` to `DecisionResult`:

```ts
export interface RandomResultDetails {
  type: 'random'
  sample: number
  winningIndex: number
  seed: string
  drawNumber: string
  probability: number
}

export interface ScientificContribution {
  criterionId: string
  name: string
  weight: number
  score: number
  contribution: number
}

export interface ScientificResultDetails {
  type: 'scientific'
  criteria: Criterion[]
  scores: ScientificScoreMap
  contributions: ScientificContribution[]
}

export interface MysticEvidence {
  key: string
  title: string
  description: string
  reading: string
}

export interface MysticResultDetails {
  type: 'mystic'
  evidence: MysticEvidence[]
  favorable: string
  avoid: string
}

export type DecisionResultDetails =
  | RandomResultDetails
  | ScientificResultDetails
  | MysticResultDetails
```

- [ ] **Step 5: Write the failing random result-detail assertions**

Extend the random result test in `src/services/decisionEngine.test.ts`:

```ts
expect(result.details).toEqual({
  type: 'random',
  sample: 0,
  winningIndex: 0,
  seed: '0000-0000',
  drawNumber: '#000001',
  probability: 0.5,
})
```

Run the service test and confirm it fails because `details` is missing.

- [ ] **Step 6: Generate random details from the actual sample**

In `src/services/decisionEngine.ts`, replace the random winner call with `drawRandomOption`, map the winner as before, and add:

```ts
function formatRandomSeed(sample: number): string {
  const encoded = Math.floor(sample * 0xffffffff)
    .toString(16)
    .toUpperCase()
    .padStart(8, '0')
  return `${encoded.slice(0, 4)}-${encoded.slice(4)}`
}

function formatDrawNumber(sample: number): string {
  const number = Math.floor(sample * 999999) + 1
  return `#${String(number).padStart(6, '0')}`
}
```

Set `probability` to `1 / draw.optionCount`; keep existing metrics for storage compatibility, but the new random result component will not render them.

- [ ] **Step 7: Verify GREEN and commit**

Run:

```powershell
npm.cmd run test:run -- src/algorithms/random.test.ts src/services/decisionEngine.test.ts
git add src/algorithms/random.ts src/algorithms/random.test.ts src/types/decision.ts src/services/decisionEngine.ts src/services/decisionEngine.test.ts
git commit -m "feat: capture mode-specific result details"
```

Expected: both test files pass with no warnings.

## Task 2: Generate scientific contributions and mystic evidence

**Files:**

- Modify: `src/services/decisionEngine.test.ts`
- Modify: `src/services/decisionEngine.ts`

- [ ] **Step 1: Write failing scientific contribution assertions**

In the scientific service test, assert:

```ts
expect(result.details?.type).toBe('scientific')
if (result.details?.type !== 'scientific') throw new Error('科学详情缺失')

expect(result.details.contributions).toEqual([
  {
    criterionId: 'taste',
    name: '喜欢程度',
    weight: 60,
    score: 7,
    contribution: 4.2,
  },
  {
    criterionId: 'price',
    name: '价格',
    weight: 40,
    score: 9,
    contribution: 3.6,
  },
])
expect(
  result.details.contributions.reduce((sum, item) => sum + item.contribution, 0),
).toBeCloseTo(result.ranking?.[0].score ?? 0, 8)
```

- [ ] **Step 2: Write failing mystic evidence assertions**

In the mystic service test, assert:

```ts
expect(result.details?.type).toBe('mystic')
if (result.details?.type !== 'mystic') throw new Error('玄学详情缺失')

expect(result.details.evidence).toHaveLength(3)
expect(result.details.evidence.map((item) => item.title)).toEqual([
  '输入顺序效应',
  '字符共振',
  '平行时间线',
])
expect(result.details.favorable).toContain(result.winner.label)
expect(result.details.avoid).toContain('重新')
```

- [ ] **Step 3: Run service tests and verify RED**

Run:

```powershell
npm.cmd run test:run -- src/services/decisionEngine.test.ts
```

Expected: failures because scientific and mystic details are absent.

- [ ] **Step 4: Implement scientific details**

In `createScientificResult`, build contributions from the winning option:

```ts
const contributions = input.criteria.map((criterion) => {
  const score = input.scores[winner.id][criterion.id]
  return {
    criterionId: criterion.id,
    name: criterion.name,
    weight: criterion.weight,
    score,
    contribution: score * criterion.weight / 100,
  }
})
```

Attach copied criteria, copied nested score maps, and `contributions` under `details: { type: 'scientific', ... }`. Generate the explanation from the largest contribution and the gap to rank two:

```ts
const strongest = [...contributions].sort(
  (left, right) => right.contribution - left.contribution,
)[0]
const runnerUp = ranking[1]
const gap = runnerUp ? leader.score - runnerUp.score : leader.score
const explanation = `「${winner.label}」在“${strongest.name}”上获得本轮最高贡献 ${strongest.contribution.toFixed(2)} 分，并以 ${gap.toFixed(2)} 分的综合优势胜出。`
```

- [ ] **Step 5: Implement deterministic mystic evidence**

Add a private helper that returns exactly three entries:

```ts
function buildMysticEvidence(
  input: RandomResultInput,
  winner: DecisionOption,
  confidence: number,
): MysticEvidence[] {
  const inputPosition = input.options.findIndex((option) => option.id === winner.id) + 1
  const resonance = ((winner.label.trim().length * 137 + confidence) % 1000) / 1000
  const timelines = Math.min(9999, confidence * 100 + winner.label.trim().length * 7)

  return [
    {
      key: 'input-order',
      title: '输入顺序效应',
      description: `你把「${winner.label}」放在第 ${inputPosition} 个位置，系统认为这绝非偶然。`,
      reading: `POSITION / ${String(inputPosition).padStart(2, '0')}`,
    },
    {
      key: 'character-resonance',
      title: '字符共振',
      description: `当前时间与「${winner.label}」的字符长度产生了异常稳定的相关性。`,
      reading: `RESONANCE / ${resonance.toFixed(3)}`,
    },
    {
      key: 'parallel-timelines',
      title: '平行时间线',
      description: `在 10,000 条模拟时间线中，有 ${timelines.toLocaleString('zh-CN')} 个你最终选择了「${winner.label}」。`,
      reading: `TIMELINES / ${timelines}`,
    },
  ]
}
```

Attach the evidence plus `favorable: `今日宜：${winner.label}`` and `avoid: '今日忌：重新打开选项继续纠结'` to the mystic result.

- [ ] **Step 6: Verify GREEN and commit**

Run:

```powershell
npm.cmd run test:run -- src/services/decisionEngine.test.ts
git add src/services/decisionEngine.ts src/services/decisionEngine.test.ts
git commit -m "feat: explain scientific and mystic results"
```

## Task 3: Differentiate the analysis animation from the first frame

**Files:**

- Create: `src/pages/AnalysisPage.test.tsx`
- Modify: `src/pages/AnalysisPage.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write failing mode-copy tests**

Create `src/pages/AnalysisPage.test.tsx`. Render `AnalysisPage` inside `MemoryRouter` and a test `DecisionContext.Provider` value with a prepared result for each mode. Assert:

```ts
expect(screen.getByRole('heading', { name: '正在启动命运抽签' })).toBeInTheDocument()
expect(screen.getByText('正在生成随机种子')).toBeInTheDocument()

expect(screen.getByRole('heading', { name: '正在进行科学计算' })).toBeInTheDocument()
expect(screen.getByText('正在应用指标权重')).toBeInTheDocument()

expect(screen.getByRole('heading', { name: '正在连接命运频道' })).toBeInTheDocument()
expect(screen.getByText('正在搜索平行时间线')).toBeInTheDocument()
```

Use fake timers and clear them after every test so navigation timers never leak.

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
npm.cmd run test:run -- src/pages/AnalysisPage.test.tsx
```

Expected: all three headings are missing because the page still uses one generic configuration.

- [ ] **Step 3: Add typed analysis configurations**

In `AnalysisPage.tsx`, replace `ANALYSIS_STEPS` with:

```ts
const ANALYSIS_CONFIG: Record<DecisionMode, {
  eyebrow: string
  title: string
  description: string
  steps: readonly string[]
  conclusion: string
}> = {
  random: {
    eyebrow: 'RANDOM MODE / SHUFFLING',
    title: '正在启动命运抽签',
    description: '没有偏好，没有暗箱，只有一次诚实的等概率落点。',
    steps: ['正在洗牌候选项', '正在生成随机种子', '正在排除人为干预', '正在确认命运落点'],
    conclusion: '命运确认。',
  },
  scientific: {
    eyebrow: 'SCIENTIFIC MODE / CALCULATING',
    title: '正在进行科学计算',
    description: '评分、权重与排名都将按照本次输入真实计算。',
    steps: ['正在校验评分矩阵', '正在应用指标权重', '正在计算综合得分', '正在生成完整排名'],
    conclusion: '计算完成。',
  },
  mystic: {
    eyebrow: 'MYSTIC MODE / CONNECTING',
    title: '正在连接命运频道',
    description: '水晶球正在工作，科学部门已暂时离开现场。',
    steps: ['正在校准宇宙频率', '正在读取潜意识波动', '正在搜索平行时间线', '水晶球连接稳定'],
    conclusion: '天机已泄露。',
  },
}
```

Select configuration from `preparedResult.current.mode`, apply `analysis-console--${mode}`, render the configuration values, and render a mode-specific visual with `aria-hidden="true"`.

- [ ] **Step 4: Add analysis visual CSS**

Add CSS classes for `.analysis-console--random`, `.analysis-console--scientific`, `.analysis-console--mystic`, `.analysis-mode-visual`, `.analysis-shuffle-card`, `.analysis-data-bar`, and `.analysis-orbit-dot`. Use existing color variables, cap motion at the existing two-second window, and disable the new keyframes inside the existing reduced-motion media query.

- [ ] **Step 5: Verify GREEN and commit**

Run:

```powershell
npm.cmd run test:run -- src/pages/AnalysisPage.test.tsx src/App.test.tsx
git add src/pages/AnalysisPage.tsx src/pages/AnalysisPage.test.tsx src/index.css
git commit -m "feat: differentiate mode analysis sequences"
```

## Task 4: Build the shared shell and random result

**Files:**

- Create: `src/components/results/ResultShell.tsx`
- Create: `src/components/results/RandomResult.tsx`
- Create: `src/components/results/results.test.tsx`
- Modify: `src/pages/ResultPage.tsx`

- [ ] **Step 1: Write the failing random result test**

Create `results.test.tsx` with a `randomResult` fixture that contains random details. Render `RandomResult` and assert:

```ts
expect(screen.getByRole('heading', { name: '命运选择了它' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '命运落点' })).toBeInTheDocument()
expect(screen.getByText('50.00%')).toBeInTheDocument()
expect(screen.getByText('0000-0000')).toBeInTheDocument()
expect(screen.getByText('这次没有任何科学依据，但至少你不用继续纠结。')).toBeInTheDocument()
expect(screen.queryByText('指标贡献')).not.toBeInTheDocument()
```

Add a second fixture without `details` and assert the component still renders the winner and derives probability from `options.length`.

- [ ] **Step 2: Run the component test and verify RED**

Run:

```powershell
npm.cmd run test:run -- src/components/results/results.test.tsx
```

Expected: module resolution fails because `RandomResult` does not exist.

- [ ] **Step 3: Implement `ResultShell`**

Move the current mode label, toolbar, page heading, and action buttons out of `ResultPage`. The shell API is:

```ts
interface ResultShellProps {
  result: DecisionResult
  children: React.ReactNode
  onRerun: () => void
  onReturnHome: () => void
}
```

The shell renders `children` between the heading and actions. Keep `查看记录` as a `Link`; `换一种模式` and `修改选项` both return to the existing home draft without erasing it.

- [ ] **Step 4: Implement `RandomResult`**

Use the mode detail when `details?.type === 'random'`; otherwise derive:

```ts
const probability = 1 / result.options.length
const seed = 'LEGACY-RESULT'
const drawNumber = '#------'
const winningIndex = Math.max(
  0,
  result.options.findIndex((option) => option.id === result.winner.id),
)
```

Render these sections with unique headings: `命运选择了它`, `命运落点`, `本轮抽签信息`, `所有候选项概率`, and `系统评价`. Build the landing track by repeating the candidate list twice and placing the selected candidate last with a visible `STOP` label. Every probability bar uses the same percentage.

- [ ] **Step 5: Make `ResultPage` dispatch independent components**

Keep the empty-state guard and rerun behavior. Wrap mode content in `ResultShell` and render `RandomResult` when `result.mode === 'random'`. Temporarily keep the old scientific/mystic markup behind their branches until Tasks 5 and 6 replace them, ensuring the app stays runnable after this commit.

- [ ] **Step 6: Verify GREEN and commit**

Run:

```powershell
npm.cmd run test:run -- src/components/results/results.test.tsx src/App.test.tsx
git add src/components/results/ResultShell.tsx src/components/results/RandomResult.tsx src/components/results/results.test.tsx src/pages/ResultPage.tsx
git commit -m "feat: add ritual random result experience"
```

## Task 5: Build the scientific result analysis

**Files:**

- Create: `src/components/results/ScientificResult.tsx`
- Modify: `src/components/results/results.test.tsx`
- Modify: `src/pages/ResultPage.tsx`

- [ ] **Step 1: Write failing scientific result tests**

Add a scientific fixture containing two criteria, two score rows, two ranking rows, and contributions. Assert:

```ts
expect(screen.getByRole('heading', { name: '最终推荐' })).toBeInTheDocument()
expect(screen.getByText('7.80 / 10')).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '指标贡献' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '方案评分对比' })).toBeInTheDocument()
expect(screen.getByRole('columnheader', { name: '喜欢程度 60%' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '为什么它胜出？' })).toBeInTheDocument()
expect(screen.queryByText('命运落点')).not.toBeInTheDocument()
```

Add a legacy scientific fixture without details and assert ranking plus explanation still render, while a clear message states that historical detailed scores are unavailable.

- [ ] **Step 2: Run the component test and verify RED**

Run the result component test and confirm failure because `ScientificResult` is missing.

- [ ] **Step 3: Implement `ScientificResult`**

Render leader score from `ranking[0].score`, ranking with the rank-two gap, contribution bars normalized against the largest contribution, a semantic comparison table from `details.criteria` and `details.scores`, and the existing deterministic explanation. When details are absent, render ranking and explanation plus `该历史记录创建于详细贡献数据启用之前。` instead of throwing.

The contribution row must show:

```text
指标名称 · 权重百分比 | 原始评分 x.x | +贡献值
```

The table wrapper receives `tabIndex={0}` and `aria-label="方案评分对比，可横向滚动"` for keyboard access on narrow screens.

- [ ] **Step 4: Dispatch scientific mode and verify GREEN**

Update `ResultPage` to render `ScientificResult` for scientific results. Run:

```powershell
npm.cmd run test:run -- src/components/results/results.test.tsx src/App.test.tsx
git add src/components/results/ScientificResult.tsx src/components/results/results.test.tsx src/pages/ResultPage.tsx
git commit -m "feat: add scientific contribution analysis"
```

## Task 6: Build the mystic destiny report

**Files:**

- Create: `src/components/results/MysticResult.tsx`
- Modify: `src/components/results/results.test.tsx`
- Modify: `src/pages/ResultPage.tsx`

- [ ] **Step 1: Write failing mystic result tests**

Add a mystic fixture with four metrics, three evidence records, favorable advice, avoid advice, and the entertainment disclaimer. Assert:

```ts
expect(screen.getByText('DESTINY REPORT')).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '今日命运报告' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '命运星盘' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '玄学证据' })).toBeInTheDocument()
expect(screen.getByText('证据 01')).toBeInTheDocument()
expect(screen.getByText(/今日宜：/)).toBeInTheDocument()
expect(screen.getByText(/今日忌：/)).toBeInTheDocument()
expect(screen.getByText(/仅供娱乐/)).toBeInTheDocument()
expect(screen.queryByText('方案评分对比')).not.toBeInTheDocument()
```

Add a legacy fixture without details and assert three fallback evidence cards are derived from winner, option order, and confidence.

- [ ] **Step 2: Run the component test and verify RED**

Run the result component test and confirm failure because `MysticResult` is missing.

- [ ] **Step 3: Implement `MysticResult`**

Render the report hero, a CSS orbit with winner in the center, metric labels around the orbit, three evidence cards, favorable/avoid cards, explanation, and disclaimer. Use `Sparkles`, `Orbit`, and `Telescope` from Lucide; keep orbit decorations `aria-hidden="true"`. Create fallback evidence with the same three titles when mode details are absent.

- [ ] **Step 4: Finish mode dispatch and remove shared detailed markup**

Update `ResultPage` so all three branches render only their independent components. Remove `MetricRing` imports and the old shared hero, confidence, metric, ranking, and explanation DOM from `ResultPage`. Keep `MetricRing.tsx` only if another route imports it; otherwise delete it after confirming with `rg "MetricRing" src`.

- [ ] **Step 5: Verify GREEN and commit**

Run:

```powershell
npm.cmd run test:run -- src/components/results/results.test.tsx src/App.test.tsx
git add src/components/results/MysticResult.tsx src/components/results/results.test.tsx src/pages/ResultPage.tsx src/components/MetricRing.tsx
git commit -m "feat: add mystic destiny report"
```

If `MetricRing.tsx` remains in use, omit it from the deletion and from the `git add` command.

## Task 7: Style three distinct responsive result layouts

**Files:**

- Modify: `src/index.css`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Strengthen complete-flow assertions before styling**

Update `src/App.test.tsx` so the random flow reaches `命运落点`, the scientific flow reaches `指标贡献` and `方案评分对比`, and the mystic flow reaches `命运星盘` and `玄学证据`. Keep the existing history assertion.

Run the app test once before the CSS change. It should pass functionally; this establishes that later CSS edits do not alter flow behavior.

- [ ] **Step 2: Add shared result-shell styles**

Keep `.result-page`, `.result-toolbar`, `.result-heading`, and `.result-actions`. Add `.mode-result`, `.mode-result__section`, and `.mode-result__heading` for spacing only; do not give them a shared analysis layout.

- [ ] **Step 3: Add random-specific styles**

Add styles for:

```text
.random-result__hero
.fate-track
.fate-track__item
.fate-track__item.is-winner
.random-meta-grid
.random-seed-card
.probability-list
.probability-row
```

Use purple soft colors, a horizontal landing strip, equal-width bars, and a clear STOP marker. The landing motion must stop under reduced motion.

- [ ] **Step 4: Add scientific-specific styles**

Add styles for:

```text
.scientific-result__hero
.scientific-ranking
.contribution-list
.contribution-row
.contribution-bar
.score-comparison-wrap
.score-comparison
.science-explanation
```

Use yellow highlights, dense but readable rows, CSS contribution bars, tabular numerals, and internal table overflow only.

- [ ] **Step 5: Add mystic-specific styles**

Add styles for:

```text
.mystic-report
.destiny-orbit
.destiny-orbit__core
.destiny-orbit__metric
.mystic-evidence-grid
.mystic-evidence-card
.daily-guidance
```

Use pale pink, lavender orbit lines, white cards, subtle rotation, and no dark occult theme.

- [ ] **Step 6: Add responsive and reduced-motion rules**

At existing `960px`, `720px`, and `480px` breakpoints, collapse all Bento grids to one column as needed. Ensure `.score-comparison-wrap` owns overflow, set `max-width: 100%`, and keep `body` free of horizontal overflow. Add every new keyframe selector to the existing `prefers-reduced-motion` block.

- [ ] **Step 7: Run tests and commit**

Run:

```powershell
npm.cmd run test:run -- src/App.test.tsx src/components/results/results.test.tsx
git add src/index.css src/App.test.tsx
git commit -m "style: distinguish decision result modes"
```

## Task 8: Full verification, browser QA, and release

**Files:**

- Create outside product repository: `过程文件文件夹/验证记录/2026-08-13-mode-specific-results/verification.md`
- Create outside product repository: desktop/mobile screenshots for all three modes.

- [ ] **Step 1: Run all automated checks**

Run from `成品文件夹/decision-lab`:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:run
npm.cmd run test:pages
```

Expected: zero lint warnings, zero type errors, every test passes, production build succeeds, and Pages asset verification succeeds.

- [ ] **Step 2: Run local production browser QA**

Start `npm.cmd run preview -- --host 127.0.0.1 --port 4174`. With Playwright CLI, complete random, scientific, and mystic flows at 1920×1080 and 375×812. Verify:

- each analysis page has its own title and steps;
- each result page has its own structure;
- random probabilities are equal;
- scientific contribution sum matches winner score shown;
- mystic page has exactly three evidence cards and entertainment disclaimer;
- desktop and mobile have no page-level horizontal overflow;
- scientific comparison table scrolls inside its wrapper at 375px;
- controls retain at least 44px hit areas;
- browser console has zero site errors and warnings.

Save screenshots and measured values in the process verification folder.

- [ ] **Step 3: Verify repository state and push**

Confirm `git status --short` is empty and `git diff --check` passes. Push `main` with command-scoped HTTP/1.1 if Windows Schannel requires it:

```powershell
git -c http.version=HTTP/1.1 push origin main
```

- [ ] **Step 4: Verify GitHub Pages deployment**

Wait for the workflow associated with the pushed commit. Require both `build=success` and `deploy=success`. Then open:

```text
https://fshfish88-lab.github.io/decision-lab/
```

Repeat one desktop and one 375px online flow, confirm the new mode headings exist, confirm console cleanliness, and HTTP-check HTML, hashed CSS, hashed JavaScript, and the brand SVG for `200` responses.

- [ ] **Step 5: Record release evidence**

Write commit SHA, workflow run ID, job conclusions, production asset sizes, browser measurements, console results, and online HTTP results to the verification record. Do not claim release completion until every recorded command has fresh successful output.
