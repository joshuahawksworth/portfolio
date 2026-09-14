import { describe, expect, it } from 'vitest';
import {
  BOOT_FADE_AT_MS,
  BOOT_MS,
  bootProgress,
  loadingCurve,
  logoFill,
  spinnerDot,
} from '../../src/lib/bootProgress';
import { listPublicAssets } from '../../scripts/publicAssets';

describe('loadingCurve', () => {
  it('runs from empty to full and never goes backwards', () => {
    expect(loadingCurve(0)).toBe(0);
    expect(loadingCurve(1)).toBe(1);
    let last = 0;
    for (let t = 0; t <= 1; t += 0.01) {
      const v = loadingCurve(t);
      expect(v).toBeGreaterThanOrEqual(last);
      last = v;
    }
  });

  it('rushes off the mark and crawls to the end, like a real boot', () => {
    expect(loadingCurve(0.4)).toBeCloseTo(0.55);
    expect(loadingCurve(0.9)).toBeCloseTo(0.92);
    expect(loadingCurve(0.95)).toBeLessThan(1);
    expect(loadingCurve(2)).toBe(1);
    expect(loadingCurve(-1)).toBe(0);
  });
});

describe('boot progress from the clock', () => {
  it('holds the bar and the logo empty until their cue, then fills them before the boot ends', () => {
    expect(bootProgress(0)).toBe(0);
    expect(bootProgress(1000)).toBe(0);
    expect(bootProgress(2500)).toBeGreaterThan(0);
    expect(bootProgress(2500)).toBeLessThan(1);
    expect(bootProgress(BOOT_MS)).toBe(1);
    expect(logoFill(0)).toBe(0);
    expect(logoFill(2000)).toBeGreaterThan(0);
    expect(logoFill(BOOT_FADE_AT_MS)).toBe(1);
  });

  it('fades the screen out only once the bar is full', () => {
    expect(bootProgress(BOOT_FADE_AT_MS)).toBeGreaterThan(0.98);
    expect(BOOT_FADE_AT_MS).toBeLessThan(BOOT_MS);
  });
});

describe('spinnerDot', () => {
  it('keeps each dot hidden until its staggered start', () => {
    expect(spinnerDot(0, 0).opacity).toBe(0);
    expect(spinnerDot(700, 0).opacity).toBe(0);
    expect(spinnerDot(900, 0).opacity).toBe(1);
    // The last dot starts 600 ms after the first.
    expect(spinnerDot(900, 5).opacity).toBe(0);
    expect(spinnerDot(1500, 5).opacity).toBe(1);
  });

  it('sweeps a full turn per cycle and rests out of sight between cycles', () => {
    expect(spinnerDot(700, 0).angle).toBe(0);
    const mid = spinnerDot(700 + 1100, 0).angle;
    expect(mid).toBeGreaterThan(90);
    expect(mid).toBeLessThan(270);
    expect(spinnerDot(700 + 2100, 0).angle).toBe(360);
    expect(spinnerDot(700 + 2100, 0).opacity).toBe(0);
    // The next cycle starts from the top again.
    expect(spinnerDot(700 + 2200, 0).angle).toBe(0);
  });
});

describe('listPublicAssets', () => {
  it('lists the shipped wallpapers and icons as public URL paths', () => {
    const assets = listPublicAssets();
    expect(assets).toContain('/wallpapers/the-beach.jpg');
    expect(assets).toContain('/wallpapers/the-beach-night.jpg');
    expect(assets).toContain('/icons/trash.png');
    expect(assets.every((p) => p.startsWith('/wallpapers/') || p.startsWith('/icons/'))).toBe(true);
  });

  it('is empty for a folder that does not exist', () => {
    expect(listPublicAssets('/definitely/not/here')).toEqual([]);
  });
});
