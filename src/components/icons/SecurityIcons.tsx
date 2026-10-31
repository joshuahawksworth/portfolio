/**
 * Artwork for the malware joke: the Malwarebytes tile that stands in until the official
 * render is dropped into public/icons, the warning tile the pop-ups and their
 * notifications wear, and the sweet on the Candy Crush adverts. All on the 44×44 canvas
 * the other drawn icons use.
 */
import type { CSSProperties } from 'react';

/** The shield glyph alone, for the phone's squircle and anywhere the tile is not wanted. */
export function ShieldGlyph({ size = 28, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 28 28" width={size} height={size} fill="none" aria-hidden="true">
      <path d="M14 2.5l9 3.4v7.3c0 5.4-3.6 9.9-9 12.3-5.4-2.4-9-6.9-9-12.3V5.9z" fill={color} />
      <path
        d="M9.4 14.2l3 3 6.2-6.4"
        stroke="#1159ff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Fallback Malwarebytes tile: brand blue with a white shield, not a copy of the logo.
 *  Full-bleed on the 44px canvas like the other drawn macOS icons; the Fluent set has its own. */
export function MalwarebytesTile({ style }: { style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 44 44" width="44" height="44" fill="none" aria-hidden="true" style={style}>
      <rect width="44" height="44" rx="10" fill="#1159ff" />
      <path
        d="M22 8l11.5 4.4v9.3c0 6.9-4.6 12.6-11.5 15.6-6.9-3-11.5-8.7-11.5-15.6v-9.3z"
        fill="#fff"
      />
      <path
        d="M16 22.6l3.9 3.9 8.1-8.4"
        stroke="#1159ff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The amber warning triangle the pop-ups and their notifications carry. */
export function MalwareAlertIcon() {
  return (
    <svg viewBox="0 0 44 44" width="44" height="44" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="38" height="38" rx="9" fill="#2b2b33" />
      <path
        d="M22 9.5L36 33.5H8z"
        fill="#ffb02e"
        stroke="#e08a00"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <rect x="20.4" y="17" width="3.2" height="9" rx="1.6" fill="#2b2b33" />
      <circle cx="22" cy="29.5" r="1.9" fill="#2b2b33" />
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
