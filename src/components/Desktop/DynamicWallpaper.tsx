/**
 * The layers that make a dynamic wallpaper move through the day: the night image
 * (when the optional file exists) cross-faded over the day image, and a dawn / dusk /
 * night tint. Sits directly above the wallpaper it belongs to.
 */
import { useEffect, useState } from 'react';
import { DYNAMIC_NIGHT_IMAGES, DYNAMIC_WALLPAPERS, type WallpaperKey } from '../../data/wallpapers';
import { dynamicLookFor, type DynamicLook } from '../../lib/dynamicWallpaper';
import { useTime } from '../../hooks/useTime';

const nightAvailable = new Map<string, boolean>();

export function useDynamicLook(key: WallpaperKey): DynamicLook | null {
  const now = useTime();
  if (!DYNAMIC_WALLPAPERS.has(key)) return null;
  return dynamicLookFor(now);
}

/** Dark enough that shell text should flip to white (night on a dynamic wallpaper). */
export function isDynamicDark(look: DynamicLook | null): boolean {
  return !!look && look.night > 0.6;
}

export default function DynamicWallpaper({
  wallpaper,
  className,
}: {
  wallpaper: WallpaperKey;
  className?: string;
}) {
  const look = useDynamicLook(wallpaper);
  const nightSrc = DYNAMIC_NIGHT_IMAGES[wallpaper];
  const [hasNight, setHasNight] = useState(() =>
    nightSrc ? nightAvailable.get(nightSrc) === true : false
  );

  useEffect(() => {
    if (!nightSrc || nightAvailable.has(nightSrc)) return;
    const img = new Image();
    img.onload = () => {
      nightAvailable.set(nightSrc, true);
      setHasNight(true);
    };
    img.onerror = () => nightAvailable.set(nightSrc, false);
    img.src = nightSrc;
  }, [nightSrc]);

  if (!look) return null;
  const base: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    transition: 'opacity 60s linear',
  };
  return (
    <>
      {hasNight && nightSrc && (
        <div
          className={className}
          style={{
            ...base,
            backgroundImage: `url(${nightSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: look.night,
          }}
          aria-hidden="true"
        />
      )}
      <div
        className={className}
        style={{
          ...base,
          background: look.overlay,
          opacity: look.overlayOpacity,
          mixBlendMode: 'multiply',
        }}
        aria-hidden="true"
      />
    </>
  );
}
