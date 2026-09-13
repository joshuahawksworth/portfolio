import { describe, expect, it } from 'vitest';
import { collectVideos, slugify } from '../../scripts/demo-video/convert.mjs';
import {
  DEMO_MARKER,
  mergeDemoSection,
  stripDemoSection,
} from '../../scripts/demo-video/pr-body.mjs';

const manifest = [
  { title: 'Snake high-score table', project: 'desktop', status: 'passed', file: 'a.mp4' },
  { title: 'Snake high-score table', project: 'pixel', status: 'passed', file: 'b.mp4' },
];

describe('pr-body', () => {
  it('appends a demo section to a body without one', () => {
    const out = mergeDemoSection('## Summary\n\nFixes the thing.\n', manifest, {
      sha: 'abcdef1234567',
      runUrl: 'https://example.test/run/1',
    });
    expect(out.startsWith('## Summary\n\nFixes the thing.\n\n' + DEMO_MARKER)).toBe(true);
    expect(out).toContain('## Demo');
    expect(out).toContain('2 clips');
    expect(out).toContain('abcdef1');
    expect(out).toContain('[workflow run](https://example.test/run/1)');
    expect(out).toContain('1. **Snake high-score table** on desktop');
    expect(out).toContain('2. **Snake high-score table** on pixel');
  });

  it('replaces an earlier section and whatever gh appended after it', () => {
    const old =
      'Body\n\n' +
      DEMO_MARKER +
      '\n## Demo\n\nold list\n\nhttps://github.com/user-attachments/assets/old\n';
    const out = mergeDemoSection(old, manifest.slice(0, 1));
    expect(out).not.toContain('old list');
    expect(out).not.toContain('assets/old');
    expect(out.split(DEMO_MARKER)).toHaveLength(2);
    expect(out).toContain('One clip');
  });

  it('copes with an empty body', () => {
    expect(mergeDemoSection('', manifest).startsWith(DEMO_MARKER)).toBe(true);
    expect(stripDemoSection('')).toBe('');
  });
});

describe('convert', () => {
  it('slugifies titles for file names', () => {
    expect(slugify('macOS desktop: Finder & Keyboard Shortcuts')).toBe(
      'macos-desktop-finder-keyboard-shortcuts'
    );
  });

  it('collects video attachments from a Playwright JSON report', () => {
    const report = {
      suites: [
        {
          title: 'desktop-tour.demo.ts',
          suites: [
            {
              title: 'desktop tour',
              specs: [
                {
                  title: 'Finder',
                  tests: [
                    {
                      projectName: 'desktop',
                      results: [
                        {
                          status: 'passed',
                          attachments: [
                            { name: 'video', path: '/x/video.webm' },
                            { name: 'screenshot', path: '/x/s.png' },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(collectVideos(report)).toEqual([
      {
        title: 'desktop tour Finder',
        specTitle: 'Finder',
        project: 'desktop',
        status: 'passed',
        path: '/x/video.webm',
      },
    ]);
  });
});
