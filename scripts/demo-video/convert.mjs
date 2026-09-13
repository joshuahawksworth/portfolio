#!/usr/bin/env node
/**
 * Collect the videos Playwright recorded under demo-results/ (via playwright.demo.config.ts),
 * convert each to an H.264 mp4 when an ffmpeg with libx264 is available, and write them to
 * demo-videos/ with a manifest the PR step can read.
 *
 *   node scripts/demo-video/convert.mjs [--report demo-results/report.json] [--out demo-videos]
 *
 * Playwright names the recordings video.webm inside a per-test folder; this script names the
 * output after the test title and project instead, e.g. `snake-high-score-table-desktop.mp4`.
 * Without a suitable ffmpeg the webm is copied as-is: GitHub renders webm inline too.
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
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

/** Walk the Playwright JSON report and return every video attachment with its test context. */
export function collectVideos(report) {
  const found = [];
  const visit = (suite, titles) => {
    for (const spec of suite.specs ?? []) {
      for (const t of spec.tests ?? []) {
        for (const r of t.results ?? []) {
          for (const a of r.attachments ?? []) {
            if (a.name === 'video' && a.path) {
              found.push({
                title: [...titles, spec.title].join(' '),
                specTitle: spec.title,
                project: t.projectName,
                status: r.status,
                path: a.path,
              });
            }
          }
        }
      }
    }
    for (const child of suite.suites ?? []) visit(child, [...titles, child.title]);
  };
  for (const suite of report.suites ?? []) visit(suite, []);
  return found;
}

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
  const videos = collectVideos(report);
  if (videos.length === 0) {
    console.error('The report has no video attachments.');
    process.exit(1);
  }
  mkdirSync(outDir, { recursive: true });
  const ffmpeg = findFfmpeg();
  console.log(ffmpeg ? `Converting with ${ffmpeg}` : 'No H.264 ffmpeg found; keeping webm');

  const manifest = [];
  for (const v of videos) {
    const name = `${slugify(v.specTitle)}-${slugify(v.project)}`;
    const ext = ffmpeg ? 'mp4' : 'webm';
    const file = join(outDir, `${name}.${ext}`);
    if (ffmpeg) toMp4(ffmpeg, v.path, file);
    else copyFileSync(v.path, file);
    manifest.push({ title: v.specTitle, project: v.project, status: v.status, file: basename(file) });
    console.log(`${v.status.padEnd(7)} ${basename(file)}  <- ${v.title} [${v.project}]`);
  }
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  if (manifest.some((m) => m.status !== 'passed')) {
    console.error('Some demos did not pass; their clips are kept but the run is marked failed.');
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) main();
