# Repository protection and CI

`main` only changes through pull requests that Joshua has reviewed. He merges them himself,
or approves an agent's merge one PR at a time. Three layers make that hold for humans and
agents alike.

## 1. Ruleset on `main` (GitHub, one-time setup)

Repository → Settings → Rules → Rulesets → **New ruleset** → **New branch ruleset**:

- Name: `main`. Enforcement status: **Active**.
- Bypass list: **leave empty**. Agent sessions act with the owner's identity, so a bypass for
  "Repository admin" would let them through too. Merging via the PR button still works for the
  owner because the rules below allow pull request merges.
- Target branches: **Add target → Include default branch**.
- Rules to tick:
  - **Restrict deletions**.
  - **Block force pushes**.
  - **Require a pull request before merging**. Required approvals: `0` (the owner cannot
    approve their own PR, and agent PRs are authored as the owner). Tick **Dismiss stale pull
    request approvals when new commits are pushed** and **Require conversation resolution
    before merging**.
  - **Require status checks to pass**. Tick **Require branches to be up to date before
    merging**, then add these checks (names come from `.github/workflows/ci.yml`; they appear
    in the picker once the workflow has run at least once):
    - `Typecheck, lint, unit tests, build`
    - `Playwright smoke (Chromium)`
- Save. From then on a direct push to `main` is refused for everyone, and the merge button is
  disabled until both checks are green.

Optional but worth turning on under Settings → Code security: **Dependabot alerts**,
**Dependabot security updates** and **CodeQL default setup**. Version updates are already
configured in `.github/dependabot.yml`.

## 2. Agent-side permission rules (`.claude/settings.json`)

Checked into the repo, so every Claude Code session on this project loads them:

- The GitHub tool that merges a PR is an **ask** rule: calling it raises a permission prompt
  in Joshua's session, and nothing happens until he approves it. That is the one-time merge
  permission; an agent uses it only when Joshua asked for the merge in that session.
- Enabling auto-merge is denied, because it would merge later without a prompt.
- The GitHub tools that write files straight to a branch through the API are denied; agents
  commit with git on a feature branch instead.
- `git push` forms that target `main` or force-push are denied.

Deny rules stop an agent even before the ruleset would, and neither kind can be lifted by a
prompt: the file is loaded when a session starts, so a change to it only takes effect in
sessions started after it is merged.

## 3. The written rule (`CLAUDE.md`)

The workflow section states that merging is Joshua's alone and that CI must be green before
review. Agents read it every session; the canary line at the end of every reply shows it is
still in context.

## What CI checks

`.github/workflows/ci.yml` runs on every PR and every push to `main`:

| Job                                | What it runs                                                           |
| ---------------------------------- | ---------------------------------------------------------------------- |
| Typecheck, lint, unit tests, build | `npm run typecheck`, `npm run lint`, `npx vitest run`, `npm run build` |
| Playwright smoke (Chromium)        | `tests/e2e` on the desktop Chromium and Pixel 7 profiles               |

Lint fails on errors only; the 31 existing warnings (React fast-refresh and hook dependency
notices) are reported but do not block. Paying that debt down is a separate change.

The PR demo video workflow (`docs/pr-demo-video.md`) is deliberately not a required check: it
only records when a PR carries a demo spec, and a missing token must not block a merge.

## Running the same checks locally

```sh
npm run typecheck && npm run lint && npx vitest run && npm run build
PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test --project=chromium-desktop --project=mobile-chrome
```

The `PLAYWRIGHT_CHROMIUM_PATH` prefix is only for environments with a preinstalled Chromium of
a different build, such as Claude Code on the web.
