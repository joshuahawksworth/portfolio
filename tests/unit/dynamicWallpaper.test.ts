import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SUN,
  dynamicLookAt,
  dynamicLookFor,
  sunTimesFor,
} from '../../src/lib/dynamicWallpaper';
import {
  defaultWallpaperFor,
  dynamicFrameSrc,
  isWallpaperAvailable,
  wallpaperFor,
  wallpaperImageFor,
  type WallpaperKey,
} from '../../src/data/wallpapers';

const SUN = { sunrise: 6.5, sunset: 19 };

describe('dynamicLookAt', () => {
  it('shows only the day picture in the middle of the day', () => {
    const look = dynamicLookAt(12, SUN);
    expect(look.phase).toBe('day');
    expect(look).toMatchObject({ dawn: 0, dusk: 0, night: 0, dark: false });
  });

  it('brings the dusk frame in before sunset and the night frame after it', () => {
    const early = dynamicLookAt(18, SUN);
    expect(early.dusk).toBeGreaterThan(0);
    expect(early.dusk).toBeLessThan(1);
    expect(early.night).toBe(0);
    const sunset = dynamicLookAt(19, SUN);
    expect(sunset.phase).toBe('dusk');
    expect(sunset.dusk).toBe(1);
    expect(sunset.dark).toBe(true);
    const late = dynamicLookAt(19.6, SUN);
    expect(late.night).toBeGreaterThan(0);
    expect(late.night).toBeLessThan(1);
    const night = dynamicLookAt(23, SUN);
    expect(night).toMatchObject({ phase: 'night', night: 1, dark: true });
  });

  it('only drops the dusk frame once the night frame fully covers it', () => {
    // Night is opaque from 20:12; dusk stays up well past that so the swap is never seen.
    expect(dynamicLookAt(20.5, SUN).dusk).toBe(1);
    expect(dynamicLookAt(21.5, SUN).dusk).toBe(0);
    expect(dynamicLookAt(21.5, SUN).night).toBe(1);
  });

  it('lifts night into dawn and dawn into day around sunrise', () => {
    expect(dynamicLookAt(4, SUN)).toMatchObject({ phase: 'night', night: 1, dawn: 0 });
    // Dawn is raised while night still hides it, then night thins to reveal it.
    expect(dynamicLookAt(5.2, SUN)).toMatchObject({ night: 1, dawn: 1 });
    const breaking = dynamicLookAt(6, SUN);
    expect(breaking.night).toBeCloseTo(0.5);
    expect(breaking.dawn).toBe(1);
    expect(dynamicLookAt(6.5, SUN)).toMatchObject({ phase: 'dawn', night: 0, dawn: 1 });
    const morning = dynamicLookAt(7, SUN);
    expect(morning.dawn).toBeCloseTo(0.5);
    expect(dynamicLookAt(8, SUN)).toMatchObject({ phase: 'day', dawn: 0 });
  });

  it('never sets a frame outside 0–1 across the whole day', () => {
    for (let h = 0; h < 24; h += 0.05) {
      const look = dynamicLookAt(h, SUN);
      for (const v of [look.dawn, look.dusk, look.night]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it('follows the sun times it is given', () => {
    const winter = { sunrise: 8.25, sunset: 15.75 };
    expect(dynamicLookAt(17, winter).phase).toBe('night');
    expect(dynamicLookAt(17, DEFAULT_SUN).phase).toBe('day');
  });
});

describe('sunTimesFor', () => {
  it('gives long days in June and short ones in December at the home latitude', () => {
    const june = sunTimesFor(new Date(2026, 5, 21));
    const december = sunTimesFor(new Date(2026, 11, 21));
    expect(june.sunset - june.sunrise).toBeGreaterThan(16);
    expect(december.sunset - december.sunrise).toBeLessThan(8);
    expect(june.sunrise).toBeLessThan(december.sunrise);
    expect(june.sunset).toBeGreaterThan(december.sunset);
  });

  it('is symmetric around noon when the clock is on standard time', () => {
    const { sunrise, sunset } = sunTimesFor(new Date(2026, 2, 20));
    // The test environment's zone may or may not observe summer time; either way the
    // day is centred on its local noon.
    const noon = (sunrise + sunset) / 2;
    expect(noon === 12 || noon === 13).toBe(true);
  });

  it('copes with polar latitudes without producing NaN', () => {
    const arctic = sunTimesFor(new Date(2026, 5, 21), 89);
    expect(Number.isNaN(arctic.sunrise)).toBe(false);
    expect(Number.isNaN(arctic.sunset)).toBe(false);
  });

  it('drives dynamicLookFor from the real date', () => {
    const look = dynamicLookFor(new Date(2026, 5, 21, 13, 0));
    expect(look.phase).toBe('day');
  });
});

describe('dynamic wallpaper frames', () => {
  it('ships dawn, dusk and night pictures for The Beach', () => {
    expect(isWallpaperAvailable('beach')).toBe(true);
    expect(dynamicFrameSrc('beach', 'dawn')).toBe('/wallpapers/the-beach-dawn.jpg');
    expect(dynamicFrameSrc('beach', 'dusk')).toBe('/wallpapers/the-beach-dusk.jpg');
    expect(dynamicFrameSrc('beach', 'night')).toBe('/wallpapers/the-beach-night.jpg');
    expect(dynamicFrameSrc('gold', 'night')).toBeNull();
  });

  it('picks the dominant frame for a single still', () => {
    expect(wallpaperImageFor('beach', dynamicLookAt(12, SUN))).toBe('/wallpapers/the-beach.jpg');
    expect(wallpaperImageFor('beach', dynamicLookAt(19, SUN))).toBe(
      '/wallpapers/the-beach-dusk.jpg'
    );
    expect(wallpaperImageFor('beach', dynamicLookAt(23, SUN))).toBe(
      '/wallpapers/the-beach-night.jpg'
    );
    expect(wallpaperImageFor('beach', dynamicLookAt(6.5, SUN))).toBe(
      '/wallpapers/the-beach-dawn.jpg'
    );
    expect(wallpaperImageFor('gold', null)).toBe('/wallpapers/golden-gate.jpg');
  });
});

describe('default wallpapers', () => {
  it('is The Beach on macOS and iOS now that it ships with the build', () => {
    expect(defaultWallpaperFor('macos')).toBe('beach');
    expect(defaultWallpaperFor('ios')).toBe('beach');
    expect(wallpaperFor('macos', {})).toBe('beach');
    expect(wallpaperFor('ios', {})).toBe(wallpaperFor('macos', {}));
  });

  it('falls back to Golden Gate on both when The Beach is not in the build', () => {
    const withoutBeach = (key: WallpaperKey) => key !== 'beach';
    expect(defaultWallpaperFor('macos', withoutBeach)).toBe('gold');
    expect(defaultWallpaperFor('ios', withoutBeach)).toBe('gold');
    expect(wallpaperFor('macos', { macos: 'beach' }, withoutBeach)).toBe('gold');
  });

  it('hides the git-ignored Windows extras that are not in the build', () => {
    expect(isWallpaperAvailable('win7')).toBe(false);
    expect(isWallpaperAvailable('winxp')).toBe(false);
    expect(wallpaperFor('windows', { windows: 'winxp' })).toBe('win11');
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

describe('wallpaperFor with a choice made on the other device', () => {
  it('shows the Mac choice on the iPhone when the phone has none of its own', () => {
    expect(wallpaperFor('ios', { macos: 'tahoe' })).toBe('tahoe');
    expect(wallpaperFor('macos', { ios: 'catalina' })).toBe('catalina');
  });

  it('still prefers the OS default when the sibling choice is not in this set', () => {
    expect(wallpaperFor('android', { windows: 'win11' })).toBe(defaultWallpaperFor('android'));
  });
});
