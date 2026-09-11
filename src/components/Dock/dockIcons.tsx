import { useId, useState, type ReactNode } from 'react';
import { AboutLogoIcon } from '../icons/AboutLogoIcon';
import { CalculatorLogoIcon } from '../icons/CalculatorLogoIcon';
import { TrashBinIcon } from '../icons/FileSystemIcons';
import { SnakeLcdIcon } from '../icons/SnakeLcdIcon';
import {
  AndroidStudioIcon,
  AppStoreIcon,
  GitHubDesktopIcon,
  PostmanIcon,
  SpotifyIcon,
  VSCodeIcon,
  XcodeIcon,
} from '../icons/DevAppIcons';
import { OutlookIcon, WordIcon } from '../icons/WindowsIcons';

export function MacIcon({
  top,
  bottom,
  children,
}: {
  top: string;
  bottom: string;
  children: React.ReactNode;
}) {
  const uid = useId().replace(/:/g, '');
  const g = `${uid}g`;
  const gl = `${uid}gl`;
  return (
    <svg viewBox="0 0 44 44" fill="none" width="44" height="44">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
        <linearGradient id={gl} x1="0" y1="0" x2="0" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0.32)" />
          <stop offset="1" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <rect width="44" height="44" rx="10" fill={`url(#${g})`} />
      <rect width="44" height="22" rx="10" fill={`url(#${gl})`} />
      <rect
        x="0.5"
        y="0.5"
        width="43"
        height="43"
        rx="9.5"
        fill="none"
        stroke="rgba(255,255,255,0.28)"
      />
      {children}
    </svg>
  );
}

