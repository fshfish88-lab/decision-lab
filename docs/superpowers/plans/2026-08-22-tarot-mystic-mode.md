# Tarot Mystic Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the precomputed mystic result with an interactive seven-card Major Arcana draw whose selected card determines the result.

**Architecture:** A pure tarot data and engine layer creates an immutable spread before user interaction. A dedicated `/tarot` page owns reveal state and delegates visuals to focused components; the existing result and history layers receive a backward-compatible tarot detail payload.

**Tech Stack:** React 19, TypeScript strict mode, React Router, Framer Motion, Vitest, Testing Library, existing CSS design tokens.

---

### Task 1: Tarot domain model and spread engine

**Files:**
- Create: `src/tarot/tarotCards.ts`
- Create: `src/tarot/tarotEngine.ts`
- Test: `src/tarot/tarotEngine.test.ts`
- Modify: `src/types/decision.ts`

- [ ] Write failing tests that require 22 unique cards, seven unique spread cards, deterministic injected randomness, fixed card-to-option mapping, and at least two mapped winners.
- [ ] Run `npm.cmd run test:run -- src/tarot/tarotEngine.test.ts` and confirm failure because the tarot modules do not exist.
- [ ] Add the Major Arcana data, tarot result types, seeded spread builder, and selected-card result builder.
- [ ] Re-run the focused test and confirm all tarot engine assertions pass.

### Task 2: Dedicated tarot route and reveal interaction

**Files:**
- Create: `src/pages/TarotPage.tsx`
- Create: `src/pages/TarotPage.test.tsx`
- Create: `src/components/tarot/TarotCard.tsx`
- Create: `src/components/tarot/TarotDeck.tsx`
- Create: `src/components/tarot/TarotReveal.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/pages/ResultPage.tsx`
- Modify: `src/App.test.tsx`

- [ ] Write failing route and flow tests that require `/tarot`, seven selectable card backs, no result before selection, reveal after selection, and stored history.
- [ ] Run `npm.cmd run test:run -- src/pages/TarotPage.test.tsx src/App.test.tsx` and confirm the new expectations fail.
- [ ] Implement the route, components, click-time result creation, history save, and rerun navigation.
- [ ] Re-run the focused tests and confirm the interactive flow passes.

### Task 3: Tarot-specific result presentation and responsive styling

**Files:**
- Modify: `src/components/results/MysticResult.tsx`
- Modify: `src/components/results/results.test.tsx`
- Modify: `src/index.css`
- Modify: `src/pages/AboutPage.tsx`

- [ ] Write a failing result test requiring card name, orientation, keywords, strength dots, and the absence of legacy pseudo-science headings for tarot records.
- [ ] Run `npm.cmd run test:run -- src/components/results/results.test.tsx` and confirm the tarot presentation expectation fails.
- [ ] Implement the tarot result branch, legacy fallback, restrained card visuals, desktop fan layout, mobile horizontal layout, focus states, and reduced-motion behavior.
- [ ] Re-run the focused test and confirm both new tarot records and legacy history render safely.

### Task 4: Product-source synchronization and complete verification

**Files:**
- Modify: `docs/product-spec.md`
- Modify: `../../DECISION_LAB_完整产品设计与开发方案.md`

- [ ] Replace the old template-and-random-indicator mystic specification with the approved 22-card interactive tarot flow in both mirrored product documents.
- [ ] Run `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run test:run`, and `npm.cmd run build`; fix every failure without touching the user's existing `vite.config.ts` change.
- [ ] Start `npm.cmd run dev -- --host 127.0.0.1`, verify the flow in a real desktop browser and at 375px, check horizontal overflow and console messages, then leave the local URL open for user review.
