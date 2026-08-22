# Readable Tarot Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace abstract occult prose with one clear, consistent six-part tarot result structure while preserving the current UI and old LocalStorage history.

**Architecture:** Generate all 44 upright/reversed readings through one deterministic helper using card name, orientation, three keywords, and opposite-side keywords. Reuse `interpretation`, `resonance`, and `echo` as meaning, option rationale, and caution; add `punchline`, while keeping `omen` only as an optional persisted legacy field.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, CSS, LocalStorage.

---

### Task 1: Lock the readable copy contract with failing tests

**Files:**
- Modify: `src/tarot/tarotEngine.test.ts`
- Modify: `src/services/decisionEngine.test.ts`
- Modify: `src/components/results/results.test.tsx`
- Modify: `src/pages/TarotPage.test.tsx`

- [ ] **Step 1: Replace catalogue assertions with the new six-part contract**

In `src/tarot/tarotEngine.test.ts`, assert for every upright and reversed meaning:

```ts
expect(meaning.keywords).toHaveLength(3)
expect(meaning.interpretation).toContain(card.chineseName)
expect(meaning.resonance).toContain('{option}')
expect(meaning.echo.length).toBeGreaterThanOrEqual(20)
expect(meaning.punchline).toContain('Decision Lab')
expect(`${meaning.interpretation}${meaning.resonance}${meaning.echo}${meaning.punchline}`).not.toMatch(
  /命运缝隙|第三次回声|未被命名|最后一道光|轻响|隐秘余韵|你应该|建议你|选择那个/,
)
```

- [ ] **Step 2: Require persistence and interpolation of the cold-humour line**

In `src/services/decisionEngine.test.ts`, update the tarot result test:

```ts
expect(tarot?.interpretation).toContain(tarot?.chineseName)
expect(tarot?.resonance).toContain(`「${result.winner.label}」`)
expect(tarot?.resonance).not.toContain('{option}')
expect(tarot?.echo?.length).toBeGreaterThanOrEqual(20)
expect(tarot?.punchline).toContain('Decision Lab')
expect(result.explanation).toContain(tarot?.punchline)
```

- [ ] **Step 3: Require the new UI labels and legacy fallback**

Change the structured fixture in `src/components/results/results.test.tsx` to include:

```ts
interpretation: '太阳正位代表快乐、明确、满足。它表示事情正在变得清楚，内心偏好也更容易被看见。',
resonance: '牌阵会指向「日料」，是因为它最接近太阳牌强调的直接满足感。',
echo: '反面是期待过高：如果把快乐当成唯一标准，其他现实条件就容易被忽略。',
punchline: 'Decision Lab 已记录太阳的意见，责任归属仍显示为“用户本人”。',
```

Assert:

```ts
expect(screen.getByRole('heading', { name: '牌面含义' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '为什么是它' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: '逆位提醒' })).toBeInTheDocument()
expect(screen.getByText(/Decision Lab 已记录太阳的意见/)).toBeInTheDocument()
expect(screen.queryByText('牌面征兆')).not.toBeInTheDocument()
expect(screen.queryByText('命运映射')).not.toBeInTheDocument()
expect(screen.queryByText('隐秘余韵')).not.toBeInTheDocument()
```

Keep the legacy test by deleting `resonance`, `echo`, and `punchline`, then assert the old `interpretation` renders without structured headings.

- [ ] **Step 4: Update the reveal-page test**

In `src/pages/TarotPage.test.tsx`, assert `牌面含义` is absent before clicking and present after clicking; replace the old `牌面征兆` assertions.

- [ ] **Step 5: Run focused tests and verify RED**

Run:

```powershell
npm.cmd run test:run -- src/tarot/tarotEngine.test.ts src/services/decisionEngine.test.ts src/components/results/results.test.tsx src/pages/TarotPage.test.tsx
```

Expected: failures for missing `punchline` and old UI labels.

---

### Task 2: Generate readable copy and render the approved structure

**Files:**
- Modify: `src/types/decision.ts`
- Modify: `src/tarot/tarotCards.ts`
- Modify: `src/services/decisionEngine.ts`
- Modify: `src/components/tarot/TarotReveal.tsx`
- Modify: `src/components/results/MysticResult.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Update fresh and persisted types**

Use this fresh meaning shape:

```ts
export interface TarotMeaning {
  keywords: string[]
  interpretation: string
  resonance: string
  echo: string
  punchline: string
  strength: number
}
```

Keep `omen?: string` in `TarotResultReading` for old history and add:

```ts
punchline?: string
```

- [ ] **Step 2: Replace mystical prose generation with a readable helper**

In `src/tarot/tarotCards.ts`, define:

```ts
type MeaningSeed = readonly [keywords: string[], strength: number]

