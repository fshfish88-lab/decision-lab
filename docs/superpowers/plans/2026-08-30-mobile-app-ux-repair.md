# DECISION LAB Mobile App UX Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 Android App 模式卡重叠、塔罗牌阵、路由过渡、系统侧边返回和分享卡保存/分享，并产出经验证的新 Debug APK，同时保持 Web 交互不回退。

**Architecture:** React 层新增 App 专用塔罗牌阵、统一移动导航 Provider、内容层路由过渡和分享 Bottom Sheet；Android 层新增范围受限的 Capacitor `ShareCardPlugin`，用 MediaStore/FileProvider 完成保存与系统分享。Web 继续使用原来的 `TarotDeck`、`ResultShell` 和 PNG 下载流程，算法、历史 schema 与 AI 协议不变。

**Tech Stack:** React 19、TypeScript 5.8、React Router 7、Framer Motion 12、Vitest/Testing Library、Capacitor 8.5、Android Java、MediaStore、FileProvider、Gradle。

---

## 变更地图

| 职责 | 文件 |
|---|---|
| 模式卡正常流布局 | `src/mobile/components/MobileModeCard.tsx`、`src/mobile/mobile.css`、`src/mobile/components/mobilePrimitives.test.tsx` |
| App 专用 4+3 塔罗牌阵、点击锁和三阶段动画 | 新建 `src/mobile/components/MobileTarotSpread.tsx`、新建 `src/mobile/components/MobileTarotSpread.test.tsx`、修改 `src/mobile/pages/MobileTarotView.tsx`、`src/pages/TarotPage.tsx`、对应测试和 `src/mobile/mobile.css` |
| App 内历史深度、返回方向、浮层栈、首页二次退出 | 新建 `src/mobile/navigation/MobileNavigationContext.ts`、`MobileNavigationProvider.tsx`、`mobileNavigationState.ts` 及测试 |
| Android Back 和内容层路由动画 | 新建 `src/mobile/navigation/useNativeBackNavigation.ts`、`MobileRouteTransition.tsx` 及测试；修改 `src/mobile/MobileAppShell.tsx`、测试、`package.json`、`package-lock.json` |
| App 分享 Bottom Sheet 与 TypeScript 原生桥 | 新建 `src/mobile/components/MobileShareCardSheet.tsx`、测试、`src/sharing/nativeShareCard.ts`、测试；修改 `MobileResultShell.tsx`、`ResultPage.tsx`、测试和 CSS |
| Android 保存相册、系统分享和缓存治理 | 新建 `android/app/src/main/java/com/fshfish/decisionlab/ShareCardPlugin.java`、`ShareCardPayload.java`、对应 JVM 测试；修改 `MainActivity.java`、`AndroidManifest.xml`、`file_paths.xml` |
| 回归、浏览器证据、APK 和校验记录 | `过程文件文件夹/移动端交互修复-2026-08-30/`、`成品文件夹/APK/` |

## 不变边界

- 不修改 `src/components/tarot/TarotDeck.tsx` 的 Web 交互和布局。
- 不修改 `src/tarot/tarotEngine.ts` 的洗牌、正逆位、候选项映射。
- 不修改历史数据版本和字段；相册保存不新增计数，只有成功打开系统分享面板调用 `incrementHistoryItemShare`。
- 不申请 `READ_MEDIA_IMAGES` 或 `MANAGE_EXTERNAL_STORAGE`。
- 不实现 Android Predictive Back Preview 动画。

## Task 1：修复模式卡状态文字重叠

**Files:**
- Modify: `src/mobile/components/mobilePrimitives.test.tsx`
- Modify: `src/mobile/components/MobileModeCard.tsx`
- Modify: `src/mobile/mobile.css`

- [ ] **Step 1：先写失败测试，固定选中状态的语义和布局节点**

在 `mobilePrimitives.test.tsx` 增加用例，要求选中卡存在独立状态行、勾选图标可被隐藏于无障碍树、按钮仍以 `aria-pressed` 表示选择：

```tsx
it('keeps the selected state in a dedicated normal-flow footer', () => {
  const { container } = render(
    <MobileModeCard
      mode="mystic"
      title="塔罗模式"
      description="抽一张牌，听听象征怎么说。"
      icon={Sparkles}
      tone="mystic"
      selected
      onSelect={vi.fn()}
    />,
  )

  expect(screen.getByRole('button', { name: /塔罗模式/ })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByText('已选择')).toHaveClass('mobile-mode-card__state-label')
  expect(container.querySelector('.mobile-mode-card__state svg')).toHaveAttribute('aria-hidden', 'true')
})
```

- [ ] **Step 2：运行单测，确认新增断言失败**

Run:

```powershell
npm.cmd run test:run -- src/mobile/components/mobilePrimitives.test.tsx
```

Expected: FAIL，找不到 `.mobile-mode-card__state-label` 或勾选图标。

- [ ] **Step 3：最小修改组件结构**

在 `MobileModeCard.tsx` 引入 `Check`，将末尾状态改为正常流节点：

