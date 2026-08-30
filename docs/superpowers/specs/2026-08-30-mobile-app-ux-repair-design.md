# DECISION LAB 移动端交互修复设计

日期：2026-08-30  
状态：用户已确认统一导航架构、交互方案与验收标准，待实施计划
适用分支：`feat/app-ui-separation`

## 1. 背景与目标

本轮修复 Android App 真机反馈中的五个问题：

1. 模式卡的“已选择”与描述文字重叠；
2. 塔罗牌阵无法稳定横向滑动，且页面下半部空间利用不足；
3. App 页面切换没有过渡，视觉生硬；
4. Android 侧边返回手势没有形成稳定的 App 内返回规则；
5. “下载分享卡”在 Android WebView 中没有可见效果。

本轮只修改 App 展示和 Android 原生交互边界。Web 布局、决策算法、塔罗牌数据与映射、历史结构、AI 协议均保持不变。

## 2. 根因

### 2.1 模式卡重叠

`.mobile-mode-card__state` 使用绝对定位，卡片没有为状态文字预留布局空间。描述换行或系统字体较大时，状态文字会覆盖描述末行。

### 2.2 塔罗无法滑动

App 外层 `.mobile-tarot__stage` 与共享 Web `.tarot-deck` 在小屏媒体查询下同时创建横向滚动，形成嵌套滚动区域。牌组仍沿用桌面横向宽度和高度，导致手机上只显示部分牌、触摸滑动目标不明确，并留下大块空白。

### 2.3 页面切换生硬

当前路由直接由 `<Routes>` 替换页面，没有 App 专用的进入、退出动画，也没有根据减少动态效果设置降级。

### 2.4 侧边返回不稳定

当前只提供页面内返回按钮，没有监听 Android 原生返回事件。系统侧边手势与 React Router 历史没有统一处理，首页也没有防误退出规则。

### 2.5 分享卡无效

当前实现生成 Blob 后触发 `<a download>`。桌面浏览器支持这一方式，但 Android WebView 不保证处理 `download` 属性，因此按钮可以显示成功却没有可靠的系统下载结果。

## 3. 已确认的交互设计

### 3.1 模式卡

- 取消状态文字的绝对定位。
- 卡片使用明确的内容区与状态行；状态行参与正常布局。
- 卡片使用纵向弹性布局，内容区占据剩余空间，状态行固定在正常文档流底部。
- 未选中显示“选择”，选中显示勾选图标和“已选择”。
- 描述文字换行、较大系统字体和 375px 屏幕下均不得与状态重叠。
- 不使用 `line-clamp` 截断描述；宁可卡片随内容增高，也不隐藏说明。
- 模式卡继续保持 2×2 布局和现有四种柔和模式色。

### 3.2 塔罗双层弧形牌阵

采用用户确认的 B 方案：

```text
上排：4 张牌
下排：3 张牌
```

- 7 张牌进入页面后一次全部可见，不需要横向滑动。
- 牌阵使用纵向空间形成轻微弧线，保留克制的抽牌仪式感。
- 每张牌的触控区域不小于 44px。
- 点击后，选中牌移动到舞台中央、放大并翻开；其余牌淡出或降到背景层。
- 移动端牌阵使用 `idle → focusing → revealed` 三阶段状态；第一次点击后立即锁定其余牌，防止快速连点生成两份结果。
- 结果继续使用现有预先确定的牌、正逆位、候选项映射和 `TarotReveal` 数据，不重新抽牌。
- 减少动态效果开启时取消强位移和 3D 翻转，以即时显隐完成相同状态变化。

App 新建专用牌阵组件，Web 继续使用现有 `TarotDeck`，避免移动修复改变网页端塔罗布局。

### 3.3 App 页面过渡

- 只在 App 内容层启用统一路由过渡，Web 不变。
- App Bar、Flow Header、Bottom Nav 和固定操作区不随页面左右移动。
- 普通进入使用约 220ms 的淡入与 8～12px 轻位移。
- 返回使用相反方向的轻位移，表达导航层级。
- 使用 Framer Motion `AnimatePresence` 的 `mode="sync"`，避免等待旧页面退出时出现短暂白屏。
- 动画期间不得阻止点击、产生白屏或重置页面状态。
- `prefers-reduced-motion: reduce` 下只保留短淡入或直接切换。

