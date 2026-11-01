import { describe, expect, it } from 'vitest';
import { MAX_LEAD, soundStart } from '../../src/lib/soundQueue';

describe('soundStart', () => {
  it('queues each chunk where the last one ends', () => {
    expect(soundStart(10, 10.1, true)).toBe(10.1);
  });

  it('starts at once when the queue has run dry', () => {
    expect(soundStart(10, 9.5, true)).toBe(10);
  });

  it('drops chunks while the context is not running, so nothing piles up to play late', () => {
    expect(soundStart(0, 0, false)).toBeNull();
    expect(soundStart(0, 3.5, false)).toBeNull();
  });

  it('drops chunks once the queue runs too far ahead of the clock', () => {
    expect(soundStart(10, 10 + MAX_LEAD + 0.01, true)).toBeNull();
    expect(soundStart(10, 10 + MAX_LEAD / 2, true)).toBe(10 + MAX_LEAD / 2);
  });
});