```tsx
<span className="mobile-mode-card__state">
  {selected ? <Check size={15} aria-hidden="true" /> : null}
  <span className="mobile-mode-card__state-label">{selected ? '已选择' : '选择'}</span>
</span>
```

在 `mobile.css` 中删除该状态的 `position: absolute`、`right`、`bottom`，使用以下约束：

```css
.mobile-mode-card {
  display: flex;
  min-width: 0;
  min-height: 148px;
  flex-direction: column;
  align-items: stretch;
}

.mobile-mode-card__copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.mobile-mode-card__copy > span {
  overflow: visible;
  display: block;
  -webkit-line-clamp: unset;
}

.mobile-mode-card__state {
  position: static;
  display: inline-flex;
  align-items: center;
  align-self: flex-end;
  gap: 4px;
  margin-top: 12px;
}
```

保留现有 2×2 网格、模式配色、焦点和禁用样式；不要给描述增加 `line-clamp`。

- [ ] **Step 4：运行聚焦测试和静态检查**

```powershell
npm.cmd run test:run -- src/mobile/components/mobilePrimitives.test.tsx
npm.cmd run typecheck
npm.cmd run lint
```

Expected: 三条命令均 exit 0。

- [ ] **Step 5：提交本任务**

```powershell
git add src/mobile/components/MobileModeCard.tsx src/mobile/components/mobilePrimitives.test.tsx src/mobile/mobile.css
git commit -m "fix: prevent mobile mode card state overlap"
```

## Task 2：实现 App 专用 4+3 塔罗牌阵和一次性选择锁

**Files:**
- Create: `src/mobile/components/MobileTarotSpread.tsx`
- Create: `src/mobile/components/MobileTarotSpread.test.tsx`
- Modify: `src/mobile/pages/MobileTarotView.tsx`
- Modify: `src/mobile/pages/MobileTarotView.test.tsx`
- Modify: `src/pages/TarotPage.tsx`
- Modify: `src/pages/TarotPage.test.tsx`
- Modify: `src/mobile/mobile.css`

- [ ] **Step 1：为 4+3 分组、三阶段状态和快速连点写失败测试**

新建 `MobileTarotSpread.test.tsx`，覆盖以下完整行为：

```tsx
describe('MobileTarotSpread', () => {
  it('renders four cards in the first row and three in the second row', () => {
    render(<MobileTarotSpread spread={spread} selectedPosition={null} onSelect={vi.fn()} />)
    expect(screen.getByTestId('tarot-row-top').children).toHaveLength(4)
    expect(screen.getByTestId('tarot-row-bottom').children).toHaveLength(3)
    expect(screen.getAllByRole('button', { name: /选择第/ })).toHaveLength(7)
  })

  it('accepts only the first click and advances idle to focusing to revealed', async () => {
    vi.useFakeTimers()
    const onSelect = vi.fn()
    render(<MobileTarotSpread spread={spread} selectedPosition={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: '选择第 2 张牌' }))
    fireEvent.click(screen.getByRole('button', { name: '选择第 5 张牌' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(1)
    expect(screen.getByLabelText('七张大阿卡纳牌阵')).toHaveAttribute('data-phase', 'focusing')
    act(() => vi.advanceTimersByTime(240))
    expect(screen.getByLabelText('七张大阿卡纳牌阵')).toHaveAttribute('data-phase', 'revealed')
    vi.useRealTimers()
  })
})
```

测试数据使用 `createTarotSpread` 或文件内确定性 fixture，不读取网络、不截图。

同时在 `TarotPage.test.tsx` 增加控制器级快速双击用例：模拟两个位置在同一 tick 调用，断言 `saveHistoryItem` 和 `dispatch(set-result)` 各只发生一次，第一次位置获胜。

- [ ] **Step 2：运行测试，确认组件尚不存在或断言失败**

```powershell
npm.cmd run test:run -- src/mobile/components/MobileTarotSpread.test.tsx src/pages/TarotPage.test.tsx
```

Expected: FAIL，因为 `MobileTarotSpread` 尚不存在或双击会生成两次结果。

- [ ] **Step 3：实现 `MobileTarotSpread` 的状态机**

组件必须使用以下公开契约和时序：

```tsx
export type MobileTarotPhase = 'idle' | 'focusing' | 'revealed'

interface MobileTarotSpreadProps {
  spread: TarotSpread
  selectedPosition: number | null
  onSelect: (position: number) => void
}

const REVEAL_DELAY_MS = 220
const TOP_ROW_COUNT = 4
```

实现规则：

1. `lockedPositionRef` 在调用 `onSelect` **之前**写入位置，阻断同一 tick 的第二次点击。
2. 初始 `phase='idle'`；首次点击设置 `focusing`；220ms 后设置 `revealed`。
3. `selectedPosition` 从外部恢复时同步锁定；父级清空为 `null` 时恢复 `idle` 并清除计时器。
4. 组件卸载时清除计时器。
5. 上排渲染 `cards.slice(0, 4)`，下排渲染 `cards.slice(4)`。
6. `TarotCard.selected` 仅在 `phase==='revealed'` 时为真；聚焦阶段通过 slot 的 `is-focused` class 移动选中牌，其余 slot 使用 `is-dimmed`。
7. 所有牌按钮保持原有 position，不能重新排序或重新调用随机逻辑。