function readableMeaning(
  cardName: string,
  orientation: TarotOrientation,
  seed: MeaningSeed,
  oppositeKeywords: string[],
): TarotMeaning {
  const [keywords, strength] = seed
  const upright = orientation === 'upright'
  const orientationLabel = upright ? '正位' : '逆位'
  return {
    keywords,
    strength,
    interpretation: upright
      ? `${cardName}正位代表${keywords.join('、')}。它表示这张牌的核心力量能够顺畅发挥，事情更容易呈现出“${keywords[0]}”的状态。`
      : `${cardName}逆位代表${keywords.join('、')}。它表示这张牌的力量受阻、过量或方向偏移，问题通常集中在“${keywords[0]}”。`,
    resonance: upright
      ? `牌阵会指向「{option}」，是因为它最接近${cardName}${orientationLabel}强调的“${keywords[0]}、${keywords[1]}”。在当前候选项里，这个对应关系最直接。`
      : `牌阵会指向「{option}」，不是因为它最完美，而是它最能暴露${cardName}${orientationLabel}所说的“${keywords[0]}、${keywords[1]}”。`,
    echo: upright
      ? `反面是${oppositeKeywords[0]}和${oppositeKeywords[1]}：如果把“${keywords[0]}”放得太大，原本的优势也可能变成新的限制。`
      : `需要留意${keywords[0]}和${keywords[1]}会互相放大，让一个普通选择看起来比实际更糟；逆位不等于彻底否定。`,
    punchline: `Decision Lab 已记录${cardName}${orientationLabel}的意见，责任归属仍显示为“用户本人”。`,
  }
}
```

Change each card seed to exactly three keywords plus strength, for example:

```ts
card(
  { id: 'the-fool', number: 0, numeral: '0', name: 'THE FOOL', chineseName: '愚者' },
  [['尝试', '冒险', '新开始'], 4],
  [['准备不足', '冲动', '迟疑'], 2],
)
```

Apply the same mechanical shape to all 22 existing card definitions and remove symbols, final-image prose, and old recommendation sentences.

- [ ] **Step 3: Persist the new structure**

In `createTarotResult`, build:

```ts
explanation: `${card.chineseName} · ${orientationLabel}：${meaning.interpretation} ${resonance} ${meaning.echo} ${meaning.punchline}`,
```

Persist `interpretation`, resolved `resonance`, `echo`, and `punchline`; do not persist a new `omen`.

- [ ] **Step 4: Rename reveal and result modules**

In `TarotReveal.tsx`, show:

```tsx
<div className="tarot-reveal__omen">
  <span>牌面含义</span>
  <p>{tarot.interpretation}</p>
</div>
```

In `MysticResult.tsx`, require `resonance`, `echo`, and `punchline` for the structured layout and render:

```tsx
<article><span>MEANING / 01</span><h3>牌面含义</h3><p>{tarot.interpretation}</p></article>
<article><span>WHY / 02</span><h3>为什么是它</h3><p>{tarot.resonance}</p></article>
<article>
  <span>CAUTION / 03</span><h3>逆位提醒</h3><p>{tarot.echo}</p>
  <small className="tarot-reading-passages__punchline">{tarot.punchline}</small>
</article>
```

- [ ] **Step 5: Add one restrained punchline style**

In `src/index.css`, add:

```css
.tarot-reading-passages__punchline {
  display: block;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #e4dac8;
  color: #7d705f;
  font-size: 10px;
  line-height: 1.65;
}
```

- [ ] **Step 6: Run focused tests and typecheck**

Run the four focused test files from Task 1, then `npm.cmd run typecheck`.

Expected: all focused tests pass; TypeScript exits 0.

- [ ] **Step 7: Commit**

```powershell
git add src/types/decision.ts src/tarot/tarotCards.ts src/services/decisionEngine.ts src/components/tarot/TarotReveal.tsx src/components/results/MysticResult.tsx src/index.css src/tarot/tarotEngine.test.ts src/services/decisionEngine.test.ts src/components/results/results.test.tsx src/pages/TarotPage.test.tsx
git commit -m "feat: make tarot readings clear and structured"
```

---

### Task 3: Synchronize documentation and verify the finished product

**Files:**
- Modify: `docs/product-spec.md`
- Modify: `DECISION_LAB_完整产品设计与开发方案.md`
- Create: `过程文件文件夹/tarot-readable-qa-20260822/desktop-result.png`
- Create: `过程文件文件夹/tarot-readable-qa-20260822/mobile-result.png`

- [ ] **Step 1: Replace the old three-part copy contract in both product sources**

Document the exact order: card name/orientation, three keywords, card meaning, why this option, reverse-side caution, and one DECISION LAB cold-humour line. Replace old “牌面征兆 / 命运映射 / 隐秘余韵” wording rather than appending a conflicting section.

- [ ] **Step 2: Run complete engineering checks**

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:run
npm.cmd run build
```

Expected: all commands exit 0.

- [ ] **Step 3: Verify production output in the local browser**

At 1280px and 375px, complete a fresh mystic draw and verify:

```text
exactly 7 card backs before selection
0 front artworks before selection
1 front artwork after selection
牌面含义 / 为什么是它 / 逆位提醒 visible on the result
one Decision Lab punchline visible
no forbidden abstract phrases
no horizontal overflow
no console errors
```

- [ ] **Step 4: Save screenshots and keep the result page open**

Save desktop and mobile screenshots under `过程文件文件夹/tarot-readable-qa-20260822/`, reset the browser viewport, and leave `http://127.0.0.1:4173/#/result` visible for review.

- [ ] **Step 5: Commit product-spec changes**

```powershell
git add docs/product-spec.md
git commit -m "docs: standardize readable tarot copy"
```
