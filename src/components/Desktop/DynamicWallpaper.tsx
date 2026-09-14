/**
 * The frames that make a dynamic wallpaper move through the day: the dawn, dusk and night
 * pictures stacked over the day image and cross-faded by the time-of-day look. Sits directly
 * above the wallpaper it belongs to and takes that wallpaper's layer class for positioning.
 */
import { DYNAMIC_WALLPAPERS, dynamicFrameSrc, type WallpaperKey } from '../../data/wallpapers';
import { DYNAMIC_FRAMES, dynamicLookFor, type DynamicLook } from '../../lib/dynamicWallpaper';
import { useTime } from '../../hooks/useTime';

export function useDynamicLook(key: WallpaperKey): DynamicLook | null {
  const now = useTime();
  if (!DYNAMIC_WALLPAPERS.has(key)) return null;
  return dynamicLookFor(now);
}

/** Dark enough that shell text should flip to white (dawn, dusk or night on a dynamic wallpaper). */
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
  return (
    <>
      {DYNAMIC_FRAMES.map((frame) => {
        const src = dynamicFrameSrc(wallpaper, frame);
        if (!src) return null;
        return (
          <div
            key={frame}
            className={className}
            data-frame={frame}
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: look[frame],
              // Frames drift in over a minute, as a real dynamic desktop does.
              transition: 'opacity 60s linear',
            }}
            aria-hidden="true"
          />
        );
      })}
    </>
  );
}
