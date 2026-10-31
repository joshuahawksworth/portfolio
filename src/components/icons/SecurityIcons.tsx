/**
 * Artwork for the malware joke: the Malwarebytes mark and app tile, the warning tile the pop-ups and their
 * notifications wear, and the sweet on the Candy Crush adverts. All on the 44×44 canvas
 * the other drawn icons use.
 */
import type { CSSProperties } from 'react';

const MARK = 'url(/icons/malwarebytes.png)';
const MALWAREBYTES_BLUE = '#2563c9';

/** The Malwarebytes "M" (Wikimedia Commons, CC BY-SA 4.0) as a mask, so it takes any colour. */
export function MalwarebytesMark({
  size,
  color = '#fff',
  style,
}: {
  size: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        background: color,
        WebkitMaskImage: MARK,
        maskImage: MARK,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

/** The app icon: the white mark on the brand-blue tile, at the platform's tile inset. */
export function MalwarebytesAppIcon() {
  return (
    <span
      style={{
        width: 'var(--app-icon-size, 50px)',
        height: 'var(--app-icon-size, 50px)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 'calc(var(--app-icon-size, 50px) * var(--app-tile-scale, 0.82))',
          height: 'calc(var(--app-icon-size, 50px) * var(--app-tile-scale, 0.82))',
          borderRadius: '22.5%',
          background: MALWAREBYTES_BLUE,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MalwarebytesMark size={0} style={{ width: '64%', height: '64%' }} />
      </span>
    </span>
  );
}

/** The amber warning triangle the pop-ups and their notifications carry. */
/** A red hazard triangle: the bait file on every platform, and the pop-ups' app icon. */
export function MalwareAlertIcon({ size = 44 }: { size?: number }) {
  return (
    <svg viewBox="0 0 44 44" width={size} height={size} fill="none" aria-hidden="true">
      <path
        d="M19.4 5.6a3 3 0 0 1 5.2 0l16 28.4A3 3 0 0 1 38 38.5H6a3 3 0 0 1-2.6-4.5z"
        fill="#e0342b"
        stroke="#a3140d"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <rect x="20.2" y="15" width="3.6" height="11.5" rx="1.8" fill="#fff" />
      <circle cx="22" cy="31.5" r="2.1" fill="#fff" />
    </svg>
  );
}

/** A wrapped sweet for the Candy Crush adverts. */
export function CandyIcon() {
  return (
    <svg viewBox="0 0 44 44" width="44" height="44" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="38" height="38" rx="9" fill="#ff6b9a" />
      <path d="M11 15l5 7-5 7 3 .5 5-4V18.5l-5-4z" fill="#fff3f7" />
      <path d="M33 15l-5 7 5 7-3 .5-5-4V18.5l5-4z" fill="#fff3f7" />
      <circle cx="22" cy="22" r="7.5" fill="#ff3d6e" stroke="#fff3f7" strokeWidth="1.6" />
      <path d="M18.5 19.5q3.5 2 7 5" stroke="#fff3f7" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
