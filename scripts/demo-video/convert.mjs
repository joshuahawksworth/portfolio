#!/usr/bin/env node
/**
 * Collect the videos and `shot:` screenshots Playwright produced under demo-results/ (via
 * playwright.demo.config.ts), convert each video to an H.264 mp4 when an ffmpeg with libx264
 * is available, and write everything to demo-videos/ with a manifest the PR step can read.
 *
 *   node scripts/demo-video/convert.mjs [--report demo-results/report.json] [--out demo-videos]
 *
 * Playwright names the recordings video.webm inside a per-test folder; this script names the
 * output after the test title and project instead, e.g. `snake-high-score-table-desktop.mp4`.
 * Without a suitable ffmpeg the webm is copied as-is: GitHub renders webm inline too.
 */
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { basename, join, resolve } from 'node:path';

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : process.argv[i + 1];
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * Walk the Playwright JSON report and return every video and every `shot:` screenshot
 * attachment with its test context, in the order the tests ran.
 */
export function collectMedia(report) {
  const found = [];
  const visit = (suite, titles) => {
    for (const spec of suite.specs ?? []) {
      for (const t of spec.tests ?? []) {
        for (const r of t.results ?? []) {
          for (const a of r.attachments ?? []) {
            if (!a.path && !a.body) continue;
            const base = {
              title: [...titles, spec.title].join(' '),
              specTitle: spec.title,
              project: t.projectName,
              status: r.status,
              path: a.path,
              body: a.body,
            };
            if (a.name === 'video') found.push({ ...base, kind: 'video', caption: spec.title });
            else if (a.name.startsWith('shot:'))
              found.push({ ...base, kind: 'image', caption: a.name.slice('shot:'.length) });
          }
        }
      }
    }
    for (const child of suite.suites ?? []) visit(child, [...titles, child.title]);
  };
  for (const suite of report.suites ?? []) visit(suite, []);
  return found;
}

/** Kept for callers of the old name. */
export const collectVideos = (report) => collectMedia(report).filter((m) => m.kind === 'video');

function findFfmpeg() {
  const candidates = [process.env.FFMPEG, 'ffmpeg'];
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || join(homedir(), '.cache', 'ms-playwright');
  if (existsSync(root)) {
    for (const dir of readdirSync(root)) {
      if (dir.startsWith('ffmpeg')) candidates.push(join(root, dir, 'ffmpeg-linux'));
    }
  }
  for (const bin of candidates.filter(Boolean)) {
    const probe = spawnSync(bin, ['-hide_banner', '-encoders'], { encoding: 'utf8' });
    if (probe.status === 0 && /libx264/.test(probe.stdout)) return bin;
  }
  return null;
}

function toMp4(ffmpeg, input, output) {
  const result = spawnSync(
    ffmpeg,
    [
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      input,
      '-an',
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '23',
      '-pix_fmt',
      'yuv420p',
      // H.264 needs even dimensions; device viewports (e.g. Pixel 7 at 412x915) are not.
      '-vf',
      'scale=trunc(iw/2)*2:trunc(ih/2)*2',
      '-movflags',
      '+faststart',
      output,
    ],
    { stdio: 'inherit' }
  );
  if (result.status !== 0) throw new Error(`ffmpeg failed for ${input}`);
}

function main() {
  const reportPath = resolve(arg('--report', 'demo-results/report.json'));
  const outDir = resolve(arg('--out', 'demo-videos'));
  if (!existsSync(reportPath)) {
    console.error(`No Playwright report at ${reportPath}; run the demo config first.`);
    process.exit(1);
  }
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  const media = collectMedia(report);
  if (media.length === 0) {
    console.error('The report has no video or shot: attachments.');
    process.exit(1);
  }
  mkdirSync(outDir, { recursive: true });
  const needsFfmpeg = media.some((m) => m.kind === 'video');
  const ffmpeg = needsFfmpeg ? findFfmpeg() : null;
  if (needsFfmpeg) {
    console.log(ffmpeg ? `Converting with ${ffmpeg}` : 'No H.264 ffmpeg found; keeping webm');
  }

  const manifest = [];
  const used = new Set();
  for (const m of media) {
    let name = `${slugify(m.caption)}-${slugify(m.project)}`;
    // Two shots with the same caption in one test would otherwise overwrite each other.
    for (let i = 2; used.has(name); i++) name = `${slugify(m.caption)}-${i}-${slugify(m.project)}`;
    used.add(name);
    let file;
    if (m.kind === 'video') {
      file = join(outDir, `${name}.${ffmpeg ? 'mp4' : 'webm'}`);
      if (ffmpeg) toMp4(ffmpeg, m.path, file);
      else copyFileSync(m.path, file);
    } else {
      file = join(outDir, `${name}.png`);
      if (m.path) copyFileSync(m.path, file);
      else writeFileSync(file, Buffer.from(m.body, 'base64'));
    }
    manifest.push({
      kind: m.kind,
      title: m.caption,
      project: m.project,
      status: m.status,
      file: basename(file),
    });
    console.log(`${m.status.padEnd(7)} ${basename(file)}  <- ${m.title} [${m.project}]`);
  }
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  if (manifest.some((m) => m.status !== 'passed')) {
    console.error('Some demos did not pass; their clips are kept but the run is marked failed.');
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) main();
