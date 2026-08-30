# Decision Lab App / Web UI Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变现有网页 UI 和业务结果的前提下，为 Android App 建立完整、独立的移动端页面体系，并重新产出可安装 APK。

**Architecture:** React 路由、算法、上下文、存储结构和 API 客户端继续共享；平台边界只负责选择 `WebAppShell` 或 `MobileAppShell`，各业务页再选择 Web/Mobile 视图。Android 包内加载本次构建生成的 `dist`，不配置远程 `server.url`，因此每次 App UI 变更都必须同步 Capacitor 并重新构建 APK。

**Tech Stack:** React 19、TypeScript strict、Vite、React Router、Tailwind CSS、Framer Motion、Lucide、Vitest、Testing Library、Capacitor 8、Android Gradle。

---

## Scope and non-goals

- App 覆盖 `/`、`/science`、`/tarot`、`/ai`、`/analysis`、`/result`、`/history`、`/statistics`、`/about`。
- App 顶层导航固定为“决策 / 记录 / 统计 / 关于”；流程页隐藏底栏，使用返回栏、步骤提示和底部主操作。
- Web 页面保持现状；不把网页简单压窄，也不重写已验证的算法、提示词、存储数据或 API 协议。
- Web 与 App 共享代码和 LocalStorage schema，但 Web 浏览器与 Android WebView 的实际本地存储彼此隔离；本阶段不做云同步。
- 不新增设置页，不伪造离线 AI、分享、登录或后端功能。

## Task 1: Freeze and verify the current Android baseline

**Files:**

- Modify: `.gitignore`
- Verify: `package.json`
- Verify: `capacitor.config.ts`
- Verify: `android/`

- [ ] **Step 1: Record the exact dirty baseline**

Run:

```powershell
git status --short
git diff -- eslint.config.js package.json package-lock.json capacitor.config.ts
```

Expected: only the known Capacitor/Android bootstrap changes appear. Stop if unrelated user edits overlap these files.

- [ ] **Step 2: Exclude local process artifacts**

Append only this entry to `.gitignore`:

```gitignore
.superpowers/
```

Confirm Android ignores still exclude `local.properties`, signing files, Gradle caches and generated APKs. Never commit SDK/JDK/cache paths or a `.jks` file.

- [ ] **Step 3: Verify the web baseline before UI separation**

Run:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:run
npm.cmd run build
```

Expected: all commands exit `0`; test baseline remains 26 files / 116 tests unless the checkout already contains a newer verified count.

- [ ] **Step 4: Verify the Android baseline with the D-drive toolchain**

Run from `android/`:

```powershell
$env:JAVA_HOME='D:\Android Studio\Jdk\jdk-21.0.12.1+1'
$env:ANDROID_HOME='D:\Android Studio\Sdk'
$env:GRADLE_USER_HOME='D:\Android Studio\GradleCache'
.\gradlew.bat testDebugUnitTest lintDebug assembleDebug
```

Expected: `BUILD SUCCESSFUL` and `android/app/build/outputs/apk/debug/app-debug.apk` exists.

- [ ] **Step 5: Commit the baseline separately**

Stage only `.gitignore`, `eslint.config.js`, `package.json`, `package-lock.json`, `capacitor.config.ts`, and source/configuration files under `android/`.

```powershell
git add .gitignore eslint.config.js package.json package-lock.json capacitor.config.ts android
git status --short
git commit -m "build: add verified Android Capacitor baseline"
```

Expected: no APK, keystore, `local.properties`, SDK, JDK, or Gradle cache is staged.

## Task 2: Add one testable platform boundary

**Files:**

- Create: `src/platform/PlatformContext.ts`
- Create: `src/platform/PlatformProvider.tsx`
- Create: `src/platform/PlatformProvider.test.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Write failing tests for native, web and preview modes**

Test these exact behaviors:

