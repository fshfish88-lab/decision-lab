# Tarot Artwork and Mystic Reading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give all 22 Major Arcana distinct symbolic geometric artwork and expand every upright/reversed result into three short, mysterious reading passages without changing the precomputed draw mechanism.

**Architecture:** Keep tarot catalogue data authoritative in `src/tarot/tarotCards.ts`, add optional rich-reading fields to persisted result types for backward compatibility, and isolate visuals in a reusable `TarotCardArtwork` SVG component. Both the flipped card and the full result reuse the same artwork; result creation resolves the selected option into the reading template exactly once.

**Tech Stack:** React 19, TypeScript strict mode, inline SVG, Framer Motion, Vitest, Testing Library, Vite, existing CSS design system.

---

## File map

- Create `src/components/tarot/TarotCardArtwork.tsx`: reusable inline-SVG renderer with 22 named compositions and a generic fallback.
- Create `src/components/tarot/TarotCardArtwork.test.tsx`: catalogue coverage, distinct composition IDs, fallback, and accessibility checks.
- Modify `src/types/decision.ts`: rich reading fields on catalogue meanings and optional persisted result fields.
- Modify `src/tarot/tarotCards.ts`: author 44 complete upright/reversed three-part readings.
- Modify `src/tarot/tarotEngine.test.ts`: enforce catalogue completeness and forbidden advice language.
- Modify `src/services/decisionEngine.ts`: resolve `{option}` inside the precomputed selected result.
- Modify `src/services/decisionEngine.test.ts`: verify result persistence and option interpolation.
- Modify `src/components/tarot/TarotCard.tsx`: render artwork only after selection.
- Modify `src/components/tarot/TarotReveal.tsx`: show a short omen on reveal.
- Modify `src/components/results/MysticResult.tsx`: reuse artwork and render the three reading passages with legacy fallback.
- Modify `src/components/results/results.test.tsx`: verify new modules and old history compatibility.
- Modify `src/pages/TarotPage.test.tsx`: prove no artwork or reading leaks before click.
- Modify `src/index.css`: artwork variables, card artwork sizing, three-passage layout, responsive rules.
- Modify `docs/product-spec.md`: replace the one-paragraph tarot result contract with the approved three-passage contract.
- Modify `DECISION_LAB_完整产品设计与开发方案.md` in the workspace root: mirror the same product-source update.

---

### Task 1: Lock the rich-reading data contract

**Files:**
- Modify: `src/types/decision.ts`
- Modify: `src/tarot/tarotEngine.test.ts`

- [ ] **Step 1: Write the failing catalogue completeness test**

Extend the existing inner assertion in `src/tarot/tarotEngine.test.ts`:

```ts
for (const card of TAROT_CARDS) {
  for (const meaning of [card.upright, card.reversed]) {
    expect(meaning.keywords.length).toBeGreaterThanOrEqual(3)
    expect(meaning.interpretation.length).toBeGreaterThan(10)
    expect(meaning.omen.length).toBeGreaterThanOrEqual(20)
    expect(meaning.resonance).toContain('{option}')
    expect(meaning.echo.length).toBeGreaterThanOrEqual(20)
    expect(`${meaning.omen}${meaning.resonance}${meaning.echo}`).not.toMatch(
      /你应该|建议你|风险是|宇宙共振率|玄学置信度/,
    )
    expect(meaning.strength).toBeGreaterThanOrEqual(1)
    expect(meaning.strength).toBeLessThanOrEqual(5)
  }
}
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
npm.cmd run test:run -- src/tarot/tarotEngine.test.ts
```

Expected: TypeScript/test failure because `omen`, `resonance`, and `echo` do not exist.

- [ ] **Step 3: Add catalogue and persisted-result types**

Update the two interfaces in `src/types/decision.ts`:

