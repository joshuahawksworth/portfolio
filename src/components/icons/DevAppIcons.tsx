/**
 * Icons for the developer apps: Visual Studio Code, GitHub Desktop, Xcode, Android Studio,
 * Postman and Outlook. These are brands with one look everywhere, so the same artwork is
 * used on macOS and Windows (Android keeps its own Material discs where it has one).
 * Drawn on the shared 44×44 canvas.
 */
import { useId } from 'react';

function Tile({
  top,
  bottom,
  children,
  radius = 10,
}: {
  top: string;
  bottom: string;
  children?: React.ReactNode;
  radius?: number;
}) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 44 44" width="44" height="44" fill="none">
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect width="44" height="44" rx={radius} fill={`url(#${uid}g)`} />
      <rect width="44" height="22" rx={radius} fill="rgba(255,255,255,0.12)" />
      <rect
        x="0.5"
        y="0.5"
        width="43"
        height="43"
        rx={radius - 0.5}
        stroke="rgba(255,255,255,0.22)"
      />
      {children}
    </svg>
  );
}

/** The VS Code ribbon, from the official mark, on its own dark tile. */
export function VSCodeIcon() {
  return (
    <Tile top="#2b2f36" bottom="#1b1e24">
      <g transform="translate(8 8) scale(0.28)">
        <path
          fill="#0065a9"
          d="M96.46 10.8 75.86.88a6.23 6.23 0 0 0-7.1 1.21L1.32 63.6a4.17 4.17 0 0 0 0 6.16l5.5 5a4.17 4.17 0 0 0 5.33.24l81.2-61.6a4.13 4.13 0 0 1 6.65 3.3v-.24a6.26 6.26 0 0 0-3.54-5.66Z"
        />
        <path
          fill="#007acc"
          d="m96.46 89.2-20.6 9.92a6.23 6.23 0 0 1-7.1-1.21L1.32 36.4a4.17 4.17 0 0 1 0-6.16l5.5-5a4.17 4.17 0 0 1 5.33-.24l81.2 61.6a4.13 4.13 0 0 0 6.65-3.3v.24a6.26 6.26 0 0 1-3.54 5.66Z"
        />
        <path
          fill="#1f9cf0"
          d="M75.86 99.13a6.23 6.23 0 0 1-7.1-1.21 3.66 3.66 0 0 0 6.24-2.58V4.66a3.66 3.66 0 0 0-6.24-2.58 6.23 6.23 0 0 1 7.1-1.21l20.6 9.9A6.26 6.26 0 0 1 100 16.4v67.2a6.26 6.26 0 0 1-3.54 5.64Z"
        />
      </g>
    </Tile>
  );
}

/** GitHub Desktop: the invertocat on its purple tile. */
export function GitHubDesktopIcon() {
  return (
    <Tile top="#8b5cf6" bottom="#5b2fc7">
      <g transform="translate(9 9) scale(1.083)">
        <path
          d="M12 .297c-6.63 0-12 5.373-12 12c0 5.303 3.438 9.8 8.205 11.385c.6.113.82-.258.82-.577c0-.285-.01-1.04-.015-2.04c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729c1.205.084 1.838 1.236 1.838 1.236c1.07 1.835 2.809 1.305 3.495.998c.108-.776.417-1.305.76-1.605c-2.665-.3-5.466-1.332-5.466-5.93c0-1.31.465-2.38 1.235-3.22c-.135-.303-.54-1.523.105-3.176c0 0 1.005-.322 3.3 1.23c.96-.267 1.98-.399 3-.405c1.02.006 2.04.138 3 .405c2.28-1.552 3.285-1.23 3.285-1.23c.645 1.653.24 2.873.12 3.176c.765.84 1.23 1.91 1.23 3.22c0 4.61-2.805 5.625-5.475 5.92c.42.36.81 1.096.81 2.22c0 1.606-.015 2.896-.015 3.286c0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
          fill="#fff"
        />
      </g>
    </Tile>
  );
}

/** Xcode: the hammer over a blueprint on Apple's blue. */
export function XcodeIcon() {
  return (
    <Tile top="#5fb4ff" bottom="#0a63d6">
      <rect x="9" y="9" width="26" height="26" rx="5" fill="rgba(255,255,255,0.93)" />
      <path
        d="M13 15h18M13 20h12M13 25h15M13 30h9"
        stroke="#bcd7f5"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <g transform="rotate(-40 22 22)">
        <rect x="20.6" y="14" width="2.8" height="19" rx="1.2" fill="#1a4f9c" />
        <rect x="15" y="10.5" width="14" height="6" rx="2" fill="#2f7ae5" />
        <rect x="15" y="10.5" width="7" height="6" rx="2" fill="#1a5ec4" />
      </g>
    </Tile>
  );
}

/** Android Studio: the compass "A" on the studio green. */
export function AndroidStudioIcon() {
  return (
    <Tile top="#3ddc84" bottom="#0d9c5a">
      <path d="M22 9 33 35H29.2L26.5 28.4h-9L14.8 35H11Z" fill="rgba(255,255,255,0.95)" />
      <path d="M18.8 25h6.4L22 17.2Z" fill="#0d9c5a" />
      <circle cx="22" cy="12" r="3" fill="#fff" />
      <circle cx="22" cy="12" r="1.4" fill="#1b6f43" />
      <path d="M27 11.5 31.5 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </Tile>
  );
}

/** Postman: the astronaut helmet on Postman orange. */
export function PostmanIcon() {
  return (
    <Tile top="#ff8b5e" bottom="#ec5a1f">
      <circle cx="22" cy="22" r="13" fill="rgba(255,255,255,0.95)" />
      <circle cx="22" cy="22" r="8.5" fill="#ff6c37" />
      <path
        d="M17 19.5q5-5 10-1.5"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M29.5 12.5 33 9" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    </Tile>
  );
}

/** Spotify: the three curves on Spotify green. */
export function SpotifyIcon() {
  return (
    <Tile top="#1ed760" bottom="#15a34a" radius={22}>
      <circle cx="22" cy="22" r="17" fill="#1ed760" />
      <path
        d="M13 17.5c6-2 13-1.6 18.5 1.3"
        stroke="#000"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14 22.5c5-1.6 10.5-1.3 15.2 1.2"
        stroke="#000"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M15.2 27.2c4-1.2 8.2-1 12 1"
        stroke="#000"
        strokeWidth="1.9"
        strokeLinecap="round"
        fill="none"
      />
    </Tile>
  );
}

/** Mac App Store: the "A" of pencils and a brush on App Store blue. */
export function AppStoreIcon() {
  return (
    <Tile top="#2fb1ff" bottom="#0a63d6">
      <path d="M15 31 24.5 14.5" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M29 31 19.5 14.5" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M11 26.5h22" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M12.5 31.5 14 29" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
    </Tile>
  );
}

/** Microsoft Store: the shopping bag with the four-pane logo. */
export function MicrosoftStoreIcon() {
  return (
    <Tile top="#ffffff" bottom="#f0f0f0">
      <path d="M16 15v-2.5a6 6 0 0 1 12 0V15" stroke="#1f1f1f" strokeWidth="2" fill="none" />
      <rect x="9" y="15" width="26" height="20" rx="3" fill="#0f6cbd" />
      <rect x="15.5" y="20" width="5.5" height="5" fill="#f25022" />
      <rect x="23" y="20" width="5.5" height="5" fill="#7fba00" />
      <rect x="15.5" y="27" width="5.5" height="5" fill="#00a4ef" />
      <rect x="23" y="27" width="5.5" height="5" fill="#ffb900" />
    </Tile>
  );
}