```ts
expect(resolvePlatform({ native: true, preview: null, isDev: false })).toBe('app')
expect(resolvePlatform({ native: false, preview: null, isDev: false })).toBe('web')
expect(resolvePlatform({ native: false, preview: 'app', isDev: true })).toBe('app')
expect(resolvePlatform({ native: false, preview: 'app', isDev: false })).toBe('web')
```

The development override is `?ui=app`; it must be ignored in production builds.

- [ ] **Step 2: Run the focused test and confirm red**

```powershell
npm.cmd run test:run -- src/platform/PlatformProvider.test.tsx
```

Expected: failure because the platform module does not yet exist.

- [ ] **Step 3: Implement the smallest platform API**

```ts
export type AppPlatform = 'web' | 'app'

export function resolvePlatform(input: {
  native: boolean
  preview: string | null
  isDev: boolean
}): AppPlatform {
  if (input.native) return 'app'
  return input.isDev && input.preview === 'app' ? 'app' : 'web'
}
```

`PlatformProvider` reads `Capacitor.isNativePlatform()`, `URLSearchParams`, and `import.meta.env.DEV`, then exposes `usePlatform()` through context. Do not scatter direct Capacitor checks across page components.

- [ ] **Step 4: Install the provider at the root**

In `src/main.tsx`, place `PlatformProvider` outside `AppRoutes` but inside the existing error/decision providers so routing behavior remains unchanged.

- [ ] **Step 5: Verify and commit**

```powershell
npm.cmd run test:run -- src/platform/PlatformProvider.test.tsx
npm.cmd run typecheck
git add src/platform src/main.tsx
git commit -m "feat: add app platform boundary"
```

Expected: focused tests and typecheck pass.

## Task 3: Split the global shell without changing routes

**Files:**

- Create: `src/navigation/navigationItems.ts`
- Create: `src/web/WebAppShell.tsx`
- Create: `src/mobile/MobileAppShell.tsx`
- Create: `src/mobile/MobileAppShell.test.tsx`
- Modify: `src/components/AppShell.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Extract shared route metadata**

Define stable route data, not rendered JSX:

```ts
export const mobilePrimaryNavigation = [
  { label: '决策', to: '/', icon: Sparkles },
  { label: '记录', to: '/history', icon: History },
  { label: '统计', to: '/statistics', icon: ChartNoAxesCombined },
  { label: '关于', to: '/about', icon: CircleHelp },
] as const

export const mobileFlowRoutes = new Set([
  '/science', '/tarot', '/ai', '/analysis', '/result',
])
```

- [ ] **Step 2: Preserve the existing web shell verbatim**

Move the current `AppShell` presentation into `src/web/WebAppShell.tsx`. Keep its header, desktop navigation, mobile menu and footer behavior unchanged.

- [ ] **Step 3: Write failing mobile shell tests**

Cover:

- `/` renders all four bottom navigation labels and marks “决策” active.
- `/history` marks “记录” active.
- `/science` hides the bottom navigation and renders a back affordance.
- the content wrapper has a semantic `main` element.

- [ ] **Step 4: Implement the dispatcher and mobile shell**

`src/components/AppShell.tsx` becomes the only branch:

```tsx
export function AppShell() {
  const platform = usePlatform()
  return platform === 'app' ? <MobileAppShell /> : <WebAppShell />
}
```

The mobile shell owns safe-area wrappers and route chrome only. It must not own decision state or page business logic.

- [ ] **Step 5: Verify route and shell behavior**

```powershell
npm.cmd run test:run -- src/mobile/MobileAppShell.test.tsx
npm.cmd run test:run -- src/App.test.tsx
npm.cmd run typecheck
```

Expected: existing route tests still pass; mobile shell tests pass.

- [ ] **Step 6: Commit**

```powershell
git add src/navigation src/web src/mobile/MobileAppShell.tsx src/mobile/MobileAppShell.test.tsx src/components/AppShell.tsx src/App.tsx
git commit -m "feat: split web and mobile application shells"
```

## Task 4: Build scoped mobile primitives and design tokens

**Files:**

- Create: `src/mobile/mobile.css`
- Create: `src/mobile/components/MobilePageHeader.tsx`
- Create: `src/mobile/components/MobileStickyAction.tsx`
- Create: `src/mobile/components/MobileModeCard.tsx`
- Create: `src/mobile/components/MobileOptionEditor.tsx`
- Create: `src/mobile/components/mobilePrimitives.test.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Write accessibility-first primitive tests**