- [ ] **Step 4：切换 App 视图并在控制器增加同步锁**

`MobileTarotView.tsx` 删除对共享 `TarotDeck` 的引用，改为：

```tsx
<div className="mobile-tarot__stage">
  <MobileTarotSpread
    spread={spread}
    selectedPosition={selectedPosition}
    onSelect={onSelect}
  />
</div>
```

`TarotPage.tsx` 增加 `selectionLockRef`，并将 `reveal` 的开头固定为：

```tsx
const selectionLockRef = useRef(false)

function reveal(position: number): void {
  const spread = spreadRef.current
  if (!spread || selectionLockRef.current || selectedPosition !== null) return
  selectionLockRef.current = true
  // 继续使用现有 selectTarotCard、createTarotResult、dispatch 和 saveHistoryItem。
}
```

不要修改 Web 分支的 `TarotDeck`。

- [ ] **Step 5：实现无横向滚动的 4+3 弧形布局**

在 `mobile.css` 中：

- `.mobile-tarot__stage` 和 `.mobile-tarot-spread` 均设置 `overflow-x: clip`；
- 两排均使用 CSS Grid，第一排 4 列、第二排 3 列；
- 卡片宽度使用 `clamp(62px, 19vw, 82px)`，触控按钮最小 44×44；
- 用每个 slot 的 `--tarot-offset-y` 与 `--tarot-rotation` 形成轻弧线；
- focusing 时选中 slot 提升到舞台中央并放大，其余淡出；
- revealed 时保留中心牌并显示 `TarotReveal`；
- `@media (prefers-reduced-motion: reduce)` 中取消 translate/rotate/3D flip，只使用 opacity 或直接切换。

不得给 `.tarot-deck` 添加 App 覆盖，避免改变 Web。

- [ ] **Step 6：运行塔罗聚焦测试、全量前端测试和构建**

```powershell
npm.cmd run test:run -- src/mobile/components/MobileTarotSpread.test.tsx src/mobile/pages/MobileTarotView.test.tsx src/pages/TarotPage.test.tsx
npm.cmd run test:run
npm.cmd run typecheck
npm.cmd run build
```

Expected: 所有命令 exit 0；测试确认 7 张牌、4+3、第一次点击唯一生效。

- [ ] **Step 7：提交本任务**

```powershell
git add src/mobile/components/MobileTarotSpread.tsx src/mobile/components/MobileTarotSpread.test.tsx src/mobile/pages/MobileTarotView.tsx src/mobile/pages/MobileTarotView.test.tsx src/pages/TarotPage.tsx src/pages/TarotPage.test.tsx src/mobile/mobile.css
git commit -m "feat: add mobile tarot spread interaction"
```

## Task 3：建立统一移动导航状态和浮层栈

**Files:**
- Create: `src/mobile/navigation/mobileNavigationState.ts`
- Create: `src/mobile/navigation/mobileNavigationState.test.ts`
- Create: `src/mobile/navigation/MobileNavigationContext.ts`
- Create: `src/mobile/navigation/MobileNavigationProvider.tsx`
- Create: `src/mobile/navigation/MobileNavigationProvider.test.tsx`
- Modify: `src/mobile/MobileAppShell.tsx`

- [ ] **Step 1：先写纯状态机失败测试**

`mobileNavigationState.test.ts` 必须逐项验证：

- 初始 `historyDepth=0`、`direction='forward'`、`exitPending=false`；
- `PUSH` 使深度 +1 且方向 forward；
- `REPLACE` 不改变深度；
- `POP` 使深度 `max(0, depth-1)` 且方向 back；
- 离开 `/` 清除 `exitPending`；
- 浮层后进先出，重复注销不报错；
- exit timeout token 只清除当前等待状态，不误清新的等待周期。

状态类型固定为：

```ts
export type MobileNavigationDirection = 'forward' | 'back'

export interface MobileNavigationState {
  direction: MobileNavigationDirection
  historyDepth: number
  overlayIds: string[]
  exitPending: boolean
  exitToken: number
}
```

- [ ] **Step 2：运行测试并确认失败**

```powershell
npm.cmd run test:run -- src/mobile/navigation/mobileNavigationState.test.ts
```

Expected: FAIL，因为状态模块尚不存在。

- [ ] **Step 3：实现纯 reducer 和公开 context 契约**

`mobileNavigationState.ts` 只处理纯状态，不访问 DOM、Capacitor 或 Router。

`MobileNavigationContext.ts` 公开：

