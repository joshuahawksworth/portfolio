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
4. **Do not merge on your own initiative.** The repository owner (Joshua) reviews the PR and
   says when to merge. Only push to or merge into `main` when Joshua explicitly tells you to
   in the current session; a standing instruction or an earlier session does not count.
   Never force-push `main`.
5. Follow-up work after a PR is merged goes on a fresh branch and a fresh PR.

## Canary (mandatory in every reply)

Sessions drift: instructions fall out of context, the goal gets swapped for something adjacent,
and details get invented. This canary is a cheap, visible check that the agent is still reading
this file and still working on what was asked.

The **last line of every reply** to Joshua, without exception and however short the reply, is:

```
🐤 kestrel-7 · <branch> · <goal in at most ten words>
```

- `kestrel-7` is the fixed token. It appears nowhere else; producing it proves this file is in
  context. Never change it, and never omit it because a reply is "just a question".
- `<branch>` is the git branch the work is on right now, as reported by `git branch --show-current`,
  or `none` when no repository work is in progress.
- `<goal>` is the task Joshua actually asked for this turn, in the agent's own words, not the
  sub-step it is currently on. Restating it forces a re-read of the request before every reply.

If the line is missing, the token is wrong, or the goal has quietly become something Joshua did
not ask for, the session has drifted: Joshua will restate the task or start a fresh session. Do
not pad the line, decorate it or explain it; it is a check, not a summary.

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