Require 44px minimum targets, semantic labels, visible disabled state, keyboard focus classes, and text labels in addition to color/icon state. Verify the option editor rejects blank values and respects the existing 2–10 option and 30-character rules.

- [ ] **Step 2: Add mobile-only scoped tokens**

All selectors must live below `.mobile-app`; do not redefine global Web styles.

```css
.mobile-app {
  --mobile-bg: #f7f8fc;
  --mobile-card: #ffffff;
  --mobile-text: #14151a;
  --mobile-muted: #747782;
  --mobile-border: #e9eaf0;
  min-height: 100dvh;
  background: var(--mobile-bg);
  color: var(--mobile-text);
}

.mobile-app__content {
  padding-bottom: calc(88px + env(safe-area-inset-bottom));
}
```

Use the approved mode palettes and 12/16/20/24px radius hierarchy. Avoid emoji, neon, glassmorphism and page-wide gradients.

- [ ] **Step 3: Implement reusable primitives**

Keep props narrow and typed. `MobileStickyAction` accepts `label`, `disabled`, `onClick`, and optional helper text. `MobileModeCard` accepts the same mode identity and selection callback used by the existing Web card. `MobileOptionEditor` reuses existing validation helpers rather than duplicating limits.

- [ ] **Step 4: Verify CSS isolation and tests**

```powershell
npm.cmd run test:run -- src/mobile/components/mobilePrimitives.test.tsx
npm.cmd run lint
npm.cmd run typecheck
```

Expected: no unscoped `.button`, `.card`, `body`, or Web component selector is introduced in `mobile.css`.

- [ ] **Step 5: Commit**

```powershell
git add src/mobile src/main.tsx
git commit -m "feat: add mobile app design primitives"
```

## Task 5: Separate the Home page view while preserving its controller

**Files:**

- Create: `src/pages/home/HomePageController.tsx`
- Create: `src/web/pages/WebHomeView.tsx`
- Create: `src/mobile/pages/MobileHomeView.tsx`
- Create: `src/mobile/pages/MobileHomeView.test.tsx`
- Modify: `src/pages/HomePage.tsx`

- [ ] **Step 1: Characterize existing Home behavior before refactoring**

Add or retain tests for question editing, option add/remove/edit, mode selection and navigation to the selected flow. Assert behavior and route changes, not DOM structure from the old layout.

- [ ] **Step 2: Extract a shared view model**

Define one typed contract consumed by both views:

```ts
export interface HomeViewProps {
  question: string
  options: DecisionOption[]
  selectedMode: DecisionMode | null
  validationMessage: string | null
  onQuestionChange(value: string): void
  onOptionChange(id: string, value: string): void
  onAddOption(): void
  onRemoveOption(id: string): void
  onSelectMode(mode: DecisionMode): void
  onStart(): void
}
```

The controller keeps all current `DecisionContext` interactions and route selection. Do not change algorithms or payload shapes.

- [ ] **Step 3: Move the current Web markup unchanged**

`WebHomeView` retains Hero, DecisionMachine/workbench and current desktop/mobile Web presentation. Only replace direct state access with `HomeViewProps`.

- [ ] **Step 4: Implement the App home**

Build a single-column screen with:

- compact “Decision Lab / 今天想决定什么？” heading;
- question and option editing card;
- two-column 2×2 mode grid using the four approved soft colors;
- explicit selected text/check state;
- sticky “开始决策” action above the safe-area bottom navigation.

At 375px there must be no horizontal scroll. Inputs and controls remain at least 44px high.

- [ ] **Step 5: Run focused and regression tests**

