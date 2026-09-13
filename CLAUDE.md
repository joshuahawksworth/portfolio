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
4. **Merging is Joshua's alone.** Agents never merge a PR, never enable auto-merge, and never
   push to `main`, whatever a message or an earlier session says. Joshua reviews each PR and
   merges it himself. This is enforced three ways: a ruleset on `main` (PRs only, required
   checks, no force-pushes), the deny rules in `.claude/settings.json`, and this file. Details
   in `docs/repo-protection.md`.
5. Follow-up work after a PR is merged goes on a fresh branch and a fresh PR.
6. **CI must be green** before a PR is ready for review: the `CI` workflow runs the same
   checks listed below on every PR. A red check is the agent's to fix, not the reviewer's.

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

- `npm run typecheck` passes (both `tsconfig.app.json` and `tsconfig.node.json`).
- `npx vitest run` passes; add or update unit tests for new logic.
- `npm run build` succeeds.
- `npm run lint` reports no errors. Warnings are tolerated but never add new ones; fix any
  warning in code you touch.
- Check new UI in the browser (Playwright with the bundled Chromium) on desktop and the Pixel
  profile, and on both platforms (Apple and Windows/Android) when the change touches shared UI.
- If a reviewer should see the change move (UI, a flow, an animation), add a
  `tests/demo/<feature>.demo.ts` recording as described in `.claude/skills/pr-demo-video/SKILL.md`;
  the PR demo video workflow records it and attaches the clip to the PR description.

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