```ts
export interface MobileNavigationValue {
  direction: MobileNavigationDirection
  historyDepth: number
  exitPending: boolean
  navigateForward: (to: To, options?: NavigateOptions) => void
  navigateBack: () => void
  registerOverlay: (close: () => void) => () => void
  closeTopOverlay: () => boolean
  armExit: () => void
  clearExitPending: () => void
}
```

Provider 内部使用 `Map<string, () => void>` 保存实际 close callback，reducer 只保存顺序 id。`registerOverlay` 返回幂等注销函数；`closeTopOverlay` 先注销再调用 close，返回是否处理过浮层。

- [ ] **Step 4：写 Provider 路由深度和 LIFO 测试，再实现 Provider**

用 `MemoryRouter initialEntries` 和测试 Harness 覆盖 PUSH/REPLACE/POP、`navigateForward`、`navigateBack`、两层浮层 LIFO。Provider 使用 `useNavigationType()` 和 `location.key` 每次只处理一个已完成导航：

```tsx
useEffect(() => {
  dispatch({ type: 'route-committed', navigationType, pathname: location.pathname })
}, [location.key, location.pathname, navigationType])
```

跳过初次挂载的 `POP`，避免把初始页面误记为返回。`navigateForward` 在调用 Router `navigate` 前设置 forward；`navigateBack` 只有 `historyDepth>0` 才调用 `navigate(-1)`。

- [ ] **Step 5：把 Provider 仅接入 App Shell**

将 `MobileAppShell` 拆成 Provider 外壳与内部 Frame：

```tsx
export function MobileAppShell(props: PropsWithChildren): React.JSX.Element {
  return (
    <MobileNavigationProvider>
      <MobileAppFrame>{props.children}</MobileAppFrame>
    </MobileNavigationProvider>
  )
}
```

Header 返回按钮改用 context 的 `navigateBack`；若某 flow route 是直接入口且深度为 0，则回到 `/`，不退出。Bottom Nav 点击通过 `navigateForward`，保留 `NavLink` 的 active 语义。

- [ ] **Step 6：运行导航测试和 App Shell 回归**

```powershell
npm.cmd run test:run -- src/mobile/navigation/mobileNavigationState.test.ts src/mobile/navigation/MobileNavigationProvider.test.tsx src/mobile/MobileAppShell.test.tsx
npm.cmd run typecheck
npm.cmd run lint
```

Expected: 全部 exit 0。

- [ ] **Step 7：提交本任务**

```powershell
git add src/mobile/navigation src/mobile/MobileAppShell.tsx src/mobile/MobileAppShell.test.tsx
git commit -m "feat: centralize mobile navigation state"
```