```powershell
npm.cmd run test:run -- src/mobile/pages/MobileHomeView.test.tsx src/pages/HomePage.test.tsx
npm.cmd run typecheck
npm.cmd run build
```

Expected: both platform views drive the same controller behavior.

- [ ] **Step 6: Commit**

```powershell
git add src/pages/HomePage.tsx src/pages/home src/web/pages/WebHomeView.tsx src/mobile/pages/MobileHomeView.tsx src/mobile/pages/MobileHomeView.test.tsx
git commit -m "feat: add dedicated mobile decision home"
```

## Task 6: Convert Scientific mode into a mobile step flow

**Files:**

- Create: `src/pages/science/useScienceDecision.ts`
- Create: `src/web/pages/WebScienceView.tsx`
- Create: `src/mobile/pages/MobileScienceView.tsx`
- Create: `src/mobile/pages/MobileScienceView.test.tsx`
- Modify: `src/pages/SciencePage.tsx`

- [ ] **Step 1: Characterize current scientific-mode behavior**

Tests must preserve criterion add/remove, weight total validation, 1–10 score validation, random fill behavior, calculation route and `1e-6` score precision.

- [ ] **Step 2: Extract the current state and handlers into a typed hook**

The hook owns criteria, weights, scores, current errors and final calculation. Views may choose a step but may not recalculate results independently.

- [ ] **Step 3: Keep the Web table-based view unchanged**

Move existing Web JSX to `WebScienceView`; do not redesign it during this task.

- [ ] **Step 4: Implement two App steps**

Step 1 edits criteria and weights with a visible “合计 100%” status. Step 2 presents one option card at a time with 1–10 controls and progress. Use a sticky primary action for next/calculate; do not render the desktop scoring table on mobile.

- [ ] **Step 5: Verify and commit**

```powershell
npm.cmd run test:run -- src/mobile/pages/MobileScienceView.test.tsx src/algorithms/scientificDecision.test.ts
npm.cmd run lint
npm.cmd run typecheck
git add src/pages/SciencePage.tsx src/pages/science src/web/pages/WebScienceView.tsx src/mobile/pages/MobileScienceView.tsx src/mobile/pages/MobileScienceView.test.tsx
git commit -m "feat: add mobile scientific decision flow"
```

Expected: scientific algorithm tests remain byte-for-byte behavior-compatible and the mobile view cannot proceed with invalid weights/scores.

## Task 7: Add dedicated Tarot and analysis experiences

**Files:**

- Create: `src/web/pages/WebTarotView.tsx`
- Create: `src/mobile/pages/MobileTarotView.tsx`
- Create: `src/mobile/pages/MobileTarotView.test.tsx`
- Modify: `src/pages/TarotPage.tsx`
- Create: `src/web/pages/WebAnalysisView.tsx`
- Create: `src/mobile/pages/MobileAnalysisView.tsx`
- Create: `src/mobile/pages/MobileAnalysisView.test.tsx`
- Modify: `src/pages/AnalysisPage.tsx`

- [ ] **Step 1: Add behavior tests before moving markup**

For Tarot, cover deck/start/reveal/result navigation and the entertainment disclaimer. For analysis, cover progress completion, cancellation/back behavior and `prefers-reduced-motion`.

- [ ] **Step 2: Preserve shared engines and timers**

Keep Tarot selection/template generation and analysis sequencing in the existing page controller or extracted hooks. Neither mobile view may invent a second randomization path or a second timeout schedule.

- [ ] **Step 3: Implement App Tarot presentation**

Use a focused card-stage layout, short instruction, one primary action and readable reveal copy. Motion may enhance card reveal but must fall back to opacity/instant state under reduced motion. Keep the “仅供娱乐” message visible.

- [ ] **Step 4: Implement App analysis presentation**

Use a compact immersive progress screen with a real cancel/back action, progress/status text and no bottom navigation. Animation duration remains within the existing 1.5–3s product rule and never blocks the main thread.

- [ ] **Step 5: Verify and commit**