const DRAWN_ICONS = {
  finder: (
    <MacIcon top="#5ecfff" bottom="#1a7aff">
      <ellipse cx="22" cy="21" rx="11" ry="10" fill="white" opacity="0.95" />
      <circle cx="17" cy="19" r="2.2" fill="#1a7aff" />
      <circle cx="27" cy="19" r="2.2" fill="#1a7aff" />
      <circle cx="17.8" cy="18.3" r="0.8" fill="white" />
      <circle cx="27.8" cy="18.3" r="0.8" fill="white" />
      <path
        d="M16 24 Q22 29 28 24"
        stroke="#1a7aff"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </MacIcon>
  ),
  github: <BrandIcon src="/icons/github-desktop.png" fallback={<GitHubDesktopIcon />} />,
  about: <AboutLogoIcon size={44} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.35)' }} />,
  experience: (
    <MacIcon top="#ffa030" bottom="#c25c00">
      <rect x="8" y="17" width="28" height="18" rx="3" fill="rgba(255,255,255,0.92)" />
      <path
        d="M16 17v-3a2 2 0 012-2h8a2 2 0 012 2v3"
        stroke="rgba(255,255,255,0.92)"
        strokeWidth="2"
        fill="none"
      />
      <rect x="18.5" y="23" width="7" height="4" rx="1.5" fill="#c25c00" />
      <path d="M8 24h28" stroke="rgba(255,120,0,0.4)" strokeWidth="1.2" />
    </MacIcon>
  ),
  skills: (
    <MacIcon top="#c46bff" bottom="#6b2fd6">
      <path
        d="M16 16L9 22L16 28"
        stroke="rgba(255,255,255,0.9)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M28 16L35 22L28 28"
        stroke="rgba(255,255,255,0.9)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M25 14L19 30"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </MacIcon>
  ),
  contact: (
    <MacIcon top="#3a9fff" bottom="#0060df">
      <rect x="7" y="12" width="30" height="21" rx="3.5" fill="rgba(255,255,255,0.92)" />
      <path
        d="M7 15L22 24L37 15"
        stroke="#0060df"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </MacIcon>
  ),
  location: (
    <MacIcon top="#34d870" bottom="#1a8f3f">
      <path
        d="M22 8 Q31 11 31 18 Q31 27 22 36 Q13 27 13 18 Q13 11 22 8Z"
        fill="rgba(255,255,255,0.92)"
      />
      <circle cx="22" cy="18" r="4" fill="#1a8f3f" />
      <circle cx="22" cy="18" r="1.8" fill="white" />
    </MacIcon>
  ),
  terminal: (
    <MacIcon top="#3a3a3c" bottom="#1c1c1e">
      <path
        d="M10 22L17 16L10 22L17 28"
        stroke="#30d158"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M20 28H34" stroke="#30d158" strokeWidth="2.2" strokeLinecap="round" />
    </MacIcon>
  ),
  cv: (
    <MacIcon top="#ff5257" bottom="#c0292e">
      <rect x="10" y="6" width="24" height="32" rx="3" fill="rgba(255,255,255,0.92)" />
      <path d="M27 6L34 13" stroke="#c0292e" strokeWidth="1.2" />
      <path d="M27 6L27 13L34 13" fill="rgba(192,41,46,0.2)" stroke="none" />
      <path
        d="M14 18H30M14 22H30M14 26H23"
        stroke="#c0292e"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </MacIcon>
  ),
  safari: (
    // Google Chrome icon — junctions at 2 o'clock (330°), 6 o'clock (90°), 10 o'clock (210°)
    // so red is centred at 12 o'clock (top), yellow at 4 o'clock, green at 8 o'clock
    <svg viewBox="0 0 44 44" fill="none" width="44" height="44">
      <rect width="44" height="44" rx="11" fill="white" />
      {/* Red — 210° → 330° clockwise, centred at top (270°) */}
      <path d="M22 22 L5.55 12.5 A19 19 0 0 1 38.45 12.5 Z" fill="#EA4335" />
      {/* Yellow — 330° → 90° clockwise, centred at lower-right */}
      <path d="M22 22 L38.45 12.5 A19 19 0 0 1 22 41 Z" fill="#FBBC05" />
      {/* Green — 90° → 210° clockwise, centred at lower-left */}
      <path d="M22 22 L22 41 A19 19 0 0 1 5.55 12.5 Z" fill="#34A853" />
      {/* White inner ring covers the pie centres */}
      <circle cx="22" cy="22" r="13" fill="white" />
      {/* White dividers: from inner edge (r=13) to outer edge (r=19) at each junction */}
      <line x1="10.74" y1="15.5" x2="5.55" y2="12.5" stroke="white" strokeWidth="2" />
      <line x1="33.26" y1="15.5" x2="38.45" y2="12.5" stroke="white" strokeWidth="2" />
      <line x1="22" y1="35" x2="22" y2="41" stroke="white" strokeWidth="2" />
      {/* Blue centre */}
      <circle cx="22" cy="22" r="10.5" fill="#4285F4" />
      {/* White separator ring */}
      <circle cx="22" cy="22" r="13" fill="none" stroke="white" strokeWidth="1.5" />
    </svg>
  ),
  // The real macOS bin (no tile), same artwork as the desktop and Finder
  trashEmpty: <TrashBinIcon size={44} />,
  trashFull: <TrashBinIcon size={44} full />,
  // The DOOM render has its own dark margin, so it sits a little larger than the
  // squircle-scaled apps to read the same size.
  doom: <RealIcon src="/doom-icon.png" rounded scale={0.92} />,
  snake: <SnakeLcdIcon />,
  imageviewer: (
    // Preview-inspired icon — teal/blue gradient with landscape
    <svg viewBox="0 0 44 44" fill="none" width="44" height="44">
      <defs>
        <linearGradient id="ivbg" x1="0" y1="0" x2="0" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5ac8fa" />
          <stop offset="1" stopColor="#007aff" />
        </linearGradient>
        <linearGradient id="ivgl" x1="0" y1="0" x2="0" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0.32)" />
          <stop offset="1" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <rect width="44" height="44" rx="11" fill="url(#ivbg)" />
      <rect width="44" height="22" rx="11" fill="url(#ivgl)" />
      {/* Sky */}
      <rect x="5" y="10" width="34" height="24" rx="3" fill="rgba(0,40,100,0.35)" />
      {/* Sun */}
      <circle cx="32" cy="17" r="4" fill="#ffd60a" opacity="0.9" />
      {/* Mountains */}
      <path d="M5 34 L14 20 L22 30 L30 18 L39 34Z" fill="rgba(255,255,255,0.18)" />
      <path
        d="M5 34 L14 20 L22 30 L30 18 L39 34"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Ground */}
      <rect x="5" y="32" width="34" height="2" rx="1" fill="rgba(255,255,255,0.25)" />
    </svg>
  ),
  calculator: (
    <MacIcon top="#ff9f0a" bottom="#c93400">
      <g transform="translate(3, 3)">
        <CalculatorLogoIcon size={38} />
      </g>
    </MacIcon>
  ),
  askjosh: (
    // Claude-style sparkle on a warm gradient
    <MacIcon top="#ffd39a" bottom="#e0862c">
      <g fill="white" opacity="0.95">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <path
            key={angle}
            d="M22 8.5 L24.2 19.8 L22 22 L19.8 19.8 Z"
            transform={`rotate(${angle} 22 22)`}
          />
        ))}
        <circle cx="22" cy="22" r="2.6" />
      </g>
    </MacIcon>
  ),
  rubberduck: (
    <MacIcon top="#ffd83d" bottom="#f2a300">
      <ellipse cx="23" cy="27" rx="11" ry="7.5" fill="#fff3a6" />
      <circle cx="17" cy="18" r="6.5" fill="#fff3a6" />
      <circle cx="15.5" cy="17" r="1.3" fill="#2a2320" />
      <path d="M10 19.5 Q6.5 20.5 8.5 22.5 Q11 23 12.5 21.5 Z" fill="#ff7a1a" />
    </MacIcon>
  ),
  texteditor: <BrandIcon src="/icons/vscode.png" fallback={<VSCodeIcon />} />,
  outlook: <BrandIcon src="/icons/outlook.png" fallback={<OutlookIcon />} />,
  postman: <BrandIcon src="/icons/postman.png" fallback={<PostmanIcon />} />,
  // Apple's Xcode render carries its own margin (and the hammer overhangs the tile), so it
  // is not squircle-clipped like the full-bleed brand icons.
  xcode: <BrandIcon src="/icons/xcode.png" fallback={<XcodeIcon />} rounded={false} />,
  androidstudio: <BrandIcon src="/icons/android-studio.png" fallback={<AndroidStudioIcon />} />,
  spotify: <BrandIcon src="/icons/spotify.png" fallback={<SpotifyIcon />} />,
  word: <BrandIcon src="/icons/word.png" fallback={<WordIcon />} />,
  appstore: <BrandIcon src="/icons/app-store.png" fallback={<AppStoreIcon />} />,
};

