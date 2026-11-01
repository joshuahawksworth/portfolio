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
  resetDefaultWallpaperPicks,
  wallpaperFor,
  wallpaperImageFor,
  type WallpaperKey,
} from '../../src/data/wallpapers';

const SUN = { sunrise: 6.5, sunset: 19 };

describe('dynamicLookAt', () => {
  it('blends the two frames either side of the moment', () => {
    // Solar noon (12:45 on these sun times) is frame 4 exactly; a quarter of the way towards
    // the 3 pm frame, the blend is a quarter in
    const noon = (SUN.sunrise + SUN.sunset) / 2;
    const quarter = ((SUN.sunset - SUN.sunrise) / 12) * 3 * 0.25;
    const look = dynamicLookAt(noon + quarter, SUN);
    expect(look).toMatchObject({ from: 4, to: 5, frame: 4, phase: 'day', dark: false });
    expect(look.mix).toBeCloseTo(0.25, 5);
  });

  it('anchors sunrise to the dawn frame and sunset to the dusk frame', () => {
    expect(dynamicLookAt(SUN.sunrise, SUN)).toMatchObject({ from: 2, phase: 'dawn' });
    expect(dynamicLookAt(SUN.sunrise, SUN).mix).toBeCloseTo(0, 5);
    expect(dynamicLookAt(SUN.sunset, SUN)).toMatchObject({ from: 6, phase: 'dusk', dark: true });
    expect(dynamicLookAt(SUN.sunset, SUN).mix).toBeCloseTo(0, 5);
  });

  it('stretches daylight across the day frames and night across the rest', () => {
    // Halfway through daylight is solar noon, frame 4; halfway through the night is midnight, frame 0
    const midday = (SUN.sunrise + SUN.sunset) / 2;
    expect(dynamicLookAt(midday, SUN).from).toBe(4);
    expect(dynamicLookAt(midday, SUN).mix).toBeCloseTo(0, 5);
    const midnight = (SUN.sunset + SUN.sunrise + 24) / 2 - 24;
    expect(dynamicLookAt(midnight, SUN)).toMatchObject({ from: 0, phase: 'night', dark: true });
  });

  it('moves round the ring without a gap or a jump across the whole day', () => {
    let previous = dynamicLookAt(0, SUN);
    for (let h = 0.05; h < 24; h += 0.05) {
      const look = dynamicLookAt(h, SUN);
      expect(look.mix).toBeGreaterThanOrEqual(0);
      expect(look.mix).toBeLessThan(1);
      expect(look.to).toBe((look.from + 1) % 8);
      // Either the same pair, a little further along, or the next pair just begun
      if (look.from === previous.from) expect(look.mix).toBeGreaterThanOrEqual(previous.mix);
      else expect(look.from).toBe(previous.to);
      previous = look;
    }
  });

  it('follows the sun times it is given', () => {
    const winter = { sunrise: 8.25, sunset: 15.75 };
    expect(dynamicLookAt(17, winter).dark).toBe(true);
    expect(dynamicLookAt(17, DEFAULT_SUN)).toMatchObject({ phase: 'day', dark: false });
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
  it("ships Apple's eight frames of The Beach", () => {
    expect(isWallpaperAvailable('beach')).toBe(true);
    for (let i = 0; i < 8; i++) {
      expect(dynamicFrameSrc('beach', i)).toBe(`/wallpapers/the-beach-${i}.jpg`);
    }
    expect(dynamicFrameSrc('beach', 8)).toBeNull();
    expect(dynamicFrameSrc('gold', 0)).toBeNull();
  });

  it('picks the dominant frame for a single still', () => {
    expect(wallpaperImageFor('beach', dynamicLookAt(12, SUN))).toBe('/wallpapers/the-beach-4.jpg');
    expect(wallpaperImageFor('beach', dynamicLookAt(SUN.sunset, SUN))).toBe(
      '/wallpapers/the-beach-6.jpg'
    );
    expect(wallpaperImageFor('beach', dynamicLookAt(SUN.sunrise, SUN))).toBe(
      '/wallpapers/the-beach-2.jpg'
    );
    expect(wallpaperImageFor('gold', null)).toBe('/wallpapers/golden-gate.jpg');
  });
});

describe('default wallpapers', () => {
  it('is a random pick of the set on the desktops, held for the visit', () => {
    resetDefaultWallpaperPicks();
    expect(defaultWallpaperFor('macos', isWallpaperAvailable, () => 0.99)).toBe('wave');
    // Later readers get the same pick, whatever their dice
    expect(defaultWallpaperFor('macos', isWallpaperAvailable, () => 0)).toBe('wave');
    expect(wallpaperFor('macos', {})).toBe('wave');
    resetDefaultWallpaperPicks();
    expect(defaultWallpaperFor('windows', isWallpaperAvailable, () => 0)).toBe('win11');
    resetDefaultWallpaperPicks();
  });

  it('keeps The Beach as the iPhone default', () => {
    expect(defaultWallpaperFor('ios')).toBe('beach');
    expect(wallpaperFor('ios', {})).toBe('beach');
  });

  it('only picks from what is in the build when The Beach is not', () => {
    resetDefaultWallpaperPicks();
    const withoutBeach = (key: WallpaperKey) => key !== 'beach';
    expect(defaultWallpaperFor('macos', withoutBeach, () => 0)).toBe('gold');
    expect(defaultWallpaperFor('ios', withoutBeach)).toBe('gold');
    expect(wallpaperFor('macos', { macos: 'beach' }, withoutBeach)).toBe('gold');
    resetDefaultWallpaperPicks();
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
