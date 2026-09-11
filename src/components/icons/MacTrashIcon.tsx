/**
 * The macOS Trash. Renders Apple's artwork from public/icons/trash.png (and
 * trash-full.png when the bin has something in it) as soon as those files exist, and
 * falls back to the drawn mesh bin until then, so the desktop never shows a broken image.
 */
import { useState, type CSSProperties } from 'react';
import { TrashBinIcon } from './FileSystemIcons';

const missingArtwork = new Set<string>();

function candidates(full: boolean): string[] {
  return (full ? ['/icons/trash-full.png', '/icons/trash.png'] : ['/icons/trash.png']).filter(
    (src) => !missingArtwork.has(src)
  );
}

export function MacTrashIcon({
  size = 50,
  full = false,
  glow = false,
  style,
}: {
  size?: number;
  full?: boolean;
  glow?: boolean;
  style?: CSSProperties;
}) {
  const [, bump] = useState(0);
  const src = candidates(full)[0];
  if (!src) return <TrashBinIcon size={size} full={full} glow={glow} style={style} />;
  const glowStyle: CSSProperties | undefined = glow
    ? { filter: 'drop-shadow(0 0 8px var(--accent)) drop-shadow(0 0 16px var(--accent-soft))' }
    : undefined;
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      onError={() => {
        missingArtwork.add(src);
        bump((n) => n + 1);
      }}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        display: 'block',
        flexShrink: 0,
        ...glowStyle,
        ...style,
      }}
    />
  );
}