```powershell
npm.cmd run test:run -- src/mobile/pages/MobileTarotView.test.tsx src/mobile/pages/MobileAnalysisView.test.tsx src/algorithms/tarotEngine.test.ts
npm.cmd run typecheck
git add src/pages/TarotPage.tsx src/pages/AnalysisPage.tsx src/web/pages/WebTarotView.tsx src/web/pages/WebAnalysisView.tsx src/mobile/pages/MobileTarotView.tsx src/mobile/pages/MobileTarotView.test.tsx src/mobile/pages/MobileAnalysisView.tsx src/mobile/pages/MobileAnalysisView.test.tsx
git commit -m "feat: add mobile tarot and analysis experiences"
```

## Task 8: Separate AI mode and make network state explicit

**Files:**

- Create: `src/hooks/useOnlineStatus.ts`
- Create: `src/hooks/useOnlineStatus.test.tsx`
- Create: `src/web/pages/WebAiView.tsx`
- Create: `src/mobile/pages/MobileAiView.tsx`
- Create: `src/mobile/pages/MobileAiView.test.tsx`
- Modify: `src/pages/AiPage.tsx`

- [ ] **Step 1: Write online/offline and failure tests**

Cover initial `navigator.onLine`, `online`/`offline` events, disabled submit while offline, in-flight state, server error, retry with preserved inputs, and the rule that AI failure does not affect Random/Science/Tarot routes.

- [ ] **Step 2: Implement the status hook**

```ts
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  return online
}
```

- [ ] **Step 3: Preserve the existing AI request boundary**

Move presentation only. Keep current request payload normalization, endpoint behavior, timeout/error messages and result persistence. Do not put secrets or provider keys into the client.

- [ ] **Step 4: Implement the App AI view**

Use a single-column form, visible online/offline badge with text, concise privacy/network note, sticky submit and in-place retry. Offline must be described honestly; do not claim AI can run locally.

- [ ] **Step 5: Verify and commit**

```powershell
npm.cmd run test:run -- src/hooks/useOnlineStatus.test.tsx src/mobile/pages/MobileAiView.test.tsx src/services/aiClient.test.ts
npm.cmd run lint
npm.cmd run typecheck
git add src/hooks/useOnlineStatus.ts src/hooks/useOnlineStatus.test.tsx src/pages/AiPage.tsx src/web/pages/WebAiView.tsx src/mobile/pages/MobileAiView.tsx src/mobile/pages/MobileAiView.test.tsx
git commit -m "feat: add mobile AI decision experience"
```

## Task 9: Build mobile result and AI deep-analysis views

**Files:**

- Create: `src/pages/result/useDecisionResult.ts`
- Create: `src/web/pages/WebResultView.tsx`
- Create: `src/mobile/pages/MobileResultView.tsx`
- Create: `src/mobile/pages/MobileResultView.test.tsx`
- Modify: `src/pages/ResultPage.tsx`
- Create: `src/web/components/WebAiDeepAnalysisView.tsx`
- Create: `src/mobile/components/MobileAiDeepAnalysisView.tsx`
- Create: `src/mobile/components/MobileAiDeepAnalysisView.test.tsx`
- Modify: `src/components/results/AiDeepAnalysisPanel.tsx`
- Modify: `src/components/results/AiDeepAnalysisPanel.test.tsx`

- [ ] **Step 1: Lock result behavior with tests**

Cover missing result redirect/recovery, each decision mode label, saved history, regret/rerun, edit/restart, copy/share fallback, AI deep-analysis request, failure and retry.

- [ ] **Step 2: Extract one result controller**

The controller resolves the result, exposes mode-specific explanation data and invokes the existing context/history actions. Web and App views receive the same typed data; they must not independently choose a winner or rewrite computed scores.

- [ ] **Step 3: Preserve the current Web result**

Move its JSX without visual redesign. Keep all current actions available.

- [ ] **Step 4: Implement the App result hierarchy**