### 3.4 Android 侧边返回

- 使用官方 `@capacitor/app` 监听 Android 系统返回动作，包括侧边手势触发的 Back。
- 由统一 `MobileNavigationProvider` 管理导航方向、App 内历史深度、浮层栈和首页退出等待状态。
- App 内历史深度根据 React Router 的 `PUSH / REPLACE / POP` 维护，不依赖不可靠的 `window.history.length`。
- 浮层打开时优先关闭最高优先级浮层，再处理路由返回。
- 页面有 App 内历史时设置返回方向并调用 React Router 返回上一页。
- 首页第一次返回显示“再返回一次退出应用”；两秒内第二次返回才退出。
- 离开首页、App 进入后台或两秒超时都会清除退出等待状态。
- Web 不注册原生监听，不改变浏览器后退行为。
- 本轮统一系统 Back 行为，但不实现 Android 系统级 Predictive Back Preview 动画。

### 3.5 分享卡操作面板

App 中原“下载分享卡”改为“分享结果卡”。点击后立即打开底部操作面板，再在面板内生成 1080×1350 PNG，避免生成期间看起来没有响应：

1. `保存到相册`：保存到 Android 图片集合中的 `Decision Lab` 目录；
2. `系统分享`：打开系统分享面板，可交给微信、QQ等可用应用。

生成期间显示“正在生成分享卡”，并禁用保存与分享按钮；生成完成后显示预览和两个操作。面板提供关闭操作。保存、打开分享面板和失败都有明确状态。系统分享只能确认面板已成功打开，不能声称用户已经发送。保存相册不增加分享次数；只有系统分享面板成功启动才记录一次分享。Web 继续保留现有 PNG 下载和复制结果。

## 4. 技术边界与组件

### 4.1 React 层

新增或调整的职责边界：

- `MobileModeCard`：正常流布局的选择状态。
- `MobileTarotSpread`：App 专用 4+3 牌阵、三阶段状态和点击锁。
- `MobileNavigationProvider`：统一维护 `direction`、App 内 `historyDepth`、`overlayStack` 和 `exitPending`。
- `MobileRouteTransition`：读取统一导航方向，只对 App 页面内容执行进入、退出和减少动态效果。
- `useNativeBackNavigation`：把原生 Back 交给 Provider，按“浮层 → 路由 → 首页退出”处理。
- `MobileShareCardSheet`：向 Provider 注册浮层关闭拦截，负责生成、预览、保存、分享和错误反馈。
- `shareCard` 服务：继续只负责绘制 PNG；平台保存行为从绘制逻辑中分离。

统一导航结构：

```text
Android Back / React Router / Bottom Sheet
                    ↓
          MobileNavigationProvider
             ↙       ↓       ↘
         浮层关闭   路由方向   首页退出
```

不把 Bottom Sheet、返回 Hook 和动画方向分别维护，避免返回穿透和重复处理。

共享状态和算法保持：

- `TarotPage` 仍负责创建固定牌阵、生成结果和写入历史；
- `tarotEngine` 不变；
- `DecisionContext`、历史 schema 与统计不变；
- Web `TarotDeck` 和 Web `ResultShell` 不改交互模型。

### 4.2 Android 原生层

新增一个范围受限的 Capacitor Android 插件 `ShareCardPlugin`：

