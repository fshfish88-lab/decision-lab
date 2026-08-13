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
- AI 深度分析：随机、科学、玄学结果可按需请求 AI 补充现实因素、风险、冲突、情景和下一步建议；原始结果不会被覆盖。
- AI 直接决策：结合用户补充的真实情况，从现有候选项中给出明确建议、主要取舍和行动计划，并写入本地历史。
- 响应式界面：支持桌面、平板和最低 375px 手机宽度，并适配减少动效偏好。

V1.5 仍没有数据库、登录或云同步。随机、科学和玄学模式始终在本地独立运行，AI 服务不可用也不会影响它们。决策记录只保存在当前浏览器；按需发起 AI 请求时，当前问题、候选项、计算摘要或用户填写的背景会发送到后端用于生成本次回复。

## AI 服务边界

前端只调用两个正式后端接口：

- `POST https://api.fshfish.com/api/ai/deep-analysis`：为本地模式结果生成可选深度分析。
- `POST https://api.fshfish.com/api/ai/decision`：为 AI 模式生成直接建议。

请求体统一为 `{ "content": "..." }`，不再使用旧 `/api/analyze`。LLM 密钥只存在于服务端，浏览器和构建产物中均不包含 DeepSeek API Key。AI 输出属于辅助建议；医疗、法律、金融等高风险决定仍需独立核实和专业意见。

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

## 生产部署

- 正式地址：`https://decision.fshfish.com/`
- Vite 生产基址固定为 `/`，构建产物不依赖旧的 `/decision-lab/` 子路径。
- 路由继续使用 HashRouter，静态托管无需额外的 SPA 重写规则。
- GitHub Pages 通过 `.github/workflows/deploy-pages.yml` 发布 `dist/`；自定义域名在仓库 Pages 设置中维护。

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
├─ ai/           # 正式 AI 接口客户端、响应校验与提示词构建
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
- 本地模式的最终结果由确定性算法产生，AI 深度分析只负责理解与解释，不能改写原结果。
- AI 模式负责直接建议，但必须从用户提供的候选项中选择，并清楚展示推荐强度和取舍。
