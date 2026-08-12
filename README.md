# DECISION LAB

一个披着“严谨决策系统”外衣的生活选择工具：该科学的时候真的计算，该玄学的时候认真胡说。

## V1.5 功能

- 随机模式：对 2～10 个有效候选项执行等概率抽取。
- 科学模式：自定义 2～6 个指标和权重，对每个方案进行 1～10 分加权评分并展示完整排名。
- 玄学模式：通过 30+ 条本地模板和相互一致的虚构指标生成娱乐结果，不调用 AI。
- 决策动画：每种模式经过独立的分析流程后再揭晓结果。
- 本地历史：使用 V2 版本化 LocalStorage 保存最近 50 条记录，支持详情展开、反悔记录和再次使用。
- 统计与成就：基于当前浏览器里的真实记录生成月度指标、7 天趋势、模式分布和本地成就。
- 结果分享：支持复制结果和下载分享卡，不上传个人决策数据。
- AI 模式外壳：提供需求提取界面和类型化 API 边界；API 未配置时明确禁用，不生成演示答案。
- 响应式界面：支持桌面、平板和最低 375px 手机宽度，并适配减少动效偏好。

V1.5 仍没有数据库、登录或云同步。AI 模式等待 Serverless API 接入，随机、科学和玄学模式始终在本地独立运行；所有决策数据只保存在当前浏览器。

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
├─ achievements/ # 本地成就规则与解锁状态
├─ ai/           # API-ready AI 客户端边界
├─ algorithms/   # 随机、科学与玄学核心算法
├─ analytics/    # 本地决策统计
├─ components/   # 可复用界面组件
├─ data/         # 玄学解释模板
├─ pages/        # 首页、科学配置、分析、结果、历史和关于
├─ services/     # 结果对象编排
├─ sharing/      # 分享文案与图片卡生成
├─ state/        # 当前决策会话状态
├─ storage/      # 版本化 LocalStorage 适配器
└─ types/        # 共享领域类型
```

## 产品原则

- 严肃界面 + 不太严肃的表达。
- 避免低幼、赛博朋克、满屏渐变和传统企业 Dashboard。
- AI 后续只负责理解与解释，确定性算法负责真正的评分和排名。
