# DECISION LAB Engineering Rules

## Product source of truth

- Read `docs/product-spec.md` before changing product behavior or visual direction.
- V1 is a static React application with random, scientific, mystic, and versioned LocalStorage history. AI, accounts, databases, and backends are not part of V1.
- Preserve the product personality: a serious interface with lightly absurd copy. Do not make it childish, cyberpunk, neon-heavy, or a generic enterprise dashboard.

## Technical rules

- Use React, Vite, TypeScript strict mode, Tailwind CSS, Framer Motion, Lucide React, Vitest, and Testing Library.
- Do not introduce explicit `any` or expose secrets in client code.
- Keep algorithms as testable pure functions separated from page components.
- Do not add dependencies without a concrete need.
- Preserve `HashRouter` unless the deployment target is also updated to support SPA rewrites.
- Local history remains versioned under `decision-lab:history`; storage failures must not break decisions.

## Design rules

- Follow `brand-spec.md` and `docs/decision-lab-v1-reference.png`.
- Reuse declared CSS custom properties. Avoid rogue hues, aggressive gradients, emoji as formal icons, and excessive decoration.
- Support 375px without page-level horizontal overflow and keep interactive targets at least 44px.
- Respect `prefers-reduced-motion`, preserve keyboard focus states, and keep text contrast at WCAG AA.

## Verification

Before reporting completion, run and fix:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:run
npm.cmd run build
```

For page changes, also inspect desktop and 375px layouts in a real browser and confirm the console has no errors or warnings.
