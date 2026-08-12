# DECISION LAB

一个披着“严谨决策系统”外衣的生活选择工具：该科学的时候真的计算，该玄学的时候认真胡说。

## V1 功能

- 随机模式：对 2～10 个有效候选项执行等概率抽取。
- 科学模式：自定义 2～6 个指标和权重，对每个方案进行 1～10 分加权评分并展示完整排名。
- 玄学模式：通过 30+ 条本地模板和相互一致的虚构指标生成娱乐结果，不调用 AI。
- 决策动画：每种模式经过独立的分析流程后再揭晓结果。
- 本地历史：使用带版本号的 LocalStorage 保存最近 50 条记录，刷新后仍然存在。
- 响应式界面：支持桌面、平板和最低 375px 手机宽度，并适配减少动效偏好。

V1 没有后端、数据库、登录或 AI 接口。所有决策数据只保存在当前浏览器。

## 技术栈

- React + Vite + TypeScript
- Tailwind CSS + 自定义设计令牌
- React Router（HashRouter，适合静态托管）
- Framer Motion
- Lucide React
- Vitest + Testing Library

## 本地运行

```powershell
npm.cmd install
npm.cmd run dev
```

浏览器访问 Vite 输出的本地地址，通常为 `http://localhost:5173`。

## 验证

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:run
npm.cmd run build
```

生产构建输出到 `dist/`，可以直接部署到任意静态站点托管服务。

## 目录结构

```text
src/
├─ algorithms/   # 随机、科学与玄学核心算法
├─ components/   # 可复用界面组件
├─ data/         # 玄学解释模板
├─ pages/        # 首页、科学配置、分析、结果、历史和关于
├─ services/     # 结果对象编排
├─ state/        # 当前决策会话状态
├─ storage/      # 版本化 LocalStorage 适配器
└─ types/        # 共享领域类型
```

## 产品原则

- 严肃界面 + 不太严肃的表达。
- 避免低幼、赛博朋克、满屏渐变和传统企业 Dashboard。
- AI 后续只负责理解与解释，确定性算法负责真正的评分和排名。