- 输入：PNG Base64 和受控操作；文件名由原生层按 `Decision-Lab-yyyyMMdd-HHmmss.png` 生成，不使用用户问题文本；
- MIME 固定为 `image/png`，解码后大小上限 10 MB；
- `saveImage`：API 29+ 使用 MediaStore 写入 `Pictures/Decision Lab`，设置 `DISPLAY_NAME`、`MIME_TYPE`、`RELATIVE_PATH`，写入期间使用 `IS_PENDING=1`，完成后更新为 `IS_PENDING=0`；
- API 24～28 写入公共 Pictures，并只在这些版本请求 `WRITE_EXTERNAL_STORAGE`；权限声明使用 `maxSdkVersion="28"`；
- 不申请 `READ_MEDIA_IMAGES` 或 `MANAGE_EXTERNAL_STORAGE`，因为 App 不读取用户相册；
- `shareImage`：写入 `cache/share`，经 FileProvider 生成 `content://` URI，使用 `ACTION_SEND`、`image/png` 和临时读取授权启动系统 Chooser；`file_paths.xml` 只暴露该分享缓存目录，不继续暴露整个外部存储；
- 分享前检查是否有应用能处理图片 Intent；
- 分享缓存不在启动 Intent 后立即删除；下次分享时清理超过 24 小时的文件，并最多保留最近 5 张；
- 输出：成功状态、保存位置或稳定错误码；
- 不读取相册、不上传文件、不永久保留分享缓存。

这一小桥接比网页下载可靠，也比把图片只写入 App 私有目录更符合“保存到相册”的要求。拒绝旧版写入权限时返回明确错误。

### 4.3 原生返回插件

增加与当前 Capacitor 版本一致的官方 `@capacitor/app` 依赖。监听器只在 App 平台注册，并在组件卸载时移除，防止热更新或 StrictMode 下重复处理。`appStateChange` 进入后台时清除首页退出等待状态。

## 5. 数据流

### 5.1 塔罗

```text
TarotPage 创建固定 TarotSpread
        ↓
MobileTarotSpread 展示 7 张牌（idle）
        ↓ 第一次点击 position，立即锁定
TarotPage.selectTarotCard(spread, position)
        ↓
生成并保存一次结果（focusing）
        ↓
选中牌聚焦翻开 → TarotReveal（revealed）
```

点击前不创建最终结果；点击后只生成一次。动画不参与随机数、映射或持久化。

### 5.2 分享卡

```text
结果页点击“分享结果卡”
        ↓
立即打开 MobileShareCardSheet
        ↓
显示生成状态并调用 renderShareCardBlob(result)
        ↓
Blob 转 PNG Base64并显示预览
   ↙                 ↘
保存到相册        系统分享
MediaStore        Cache + Share Intent
```

保存相册成功不增加分享次数。只有系统分享面板成功打开时才增加分享次数；面板关闭后不显示“已分享”，只显示“已打开系统分享面板”；原生调用失败不增加计数。本轮不新增 `exportCount`，避免修改历史 schema。

### 5.3 返回

```text
Android 侧边返回
        ↓
MobileNavigationProvider
        ↓
overlayStack 非空？关闭最高层浮层
        ↓ 否
historyDepth > 0？direction='back' → navigate(-1)
        ↓ 否
第一次：首页 Toast 提示
第二次（2 秒内）：exitApp()
```

任何新的 App Bottom Sheet 或模态层都必须向 Provider 注册关闭回调，关闭时注销。当前分享面板打开时，Android Back 只关闭面板，不穿透到结果页返回。进入其他页面、App 切到后台或两秒超时都会取消 `exitPending`。

## 6. 错误处理

- 牌阵缺少有效候选项时继续显示现有可恢复空状态。
- 分享卡生成失败：显示“分享卡生成失败，请稍后重试”。
- 相册权限拒绝：显示“未获得图片保存权限”。
- MediaStore 写入失败：显示“保存失败，图片未写入相册”。
- 系统没有可处理分享的应用：显示“没有找到可用的分享应用”。
- 图片 Base64 无效、MIME 不符或超过 10 MB：原生插件拒绝处理并返回稳定错误，不写入文件。
- 用户关闭分享面板不显示错误，也不显示“已分享”；应用只确认分享面板曾成功打开。
- 页面过渡和原生返回监听异常不得影响随机、科学和塔罗核心流程。

## 7. 测试与验收

### 7.1 自动测试