Show, in order: winning option, short mode-specific explanation, supporting metrics/content, primary next action, then secondary rerun/edit/share actions. Use a sheet/card pattern that fits 375px and does not hide important text behind the sticky action.

- [ ] **Step 5: Implement the App deep-analysis state machine**

Render explicit idle/loading/success/error/retry states. Keep user input and completed local decision data after a failed network request.

- [ ] **Step 6: Verify and commit**

```powershell
npm.cmd run test:run -- src/mobile/pages/MobileResultView.test.tsx src/mobile/components/MobileAiDeepAnalysisView.test.tsx src/components/results/AiDeepAnalysisPanel.test.tsx src/pages/ResultPage.test.tsx
npm.cmd run typecheck
git add src/pages/ResultPage.tsx src/pages/result src/components/results/AiDeepAnalysisPanel.tsx src/components/results/AiDeepAnalysisPanel.test.tsx src/web/pages/WebResultView.tsx src/web/components/WebAiDeepAnalysisView.tsx src/mobile/pages/MobileResultView.tsx src/mobile/pages/MobileResultView.test.tsx src/mobile/components/MobileAiDeepAnalysisView.tsx src/mobile/components/MobileAiDeepAnalysisView.test.tsx
git commit -m "feat: add mobile result and deep analysis views"
```

## Task 10: Complete the four top-level App destinations

**Files:**

- Create: `src/web/pages/WebHistoryView.tsx`
- Create: `src/mobile/pages/MobileHistoryView.tsx`
- Create: `src/mobile/pages/MobileHistoryView.test.tsx`
- Modify: `src/pages/HistoryPage.tsx`
- Create: `src/web/pages/WebStatisticsView.tsx`
- Create: `src/mobile/pages/MobileStatisticsView.tsx`
- Create: `src/mobile/pages/MobileStatisticsView.test.tsx`
- Modify: `src/pages/StatisticsPage.tsx`
- Create: `src/web/pages/WebAboutView.tsx`
- Create: `src/mobile/pages/MobileAboutView.tsx`
- Create: `src/mobile/pages/MobileAboutView.test.tsx`
- Modify: `src/pages/AboutPage.tsx`
- Create: `src/web/pages/WebNotFoundView.tsx`
- Create: `src/mobile/pages/MobileNotFoundView.tsx`
- Create: `src/mobile/pages/MobileNotFoundView.test.tsx`
- Modify: `src/pages/NotFoundPage.tsx`

- [ ] **Step 1: Preserve data behavior with characterization tests**

History: empty state, filters, expansion, deletion and clear confirmation. Statistics: current summary/achievement calculations and reduced motion. About: real product/version/contact/legal content and external-link semantics.

- [ ] **Step 2: Implement mobile History**

Use compact cards with decision mode text, time, winner and an expandable explanation. Filters become a horizontally scrollable chip row contained within the component—not page-level overflow. Destructive actions require the existing confirmation behavior.

- [ ] **Step 3: Implement mobile Statistics**

Use vertically stacked summary cards and responsive chart containers. Preserve Recharts calculations and accessible text summaries; chart color is not the only carrier of meaning.

- [ ] **Step 4: Implement mobile About**

Use a simple branded header, product explanation, version and real links. Do not create a settings destination or nonfunctional switches.

- [ ] **Step 5: Implement the mobile invalid-route recovery**

Keep the existing Web 404 view and add an App view with a plain-language error, “返回决策首页” action and no dead-end navigation. It must not silently fabricate result data or redirect before the user can understand what happened.

- [ ] **Step 6: Verify all navigation destinations**

```powershell
npm.cmd run test:run -- src/mobile/pages/MobileHistoryView.test.tsx src/mobile/pages/MobileStatisticsView.test.tsx src/mobile/pages/MobileAboutView.test.tsx src/mobile/pages/MobileNotFoundView.test.tsx
npm.cmd run typecheck
npm.cmd run build
```

Expected: each bottom-navigation item opens a functional existing route and preserves state on in-app navigation.

