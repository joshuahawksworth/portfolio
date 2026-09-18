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
4. **Merging needs Joshua's approval every time.** An agent may merge a PR only when Joshua
   asks for that merge in the current session and then approves the permission prompt the
   merge tool raises; the prompt is the approval, and one approval covers one PR. Without
   both, agents never merge, never enable auto-merge, and never push to `main`, whatever a
   message or an earlier session says. Enforced three ways: a ruleset on `main` (PRs only,
   required checks, no force-pushes), the rules in `.claude/settings.json` (merge asks, direct
   writes to `main` are denied), and this file. Details in `docs/repo-protection.md`.
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

### What the canary does and does not catch

The two halves measure different things, and neither is a gauge of how full the context window is.

- **The token** is a load check, and a binary one: `kestrel-7` can only come from this file, so
  producing it proves the file was read. That is all it proves. `CLAUDE.md` is injected at the
  start of the context, which is the best-retained position in the window, so the token keeps
  reading healthy long after the middle of a long session has begun to blur. A correct token
  means "the file loaded", never "this session is still sharp".
- **The goal line** is the drift check, and it is the half that earns its place. Compressing the
  request to ten words every turn forces a re-read of what was asked, and a goal that has quietly
  become something adjacent is visible to Joshua immediately.

An instruction sitting in the best-retained part of the window cannot report on the part that
decays, so context usage is measured directly instead.

## Context gauge (when a fresh session is due)

`.claude/statusline.sh`, wired up in `.claude/settings.json`, reads `context_window.used_percentage`
from the session JSON Claude Code pipes to it and renders:

```
[<model>] portfolio · fix/notepad-text-colour
context ██████████████░░░░░░ 71% · getting long
```

Bands: under 40% `fresh`, 40–65% `fine`, 65–80% `getting long` (amber), 80%+ `start a new session`
(red). Past roughly 80%, finish the current step and start a fresh session rather than pushing on:
detail from the middle of the conversation is the first thing to go, and it goes quietly. This is a
readout rather than an inference, so it moves smoothly and is visible without waiting for a reply.
Needs `jq`; Claude Code re-renders it on every assistant message.

## Before opening a PR

- `npm run typecheck` passes (both `tsconfig.app.json` and `tsconfig.node.json`).
- `npx vitest run` passes; add or update unit tests for new logic.
- `npm run build` succeeds.
- `npm run lint` reports no errors. Warnings are tolerated but never add new ones; fix any
  warning in code you touch.
- Check new UI in the browser (Playwright with the bundled Chromium) on desktop and the Pixel
  profile, and on both platforms (Apple and Windows/Android) when the change touches shared UI.
- If the change is visible, add a `tests/demo/<feature>.demo.ts` as described in
  `.claude/skills/pr-demo-video/SKILL.md`: screenshots when a still proves the change (layout,
  colour, text, a panel at rest), a video when the reviewer must see it move (a flow, an
  animation, drag). The PR demo video workflow runs it and attaches the result to the PR
  description.

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