```ts
export interface TarotMeaning {
  keywords: string[]
  interpretation: string
  omen: string
  resonance: string
  echo: string
  strength: number
}

export interface TarotResultReading {
  cardId: string
  number: number
  numeral: string
  name: string
  chineseName: string
  orientation: TarotOrientation
  keywords: string[]
  interpretation: string
  /** 新版三段式解读；可选以兼容旧版 LocalStorage。 */
  omen?: string
  /** 已将 {option} 替换为本轮结果。 */
  resonance?: string
  echo?: string
  strength: number
  selectedPosition: number
  deckFingerprint: string
}
```

Do not make `TarotMeaning` fields optional: the live 22-card catalogue must always be complete. Keep only persisted `TarotResultReading` fields optional for old history.

- [ ] **Step 4: Run typecheck and keep the expected failures focused**

Run:

```powershell
npm.cmd run typecheck
```

Expected: failures only in `src/tarot/tarotCards.ts` because all 44 meanings still need the new required fields.

- [ ] **Step 5: Keep the branch in RED until Task 2 completes the catalogue**

Do not commit the temporarily non-compiling contract by itself. Task 2 supplies all 44 required data objects, returns the branch to GREEN, and commits the contract, tests, catalogue, and result construction together.

---

### Task 2: Author all 44 upright/reversed mystery readings

**Files:**
- Modify: `src/tarot/tarotCards.ts`
- Modify: `src/services/decisionEngine.ts`
- Modify: `src/services/decisionEngine.test.ts`

- [ ] **Step 1: Add a failing result-construction test**

In `src/services/decisionEngine.test.ts`, add a test using a spread entry from `createTarotSpread`:

