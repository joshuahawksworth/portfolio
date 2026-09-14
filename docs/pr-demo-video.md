# PR demo videos and screenshots

Every pull request with a visible change gets a short screen recording, or a set of
screenshots, in its description. Playwright produces them in GitHub Actions, videos are
converted to mp4, and everything is uploaded with `gh pr edit --attach`, so nothing is
committed to the repository.

## Video or screenshots

The spec decides. A spec that calls `screenshotsOnly()` at the top records no video and the PR
gets the stills it takes with `shot(page, caption)`; use that when the change is static (a
layout, colour or text change, a panel at rest). Leave the default when the reviewer must see
something move (a flow, an animation, drag and drop); a video spec may also take a `shot` of a
key frame. `desktop-at-rest.demo.ts` is the screenshot template and `desktop-tour.demo.ts` the
video one. The agent skill in `.claude/skills/pr-demo-video/SKILL.md` carries the same rule.

## How a PR gets a video or screenshots

1. Add a demo spec under `tests/demo/`, named `<feature>.demo.ts`. It is an ordinary Playwright
   test written for a viewer: use `enterPortfolio`, `beat`, `typeSlowly` and `shot` from
   `tests/demo/demo-helpers.ts`, pause after each visible change, and end on the state that
   proves the change.
2. Push it on the PR branch. The **PR demo video** workflow (`.github/workflows/pr-demo-video.yml`)
   runs on every push, records the demo specs the PR adds or changes, and rewrites the end of the
   PR description with a `## Demo` section followed by the clips and screenshots, in the order
   listed.
3. Re-record on demand by adding the `demo-video` label (records every demo) or from the Actions
   tab with _Run workflow_ and the PR number.

Each spec is recorded on two projects from `playwright.demo.config.ts`: `desktop` (1280×800
Chromium) and `pixel` (Pixel 7). Use `onlyOn('desktop')` or `onlyOn('pixel')` inside a
`describe` to record on one of them. Pass `'apple'` or `'windows'` to `enterPortfolio` to pin the
platform; the demo should cover both when the change touches shared UI.

## One-time setup: the upload token

GitHub's attachment upload rejects the workflow's own `GITHUB_TOKEN` (and GitHub App tokens), so
the attach step needs a personal token:

1. GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** →
   Generate new token.
2. Repository access: only this repository. Permissions: **Contents: Read and write**,
   **Pull requests: Read and write** (Metadata: Read is added automatically).
3. Repository → Settings → Secrets and variables → **Actions** (not Agents or Codespaces) →
   New repository secret, named `PR_DEMO_VIDEO_TOKEN`. The value is the token string alone, the
   one starting `github_pat_`, with no name, prefix or whitespace around it.

Without the secret, or with one GitHub rejects, the workflow still records and keeps the clips
as a workflow artifact for 30 days, and leaves one comment on the PR saying what is wrong and
pointing at the artifact. The upload also needs GitHub CLI 2.99
or newer, and the mp4 conversion an ffmpeg with libx264; the workflow installs either when the
runner image lacks it.

Attachment size limits depend on the account plan (roughly 10 MB on free, more on paid), so
keep clips short: a demo should be a few pauses and clicks, not a full tour.

## Running it locally

```sh
npm run demo:record                   # records every tests/demo/*.demo.ts into demo-results/
npm run demo:record -- tests/demo/x.demo.ts
npm run demo:convert                  # writes demo-videos/*.mp4 (or .webm), *.png and manifest.json
```

Locally the clips stay webm unless an ffmpeg with libx264 is on `PATH` (the one Playwright
bundles only encodes VP8). Both `demo-results/` and `demo-videos/` are git-ignored.

In an environment with a preinstalled Chromium of a different build (Claude Code on the web
provides one at `/opt/pw-browsers/chromium`), set `PLAYWRIGHT_CHROMIUM_PATH` to it instead of
downloading browsers:

```sh
PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium npm run demo:record
```