- [ ] **Step 7: Commit**

```powershell
git add src/pages/HistoryPage.tsx src/pages/StatisticsPage.tsx src/pages/AboutPage.tsx src/pages/NotFoundPage.tsx src/web/pages/WebHistoryView.tsx src/web/pages/WebStatisticsView.tsx src/web/pages/WebAboutView.tsx src/web/pages/WebNotFoundView.tsx src/mobile/pages/MobileHistoryView.tsx src/mobile/pages/MobileHistoryView.test.tsx src/mobile/pages/MobileStatisticsView.tsx src/mobile/pages/MobileStatisticsView.test.tsx src/mobile/pages/MobileAboutView.tsx src/mobile/pages/MobileAboutView.test.tsx src/mobile/pages/MobileNotFoundView.tsx src/mobile/pages/MobileNotFoundView.test.tsx
git commit -m "feat: complete mobile app destinations"
```

## Task 11: Harden safe areas, keyboard behavior and Android navigation

**Files:**

- Modify: `src/mobile/mobile.css`
- Modify: `src/mobile/MobileAppShell.tsx`
- Create: `src/mobile/MobileAppShell.integration.test.tsx`
- Modify only if verified necessary: `package.json`
- Modify only if verified necessary: Android/Capacitor configuration related to back handling

- [ ] **Step 1: Add safe-area and viewport rules**

Use `100dvh`, `env(safe-area-inset-top)`, and `env(safe-area-inset-bottom)`. Sticky controls must stay above the system gesture area and must not cover the focused input. Add `scroll-margin-bottom` to editable controls so WebView keyboard focusing can reveal them.

- [ ] **Step 2: Test browser history behavior first**

With `HashRouter`, verify Android/WebView back from a flow page returns to the prior in-app route and back at `/` follows the platform default. Do not add `@capacitor/app` merely to intercept back unless this verified default behavior fails.

- [ ] **Step 3: Add the smallest back fix only if needed**

If default back fails on a physical device/emulator, add `@capacitor/app`, register one listener at shell startup, call router history for non-root routes, and remove the listener on cleanup. Add an integration test for listener cleanup and root behavior before committing the dependency.

- [ ] **Step 4: Run automated integration checks**

```powershell
npm.cmd run test:run -- src/mobile/MobileAppShell.integration.test.tsx
npm.cmd run lint
npm.cmd run typecheck
```

- [ ] **Step 5: Commit**

```powershell
git add src/mobile package.json package-lock.json capacitor.config.ts android
git commit -m "fix: harden mobile safe areas and navigation"
```

Before committing, unstage package/config files if the optional native back fix was not required.

## Task 12: Visual QA Web and App variants

**Files:**

- Create: `过程文件文件夹/App-UI复测/2026-08-30-复测记录.md`
- Create: screenshots under `过程文件文件夹/App-UI复测/`
- Modify: only files implicated by a reproduced defect

- [ ] **Step 1: Start the previewable development build**

```powershell
npm.cmd run dev -- --host 127.0.0.1
```

Use `?ui=app#/` only in development. Confirm a production build ignores the query override.

- [ ] **Step 2: Test these viewports and route sets**

| Variant | Viewport | Routes |
|---|---:|---|
| App preview | 375×812 | all 9 routes and one complete Random flow |
| App preview | 412×915 | Home, Science, Result, History |
| Web | 1280×800 | all existing routes |
| Web responsive | 375×812 | Home and existing Web mobile navigation |

For every row check page-level horizontal overflow, focus visibility, 44px targets, sticky controls, bottom navigation, reduced motion and console errors.

- [ ] **Step 3: Complete functional journeys**

Run Random, Science, Tarot and AI flows without refreshing; verify History and Statistics update. Then close/reopen the browser preview and verify the expected origin-local LocalStorage persistence. Test offline AI and confirm local modes still work.

- [ ] **Step 4: Record evidence**

The Markdown record must list URL/route, viewport, result, console status and screenshot filename. Store it outside the product repository according to the project’s `过程文件文件夹` rule.