```ts
it('persists three mysterious tarot passages and resolves the selected option', () => {
  const spread = createTarotSpread(OPTIONS, () => 0)
  const result = createTarotResult({
    question: '今晚吃什么？',
    options: OPTIONS,
    selection: spread.cards[0],
    deckFingerprint: spread.fingerprint,
    now: () => new Date('2026-08-22T00:00:00.000Z'),
    makeId: () => 'tarot-rich-1',
  })

  const tarot = result.details?.type === 'mystic' ? result.details.tarot : undefined
  expect(tarot?.omen.length).toBeGreaterThanOrEqual(20)
  expect(tarot?.resonance).toContain(`「${result.winner.label}」`)
  expect(tarot?.resonance).not.toContain('{option}')
  expect(tarot?.echo.length).toBeGreaterThanOrEqual(20)
})
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```powershell
npm.cmd run test:run -- src/tarot/tarotEngine.test.ts src/services/decisionEngine.test.ts
```

Expected: catalogue completeness and result persistence tests fail.

- [ ] **Step 3: Add the three fields to every meaning in `TAROT_CARDS`**

Use the approved three-part structure for all 44 meanings. The first card establishes the exact data shape and tone:

```ts
{
  id: 'the-fool', number: 0, numeral: '0', name: 'THE FOOL', chineseName: '愚者',
  upright: {
    keywords: ['尝试', '冒险', '新开始'],
    interpretation: '愚者鼓励你先迈出一步，让新的体验替代没有尽头的比较。',
    omen: '远处的日轮尚未升至最高处，悬崖边却已有风吹动行囊。某个未被命名的开端，正在比理性更早地靠近。',
    resonance: '愚者把「{option}」放在旅途的第一块踏石上。它并非最稳固的答案，却与此刻尚未展开的那条路径产生了回声。',
    echo: '脚步落下之前，世界仍保持沉默；而沉默之中，已有一枚看不见的骰子停止滚动。',
    strength: 4,
  },
  reversed: {
    keywords: ['准备不足', '冲动', '迟疑'],
    interpretation: '愚者逆位提醒你放慢一点，但别把谨慎变成继续拖延的理由。',
    omen: '旅人的影子先一步越过边缘，行囊却仍停在原地。风向反复改变，像是在遮掩一个过早出现的念头。',
    resonance: '逆位愚者让「{option}」浮在尚未落地的轨道上。它被牌阵选中，不因道路清晰，而因迷雾恰好在这里留下缺口。',
    echo: '没有响起的铃声仍在远处震动；当它再次靠近时，答案或许会以另一副面孔出现。',
    strength: 2,
  },
},
```

For the remaining cards, author both orientations with the following exact symbolic anchors so no entry becomes a renamed generic template:

```ts
const READING_ANCHORS = {
  'the-magician': ['无限结', '四元素', '上下相连'],
  'the-high-priestess': ['双柱', '月光帷幕', '未开启的卷册'],
  'the-empress': ['十二星冠', '麦穗', '丰盛之门'],
  'the-emperor': ['石座', '四方边界', '远山'],
  'the-hierophant': ['双钥匙', '三重冠', '仪式台阶'],
  'the-lovers': ['双星', '交汇轨道', '上方日轮'],
  'the-chariot': ['双轮', '分向之兽', '胜利冠'],
  strength: ['狮首', '无限结', '不燃烧的火'],
  'the-hermit': ['提灯', '孤峰', '内收光束'],
  'wheel-of-fortune': ['轮盘', '四象刻度', '回转箭头'],
  justice: ['天平', '直剑', '对称双柱'],
  'the-hanged-man': ['倒悬三角', '静止光环', '树枝'],
  death: ['白花', '落日', '门扉'],
  temperance: ['双杯', '合流之水', '日月'],
  'the-devil': ['锁链', '倒置星形', '双火焰'],
  'the-tower': ['裂塔', '闪电', '坠落星屑'],
  'the-star': ['八芒主星', '七颗伴星', '水面涟漪'],
  'the-moon': ['月相', '双塔', '蜿蜒路径'],
  'the-sun': ['主日轮', '四向光芒', '开放花冠'],
  judgement: ['号角', '上升弧线', '三重回声'],
  'the-world': ['椭圆花环', '四角守望', '完成之印'],
} as const
```

Each `omen` must use at least two anchors. Each `resonance` must contain exactly one `{option}` placeholder and explain the mysterious correspondence without advice language. Each `echo` must close on an unresolved image. Upright and reversed text must not be identical or simple negations.

- [ ] **Step 4: Resolve and persist the selected option exactly once**

In `createTarotResult`, add:

```ts
const resonance = meaning.resonance.replace('{option}', `「${winner.label}」`)
```

and persist:

```ts
omen: meaning.omen,
resonance,
echo: meaning.echo,
```

Build the top-level explanation from the three passages without advice copy:

```ts
explanation: `${card.chineseName} · ${orientationLabel}：${meaning.omen} ${resonance} ${meaning.echo}`,
```

- [ ] **Step 5: Run catalogue, engine, and result tests**

Run:

```powershell
npm.cmd run test:run -- src/tarot/tarotEngine.test.ts src/services/decisionEngine.test.ts
npm.cmd run typecheck
```

Expected: all focused tests pass and TypeScript exits 0.

- [ ] **Step 6: Commit the complete reading catalogue**

```powershell
git add src/types/decision.ts src/tarot/tarotCards.ts src/tarot/tarotEngine.test.ts src/services/decisionEngine.ts src/services/decisionEngine.test.ts
git commit -m "feat: enrich all tarot readings"
```

---

### Task 3: Build the 22-card symbolic SVG system

**Files:**
- Create: `src/components/tarot/TarotCardArtwork.tsx`
- Create: `src/components/tarot/TarotCardArtwork.test.tsx`

- [ ] **Step 1: Write failing artwork coverage and fallback tests**

Create `src/components/tarot/TarotCardArtwork.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TAROT_CARDS } from '../../tarot/tarotCards'
import { TAROT_ARTWORK_IDS, TarotCardArtwork } from './TarotCardArtwork'

