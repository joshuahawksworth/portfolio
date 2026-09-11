/**
 * Windows 11 (Fluent) counterparts of the dock artwork: File Explorer, To Do, Outlook,
 * Maps, Windows Terminal, Calculator, Notepad, Photos, Word, Settings, Recycle Bin…
 * Drawn on the same 44×44 canvas as the macOS drawn icons so every surface can size
 * them the same way.
 */
import { useId, type ReactNode } from 'react';
import { MicrosoftStoreIcon } from './DevAppIcons';
import { BrandIcon } from '../Dock/dockIcons';

function Svg({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <svg viewBox="0 0 44 44" width="44" height="44" fill="none" aria-label={title} role="img">
      {children}
    </svg>
  );
}

/** Fluent-style rounded tile with a vertical two-stop gradient. */
export function WinTile({
  top,
  bottom,
  children,
  radius = 8,
}: {
  top: string;
  bottom: string;
  children?: ReactNode;
  radius?: number;
}) {
  const uid = useId().replace(/:/g, '');
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="38" height="38" rx={radius} fill={`url(#${uid}g)`} />
      {children}
    </Svg>
  );
}

export function ExplorerIcon() {
  return (
    <Svg title="File Explorer">
      {/* Back folder */}
      <path d="M4 12.5Q4 9 7.5 9H17l3 3h16.5Q40 12 40 15.5V19H4Z" fill="#f3b11b" />
      {/* Front panel, slightly tilted like the Fluent icon */}
      <path d="M4 18.5h36v15Q40 37 36.5 37h-29Q4 37 4 33.5Z" fill="#ffd54f" />
      <path d="M4 18.5h36v3H4Z" fill="#ffca28" />
      {/* Blue Explorer clip on the left */}
      <rect x="6" y="14" width="10" height="21" rx="2" fill="#1e6ee8" />
      <rect x="8" y="17" width="6" height="2" rx="1" fill="#fff" opacity="0.9" />
      <rect x="8" y="21" width="6" height="2" rx="1" fill="#fff" opacity="0.9" />
      <rect x="8" y="25" width="6" height="2" rx="1" fill="#fff" opacity="0.9" />
    </Svg>
  );
}

export function BriefcaseIcon() {
  return (
    <WinTile top="#3a7bea" bottom="#1f56c9">
      <path
        d="M17 15v-2.5q0-2.5 2.5-2.5h5q2.5 0 2.5 2.5V15"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
      />
      <rect x="8" y="15" width="28" height="19" rx="3" fill="#fff" />
      <rect x="8" y="15" width="28" height="7" rx="3" fill="#dbe8ff" />
      <path d="M8 22h28" stroke="#9dbdf5" strokeWidth="1.2" />
      <rect x="19.5" y="20" width="5" height="4" rx="1" fill="#1f56c9" />
    </WinTile>
  );
}

export function SkillsIcon() {
  return (
    <WinTile top="#a35cf0" bottom="#5b2fc4">
      <path
        d="M15 15l-7 7 7 7M29 15l7 7-7 7"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M25 13l-6 18" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
    </WinTile>
  );
}

export function OutlookIcon() {
  return (
    <Svg title="Outlook">
      <rect x="14" y="9" width="27" height="26" rx="3" fill="#1b62c7" />
      <rect x="14" y="9" width="27" height="10" rx="3" fill="#2f7ae5" />
      <path d="M17 19l10.5 7L38 19" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="3" y="13" width="20" height="20" rx="3" fill="#0f5cbf" />
      <ellipse cx="13" cy="23" rx="6" ry="6.5" fill="none" stroke="#fff" strokeWidth="3" />
    </Svg>
  );
}

/** Windows Mail: the blue envelope tile. */
export function WinMailIcon() {
  return (
    <WinTile top="#3f9bff" bottom="#0f5cbf">
      <rect x="9" y="13" width="26" height="19" rx="3" fill="#fff" opacity="0.95" />
      <path
        d="M9 16l13 9 13-9"
        stroke="#1b62c7"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
    </WinTile>
  );
}

