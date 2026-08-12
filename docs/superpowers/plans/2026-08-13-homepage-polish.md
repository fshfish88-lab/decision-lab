# Homepage Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten the homepage first-screen layout and add a living decision-machine animation, mode personality copy, dynamic CTA labels, and consistent interaction polish.

**Architecture:** Keep the current React state and routing intact. Add behavioral changes inside `HomePage`, `ModeCard`, and `DecisionMachine`; keep visual changes in the existing stylesheet and validate behavior with focused Vitest tests before browser QA.

**Tech Stack:** React 19, TypeScript, Framer Motion, Vitest, Testing Library, CSS, Vite, GitHub Pages.

---

### Task 1: Mode personality and dynamic CTA

**Files:**
- Modify: `src/pages/HomePage.test.tsx`
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/components/ModeCard.tsx`

- [ ] Add failing tests asserting the initial CTA is `选择一种决策方式`, then becomes `交给命运`, `开始计算`, or `开始做法` after selecting each enabled mode; assert the four personality lines are present.
- [ ] Run `npm.cmd run test:run -- src/pages/HomePage.test.tsx` and confirm failures are caused by the missing labels and copy.
- [ ] Add an `aside: string` prop to `ModeCard`, render it as `.mode-card__aside`, pass the four approved lines, and derive the CTA label from `state.mode` in `HomePage`.
- [ ] Run the focused test again and confirm it passes.

### Task 2: Animated rotating ticket

**Files:**
- Create: `src/components/DecisionMachine.test.tsx`
- Modify: `src/components/DecisionMachine.tsx`

- [ ] Add failing tests for a pure `getNextTicketIndex` helper that never repeats the current paper and for timer-driven paper replacement.
- [ ] Run `npm.cmd run test:run -- src/components/DecisionMachine.test.tsx` and confirm it fails because the helper and rotation do not exist.
- [ ] Add six local ticket phrases, the non-repeating selection helper, a 4.2-second interval with cleanup, a serial number, and Framer Motion ticket/body transitions guarded by `useReducedMotion`.
- [ ] Run the focused test and confirm it passes without timer leaks or warnings.

### Task 3: Layout and interaction polish

**Files:**
- Modify: `src/index.css`

- [ ] Replace the root font stack with `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei UI", "PingFang SC", "Noto Sans CJK SC", sans-serif`.
- [ ] Change desktop Hero to `min-height: 400px`, `padding: 52px 52px 28px`, reduce the title maximum to `64px`, tighten copy spacing, and scale the decision machine without changing the mobile single-column rules.
- [ ] Make mode cards consistently tall, reserve space for the new aside line, unify transitions, add `focus-visible`, and keep selected/disabled states visually distinct without color alone.
- [ ] Add ticket enter/exit and body-shake styling hooks while preserving the existing global reduced-motion override.

### Task 4: Regression and visual verification

**Files:**
- Modify: `过程文件文件夹/验证记录/2026-08-12-v1-verification.md` outside the product repo after verification.

- [ ] Run `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run test:run`, and `npm.cmd run test:pages`; all must exit 0.
- [ ] Run the local production preview and inspect Desktop and 375px layouts. Verify no page-level horizontal overflow, all mode cards align, dynamic CTA text works, and the ticket changes after one interval.
- [ ] Record the checks and any honest limitations in the existing verification record.

### Task 5: Publish and verify GitHub Pages

**Files:**
- No additional source files expected.

- [ ] Commit only the approved polish, its tests, and documentation.
- [ ] Push `main` to `origin` and wait for the Pages workflow build and deploy jobs to complete successfully.
- [ ] Verify the live homepage, JavaScript, CSS, and brand SVG return HTTP 200 and confirm the new copy and ticket behavior in the live browser.
