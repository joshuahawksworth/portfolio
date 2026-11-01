/**
 * The frames that make a dynamic wallpaper move through the day. Two are up at any moment,
 * the one just past underneath and the one coming next blended in over it by the time-of-day
 * look, as a macOS dynamic desktop does. Sits directly above the wallpaper it belongs to and
 * takes that wallpaper's layer class for positioning.
 */
import { DYNAMIC_WALLPAPERS, dynamicFrameSrc, type WallpaperKey } from '../../data/wallpapers';
import { dynamicLookFor, type DynamicLook } from '../../lib/dynamicWallpaper';
import { useTime } from '../../hooks/useTime';

export function useDynamicLook(key: WallpaperKey): DynamicLook | null {
  const now = useTime();
  if (!DYNAMIC_WALLPAPERS.has(key)) return null;
  return dynamicLookFor(now);
}

/** Dark enough that shell text should flip to white (a night or dusk frame on top). */
export function isDynamicDark(look: DynamicLook | null): boolean {
  return !!look?.dark;
}

export default function DynamicWallpaper({
  wallpaper,
  className,
}: {
  wallpaper: WallpaperKey;
  className?: string;
}) {
  const look = useDynamicLook(wallpaper);
  if (!look) return null;
  const from = dynamicFrameSrc(wallpaper, look.from);
  const to = dynamicFrameSrc(wallpaper, look.to);
  if (!from || !to) return null;
  const layer = (src: string) => ({
    backgroundImage: `url(${src})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  });
  return (
    <>
      <div className={className} data-frame={look.from} style={layer(from)} aria-hidden="true" />
      {/* Keyed on the frame so a new one mounts at its starting opacity instead of fading
          from the old one's; the blend itself drifts over a minute per tick. */}
      <div
        key={look.to}
        className={className}
        data-frame={look.to}
        style={{ ...layer(to), opacity: look.mix, transition: 'opacity 60s linear' }}
        aria-hidden="true"
      />
    </>
  );
}
