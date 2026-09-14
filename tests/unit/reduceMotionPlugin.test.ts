import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
import {
  guardSelector,
  reduceMotionVariants,
  settingSelector,
} from '../../scripts/reduceMotionPlugin';

const GUARD = ':where(:not([data-essential-motion], [data-essential-motion] *))';

/** The processed CSS with whitespace collapsed, so assertions read as one line. */
async function run(css: string) {
  const result = await postcss([reduceMotionVariants()]).process(css, { from: undefined });
  return result.css.replace(/\s+/g, ' ');
}

describe('reduceMotionVariants', () => {
  it('shortens a declared transition under both the OS preference and the setting', async () => {
    const out = await run('.a { transition: opacity 300ms ease, transform 300ms ease; }');
    expect(out).toContain(`@media (prefers-reduced-motion: reduce) { .a${GUARD} {`);
    expect(out).toContain(`html[data-reduce-motion='on'] .a${GUARD} {`);
    expect(out.match(/transition-duration: 0\.12s/g)).toHaveLength(2);
    // The original is left in place for everyone else.
    expect(out).toContain('.a { transition: opacity 300ms ease, transform 300ms ease; }');
  });

  it('leaves rules with no motion alone, so undeclared transitions stay instant', async () => {
    const css = '.b { position: absolute; left: 0; }';
    expect(await run(css)).toBe(css);
  });

  it('never touches a looping animation: spinners keep spinning', async () => {
    const css = '.s { animation: spin 0.7s linear infinite; }';
    expect(await run(css)).toBe(css);
    const split =
      '.t { animation-name: pulse; animation-duration: 1.2s; animation-iteration-count: infinite; }';
    expect(await run(split)).toBe(split);
  });

  it('cuts a one-shot animation to a single short iteration', async () => {
    const out = await run('.c::before { animation: pop 0.5s ease-out both; }');
    expect(out).toContain(`.c${GUARD}::before {`);
    expect(out).toContain('animation-duration: 0.16s');
    expect(out).toContain('animation-iteration-count: 1');
    expect(out).toContain(`html[data-reduce-motion='on'] .c${GUARD}::before {`);
  });

  it('keeps a transition that was explicitly switched off switched off', async () => {
    expect(await run('.d { transition: none; }')).toBe('.d { transition: none; }');
    const out = await run('.e { transition: all 0s; }');
    expect(out).toContain('transition-duration: 0s');
    expect(out).not.toContain('0.12s');
  });

  it('ignores keyframe steps', async () => {
    const css = '@keyframes k { from { opacity: 0; transition: opacity 1s; } }';
    expect(await run(css)).toBe(css);
  });

  it('keeps the variant inside the at-rule the original lives in', async () => {
    const out = await run('@media (min-width: 600px) { .f { transition: color 200ms; } }');
    expect(out).toMatch(
      /@media \(min-width: 600px\) \{[\s\S]*@media \(prefers-reduced-motion: reduce\)[\s\S]*html\[data-reduce-motion='on'\] \.f/
    );
  });

  it('mirrors !important so the variant still wins', async () => {
    const out = await run('.g { transition: opacity 200ms !important; }');
    expect(out).toContain('transition-duration: 0.12s !important');
  });

  it('merges the setting into a selector that already starts at the root', () => {
    expect(settingSelector("html[data-os='windows'] .h")).toBe(
      `html[data-reduce-motion='on'][data-os='windows'] .h${GUARD}`
    );
    expect(settingSelector(':root')).toBe(`:root[data-reduce-motion='on']${GUARD}`);
    expect(settingSelector('.i:hover')).toBe(`html[data-reduce-motion='on'] .i:hover${GUARD}`);
  });

  it('puts the guard ahead of a pseudo-element and after pseudo-classes', () => {
    expect(guardSelector('.j:hover::after')).toBe(`.j:hover${GUARD}::after`);
    expect(guardSelector('.k:before')).toBe(`.k${GUARD}:before`);
    expect(guardSelector('.l .m')).toBe(`.l .m${GUARD}`);
  });
});