describe('TarotCardArtwork', () => {
  it('defines one distinct symbolic composition for every Major Arcana', () => {
    expect(TAROT_ARTWORK_IDS).toEqual(TAROT_CARDS.map((card) => card.id))
    expect(new Set(TAROT_ARTWORK_IDS).size).toBe(22)
  })

  it('renders decorative card-specific artwork and a safe fallback', () => {
    const { rerender } = render(<TarotCardArtwork cardId="the-moon" />)
    expect(screen.getByTestId('tarot-artwork-the-moon')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByTestId('tarot-artwork-the-moon').querySelectorAll('path, circle, line, polygon, polyline').length)
      .toBeGreaterThanOrEqual(6)

    rerender(<TarotCardArtwork cardId="unknown-card" />)
    expect(screen.getByTestId('tarot-artwork-fallback')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test and verify RED**

```powershell
npm.cmd run test:run -- src/components/tarot/TarotCardArtwork.test.tsx
```

Expected: module-not-found failure.

- [ ] **Step 3: Implement the renderer boundary and exact catalogue order**

Create `src/components/tarot/TarotCardArtwork.tsx` with this public contract:

```tsx
import type { ReactNode } from 'react'

export const TAROT_ARTWORK_IDS = [
  'the-fool', 'the-magician', 'the-high-priestess', 'the-empress',
  'the-emperor', 'the-hierophant', 'the-lovers', 'the-chariot',
  'strength', 'the-hermit', 'wheel-of-fortune', 'justice',
  'the-hanged-man', 'death', 'temperance', 'the-devil',
  'the-tower', 'the-star', 'the-moon', 'the-sun', 'judgement', 'the-world',
] as const

interface TarotCardArtworkProps {
  cardId: string
  className?: string
}

function Stars(): ReactNode {
  return <g className="tarot-artwork__stars"><circle cx="24" cy="26" r="1.5" /><circle cx="76" cy="22" r="1" /><path d="M82 48h8M86 44v8" /></g>
}

function FallbackArtwork(): ReactNode {
  return <g><circle cx="50" cy="50" r="25" /><circle cx="50" cy="50" r="8" /><path d="M50 14v12M50 74v12M14 50h12M74 50h12" /></g>
}
```

Implement `artworkFor(cardId)` as an exhaustive switch. Every case must return a dedicated `<g>` with at least six visible SVG primitives and the main symbols from design section 3.2. Use this exact outer SVG:

```tsx
export function TarotCardArtwork({ cardId, className }: TarotCardArtworkProps): React.JSX.Element {
  const known = TAROT_ARTWORK_IDS.includes(cardId as (typeof TAROT_ARTWORK_IDS)[number])
  return (
    <svg
      aria-hidden="true"
      className={className}
      data-testid={`tarot-artwork-${known ? cardId : 'fallback'}`}
      focusable="false"
      viewBox="0 0 100 120"
    >
      <Stars />
      {known ? artworkFor(cardId) : <FallbackArtwork />}
    </svg>
  )
}
```

Composition requirements for the switch are exact:

```text
the-fool=cliff+sun+three trail stars
the-magician=infinity loop+four element nodes+vertical wand
the-high-priestess=two pillars+crescent+curtain dots
the-empress=twelve-point crown+two wheat stems+arched gate
the-emperor=stepped throne+two mountains+square seal
the-hierophant=triple crown+crossed keys+three steps
the-lovers=two stars+crossing orbits+upper sun
the-chariot=two wheels+split triangular beasts+victory crown
strength=geometric lion face+infinity loop+halo
the-hermit=lantern+single mountain+inward rays
wheel-of-fortune=three rings+four ticks+two curved arrows
justice=balanced scales+upright sword+two pillars
the-hanged-man=inverted triangle+branch+still halo
death=five-petal white flower+setting sun+open door
temperance=two cups+two curved streams+sun and moon
the-devil=broken chains+inverted pentagonal frame+two flames
the-tower=split tower+lightning+five falling stars
the-star=eight-point star+seven companions+three ripples
the-moon=three moon phases+two towers+winding path
the-sun=central sun+four cardinal rays+open flower crown
judgement=trumpet+three rising arcs+three echo lines
the-world=oval wreath+four corner watchers+central completion diamond
```

Use only `currentColor`, `var(--tarot-artwork-accent)`, `fill="none"`, and the existing cream background. Do not introduce gradients, filters, external assets, or animation inside the SVG.

- [ ] **Step 4: Run artwork tests and typecheck**

```powershell
npm.cmd run test:run -- src/components/tarot/TarotCardArtwork.test.tsx
npm.cmd run typecheck
```

Expected: artwork tests pass; TypeScript exits 0.

- [ ] **Step 5: Commit the artwork system**

```powershell
git add src/components/tarot/TarotCardArtwork.tsx src/components/tarot/TarotCardArtwork.test.tsx
git commit -m "feat: add symbolic Major Arcana artwork"
```

---

### Task 4: Integrate artwork and three-part readings into the UI

**Files:**
- Modify: `src/components/tarot/TarotCard.tsx`
- Modify: `src/components/tarot/TarotReveal.tsx`
- Modify: `src/components/results/MysticResult.tsx`
- Modify: `src/components/results/results.test.tsx`
- Modify: `src/pages/TarotPage.test.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Extend result fixtures and write failing UI assertions**

Add the new fields to the `tarotResult` fixture in `src/components/results/results.test.tsx`:

```ts
omen: '主日轮越过牌面的边界，四向光芒让隐藏的轮廓短暂显形。',
resonance: '太阳把「日料」置于无遮蔽的光线中，像一个早已被看见、只是尚未说出的名字。',
echo: '当最后一道影子缩回门后，仍有一粒金色尘埃停在答案上方。',
```

Then assert the three modules and shared artwork:

```ts
expect(screen.getByTestId('tarot-artwork-the-sun')).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '牌面征兆' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '命运映射' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '隐秘余韵' })).toBeInTheDocument()
expect(screen.getByText(/太阳把「日料」置于/)).toBeInTheDocument()
expect(screen.queryByRole('heading', { name: '本轮建议' })).not.toBeInTheDocument()
```

Add a legacy tarot fixture by deleting the optional fields and assert the single interpretation fallback remains visible:

```ts
const legacyTarot = structuredClone(tarotResult)
if (legacyTarot.details?.type === 'mystic' && legacyTarot.details.tarot) {
  delete legacyTarot.details.tarot.omen
  delete legacyTarot.details.tarot.resonance
  delete legacyTarot.details.tarot.echo
}
render(<MysticResult result={legacyTarot} />)
expect(screen.getByText('太阳牌认为答案无需过度解释，选择那个让你直接感到开心的方案。')).toBeInTheDocument()
```

- [ ] **Step 2: Strengthen the pre-click privacy test**

In `src/pages/TarotPage.test.tsx`, before clicking a card add:

```ts
expect(screen.queryByTestId(/tarot-artwork-/)).not.toBeInTheDocument()
expect(screen.queryByText('牌面征兆')).not.toBeInTheDocument()
expect(screen.queryByText('命运映射')).not.toBeInTheDocument()
expect(screen.queryByText('隐秘余韵')).not.toBeInTheDocument()
```

After clicking, assert one selected artwork and the reveal omen are present:

```ts
expect(screen.getAllByTestId(/tarot-artwork-/)).toHaveLength(1)
expect(screen.getByText(/牌面征兆/)).toBeInTheDocument()
```

- [ ] **Step 3: Run UI tests and verify RED**

```powershell
npm.cmd run test:run -- src/components/results/results.test.tsx src/pages/TarotPage.test.tsx
```

Expected: missing artwork and reading-module assertions fail.

- [ ] **Step 4: Reuse artwork in the selected card and result hero**

In `TarotCard.tsx`, replace the selected face sigil with:

```tsx
<TarotCardArtwork cardId={entry.card.id} className="tarot-card__artwork" />
```

Keep it inside `{selected ? (...) : null}` so no front artwork enters the DOM before selection.

In `MysticResult.tsx`, replace the `CircleDot` icon with:

```tsx
<TarotCardArtwork cardId={tarot.cardId} className="tarot-result__artwork" />
```

Remove the now-unused `CircleDot` import.

- [ ] **Step 5: Show a concise omen on the reveal panel**

In `TarotReveal.tsx`, render:

```tsx
{tarot.omen ? (
  <div className="tarot-reveal__omen">
    <span>牌面征兆</span>
    <p>{tarot.omen}</p>
  </div>
) : (
  <p className="tarot-reveal__interpretation">{tarot.interpretation}</p>
)}
```

Do not show all three passages here; the reveal remains brief and the full result owns the complete reading.

- [ ] **Step 6: Render three passages with a legacy fallback**

In the tarot branch of `MysticResult.tsx`, derive:

```ts
const hasRichReading = Boolean(tarot.omen && tarot.resonance && tarot.echo)
```

Replace the current single `tarot-result__interpretation` body with:

```tsx
<section className="tarot-result__interpretation" aria-labelledby="tarot-interpretation-heading">
  <div>
    <span className="section-index">CARD INTERPRETATION</span>
    <h2 id="tarot-interpretation-heading">牌意解读</h2>
    {hasRichReading ? (
      <div className="tarot-reading-passages">
        <article><span>OMEN / 01</span><h3>牌面征兆</h3><p>{tarot.omen}</p></article>
        <article><span>RESONANCE / 02</span><h3>命运映射</h3><p>{tarot.resonance}</p></article>
        <article><span>ECHO / 03</span><h3>隐秘余韵</h3><p>{tarot.echo}</p></article>
      </div>
    ) : <p>{tarot.interpretation}</p>}
  </div>
  <dl>
    <div><dt>牌阵指纹</dt><dd>{tarot.deckFingerprint}</dd></div>
    <div><dt>抽牌位置</dt><dd>{String(tarot.selectedPosition + 1).padStart(2, '0')} / 07</dd></div>
    <div><dt>科学意见</dt><dd>不予置评</dd></div>
  </dl>
</section>
```

Delete the tarot branch's green/red “宜/忌” `mystic-guidance` section because the approved experience explicitly excludes concrete advice. Keep `favorable` and `avoid` in stored details only for old schema compatibility.

- [ ] **Step 7: Add restrained SVG and passage styles**

Add to `src/index.css`:

```css
.tarot-card__artwork,
.tarot-result__artwork {
  --tarot-artwork-accent: #9a8455;
  width: 72%;
  color: #292a31;
  overflow: visible;
  stroke: currentColor;
  stroke-width: 1.25;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.tarot-card__artwork { max-height: 54%; }
.tarot-result__artwork { width: min(74%, 170px); margin: auto; }
.tarot-artwork__stars { color: var(--tarot-artwork-accent); }

.tarot-reading-passages {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 22px;
}

.tarot-reading-passages article {
  min-width: 0;
  padding: 20px;
  border: 1px solid #ebe2d2;
  border-radius: 16px;
  background: #faf7f0;
}

.tarot-reading-passages article > span {
  color: #967a4b;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.tarot-reading-passages h3 { margin: 9px 0; font-size: 19px; }
.tarot-reading-passages p { margin: 0; color: #625b51; line-height: 1.8; }

@media (max-width: 720px) {
  .tarot-reading-passages { grid-template-columns: 1fr; }
  .tarot-card__artwork { width: 68%; }
}
```

Integrate these rules beside the existing tarot block, not at the end of unrelated responsive rules. Adjust existing selectors only where the old sigil dimensions conflict.

- [ ] **Step 8: Run focused UI tests and inspect coverage**

```powershell
npm.cmd run test:run -- src/components/tarot/TarotCardArtwork.test.tsx src/components/results/results.test.tsx src/pages/TarotPage.test.tsx
npm.cmd run typecheck
```

Expected: all focused tests pass; TypeScript exits 0.

- [ ] **Step 9: Commit the integrated experience**

```powershell
git add src/components/tarot/TarotCard.tsx src/components/tarot/TarotReveal.tsx src/components/results/MysticResult.tsx src/components/results/results.test.tsx src/pages/TarotPage.test.tsx src/index.css
git commit -m "feat: present symbolic tarot readings"
```

---

### Task 5: Synchronize product sources and complete verification

**Files:**
- Modify: `docs/product-spec.md`
- Modify: `C:\Users\67588\Documents\选择困难症\DECISION_LAB_完整产品设计与开发方案.md`
- Create process artifacts under: `C:\Users\67588\Documents\选择困难症\过程文件文件夹\tarot-rich-qa-20260822\`

- [ ] **Step 1: Update both product-source descriptions**

In both Markdown sources, state the same acceptance contract:

```markdown
- 22 张大阿卡纳使用可相互辨认的象征性几何插画，抽牌翻面和完整结果复用同一图案。
- 每个正逆位结果包含“牌面征兆、命运映射、隐秘余韵”三个神秘短段落。
- 命运映射可以嵌入本轮候选项，但不输出具体行动建议、现实风险分析或伪科学百分比。
- 旧版塔罗历史缺少三段式字段时继续显示原单段牌意。
```

Replace the old single-interpretation wording rather than appending a conflicting second description.

- [ ] **Step 2: Run fresh full verification**

Run each command separately and stop on the first non-zero exit:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:run
npm.cmd run build
```

Expected: lint and typecheck exit 0; all test files pass; Vite production build exits 0.

- [ ] **Step 3: Serve the production build for browser QA**

Use the workspace-required Python interpreter:

```powershell
& 'C:\Users\67588\anaconda3\envs\modeling\python.exe' -m http.server 4173 --bind 127.0.0.1 --directory dist
```

If port 4173 is already occupied by the prior server, stop only that known session or reuse it after rebuilding; do not terminate unrelated processes.

- [ ] **Step 4: Verify the desktop flow in Chrome**

At `http://127.0.0.1:4173/#/`:

1. Enter a question and at least two options.
2. Select 玄学模式 and enter `/tarot`.
3. Confirm seven backs and no card artwork/readings in the DOM before click.
4. Select a card and confirm its unique artwork appears.
5. Open the full result and confirm three passage headings and the selected option in 命运映射.
6. Confirm no “宜/忌”, “宇宙共振率”, “玄学置信度”, or advice copy.
7. Evaluate `document.documentElement.scrollWidth === document.documentElement.clientWidth`.
8. Confirm console has 0 errors and 0 warnings.
9. Emulate `prefers-reduced-motion: reduce` and confirm no new artwork animation runs independently of the existing card flip.

Save a full-page screenshot to:

```text
C:\Users\67588\Documents\选择困难症\过程文件文件夹\tarot-rich-qa-20260822\desktop-rich-result.png
```

- [ ] **Step 5: Verify the 375px flow**

Resize the same browser session to 375×812, rerun the draw, and confirm:

- card deck scrolls internally while the page does not overflow;
- the selected illustration remains legible at card size;
- the three passages stack in one column;
- all text wraps without clipping;
- console remains clean.

Save:

```text
C:\Users\67588\Documents\选择困难症\过程文件文件夹\tarot-rich-qa-20260822\mobile-rich-result-375.png
```

- [ ] **Step 6: Commit product-source synchronization**

Commit the nested repository source:

```powershell
git add docs/product-spec.md
git commit -m "docs: document rich tarot presentation"
```

The root `DECISION_LAB_完整产品设计与开发方案.md` is outside the nested Git repository; verify its diff separately and do not add it to the nested commit.

- [ ] **Step 7: Open the local result for user review**

Keep the verified local server running and open `http://127.0.0.1:4173/#/` in the Codex browser. Report the exact branch, latest commit, test count, build result, desktop/mobile overflow measurements, console state, and screenshot paths.

---

## Final self-check

- The draw remains precomputed and click-controlled.
- All 22 card IDs have distinct SVG compositions and a fallback exists.
- All 44 meanings contain three complete passages.
- New persistence resolves the chosen option; old history remains readable.
- No concrete advice modules remain in the new tarot result.
- Artwork is absent before click.
- No new dependency, API, backend, or external asset is introduced.
- Product sources, automated tests, production build, and browser evidence agree.
