---
name: pr-demo-video
description: Add a Playwright demo recording to a pull request so the reviewer sees the change move. Use when raising a PR for a bug fix or feature that changes anything visible (UI, animation, a flow), or when Joshua asks for a video on a PR.
---

# PR demo video

The video is produced by the **PR demo video** GitHub Actions workflow, not by this session:
the session writes a demo spec, the workflow records it on push and attaches the clips to the
PR description. Full details in `docs/pr-demo-video.md`.

## Steps

1. Write `tests/demo/<feature>.demo.ts`, modelled on `tests/demo/desktop-tour.demo.ts`:
   - one `test.describe` per project (`onlyOn('desktop')` / `onlyOn('pixel')`), or none to
     record on both;
   - `enterPortfolio(page, 'apple' | 'windows')` to boot and log in on a fixed platform; cover
     both platforms when the change touches shared UI;
   - drive the feature slowly: `beat(page)` after every visible change, `typeSlowly` for text,
     a longer `beat` on the final state;
   - assert the outcome with `expect` so a broken feature fails the recording instead of
     producing a misleading clip;
   - give the test a short title: it becomes the file name and the caption in the PR.
2. Run it here to make sure it passes and looks right:
   `npm run demo:record -- tests/demo/<feature>.demo.ts && npm run demo:convert`, then read
   `demo-videos/manifest.json` and look at a few frames (extract them with the ffmpeg under
   `$PLAYWRIGHT_BROWSERS_PATH/ffmpeg-*/ffmpeg-linux`). Keep the clip under about 30 seconds.
   In a cloud session prefix the record command with
   `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium` rather than downloading browsers.
3. Lint the spec (`npx eslint tests/demo/<feature>.demo.ts`), commit it with the change, push,
   and open the PR. Mention in the PR body that the demo section is added by the workflow.
4. After the workflow finishes, check the PR description ends with a `## Demo` section and the
   clips. If it shows a comment about `PR_DEMO_VIDEO_TOKEN` instead, the repository secret is
   missing: tell Joshua, do not try to upload another way.

## Do not

- Commit videos, GIFs or the `demo-results/` and `demo-videos/` folders.
- Pad the recording with unrelated tours; a demo shows the change and stops.
- Skip the assertion. A recording of a broken feature is worse than none.
