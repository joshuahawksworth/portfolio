# Working in this repository

These rules apply to every session and every agent, human-directed or autonomous.

## Git workflow (mandatory)

1. **Never commit directly to `main`.** Every piece of work, however small, starts on a new
   branch cut from the latest `origin/main`. Name it for the change, e.g.
   `feature/terminal-shells`, `fix/notepad-text-colour`, `docs/search-setup`.
2. **Commit to that branch** as the work progresses, with clear messages that say what changed
   and why.
3. **Open a pull request** from the branch to `main` as soon as the work is ready for review.
   Describe what changed, how it was verified (tests, screenshots, Playwright), and anything
   the reviewer needs to configure (env vars, assets).
4. **Do not merge.** The repository owner (Joshua) reviews the PR and says when to merge.
   Never fast-forward, squash or merge into `main` yourself, and never force-push `main`.
5. Follow-up work after a PR is merged goes on a fresh branch and a fresh PR.

## Before opening a PR

- `npx tsc -p tsconfig.app.json --noEmit` and `npx tsc -p tsconfig.node.json --noEmit` pass.
- `npx vitest run` passes; add or update unit tests for new logic.
- `npm run build` succeeds.
- Lint the files you changed (`npx eslint <files>`); the repo carries some pre-existing lint
  debt, so a clean diff is the bar, not a clean tree.
- Check new UI in the browser (Playwright with the bundled Chromium) on desktop and the Pixel
  profile, and on both platforms (Apple and Windows/Android) when the change touches shared UI.

## Project conventions

- Read `DESIGN_SYSTEM.md` before adding UI. Names, icons, insets and wallpapers are per
  platform: use `appTitleFor`, `appLabelFor`, `nodeDisplayName`, `appIconFor`, `shellInsets`
  and `WALLPAPERS_FOR_OS` rather than hard-coding macOS strings.
- Platform-specific control styling lives in `src/theme/platform.css` and is keyed on
  `html[data-os]`; components that need a bare `<input>` (terminals, address bars) override it
  in their own module with a more specific selector.
- Serverless endpoints live in `api/` with shared helpers in `api/*-utils.ts`; mirror any new
  endpoint in the Vite dev middleware in `vite.config.ts`.
- Secrets and copyrighted assets are never committed: see `.env.example` and the git-ignored
  Windows wallpapers in `public/wallpapers/`.
