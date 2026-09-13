#!/usr/bin/env node
/**
 * Rewrite a PR description so it ends with a "Demo" section for the clips in
 * demo-videos/manifest.json. `gh pr edit --attach` appends each uploaded video after the body,
 * so the section is always the last thing in the description and lists the clips in the order
 * they are attached. Re-running replaces the previous section (and the URLs gh appended after
 * it) instead of stacking another one.
 *
 *   node scripts/demo-video/pr-body.mjs --body body.md --manifest demo-videos/manifest.json \
 *        --run-url https://github.com/... > new-body.md
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const DEMO_MARKER = '<!-- pr-demo-video -->';

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : process.argv[i + 1];
}

/** Strip a previous demo section: the marker and everything after it. */
export function stripDemoSection(body) {
  const i = body.indexOf(DEMO_MARKER);
  return (i === -1 ? body : body.slice(0, i)).replace(/\s+$/, '');
}

export function renderDemoSection(manifest, { runUrl, sha } = {}) {
  const lines = [DEMO_MARKER, '## Demo', ''];
  const meta = [];
  if (sha) meta.push(`recorded at ${sha.slice(0, 7)}`);
  if (runUrl) meta.push(`[workflow run](${runUrl})`);
  lines.push(
    manifest.length === 1
      ? `One clip, recorded by Playwright${meta.length ? ` (${meta.join(', ')})` : ''}:`
      : `${manifest.length} clips, recorded by Playwright${meta.length ? ` (${meta.join(', ')})` : ''}, in this order:`
  );
  lines.push('');
  manifest.forEach((m, i) => {
    lines.push(`${i + 1}. **${m.title}** on ${m.project}`);
  });
  lines.push('');
  return lines.join('\n');
}

export function mergeDemoSection(body, manifest, opts) {
  const head = stripDemoSection(body ?? '');
  const section = renderDemoSection(manifest, opts);
  return head ? `${head}\n\n${section}` : section;
}

function main() {
  const body = readFileSync(resolve(arg('--body', 'body.md')), 'utf8');
  const manifest = JSON.parse(readFileSync(resolve(arg('--manifest', 'demo-videos/manifest.json')), 'utf8'));
  process.stdout.write(
    mergeDemoSection(body, manifest, { runUrl: arg('--run-url'), sha: arg('--sha') })
  );
}

if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) main();