export function WinMapsIcon() {
  return (
    <WinTile top="#3fb0f3" bottom="#1b7fd4">
      <path d="M8 31l9-4 10 4 9-4V12l-9 4-10-4-9 4z" fill="#dff3ff" opacity="0.9" />
      <path d="M17 12v15M27 16v15" stroke="#1b7fd4" strokeWidth="1.2" opacity="0.5" />
      <path d="M22 9q6 0 6 6.5Q28 21 22 28q-6-7-6-12.5Q16 9 22 9z" fill="#e8483c" />
      <circle cx="22" cy="15.5" r="2.6" fill="#fff" />
    </WinTile>
  );
}

export function WinTerminalIcon() {
  return (
    <Svg title="Windows Terminal">
      <rect x="3" y="4" width="38" height="36" rx="7" fill="#1f1f1f" />
      <path d="M3 11q0-7 7-7h24q7 0 7 7v3H3z" fill="#3b3b3b" />
      <path
        d="M12 18l6 5-6 5"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M21 30h9" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </Svg>
  );
}

export function WinCalculatorIcon() {
  return (
    <Svg title="Calculator">
      <rect x="8" y="3" width="28" height="38" rx="5" fill="#2f3f5f" />
      <rect x="11" y="6" width="22" height="9" rx="2" fill="#e9f0fb" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <rect
            key={`${r}${c}`}
            x={11.5 + c * 7.5}
            y={18 + r * 6.5}
            width="6"
            height="5"
            rx="1.2"
            fill={c === 2 ? '#3a8df0' : '#f2f5fb'}
          />
        ))
      )}
    </Svg>
  );
}

export function WordIcon() {
  return (
    <Svg title="Word">
      <path d="M17 5h15l8 8v24q0 2-2 2H17q-2 0-2-2V7q0-2 2-2z" fill="#4b8ff0" />
      <path d="M32 5v8h8z" fill="#9dc3ff" />
      <rect x="3" y="12" width="22" height="22" rx="3" fill="#185abd" />
      <path
        d="M7.5 16.5l2.5 13 3-9.5 3 9.5 2.5-13"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function NotepadIcon() {
  return (
    <Svg title="Notepad">
      <rect x="8" y="6" width="28" height="34" rx="4" fill="#eaf3ff" />
      <rect x="8" y="6" width="28" height="7" rx="4" fill="#2b6fd6" />
      <rect x="8" y="10" width="28" height="3" fill="#2b6fd6" />
      {[12, 16, 20, 24, 28].map((x) => (
        <rect key={x} x={x} y="3" width="2.4" height="7" rx="1.2" fill="#1c4ea3" />
      ))}
      <path
        d="M13 19h18M13 24h18M13 29h12"
        stroke="#7aa6e0"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function WinPhotosIcon() {
  return (
    <WinTile top="#4cb5ff" bottom="#0e6ee0" radius={9}>
      <rect x="8" y="10" width="28" height="24" rx="3" fill="#fff" opacity="0.18" />
      <circle cx="29" cy="16.5" r="3.2" fill="#ffe36a" />
      <path d="M8 31l9-11 6 7 4-4 9 8z" fill="#fff" opacity="0.92" />
      <path d="M8 31l9-11 6 7-6 4z" fill="#dbeeff" />
    </WinTile>
  );
}

export function WinSettingsIcon() {
  // Fluent gear: 8 teeth around a ring with a hollow centre.
  const teeth = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <Svg title="Settings">
      <g fill="#5b6f9c">
        {teeth.map((a) => (
          <rect
            key={a}
            x="19"
            y="3.5"
            width="6"
            height="9"
            rx="2"
            transform={`rotate(${a} 22 22)`}
          />
        ))}
      </g>
      <circle cx="22" cy="22" r="13" fill="#6f84b3" />
      <circle cx="22" cy="22" r="13" fill="none" stroke="#5b6f9c" strokeWidth="1" />
      <circle cx="22" cy="22" r="5.5" fill="#f2f5fb" />
    </Svg>
  );
}

export function WinKeyboardIcon() {
  return (
    <WinTile top="#5c6370" bottom="#3a3f4a">
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3, 4].map((c) => (
          <rect
            key={`${r}${c}`}
            x={8.5 + c * 5.6}
            y={12 + r * 5.4}
            width="4.2"
            height="4"
            rx="1"
            fill="#fff"
            opacity="0.9"
          />
        ))
      )}
      <rect x="12" y="28.5" width="20" height="4" rx="1" fill="#fff" opacity="0.9" />
    </WinTile>
  );
}