- [ ] **Step 5: Re-run focused tests for every visual fix**

Do not batch unverified CSS changes. After each fix, rerun its component test and revisit both App and Web at the affected width.

## Task 13: Full regression, Capacitor sync and APK delivery

**Files:**

- Generated: `dist/`
- Generated/synced: `android/app/src/main/assets/public/`
- Deliver: `成品文件夹/APK/Decision-Lab-v1.5.0-app-ui-debug.apk` or the version defined by the approved release policy
- Create: `过程文件文件夹/App-UI复测/APK验证.txt`

- [ ] **Step 1: Run the full Web quality gate**

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:run
npm.cmd run build
```

Expected: all exit `0`; existing 26 files / 116 tests remain green plus the new mobile tests. Record the actual final count rather than copying the expected count.

- [ ] **Step 2: Confirm the production build chooses Web in a browser**

Serve `dist` and open both `/#/` and `/?ui=app#/`. Expected: both render Web UI because the override is development-only.

- [ ] **Step 3: Sync the embedded Web bundle**

```powershell
npm.cmd run android:sync
```

Expected: Capacitor copies the current `dist` into Android assets. Verify `capacitor.config.ts` has no remote `server.url`; `server.hostname` only sets the local WebView origin.

- [ ] **Step 4: Build and validate the debug APK**

```powershell
Set-Location android
$env:JAVA_HOME='D:\Android Studio\Jdk\jdk-21.0.12.1+1'
$env:ANDROID_HOME='D:\Android Studio\Sdk'
$env:GRADLE_USER_HOME='D:\Android Studio\GradleCache'
.\gradlew.bat testDebugUnitTest lintDebug assembleDebug
```

Expected: `BUILD SUCCESSFUL` and a fresh `app-debug.apk` timestamp after the sync.

- [ ] **Step 5: Copy, inspect and hash the deliverable**

Copy the APK into `成品文件夹/APK/` without deleting earlier versions. Run SDK tools against the copied file:

```powershell
& 'D:\Android Studio\Sdk\build-tools\36.0.0\apksigner.bat' verify --verbose '<copied-apk>'
& 'D:\Android Studio\Sdk\build-tools\36.0.0\aapt.exe' dump badging '<copied-apk>'
Get-FileHash -Algorithm SHA256 '<copied-apk>'
```

Expected: signature verifies; package is `com.fshfish.decisionlab`; version, min/target SDK and SHA-256 are recorded in `APK验证.txt`.

- [ ] **Step 6: Perform device/emulator smoke test when available**

Install with `adb install -r`, open the App, complete one local decision, press Android back through a flow, rotate/reopen if supported, and inspect `adb logcat` for fatal exceptions. If no device/emulator is available, state this explicitly as the only unverified item.

- [ ] **Step 7: Final repository check and release commit**

```powershell
git status --short
git diff --check
```

Expected: no generated APK, `dist`, Gradle output, local properties, keystore, screenshots or process records are staged in the product repository. Commit only intentional source/configuration changes:

```powershell
git add src package.json package-lock.json capacitor.config.ts android
git commit -m "feat: deliver separate Decision Lab app interface"
```

## Completion checklist

- [ ] All nine routes have an App-specific presentation.
- [ ] Web UI remains visually and functionally unchanged outside intentional shared fixes.
- [ ] App has exactly four real top-level destinations and no fake settings page.
- [ ] Flow pages hide bottom navigation and provide back/progress/sticky action as appropriate.
- [ ] Local deterministic modes work without AI/network availability.
- [ ] App preview override is development-only.
- [ ] Mobile CSS is scoped below `.mobile-app` and 375px has no page-level overflow.
- [ ] Reduced motion, focus states, text status and safe areas are verified.
- [ ] Full lint/typecheck/test/build and Android test/lint/assemble pass.
- [ ] APK signature, package metadata and SHA-256 are recorded.
- [ ] Any missing physical-device test is reported, not implied complete.