export type DockIconKey = keyof typeof DOCK_ICONS;

/**
 * Real app artwork (renders of the official icons from Wikimedia Commons).
 * `rounded` images are full-bleed iOS-style squares that need the squircle
 * radius applied; macOS-style icons already carry their own margin and shape.
 * Size follows `--app-icon-size` so the dock, Spotlight and Launchpad can scale it.
 */
export function RealIcon({
  src,
  rounded = false,
  scale = rounded ? 0.82 : 1,
  onError,
}: {
  src: string;
  rounded?: boolean;
  scale?: number;
  onError?: () => void;
}) {
  const size = `calc(var(--app-icon-size, 50px) * ${scale})`;
  return (
    <span
      className="realIcon"
      style={{
        width: 'var(--app-icon-size, 50px)',
        height: 'var(--app-icon-size, 50px)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        onError={onError}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          borderRadius: rounded ? '22.5%' : 0,
          display: 'block',
        }}
      />
    </span>
  );
}

const missingArtwork = new Set<string>();

/**
 * Brand artwork for a third-party app. Renders the official render from public/icons when
 * the file is there and falls back to the drawn tile when it isn't, so the desktop never
 * shows a broken image. Add the PNG (a square, full-bleed render like mail.png) and the
 * real icon appears with no code change.
 */
export function BrandIcon({
  src,
  fallback,
  rounded = true,
}: {
  src: string;
  fallback: ReactNode;
  rounded?: boolean;
}) {
  const [missing, setMissing] = useState(() => missingArtwork.has(src));
  if (missing) return <>{fallback}</>;
  return (
    <RealIcon
      src={src}
      rounded={rounded}
      onError={() => {
        missingArtwork.add(src);
        setMissing(true);
      }}
    />
  );
}

const REAL_ICONS = {
  finder: <RealIcon src="/icons/finder.png" />,
  safari: <RealIcon src="/icons/chrome.png" scale={0.82} />,
  askjosh: <RealIcon src="/icons/claude.png" rounded />,
  contact: <RealIcon src="/icons/mail.png" rounded />,
  location: <RealIcon src="/icons/maps.png" rounded />,
  terminal: <RealIcon src="/icons/terminal.png" />,
  calculator: <RealIcon src="/icons/calculator.png" rounded />,
  cv: <RealIcon src="/icons/pages.png" rounded />,
  texteditor: <RealIcon src="/icons/textedit.png" />,
  // Preview's render is full-bleed, unlike the other macOS icons, so it gets the squircle
  imageviewer: <RealIcon src="/icons/preview.png" rounded />,
  experience: <RealIcon src="/icons/reminders.png" rounded />,
  shortcuts: <RealIcon src="/icons/shortcuts.png" rounded />,
  settings: <RealIcon src="/icons/settings.png" />,
};

export const DOCK_ICONS = { ...DRAWN_ICONS, ...REAL_ICONS };