- `MobileModeCard`：描述与状态使用独立布局节点；选中状态有勾选语义。
- `MobileTarotSpread`：渲染 7 张可点击牌、4+3 分组、点击正确 position、快速连点只接受第一次、三阶段状态正确。
- `MobileNavigationProvider`：正确维护 `PUSH / REPLACE / POP` 深度、前进/返回方向、浮层 LIFO 优先级和退出等待清理。
- 路由过渡：只动画内容层；App 启用、Web 不启用；`mode="sync"` 不产生空白；减少动态效果降级。
- 原生返回 Hook：浮层优先、有历史时返回、首页第一次提示、第二次退出、进入后台清除等待、监听器正确移除。
- 分享面板：打开后立即显示生成状态；生成中防重复；保存、分享、关闭、失败状态正确。
- 分享计数：保存相册不增加；只有系统分享面板成功启动才增加；失败不增加。
- Web 原有下载测试继续通过。

### 7.2 浏览器与尺寸复测

- App：375×812、412×915。
- Web：375px 响应式和 1280px Desktop 回归。
- App 模式卡在长描述和较大字体下无重叠。
- App 塔罗页面没有页面级或组件级横向滚动，7 张牌全部可见。
- 页面切换无白屏，控制台无 error。
- 减少动态效果模式可完成全部流程。

### 7.3 Android 复测

- `lint`、`typecheck`、全部 Vitest、Web `build`。
- `android:sync`。
- Gradle `testDebugUnitTest lintDebug assembleDebug`。
- APK 签名、包名、版本、内嵌资源和 SHA-256 校验。
- API 28：验证旧版写入权限只在需要时请求，并能保存到公共 Pictures。
- API 29+：验证 MediaStore 保存无需相册读取权限。
- API 33+：验证系统分享和手势触发的 Back；不把系统级 Predictive Back Preview 动画列为完成条件。
- API 36：按当前 target SDK 回归构建与主要流程。
- 有真机时验证：侧边返回、首页两次退出、保存到相册、微信或系统分享面板；有可用模拟器或设备时运行 `connectedDebugAndroidTest`。
- 没有连接设备时必须明确列出上述真机未验证项，不得用编译成功代替真机结论。

## 8. 实施阶段

### Phase 1：UI 修复

- `MobileModeCard` 正常流布局；
- `MobileTarotSpread` 4+3 牌阵、状态机和选择锁；
- 完成 Vitest、Web 回归及 375/412 App 视口复测。

### Phase 2：统一 App 导航

- `MobileNavigationProvider`；
- `MobileRouteTransition`；
- `useNativeBackNavigation`；
- 验证 Forward、Back、Bottom Nav、浮层优先级和首页退出。

### Phase 3：分享 UI

- `MobileShareCardSheet` 先打开再生成；
- Loading、预览、保存、分享和错误状态；
- React 层使用可替换的原生桥接接口完成自动测试。

### Phase 4：Android 原生分享插件

- MediaStore API 29+ 保存；
- API 24～28 权限和公共 Pictures 保存；
- FileProvider、分享 Intent、缓存清理和安全限制；
- Android 编译、Lint 与设备专项。

### Phase 5：完整交付

- 全量前端检查；
- Android 同步、构建和 APK 校验；
- 真机可用时复测输入法、Safe Area、返回、塔罗、相册、系统分享和关闭重开；
- 输出新 APK 与过程记录。

## 9. 非目标

- 不修改 Web 首页、Web 塔罗牌阵或 Web 路由动画。
- 不改变塔罗牌库、抽牌随机性、正逆位和候选项映射。
- 不增加账号、云存储或服务端图片上传。
- 不读取用户相册或通讯录。
- 不把分享图片保存到项目或 LocalStorage。
- 不引入新的跨平台 UI 框架。
- 不实现 Android 系统级 Predictive Back Preview 动画。

## 10. 完成定义

只有以下条件同时满足才能称为完成：

- 五个反馈问题都有对应回归测试或可复现验收；
- App 牌阵无需滑动即可选择全部 7 张牌；
- 模式卡在目标尺寸和长文案下不重叠；
- App 内容层路由过渡、浮层返回优先级与 Android 侧边返回工作一致；
- App 能明确执行保存到相册和系统分享，失败不显示假成功；
- 保存相册不污染分享次数，系统分享缓存可被接收方读取且会延迟清理；
- Web 行为不回退；
- 自动检查与 Android 构建通过；
- 新 APK 及复测记录已输出到规定的成品和过程目录。
