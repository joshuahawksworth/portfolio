---
name: cross-links
description: Find the readers of a shared shape before changing it, including coupling that grep cannot see. Use before changing a function signature or return type, component props, an HTTP path under api/, an env var, a stored key, or a filename other code depends on — and before deleting anything as unused.
---

# Cross-links

An agent verifies what is in its context window and infers the rest, confidently and sometimes
wrongly. A return shape it cannot see gets a guessed shape; a helper it cannot see gets assumed
cheap. Both compile. This skill is the check before changing anything shared.

## 1. Search for the readers

```bash
grep -rn "<name>" src/ api/ tests/ vite.config.ts
```

Widen it: a component is also found by its file name, an endpoint by its path string, a CSS
class by the `styles.x` that reads it. Deleting something requires proving it unreferenced —
an empty result is a result, an unrun search is not.

## 2. Check the channels grep cannot follow

Coupling with no code reference at either end returns nothing and still breaks. In this repo:

| Channel | Sides that must change together |
| --- | --- |
| HTTP path | `fetch('/api/x')` in `src/`, the handler `api/x.ts`, **and** the dev middleware in `vite.config.ts` |
| `html[data-os]` | `src/theme/platform.css` and any component overriding it in its own module |
| Wallpapers | `WALLPAPERS_FOR_OS` and the filenames in `public/wallpapers/`, git-ignored ones included |
| Env vars | `.env.example`, the `api/` handler reading it, and the Vercel project settings |
| Platform naming | `appTitleFor`, `appLabelFor`, `nodeDisplayName`, `appIconFor`, `shellInsets` — per platform, never hard-coded |

A live instance: `/api/ask` and `/api/contact` are called from `src/` and implemented in `api/`,
but neither is mirrored in `vite.config.ts`, so both 404 under `npm run dev`. Nothing in `src/`
names `vite.config.ts`; no search from the calling code finds it.

## 3. Check cost, not just correctness

If the changed code runs in a loop, open what it calls. A linear-looking loop calling an unseen
linear helper is quadratic, and that only shows up at scale.

Reasoning and further examples: `docs/working-with-ai.md`.
