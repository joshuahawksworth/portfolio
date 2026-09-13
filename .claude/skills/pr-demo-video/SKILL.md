---
name: pr-demo-video
description: Add a Playwright demo (a video clip, or screenshots when the change is static) to a pull request so the reviewer sees the change. Use when raising a PR for a bug fix or feature that changes anything visible (UI, animation, a flow), or when Joshua asks for a video or screenshot on a PR.
---

# PR demo video or screenshots

The media is produced by the **PR demo video** GitHub Actions workflow, not by this session:
the session writes a demo spec, the workflow runs it on push and attaches the clips and
screenshots to the PR description. Full details in `docs/pr-demo-video.md`.

## Video or screenshot?

Decide per PR, and say which you chose in the PR body:

- **Screenshots** when the change is static and a still proves it: a layout or spacing fix,
  a colour or icon change, new text, a panel or window at rest, a responsive tweak. Call
  `screenshotsOnly()` at the top of the spec and take one `shot(page, caption)` per state
  worth seeing (before-and-after states, both platforms). Cheaper for the reviewer to scan.
- **Video** when the reviewer must see something move: a multi-step flow, an animation or
  transition, drag and drop, hover states, anything with timing. Keep the default (video on).
  A video spec may still call `shot` for a key frame.
- **Neither** for changes with nothing visible: backend, config, docs, tests, refactors.

When unsure, prefer screenshots for a fix and video for a feature.

## Steps

1. Write `tests/demo/<feature>.demo.ts`, modelled on `tests/demo/desktop-tour.demo.ts`
   (video) or `tests/demo/desktop-at-rest.demo.ts` (screenshots):
   - one `test.describe` per project (`onlyOn('desktop')` / `onlyOn('pixel')`), or none to
     record on both;
   - `enterPortfolio(page, 'apple' | 'windows')` to boot and log in on a fixed platform; cover
     both platforms when the change touches shared UI;
   - drive the feature slowly: `beat(page)` after every visible change, `typeSlowly` for text,
     a longer `beat` on the final state;
   - assert the outcome with `expect` so a broken feature fails the recording instead of
     producing a misleading clip;
   - give the test a short title: it becomes the file name and the caption of the clip in
     the PR; a `shot` caption plays the same role for a screenshot.
2. Run it here to make sure it passes and looks right:
   `npm run demo:record -- tests/demo/<feature>.demo.ts && npm run demo:convert`, then read
   `demo-videos/manifest.json`, open the screenshots, and look at a few frames of a clip
   (extract them with the ffmpeg under `$PLAYWRIGHT_BROWSERS_PATH/ffmpeg-*/ffmpeg-linux`).
   Keep a clip under about 30 seconds and a screenshot set to a handful of stills.
   In a cloud session prefix the record command with
   `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium` rather than downloading browsers.
3. Lint the spec (`npx eslint tests/demo/<feature>.demo.ts`), commit it with the change, push,
   and open the PR. Mention in the PR body that the demo section is added by the workflow.
4. After the workflow finishes, check the PR description ends with a `## Demo` section and the
   clips or screenshots. If it shows a comment about `PR_DEMO_VIDEO_TOKEN` instead, the repository secret is
   missing: tell Joshua, do not try to upload another way.

## Do not

- Commit videos, GIFs or the `demo-results/` and `demo-videos/` folders.
- Pad the recording with unrelated tours; a demo shows the change and stops.
- Skip the assertion. A recording of a broken feature is worse than none.
