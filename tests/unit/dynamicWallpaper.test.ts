import { describe, expect, it } from 'vitest';
import { dynamicLookAt } from '../../src/lib/dynamicWallpaper';
import { defaultWallpaperFor, wallpaperFor } from '../../src/data/wallpapers';

describe('dynamicLookAt', () => {
  it('is untinted in the middle of the day', () => {
    const look = dynamicLookAt(12);
    expect(look.phase).toBe('day');
    expect(look.night).toBe(0);
    expect(look.overlayOpacity).toBe(0);
  });

  it('warms up at dusk and darkens into night', () => {
    const dusk = dynamicLookAt(18);
    expect(dusk.phase).toBe('dusk');
    expect(dusk.overlayOpacity).toBeGreaterThan(0);
    const night = dynamicLookAt(23);
    expect(night.phase).toBe('night');
    expect(night.night).toBe(1);
    expect(night.night).toBeGreaterThan(dusk.night);
  });

  it('fades night out across dawn', () => {
    expect(dynamicLookAt(5).night).toBeCloseTo(1);
    expect(dynamicLookAt(7.4).night).toBeLessThan(0.1);
  });
});

describe('default wallpapers', () => {
  it('uses the same fallback on macOS and iOS while The Beach is not on the server', () => {
    // Nothing has been probed in jsdom, so the optional Beach counts as missing.
    expect(defaultWallpaperFor('macos')).toBe('gold');
    expect(defaultWallpaperFor('ios')).toBe('gold');
    expect(wallpaperFor('ios', {})).toBe(wallpaperFor('macos', {}));
  });
});

describe('wallpaperChoiceFor', () => {
  it('shares an Apple wallpaper between the Mac and the iPhone', async () => {
    const { wallpaperChoiceFor } = await import('../../src/data/wallpapers');
    expect(wallpaperChoiceFor('macos', 'tahoe')).toEqual({ macos: 'tahoe', ios: 'tahoe' });
    expect(wallpaperChoiceFor('ios', 'catalina')).toEqual({ ios: 'catalina', macos: 'catalina' });
  });

  it('keeps a choice to one OS when the sibling has no such wallpaper', async () => {
    const { wallpaperChoiceFor } = await import('../../src/data/wallpapers');
    expect(wallpaperChoiceFor('windows', 'win11')).toEqual({ windows: 'win11' });
    expect(wallpaperChoiceFor('android', 'pixelDark')).toEqual({ android: 'pixelDark' });
  });
});