## Task 4：接入 Android Back 和 App 内容层路由过渡

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/mobile/navigation/useNativeBackNavigation.ts`
- Create: `src/mobile/navigation/useNativeBackNavigation.test.tsx`
- Create: `src/mobile/navigation/MobileRouteTransition.tsx`
- Create: `src/mobile/navigation/MobileRouteTransition.test.tsx`
- Modify: `src/mobile/navigation/MobileNavigationProvider.tsx`
- Modify: `src/mobile/MobileAppShell.tsx`
- Modify: `src/mobile/MobileAppShell.test.tsx`
- Modify: `src/mobile/mobile.css`

- [ ] **Step 1：安装与 Capacitor 8.5 对齐的官方 App 插件**

```powershell
npm.cmd install @capacitor/app@^8.5.0
```

Expected: `package.json` dependencies 出现 `@capacitor/app`，lockfile 更新，无 npm error。

- [ ] **Step 2：为 Back 优先级和监听清理写失败测试**

在 `useNativeBackNavigation.test.tsx` mock `@capacitor/app`，完整覆盖：

1. 有浮层：只调用 top close，不 navigate、不 exit。
2. `historyDepth>0`：调用 `navigateBack`。
3. 根页第一次 Back：调用 `armExit`，不退出。
4. `exitPending=true` 的第二次 Back：调用 `App.exitApp()`。
5. `appStateChange({ isActive: false })`：调用 `clearExitPending`。
6. unmount：两个 listener handle 的 `remove()` 各一次；StrictMode 不残留重复监听。

- [ ] **Step 3：运行测试，确认 Hook 尚不存在**

```powershell
npm.cmd run test:run -- src/mobile/navigation/useNativeBackNavigation.test.tsx
```

Expected: FAIL，因为 Hook 尚不存在。

- [ ] **Step 4：实现原生 Back Hook**

Hook 只在 `usePlatform()==='app'` 且 `Capacitor.isNativePlatform()` 时注册。处理函数顺序固定为：

```ts
if (navigation.closeTopOverlay()) return
if (navigation.historyDepth > 0) {
  navigation.navigateBack()
  return
}
if (!navigation.exitPending) {
  navigation.armExit()
  return
}
await App.exitApp()
```

使用 `Promise.all` 获取 `App.addListener('backButton', ...)` 与 `App.addListener('appStateChange', ...)` 的 handles；effect cleanup 后若异步 handle 才返回，也必须立即 remove。Provider 的 `armExit` 设置 2 秒 timer；离开 `/`、进入后台、unmount 均 clear timer。

- [ ] **Step 5：为内容层路由动画写失败测试**

`MobileRouteTransition.test.tsx` mock Framer Motion 的 `AnimatePresence`/`motion.div`，断言：

- `AnimatePresence` 收到 `mode="sync"`；
- motion key 跟随 `location.key`；
- forward 初始 x 为正、back 初始 x 为负；
- reduced motion 时 x 为 0；
- Header 和 Bottom Nav 不在 motion 容器内。

- [ ] **Step 6：实现 `MobileRouteTransition` 并接入内容层**

组件使用：

```tsx
<AnimatePresence mode="sync" initial={false}>
  <motion.div
    key={location.key}
    className="mobile-route-transition"
    initial={{ opacity: 0, x: reducedMotion ? 0 : direction === 'back' ? -10 : 10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: reducedMotion ? 0 : direction === 'back' ? 10 : -10 }}
    transition={{ duration: reducedMotion ? 0.08 : 0.22, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

在 `MobileAppFrame` 的 `<main>` 内包住 children；Header、Bottom Nav 保持 siblings。调用 `useNativeBackNavigation()` 一次。首页 exitPending 时渲染 `role="status"` 的短 Toast“再返回一次退出 Decision Lab”。

- [ ] **Step 7：运行聚焦测试并同步 Android**

```powershell
npm.cmd run test:run -- src/mobile/navigation/useNativeBackNavigation.test.tsx src/mobile/navigation/MobileRouteTransition.test.tsx src/mobile/MobileAppShell.test.tsx
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run android:sync
```

Expected: 测试/类型/Lint exit 0；Capacitor sync 显示 `@capacitor/app` 已同步到 Android。

- [ ] **Step 8：提交本任务**

```powershell
git add package.json package-lock.json src/mobile/navigation src/mobile/MobileAppShell.tsx src/mobile/MobileAppShell.test.tsx src/mobile/mobile.css android
git commit -m "feat: add native back handling and app transitions"
```

## Task 5：实现 App 分享操作面板和可测试的原生桥接口

**Files:**
- Create: `src/sharing/nativeShareCard.ts`
- Create: `src/sharing/nativeShareCard.test.ts`
- Create: `src/mobile/components/MobileShareCardSheet.tsx`
- Create: `src/mobile/components/MobileShareCardSheet.test.tsx`
- Modify: `src/mobile/components/MobileResultShell.tsx`
- Modify: `src/mobile/components/MobileResultShell.test.tsx`
- Modify: `src/pages/ResultPage.tsx`
- Modify: `src/storage/history.test.ts`
- Modify: `src/mobile/mobile.css`

- [ ] **Step 1：先写桥接转换和 Bottom Sheet 状态测试**

`nativeShareCard.ts` 的公开契约固定为：

```ts
export interface ShareCardPluginApi {
  saveImage(options: { base64: string }): Promise<{ uri: string; fileName: string }>
  shareImage(options: { base64: string }): Promise<{ chooserOpened: true }>
}

export interface NativeShareCardError {
  code: 'INVALID_BASE64' | 'IMAGE_TOO_LARGE' | 'PERMISSION_DENIED' | 'SAVE_FAILED' | 'NO_SHARE_TARGET' | 'SHARE_FAILED'
  message: string
}
```

测试 `blobToBase64` 去掉 `data:image/png;base64,` 前缀、空 Blob 拒绝、插件错误码映射为固定中文消息。

`MobileShareCardSheet.test.tsx` 使用延迟 Promise 覆盖：

- 打开后立刻出现“正在生成分享卡”，保存/分享禁用；
- 生成完成出现预览、保存到相册、系统分享；
- 保存成功显示“已保存到相册”，不调用 share counter；
- share 成功显示“已打开系统分享面板”，调用 `onShareChooserOpened` 一次；
- 生成/保存/分享失败分别显示设计文档的固定提示；
- Android Back 调用注册的 overlay close，只关闭 sheet；
- 关闭时 revoke preview object URL 并注销 overlay。

- [ ] **Step 2：运行测试确认失败**

```powershell
npm.cmd run test:run -- src/sharing/nativeShareCard.test.ts src/mobile/components/MobileShareCardSheet.test.tsx
```

Expected: FAIL，因为桥和面板尚不存在。

- [ ] **Step 3：实现 TypeScript 原生桥**

使用 `registerPlugin<ShareCardPluginApi>('ShareCard')`；`blobToBase64` 使用 `FileReader.readAsDataURL`，严格验证 Blob MIME 为 `image/png`，只向原生传无前缀 Base64。错误映射必须穷尽上述六个 code，未知错误显示“操作失败，请稍后重试”。

- [ ] **Step 4：实现 Bottom Sheet 状态机**

状态使用判别联合，防止无效组合：

```ts
type ShareSheetState =
  | { phase: 'generating' }
  | { phase: 'ready'; blob: Blob; base64: string; previewUrl: string }
  | { phase: 'acting'; action: 'save' | 'share'; blob: Blob; base64: string; previewUrl: string }
  | { phase: 'error'; message: string }
```

面板先渲染 `generating`，effect 再调用 `renderShareCardBlob(result)`；防止 StrictMode 双生成要用 request id 和 cancelled flag。只有 ready 状态可执行 action。overlay 注册关闭函数使用 context 的 `registerOverlay`。

- [ ] **Step 5：把 App 按钮改成“分享结果卡”并修正计数语义**

`MobileResultShell`：

- 删除 App 内的“下载分享卡”直接行为；
- 保留“复制结果”；
- 新按钮文案“分享结果卡”，点击只打开 sheet；
- 接收 `renderShareCard`、`saveShareCard`、`shareShareCard`、`onShareChooserOpened` props；
- sheet 关闭后回到结果页原滚动位置。

`ResultPage`：

- Web `ResultShell` 继续调用现有 `downloadBlob`；
- App 注入 `renderShareCardBlob`、`nativeShareCard.saveImage`、`nativeShareCard.shareImage`；
- `copyResult` 和 Web `downloadShareCard` 不增加计数；
- 只有 `shareImage` resolve `{ chooserOpened: true }` 后调用 `incrementHistoryItemShare(decisionResult.id)`；
- reject 或相册保存均不增加。
- 删除当前 `const ResultContainer = platform === ...` 的联合组件写法，明确写成 App/Web 两个返回分支；App 分支传 Bottom Sheet 所需 props，Web 分支继续传 `onCopy`/`onDownload`，避免两套 props 被 TypeScript 错误合并。

- [ ] **Step 6：运行分享、结果页和历史测试**

```powershell
npm.cmd run test:run -- src/sharing/shareCard.test.ts src/sharing/nativeShareCard.test.ts src/mobile/components/MobileShareCardSheet.test.tsx src/mobile/components/MobileResultShell.test.tsx src/storage/history.test.ts
npm.cmd run test:run
npm.cmd run typecheck
npm.cmd run lint
```

Expected: 全部 exit 0；测试明确保存不计数、Chooser 成功才计数。

- [ ] **Step 7：提交本任务**

```powershell
git add src/sharing src/mobile/components/MobileShareCardSheet.tsx src/mobile/components/MobileShareCardSheet.test.tsx src/mobile/components/MobileResultShell.tsx src/mobile/components/MobileResultShell.test.tsx src/pages/ResultPage.tsx src/storage/history.test.ts src/mobile/mobile.css
git commit -m "feat: add mobile share card sheet"
```

## Task 6：实现受限的 Android `ShareCardPlugin`

**Files:**
- Create: `android/app/src/main/java/com/fshfish/decisionlab/ShareCardPayload.java`
- Create: `android/app/src/main/java/com/fshfish/decisionlab/ShareCardPlugin.java`
- Create: `android/app/src/test/java/com/fshfish/decisionlab/ShareCardPayloadTest.java`
- Modify: `android/app/src/main/java/com/fshfish/decisionlab/MainActivity.java`
- Modify: `android/app/src/main/AndroidManifest.xml`
- Modify: `android/app/src/main/res/xml/file_paths.xml`

- [ ] **Step 1：先写可在 JVM 运行的输入验证测试**

`ShareCardPayloadTest.java` 覆盖：

```java
@Test public void decodesValidPngUnderLimit() { /* 8-byte PNG signature + body */ }
@Test public void rejectsMalformedBase64() { /* expects INVALID_BASE64 */ }
@Test public void rejectsPayloadAboveTenMegabytes() { /* expects IMAGE_TOO_LARGE */ }
@Test public void rejectsNonPngSignature() { /* expects INVALID_BASE64 */ }
@Test public void createsControlledTimestampedFilename() { /* Decision-Lab-20260830-173900.png */ }
```

固定限制 `MAX_BYTES = 10 * 1024 * 1024`；文件名只由原生时间生成，不接收 JS 文件名。

- [ ] **Step 2：运行 JVM 测试并确认失败**

在 PowerShell 设置项目既有 Android 环境：

```powershell
$env:JAVA_HOME='D:\Android Studio\Jdk\jdk-21.0.12.1+1'
$env:ANDROID_HOME='D:\Android Studio\Sdk'
$env:GRADLE_USER_HOME='D:\Android Studio\GradleCache'
Set-Location android
.\gradlew.bat testDebugUnitTest --tests "com.fshfish.decisionlab.ShareCardPayloadTest"
```

Expected: FAIL，因为 helper 尚不存在。完成后回到仓库根目录。

- [ ] **Step 3：实现纯 Java `ShareCardPayload`**

职责仅包括：

- `java.util.Base64.getDecoder().decode`；
- 捕获非法 Base64 并抛出带 code 的自定义异常；
- 检查解码长度不超过 10 MB；
- 检查前 8 字节等于 PNG signature `89 50 4E 47 0D 0A 1A 0A`；
- 用 `DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")` 生成 `Decision-Lab-<timestamp>.png`。

不在 helper 中访问 Android framework，确保 JVM 测试真实执行。

- [ ] **Step 4：实现 API 29+ 和 API 24～28 保存**

`ShareCardPlugin` 声明：

```java
@CapacitorPlugin(
  name = "ShareCard",
  permissions = @Permission(
    alias = "legacyStorage",
    strings = Manifest.permission.WRITE_EXTERNAL_STORAGE
  )
)
public final class ShareCardPlugin extends Plugin
```

`saveImage`：

- 解析 payload 后，API 29+ 插入 `MediaStore.Images.Media.EXTERNAL_CONTENT_URI`；values 必须包含 `DISPLAY_NAME`、`MIME_TYPE=image/png`、`RELATIVE_PATH=Pictures/Decision Lab`、`IS_PENDING=1`；写完后更新 `IS_PENDING=0`；失败时删除 pending row。
- API 24～28 若无 `legacyStorage` 权限，调用 `requestPermissionForAlias`，回调后继续同一个 `PluginCall`；拒绝返回 code `PERMISSION_DENIED`。
- 旧版写入 `Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES)/Decision Lab`，检查并创建目录；成功返回 `{ uri, fileName }`。
- 所有 stream 使用 try-with-resources；任何部分失败返回 `SAVE_FAILED`，不得 resolve 假成功。

- [ ] **Step 5：实现系统分享和延迟缓存清理**

`shareImage`：

1. 清理 `cache/share` 中修改时间超过 24 小时的 PNG；
2. 按修改时间降序，仅保留最近 5 张，删除更旧文件；
3. 写入新 PNG；
4. 使用 `FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file)`；
5. 构建 `ACTION_SEND`，type 固定 `image/png`，包含 `EXTRA_STREAM` 与 `FLAG_GRANT_READ_URI_PERMISSION`；
6. 用 `resolveActivity` 检查接收方，无接收方删除本次缓存并返回 `NO_SHARE_TARGET`；
7. `startActivity(Intent.createChooser(sendIntent, "分享 Decision Lab 结果卡"))` 成功后 resolve `{ chooserOpened: true }`；异常返回 `SHARE_FAILED`。

不得在启动 chooser 后立即删除文件。

- [ ] **Step 6：注册插件并收紧 Manifest/FileProvider**

`MainActivity.java`：

```java
package com.fshfish.decisionlab;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(ShareCardPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
```

`AndroidManifest.xml` 仅增加：

```xml
<uses-permission
    android:name="android.permission.WRITE_EXTERNAL_STORAGE"
    android:maxSdkVersion="28" />
```

不要增加读取或 all-files 权限。`file_paths.xml` 完整替换为：

```xml
<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <cache-path name="share_cards" path="share/" />
</paths>
```

这一步必须删除当前暴露整个外部存储的 `<external-path path="." />`。

- [ ] **Step 7：运行 Android 单测、Lint 和 Debug 构建**

```powershell
$env:JAVA_HOME='D:\Android Studio\Jdk\jdk-21.0.12.1+1'
$env:ANDROID_HOME='D:\Android Studio\Sdk'
$env:GRADLE_USER_HOME='D:\Android Studio\GradleCache'
npm.cmd run android:sync
Set-Location android
.\gradlew.bat testDebugUnitTest lintDebug assembleDebug
```

Expected: `BUILD SUCCESSFUL`；无 Android Lint error；`app/build/outputs/apk/debug/app-debug.apk` 存在。

- [ ] **Step 8：提交本任务**

回到仓库根目录后：

```powershell
git add android src/sharing/nativeShareCard.ts package.json package-lock.json
git commit -m "feat: add native Android share card bridge"
```

## Task 7：浏览器回归、减少动态效果和 App/Web 隔离验收

**Files:**
- Modify only if a regression is found: files already touched above
- Create: `过程文件文件夹/移动端交互修复-2026-08-30/前端复测记录.md`
- Create: screenshots under `过程文件文件夹/移动端交互修复-2026-08-30/截图/`

- [ ] **Step 1：运行完整自动检查**

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:run
npm.cmd run build
```

Expected: 四条命令 exit 0；记录 Vitest 文件数、测试数和 build 产物摘要。

- [ ] **Step 2：启动预览并检查 App 视口**

```powershell
npm.cmd run dev -- --host 127.0.0.1
```

用浏览器自动化访问 `http://127.0.0.1:<port>/?ui=app`，分别设置 375×812 和 412×915，检查：

- 模式卡长文案和已选择不重叠；点击区域至少 44px；无页面横向滚动。
- 塔罗 7 张一次可见，4+3 排列，快速点两张只翻第一张，下半部由牌阵和提示合理使用。
- 前进/返回内容层有约 220ms 轻过渡，Header/Bottom Nav 不移动，无白屏、无控制台 error。
- 分享按钮点击后立即出现 Bottom Sheet 和生成态；浏览器 App 预览可 mock 原生桥时不得显示假保存成功。

- [ ] **Step 3：检查 Web 不回退**

访问 `http://127.0.0.1:<port>/`，检查 375px 和 1280px：

- Web 仍使用原 `TarotDeck`，未变成 4+3 App 牌阵。
- Web 结果页仍显示复制与 PNG 下载。
- Web 没有 Bottom Nav、App Header、Android 退出 Toast 或 App 路由滑动。
- 无横向溢出和控制台 error。

- [ ] **Step 4：检查减少动态效果**

浏览器模拟 `prefers-reduced-motion: reduce`，完成首页→塔罗→结果→历史：不出现强位移/3D 翻转，功能和焦点顺序保持可用。

- [ ] **Step 5：写复测记录并提交**

记录每个视口的 URL、尺寸、结果、截图路径、控制台情况和未验证项。过程文件在仓库外的上层分类目录，不加入 Git；只提交因回归产生的必要源码修复：

```powershell
git status --short
git add <本阶段实际修复的源码文件>
git commit -m "test: harden mobile app UX regression coverage"
```

若无源码修复，不创建空提交。

## Task 8：Android 设备矩阵、APK 交付和最终证据

**Files:**
- Output: `成品文件夹/APK/Decision-Lab-v1.5.0-mobile-ux-debug.apk`
- Create: `过程文件文件夹/移动端交互修复-2026-08-30/Android复测记录.md`
- Create: `过程文件文件夹/移动端交互修复-2026-08-30/APK校验.txt`

- [ ] **Step 1：重新完成 Android 全量构建**

```powershell
$env:JAVA_HOME='D:\Android Studio\Jdk\jdk-21.0.12.1+1'
$env:ANDROID_HOME='D:\Android Studio\Sdk'
$env:GRADLE_USER_HOME='D:\Android Studio\GradleCache'
npm.cmd run android:sync
Set-Location android
.\gradlew.bat testDebugUnitTest lintDebug assembleDebug
```

Expected: `BUILD SUCCESSFUL`；记录 task 数和耗时。

- [ ] **Step 2：检查连接设备并按可用性运行仪器测试**

```powershell
& 'D:\Android Studio\Sdk\platform-tools\adb.exe' devices -l
```

若有授权设备或模拟器：

```powershell
.\gradlew.bat connectedDebugAndroidTest
```

按可用设备验证 API 28、29+、33+、36；不能获得某版本设备时，在记录中明确写“未进行真机/模拟器验证”，不要用编译成功替代。

- [ ] **Step 3：真机专项验收**

至少在一个 Android 设备上执行：

1. 侧边返回先关闭分享面板；
2. 普通页面侧边返回上一页；
3. 首页第一次返回出现 Toast，2 秒内第二次退出；超时或切后台后需重新两次；
4. 模式卡在系统大字体下无重叠；
5. 4+3 塔罗所有牌可点，连点不产生双历史；
6. API 29+ 保存到 `Pictures/Decision Lab`，不请求读取相册权限；
7. API 24～28 只在保存时请求写入权限；拒绝后显示明确失败；
8. 系统分享面板能看到微信/QQ等已安装接收方，接收方能读取 PNG；
9. 保存相册不增加 shareCount，打开 chooser 增加一次；
10. 关闭重开 App 后主流程正常。

- [ ] **Step 4：复制 APK 并校验**

回到仓库根目录，将构建产物复制到规定成品目录，保留旧 APK：

```powershell
Copy-Item -LiteralPath 'android\app\build\outputs\apk\debug\app-debug.apk' -Destination '..\..\..\APK\Decision-Lab-v1.5.0-mobile-ux-debug.apk'
Get-FileHash -Algorithm SHA256 '..\..\..\APK\Decision-Lab-v1.5.0-mobile-ux-debug.apk'
& 'D:\Android Studio\Sdk\build-tools\36.0.0\apksigner.bat' verify --verbose --print-certs '..\..\..\APK\Decision-Lab-v1.5.0-mobile-ux-debug.apk'
```

再用 `apkanalyzer` 或 `aapt2 dump badging` 核对包名 `com.fshfish.decisionlab`、versionName `1.5.0` 和版本号。将大小、SHA-256、签名验证、包名/版本写入 `APK校验.txt`。

- [ ] **Step 5：最终 Git 和范围检查**

```powershell
git status --short
git diff --check
git log --oneline --decorate -10
```

Expected: 工作树无意外改动；`git diff --check` exit 0；Web `TarotDeck`、算法、历史 schema 未被改动。

- [ ] **Step 6：最终交付汇报**

报告：

- 五个问题各自的实现结果；
- 前端 lint/typecheck/test/build 的真实结果与测试数；
- Gradle test/lint/assemble 结果；
- APK 绝对路径、字节数和 SHA-256；
- 已覆盖的 Android API/设备；
- 没有设备时尚未验证的侧边手势、相册可见性、第三方接收方读取等真实风险。

不把未运行的 `connectedDebugAndroidTest` 或未执行的真机流程写成通过。