export function RecycleBinIcon({ full = false, size }: { full?: boolean; size?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 44 44"
      width={size ?? 44}
      height={size ?? 44}
      fill="none"
      aria-label="Recycle Bin"
      role="img"
    >
      <defs>
        <linearGradient id={`${uid}b`} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#cfe3f7" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#f2f8ff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#b8d2ee" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      {full && (
        <>
          <path d="M14 14l4-6 5 4 4-5 3 6z" fill="#fff" />
          <path d="M16 12l3-4 3 3 3-4 2 5z" fill="#e8eef7" />
        </>
      )}
      <path d="M9 13h26l-2.5 25q-.3 3-3.3 3H14.8q-3 0-3.3-3z" fill={`url(#${uid}b)`} />
      <rect x="7" y="10" width="30" height="4" rx="2" fill="#8fb2d9" />
      <path
        d="M19.5 20.5l2.5-4 2.5 4M22 18.5v6M16 30l-1.5 4h5M14.5 34l3-4.5M28 30l1.5 4h-5M29.5 34l-3-4.5"
        stroke="#2f7ad6"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 13h26" stroke="#fff" strokeWidth="1" opacity="0.7" />
    </svg>
  );
}

export function ThisPcIcon({ size = 50 }: { size?: number }) {
  return (
    <svg viewBox="0 0 52 52" width={size} height={size} fill="none" aria-hidden="true">
      <rect x="6" y="9" width="40" height="27" rx="3" fill="#2f6fd6" />
      <rect x="9" y="12" width="34" height="21" rx="1.5" fill="#dbeafe" />
      <rect x="9" y="12" width="34" height="21" rx="1.5" fill="#4d9cf0" opacity="0.9" />
      <rect x="9" y="12" width="34" height="9" fill="#7fbcff" opacity="0.6" />
      <rect x="19" y="37" width="14" height="3" fill="#b5c6dd" />
      <rect x="14" y="40" width="24" height="3" rx="1.5" fill="#8fa3bf" />
    </svg>
  );
}

export function WinFolderIcon({ size = 48, children }: { size?: number; children?: ReactNode }) {
  return (
    <svg viewBox="0 0 64 52" width={size} height={size * (52 / 64)} fill="none" aria-hidden="true">
      <path d="M4 9.5Q4 5 8.5 5H23.5l4.5 4.5h27.5Q60 9.5 60 14V22H4Z" fill="#e8a416" />
      <path d="M4 17.5h56V44q0 4.5-4.5 4.5h-47Q4 48.5 4 44Z" fill="#ffcd3c" />
      <path d="M4 17.5h56v4H4z" fill="#f7bf22" />
      {children}
    </svg>
  );
}

export function WindowsLogo({ size = 24, color = '#0078d4' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color} aria-hidden="true">
      <rect x="1" y="1" width="10.4" height="10.4" />
      <rect x="12.6" y="1" width="10.4" height="10.4" />
      <rect x="1" y="12.6" width="10.4" height="10.4" />
      <rect x="12.6" y="12.6" width="10.4" height="10.4" />
    </svg>
  );
}

export const WINDOWS_ICONS = {
  finder: <ExplorerIcon />,
  experience: <BriefcaseIcon />,
  skills: <SkillsIcon />,
  contact: <WinMailIcon />,
  outlook: <BrandIcon src="/icons/outlook.png" fallback={<OutlookIcon />} />,
  location: <WinMapsIcon />,
  terminal: <WinTerminalIcon />,
  calculator: <WinCalculatorIcon />,
  cv: <WordIcon />,
  appstore: <BrandIcon src="/icons/microsoft-store.png" fallback={<MicrosoftStoreIcon />} />,
  imageviewer: <WinPhotosIcon />,
  settings: <WinSettingsIcon />,
  shortcuts: <WinKeyboardIcon />,
  trashEmpty: <RecycleBinIcon />,
  trashFull: <RecycleBinIcon full />,
} as const;
