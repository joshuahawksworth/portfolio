import { useState, useRef, useEffect, useCallback } from 'react';
import { DesktopProvider, useDesktop, WindowInstance, DesktopFolderItem } from '../../context/DesktopContext';
import MenuBar from '../MenuBar/MenuBar';
import Dock from '../Dock/Dock';
import Window from '../Window/Window';
import AboutApp from '../apps/AboutApp';
import ExperienceApp from '../apps/ExperienceApp';
import SkillsApp from '../apps/SkillsApp';
import ContactApp from '../apps/ContactApp';
import LocationApp from '../apps/LocationApp';
import TerminalApp from '../apps/TerminalApp';
import FinderApp from '../apps/FinderApp';
import TrashApp from '../apps/TrashApp';
import SafariApp from '../apps/SafariApp';
import DoomApp from '../apps/DoomApp';
import SnakeApp from '../apps/SnakeApp';
import TextEditorApp from '../apps/TextEditorApp';
import ImageViewerApp from '../apps/ImageViewerApp';
import { jobsData } from '../../data/experienceData';
import styles from './Desktop.module.css';

const APP_COMPONENTS: Record<string, React.ComponentType<{ props?: Record<string, unknown> }>> = {
  about: AboutApp,
  experience: ExperienceApp,
  skills: SkillsApp,
  contact: ContactApp,
  location: LocationApp,
  terminal: TerminalApp,
  finder: FinderApp,
  trash: TrashApp,
  safari: SafariApp,
  githubapp: SafariApp,
  doom: DoomApp,
  texteditor:  TextEditorApp,
  imageviewer: ImageViewerApp,
  // snake is rendered by NokiaWindow — NOT in this map
};

// ── NokiaWindow ── custom Nokia phone frame for Snake ─────────────────────
function NokiaWindow({ win }: { win: WindowInstance }) {
  const { closeWindow, focusWindow, moveWindow } = useDesktop();
  const posRef = useRef({ x: win.x, y: win.y });
  const [pos, setPos] = useState({ x: win.x, y: win.y });

  const pushDirRef = useRef<((d: 'U' | 'D' | 'L' | 'R') => void) | null>(null);
  const startGameRef = useRef<(() => void) | null>(null);

  const handlePushDir = useCallback((cb: (d: 'U' | 'D' | 'L' | 'R') => void) => {
    pushDirRef.current = cb;
  }, []);
  const handleStartGame = useCallback((cb: () => void) => {
    startGameRef.current = cb;
  }, []);

  // Keyboard: forward to game
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const MAP: Record<string, 'U' | 'D' | 'L' | 'R'> = {
        ArrowUp: 'U',
        w: 'U',
        W: 'U',
        ArrowDown: 'D',
        s: 'D',
        S: 'D',
        ArrowLeft: 'L',
        a: 'L',
        A: 'L',
        ArrowRight: 'R',
        d: 'R',
        D: 'R',
      };
      if (e.key === ' ' || e.key === 'Enter') {
        startGameRef.current?.();
        return;
      }
      const d = MAP[e.key];
      if (d) {
        e.preventDefault();
        pushDirRef.current?.(d);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Dragging by the phone body
  function onPhoneMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    focusWindow(win.id);
    const sx = e.clientX - posRef.current.x;
    const sy = e.clientY - posRef.current.y;

    function onMove(ev: MouseEvent) {
      const nx = ev.clientX - sx;
      const ny = Math.max(28, ev.clientY - sy);
      posRef.current = { x: nx, y: ny };
      setPos({ x: nx, y: ny });
      moveWindow(win.id, nx, ny);
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  if (win.minimized) return null;

  return (
    <div
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: win.zIndex, userSelect: 'none' }}
      onMouseDown={(e) => {
        e.stopPropagation();
        focusWindow(win.id);
      }}
    >
      {/* Nokia phone body */}
      <div className={styles.nokia} onMouseDown={onPhoneMouseDown}>
        {/* Top — speaker + camera + close */}
        <div className={styles.nokiaTop}>
          <div className={styles.nokiaDot} />
          <div className={styles.nokiaSpeaker} />
          <button
            className={styles.nokiaClose}
            onClick={() => closeWindow(win.id)}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* LCD screen bezel */}
        <div className={styles.nokiaBezel}>
          <div className={styles.nokiaScreen}>
            <SnakeApp onPushDir={handlePushDir} onStartGame={handleStartGame} hideDpad={true} />
          </div>
        </div>

        {/* Nokia branding */}
        <div className={styles.nokiaBrand}>NOKIA</div>

        {/* Nav D-pad */}
        <div className={styles.nokiaNav}>
          <button
            className={styles.navBtn}
            onPointerDown={(e) => {
              e.preventDefault();
              pushDirRef.current?.('U');
            }}
          >
            ▲
          </button>
          <div className={styles.navRow}>
            <button
              className={styles.navBtn}
              onPointerDown={(e) => {
                e.preventDefault();
                pushDirRef.current?.('L');
              }}
            >
              ◄
            </button>
            <div
              className={styles.navCenterBtn}
              onPointerDown={(e) => {
                e.preventDefault();
                startGameRef.current?.();
              }}
            />
            <button
              className={styles.navBtn}
              onPointerDown={(e) => {
                e.preventDefault();
                pushDirRef.current?.('R');
              }}
            >
              ►
            </button>
          </div>
          <button
            className={styles.navBtn}
            onPointerDown={(e) => {
              e.preventDefault();
              pushDirRef.current?.('D');
            }}
          >
            ▼
          </button>
        </div>

        {/* Soft key row */}
        <div className={styles.nokiaSoftRow}>
          <button
            className={styles.nokiaSoftKey}
            onPointerDown={(e) => {
              e.preventDefault();
              startGameRef.current?.();
            }}
          >
            Play
          </button>
          <div className={styles.nokiaCallBtns}>
            <button className={styles.nokiaCallBtn} style={{ background: '#1e6b2e' }} />
            <button className={styles.nokiaCallBtn} style={{ background: '#6b1e1e' }} />
          </div>
          <button className={styles.nokiaSoftKey}>Menu</button>
        </div>

        {/* Numpad */}
        <div className={styles.nokiaNumpad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
            <button key={k} className={styles.nokiaNumKey}>
              {k}
            </button>
          ))}
        </div>

        <div className={styles.nokiaChin} />
      </div>
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────
interface IconPos {
  x: number;
  y: number;
}

interface DesktopItem {
  id: string;
  type: 'job' | 'folder' | 'app' | 'file' | 'image';
  label: string;
  jobId?: string;
  appId?: string;
  content?: string;
  dataUrl?: string;  // base64 data URL for uploaded images
}

interface CtxMenu {
  x: number;
  y: number;
  targetId?: string;
}

// ── Wallpapers ─────────────────────────────────────────────────────────────
const WALLPAPERS = {
  space: [
    'radial-gradient(ellipse at 18% 25%, rgba(59,100,220,0.22) 0%, transparent 48%)',
    'radial-gradient(ellipse at 80% 70%, rgba(120,60,200,0.15) 0%, transparent 45%)',
    'radial-gradient(ellipse at 55% 5%, rgba(30,60,140,0.25) 0%, transparent 40%)',
    'radial-gradient(ellipse at 50% 100%, rgba(15,35,80,0.6) 0%, transparent 50%)',
    'linear-gradient(175deg, #06090f 0%, #08101e 20%, #0d1628 45%, #101c32 65%, #0c1520 80%, #06090f 100%)',
  ].join(', '),
  sunset: [
    'radial-gradient(ellipse at 30% 60%, rgba(220,80,20,0.45) 0%, transparent 55%)',
    'radial-gradient(ellipse at 70% 30%, rgba(180,40,100,0.35) 0%, transparent 50%)',
    'linear-gradient(175deg, #0a0408 0%, #1e0810 30%, #32100a 60%, #160a08 100%)',
  ].join(', '),
  ocean: [
    'radial-gradient(ellipse at 20% 40%, rgba(0,100,200,0.35) 0%, transparent 55%)',
    'radial-gradient(ellipse at 80% 20%, rgba(0,180,220,0.25) 0%, transparent 50%)',
    'linear-gradient(175deg, #020b12 0%, #061520 30%, #082030 60%, #040d18 100%)',
  ].join(', '),
  aurora: [
    'radial-gradient(ellipse at 40% 30%, rgba(0,200,100,0.28) 0%, transparent 50%)',
    'radial-gradient(ellipse at 70% 60%, rgba(100,0,200,0.22) 0%, transparent 45%)',
    'radial-gradient(ellipse at 20% 70%, rgba(0,150,180,0.22) 0%, transparent 50%)',
    'linear-gradient(175deg, #020812 0%, #050f18 30%, #040c14 60%, #030810 100%)',
  ].join(', '),
  midnight: [
    'radial-gradient(ellipse at 50% 50%, rgba(60,0,120,0.35) 0%, transparent 65%)',
    'linear-gradient(175deg, #050008 0%, #0a0015 50%, #050008 100%)',
  ].join(', '),
} as const;
type WallpaperKey = keyof typeof WALLPAPERS;

const WALLPAPER_LABELS: Record<WallpaperKey, string> = {
  space: 'Space',
  sunset: 'Sunset',
  ocean: 'Ocean',
  aurora: 'Aurora',
  midnight: 'Midnight',
};
const WALLPAPER_SWATCH: Record<WallpaperKey, string> = {
  space: '#0d1628',
  sunset: '#32100a',
  ocean: '#082030',
  aurora: '#040c14',
  midnight: '#0a0015',
};

// ── Constants ──────────────────────────────────────────────────────────────
const ICON_W = 76;
const ICON_H = 84;
const ICON_GAP = 8;
const BOUNCE_MS = 1850; // matches 1800ms animation + 50ms buffer

// ── Grid helper ───────────────────────────────────────────────────────────
// Returns the first grid cell not already occupied by any icon in `taken`.
// `taken` is a snapshot of current iconPos — mutate a local copy to reserve
// cells for multiple items being placed in the same batch.
function findEmptyGridCell(taken: Record<string, IconPos>): IconPos {
  const startX  = 20;
  const startY  = 54;
  const colW    = ICON_W + ICON_GAP + 4;
  const rowH    = ICON_H + ICON_GAP;
  const maxRows = Math.max(1, Math.floor((window.innerHeight - startY - 80) / rowH));
  const maxCols = Math.max(1, Math.floor((window.innerWidth  - startX) / colW));

  const occupied = Object.values(taken);

  for (let col = 0; col < maxCols; col++) {
    for (let row = 0; row < maxRows; row++) {
      const gx = startX + col * colW;
      const gy = startY + row * rowH;
      const hit = occupied.some(
        p => Math.abs(p.x - gx) < ICON_W * 0.7 && Math.abs(p.y - gy) < ICON_H * 0.7
      );
      if (!hit) return { x: gx, y: gy };
    }
  }
  // All cells full — overflow below the grid
  const n = Object.keys(taken).length;
  return {
    x: startX,
    y: startY + (n % maxRows) * rowH + maxRows * rowH,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────
// Desktop-level app shortcuts
const APP_SHORTCUTS: DesktopItem[] = [
  { id: 'shortcut-mycomputer', type: 'app', label: 'My Computer', appId: 'finder' },
  { id: 'shortcut-trash', type: 'app', label: 'Trash', appId: 'trash' },
  { id: 'shortcut-doom', type: 'app', label: 'DOOM', appId: 'doom' },
  { id: 'shortcut-snake', type: 'app', label: 'Snake', appId: 'snake' },
  { id: 'trickster', type: 'folder', label: 'My Flaws' },
];

function makeDefaultItems(): DesktopItem[] {
  return [
    ...APP_SHORTCUTS,
    ...jobsData.map((j) => ({ id: j.id, type: 'job' as const, label: j.company, jobId: j.id })),
  ];
}

// All icons stack down the LEFT side in up-to-2 columns
function initPositions(items: DesktopItem[]): Record<string, IconPos> {
  const startX = 20;
  const startY = 54;
  const colW = ICON_W + ICON_GAP + 4;
  const maxRows = Math.max(1, Math.floor((window.innerHeight - startY - 80) / (ICON_H + ICON_GAP)));
  const result: Record<string, IconPos> = {};
  items.forEach((item, i) => {
    result[item.id] = {
      x: startX + Math.floor(i / maxRows) * colW,
      y: startY + (i % maxRows) * (ICON_H + ICON_GAP),
    };
  });
  return result;
}

function computeCleanPositions(items: DesktopItem[], sortByName: boolean): Record<string, IconPos> {
  const sorted = sortByName
    ? [...items].sort((a, b) => a.label.localeCompare(b.label))
    : [...items];
  const startX = 20;
  const startY = 54;
  const colW = ICON_W + ICON_GAP + 4;
  const maxRows = Math.max(1, Math.floor((window.innerHeight - startY - 80) / (ICON_H + ICON_GAP)));
  const result: Record<string, IconPos> = {};
  sorted.forEach((item, i) => {
    result[item.id] = {
      x: startX + Math.floor(i / maxRows) * colW,
      y: startY + (i % maxRows) * (ICON_H + ICON_GAP),
    };
  });
  return result;
}

// ── Sub-components ─────────────────────────────────────────────────────────
function ImageThumbIcon({ dataUrl, name }: { dataUrl?: string; name: string }) {
  if (dataUrl) {
    return (
      <img
        src={dataUrl}
        alt={name}
        style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', display: 'block', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
      />
    );
  }
  // Fallback generic image icon
  return (
    <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
      <rect x="2" y="4" width="44" height="40" rx="5" fill="#1e3a4a" stroke="#06b6d4" strokeWidth="1.5"/>
      <circle cx="16" cy="16" r="4" fill="#06b6d4" opacity="0.7"/>
      <path d="M4 34 L14 22 L22 30 L32 18 L44 34Z" fill="#06b6d4" opacity="0.35"/>
      <path d="M4 34 L14 22 L22 30 L32 18 L44 34" stroke="#06b6d4" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const color =
    ext === 'js' || ext === 'ts'
      ? '#f7df1e'
      : ext === 'md' || ext === 'txt'
        ? '#94a3b8'
        : ext === 'html'
          ? '#e44d26'
          : '#60a5fa';
  return (
    <svg viewBox="0 0 40 48" fill="none" width="40" height="48">
      <path d="M6 4H28L36 12V44H6Z" fill={color} opacity="0.85" />
      <path d="M28 4L36 12H28Z" fill="rgba(0,0,0,0.25)" />
      <path
        d="M12 22H28M12 28H24M12 34H20"
        stroke="rgba(0,0,0,0.45)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 52 44" fill="none" width="48" height="48">
      <path
        d="M2 9Q2 5 6 5L20 5L24 9L47 9Q49 9 49 11L49 38Q49 40 47 40L5 40Q3 40 3 38Z"
        fill="#4a9eff"
        opacity="0.88"
      />
      <path d="M2 9Q2 5 6 5L20 5L24 9L47 9Q49 9 49 11L49 14L2 14Z" fill="rgba(255,255,255,0.22)" />
    </svg>
  );
}

function TricksterFolderIcon() {
  return (
    <svg viewBox="0 0 52 44" fill="none" width="48" height="48">
      {/* Slightly tilted / wiggly folder */}
      <path
        d="M2 9Q2 5 6 5L20 5L24 9L47 9Q49 9 49 11L49 38Q49 40 47 40L5 40Q3 40 3 38Z"
        fill="#f59e0b"
        opacity="0.92"
      />
      <path d="M2 9Q2 5 6 5L20 5L24 9L47 9Q49 9 49 11L49 14L2 14Z" fill="rgba(255,255,255,0.28)" />
      {/* Question mark */}
      <text
        x="26"
        y="32"
        textAnchor="middle"
        fontSize="16"
        fontWeight="900"
        fill="rgba(120,60,0,0.7)"
        fontFamily="Arial, sans-serif"
      >
        ?
      </text>
    </svg>
  );
}

function MyComputerIcon() {
  return (
    <svg viewBox="0 0 52 48" fill="none" width="48" height="48">
      {/* Monitor outer bezel */}
      <rect
        x="3"
        y="3"
        width="46"
        height="31"
        rx="4"
        fill="#4a7ab5"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
      />
      {/* Monitor highlight */}
      <rect x="3" y="3" width="46" height="10" rx="4" fill="rgba(255,255,255,0.12)" />
      {/* Screen */}
      <rect x="7" y="7" width="38" height="23" rx="2" fill="#0d2340" />
      {/* Screen glow */}
      <rect x="8" y="8" width="36" height="10" rx="1" fill="rgba(80,160,255,0.15)" />
      {/* Desktop icons on screen */}
      <rect x="10" y="11" width="7" height="6" rx="1" fill="#2060c0" opacity="0.9" />
      <rect x="11" y="19" width="5" height="1" rx="0.5" fill="rgba(255,255,255,0.5)" />
      <rect x="20" y="11" width="7" height="6" rx="1" fill="#1e8040" opacity="0.9" />
      <rect x="21" y="19" width="5" height="1" rx="0.5" fill="rgba(255,255,255,0.5)" />
      <rect x="30" y="11" width="7" height="6" rx="1" fill="#802020" opacity="0.9" />
      <rect x="31" y="19" width="5" height="1" rx="0.5" fill="rgba(255,255,255,0.5)" />
      {/* Taskbar at bottom of screen */}
      <rect x="8" y="24" width="36" height="5" rx="0.5" fill="#1a3a6a" />
      <rect x="9" y="25" width="10" height="3" rx="1" fill="#2860a0" />
      {/* Stand */}
      <rect x="22" y="34" width="8" height="5" rx="1" fill="#3a6090" />
      <rect
        x="15"
        y="39"
        width="22"
        height="4"
        rx="2"
        fill="#3a6090"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

function DesktopTrashIcon({ full, glow }: { full: boolean; glow?: boolean }) {
  const stroke = glow ? '#ff6b6b' : 'rgba(255,255,255,0.85)';
  return (
    <svg
      viewBox="0 0 48 54"
      fill="none"
      width="44"
      height="44"
      style={
        glow
          ? {
              filter:
                'drop-shadow(0 0 8px rgba(255,80,80,0.9)) drop-shadow(0 0 16px rgba(255,40,40,0.6))',
            }
          : undefined
      }
    >
      <path
        d="M8 14H40M24 8H28M10 14L13 46H35L38 14Z"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {full && (
        <path
          d="M19 20V40M24 20V40M29 20V40"
          stroke={glow ? 'rgba(255,150,150,0.7)' : 'rgba(255,255,255,0.55)'}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function DoomIcon() {
  return (
    <img
      src="/doom-icon.png"
      alt="DOOM"
      width="52"
      height="52"
      style={{ imageRendering: 'auto', borderRadius: 8 }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

function NokiaIcon() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Phone body */}
      <rect x="9" y="1" width="30" height="46" rx="7" fill="#1c2233" />
      <rect x="10" y="2" width="28" height="44" rx="6" fill="#243044" />
      {/* Top speaker grill */}
      <rect x="18" y="5" width="12" height="2" rx="1" fill="#161f2e" />
      {/* Screen bezel */}
      <rect x="12" y="9" width="24" height="18" rx="2.5" fill="#0d0f0d" />
      {/* LCD screen */}
      <rect x="13" y="10" width="22" height="16" rx="1.5" fill="#1c2c10" />
      {/* Snake game pixels on screen */}
      {/* Snake head */}
      <rect x="22" y="12" width="3" height="3" fill="#4ddd4d" />
      {/* Snake body */}
      <rect x="19" y="12" width="3" height="3" fill="#35bb35" />
      <rect x="16" y="12" width="3" height="3" fill="#2aaa2a" />
      <rect x="16" y="15" width="3" height="3" fill="#2aaa2a" />
      <rect x="16" y="18" width="3" height="3" fill="#2aaa2a" />
      <rect x="19" y="18" width="3" height="3" fill="#2aaa2a" />
      <rect x="22" y="18" width="3" height="3" fill="#2aaa2a" />
      {/* Food */}
      <rect x="30" y="13" width="2" height="2" fill="#88ff44" />
      {/* Nokia logo text */}
      <text
        x="24"
        y="32"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="4.5"
        fontWeight="700"
        letterSpacing="1.2"
        fill="#5a78a0"
      >
        NOKIA
      </text>
      {/* Navigation key (oval d-pad) */}
      <ellipse cx="24" cy="37.5" rx="5.5" ry="3.5" fill="#1a2535" />
      <circle cx="24" cy="37.5" r="2.5" fill="#141d28" />
      <circle cx="24" cy="37.5" r="1.2" fill="#1e2a3a" />
      {/* Left soft key */}
      <rect x="12" y="34" width="7" height="4" rx="2" fill="#1a2535" />
      {/* Right soft key */}
      <rect x="29" y="34" width="7" height="4" rx="2" fill="#1a2535" />
      {/* Number keys row 1 */}
      <rect x="12" y="40" width="6" height="3" rx="1.5" fill="#1a2535" />
      <rect x="21" y="40" width="6" height="3" rx="1.5" fill="#1a2535" />
      <rect x="30" y="40" width="6" height="3" rx="1.5" fill="#1a2535" />
      {/* Number keys row 2 */}
      <rect x="12" y="44" width="6" height="2.5" rx="1.2" fill="#1a2535" />
      <rect x="21" y="44" width="6" height="2.5" rx="1.2" fill="#1a2535" />
      <rect x="30" y="44" width="6" height="2.5" rx="1.2" fill="#1a2535" />
    </svg>
  );
}

function GetInfoModal({
  target,
  onClose,
}: {
  target: 'desktop' | DesktopItem;
  onClose: () => void;
}) {
  const isDesktop = target === 'desktop';
  const name = isDesktop ? 'Desktop' : (target as DesktopItem).label;
  const kind = isDesktop
    ? 'Folder'
    : (target as DesktopItem).type === 'folder'
      ? 'Folder'
      : 'Application';
  const jobInfo =
    !isDesktop && (target as DesktopItem).jobId
      ? jobsData.find((j) => j.id === (target as DesktopItem).jobId)
      : null;
  const ua = navigator.userAgent;
  const browser = /Firefox/.test(ua)
    ? 'Firefox'
    : /Edg\//.test(ua)
      ? 'Edge'
      : /Chrome/.test(ua)
        ? 'Chrome'
        : /Safari/.test(ua)
          ? 'Safari'
          : /Opera|OPR/.test(ua)
            ? 'Opera'
            : 'Unknown';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.getInfo} onClick={(e) => e.stopPropagation()}>
        <div className={styles.getInfoTitleBar}>
          <button className={styles.trafficClose} onClick={onClose} aria-label="Close" />
        </div>
        <div className={styles.getInfoHead}>
          {isDesktop || kind === 'Folder' ? (
            <svg viewBox="0 0 52 44" fill="none" width="48" height="40">
              <path
                d="M2 9Q2 5 6 5L20 5L24 9L47 9Q49 9 49 11L49 38Q49 40 47 40L5 40Q3 40 3 38Z"
                fill="#4a9eff"
                opacity="0.9"
              />
              <path
                d="M2 9Q2 5 6 5L20 5L24 9L47 9Q49 9 49 11L49 14L2 14Z"
                fill="rgba(255,255,255,0.28)"
              />
            </svg>
          ) : jobInfo?.logo ? (
            <img
              src={jobInfo.logo}
              alt={name}
              style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                objectFit: 'contain',
                background: 'rgba(255,255,255,0.12)',
                padding: 4,
              }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 700,
                color: 'white',
              }}
            >
              {name[0]}
            </div>
          )}
          <div>
            <div className={styles.getInfoName}>{name}</div>
            <div className={styles.getInfoMeta}>{kind}</div>
          </div>
        </div>
        <div className={styles.getInfoSection}>
          <div className={styles.getInfoSectionTitle}>▾ General:</div>
          <table className={styles.getInfoTable}>
            <tbody>
              <tr>
                <td>Kind:</td>
                <td>{kind}</td>
              </tr>
              <tr>
                <td>Where:</td>
                <td>~/Desktop</td>
              </tr>
              {isDesktop ? (
                <>
                  <tr>
                    <td>Browser:</td>
                    <td>{browser}</td>
                  </tr>
                  <tr>
                    <td>Screen:</td>
                    <td>
                      {window.screen.width} × {window.screen.height}
                    </td>
                  </tr>
                  <tr>
                    <td>Built with:</td>
                    <td>React 19 + TypeScript</td>
                  </tr>
                  <tr>
                    <td>Bundler:</td>
                    <td>Vite</td>
                  </tr>
                </>
              ) : jobInfo ? (
                <>
                  <tr>
                    <td>Role:</td>
                    <td>{jobInfo.role}</td>
                  </tr>
                  <tr>
                    <td>Period:</td>
                    <td>{jobInfo.period}</td>
                  </tr>
                </>
              ) : null}
            </tbody>
          </table>
        </div>
        {isDesktop && (
          <div className={styles.getInfoSection}>
            <div className={styles.getInfoSectionTitle}>▾ More Info:</div>
            <p className={styles.getInfoBody}>
              Joshua Hawksworth's portfolio — frontend developer specialising in React &amp;
              TypeScript.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function WallpaperPicker({
  current,
  onChange,
  onClose,
}: {
  current: WallpaperKey;
  onChange: (k: WallpaperKey) => void;
  onClose: () => void;
}) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.wallpaperPicker} onClick={(e) => e.stopPropagation()}>
        <div className={styles.wallpaperTitle}>Change Background</div>
        <div className={styles.wallpaperSwatches}>
          {(Object.keys(WALLPAPERS) as WallpaperKey[]).map((key) => (
            <button
              key={key}
              className={`${styles.wallpaperSwatch} ${current === key ? styles.wallpaperActive : ''}`}
              style={{ background: WALLPAPER_SWATCH[key] }}
              onClick={() => {
                onChange(key);
                onClose();
              }}
            >
              {WALLPAPER_LABELS[key]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── DesktopSurface ─────────────────────────────────────────────────────────
function DesktopSurface() {
  const {
    windows,
    openApp,
    syncDesktopFolders,
    syncDesktopFiles,
    syncCustomFolderItems,
    uploadedFileQueue,
    ackUploadedFile,
    moveFromFolderToDesktop,
    pendingFromFolder,
    ackFromFolder,
    trashItem,
    restoredItemQueue,
    ackRestoredItem,
    trashedItems,
    trashEmptied,
  } = useDesktop();

  const [items, setItems] = useState<DesktopItem[]>(makeDefaultItems);
  const [iconPos, setIconPos] = useState<Record<string, IconPos>>(() =>
    initPositions(makeDefaultItems())
  );
  const [selectedIcons, setSelectedIcons] = useState<Set<string>>(new Set());
  const [selRect, setSelRect] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(
    null
  );
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [getInfoTarget, setGetInfoTarget] = useState<'desktop' | DesktopItem | null>(null);
  const [showWallpaper, setShowWallpaper] = useState(false);
  const [wallpaper, setWallpaper] = useState<WallpaperKey>('space');
  const [cleaning, setCleaning] = useState(false);
  const [bouncingKeys, setBouncingKeys] = useState<Set<string>>(new Set());
  const [nearTrashTarget, setNearTrashTarget] = useState<'dock' | 'desktop' | null>(null);
  const [draggingIds, setDraggingIds] = useState<Set<string>>(new Set());
  const [nearFolderTarget, setNearFolderTarget] = useState<string | null>(null);
  // folderId → items inside that folder (persisted while app is open)
  const [folderItems, setFolderItems] = useState<Record<string, DesktopFolderItem[]>>({});

  // Refs for always-fresh state inside event handler closures
  const selectedIconsRef = useRef<Set<string>>(new Set());
  const iconPosRef = useRef<Record<string, IconPos>>({});
  const itemsRef = useRef<DesktopItem[]>([]);
  const multiDragRef = useRef<{
    ids: string[];
    sx: number;
    sy: number;
    origins: Record<string, IconPos>;
  } | null>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    selectedIconsRef.current = selectedIcons;
  }, [selectedIcons]);
  useEffect(() => {
    iconPosRef.current = iconPos;
  }, [iconPos]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Keep icons in viewport on resize
  useEffect(() => {
    function onResize() {
      setIconPos((prev) => {
        const next = { ...prev };
        for (const id in next) {
          next[id] = {
            x: Math.min(next[id].x, window.innerWidth - ICON_W - 4),
            y: Math.min(next[id].y, window.innerHeight - ICON_H - 4),
          };
        }
        return next;
      });
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (renamingId) {
      renameRef.current?.focus();
      renameRef.current?.select();
    }
  }, [renamingId]);

  // Keep Finder in sync with desktop folder list
  useEffect(() => {
    syncDesktopFolders(
      items.filter((i) => i.type === 'folder').map((i) => ({ id: i.id, label: i.label }))
    );
  }, [items, syncDesktopFolders]);

  // Keep Finder in sync with desktop file/image items
  useEffect(() => {
    syncDesktopFiles(
      items
        .filter((i) => i.type === 'file' || i.type === 'image')
        .map((i) => ({
          id: i.id,
          label: i.label,
          type: i.type as 'file' | 'image',
          content: i.content,
          dataUrl: i.dataUrl,
        }))
    );
  }, [items, syncDesktopFiles]);

  // Keep Finder in sync with folder item contents
  useEffect(() => {
    syncCustomFolderItems(folderItems);
  }, [folderItems, syncCustomFolderItems]);

  // Process newly-uploaded files — add icon to desktop
  useEffect(() => {
    if (uploadedFileQueue.length === 0) return;
    const claimed = { ...iconPosRef.current };
    for (const uf of uploadedFileQueue) {
      const type: DesktopItem['type'] = uf.isImage ? 'image' : 'file';
      const pos = findEmptyGridCell(claimed);
      claimed[uf.id] = pos;
      setItems(prev => {
        if (prev.some(i => i.id === uf.id)) return prev;
        return [...prev, { id: uf.id, type, label: uf.name, content: uf.content, dataUrl: uf.dataUrl }];
      });
      setIconPos(prev => ({ ...prev, [uf.id]: pos }));
      ackUploadedFile(uf.id);
    }
  }, [uploadedFileQueue, ackUploadedFile]);

  // Process items moved back to desktop from a Finder folder
  useEffect(() => {
    if (pendingFromFolder.length === 0) return;
    const claimed = { ...iconPosRef.current };
    for (const fi of pendingFromFolder) {
      // Remove from local folderItems so the sync doesn't restore it back to context
      setFolderItems(prev => {
        const next = { ...prev };
        for (const folderId in next) {
          next[folderId] = next[folderId].filter(item => item.id !== fi.id);
        }
        return next;
      });
      const pos = findEmptyGridCell(claimed);
      claimed[fi.id] = pos;
      setItems(prev => {
        if (prev.some(i => i.id === fi.id)) return prev;
        return [...prev, { id: fi.id, type: fi.type, label: fi.label, jobId: fi.jobId, appId: fi.appId, content: fi.content, dataUrl: fi.dataUrl }];
      });
      setIconPos(prev => ({ ...prev, [fi.id]: pos }));
      ackFromFolder(fi.id);
    }
  }, [pendingFromFolder, ackFromFolder]);

  // Handle restored items from trash — add them back to desktop
  useEffect(() => {
    if (restoredItemQueue.length === 0) return;
    const claimed = { ...iconPosRef.current };
    for (const item of restoredItemQueue) {
      const type: DesktopItem['type'] = item.dataUrl
        ? 'image'
        : item.isJoke
          ? 'file'
          : 'folder';
      const pos  = findEmptyGridCell(claimed);
      claimed[item.id] = pos;
      setItems((prev) => {
        if (prev.some((i) => i.id === item.id)) return prev;
        return [...prev, { id: item.id, type, label: item.name, content: item.content, dataUrl: item.dataUrl }];
      });
      setIconPos((prev) => ({ ...prev, [item.id]: pos }));
      ackRestoredItem(item.id);
    }
  }, [restoredItemQueue, ackRestoredItem]);

  // ── Finder → Desktop drag-and-drop ────────────────────────────────────
  function onDesktopDragOver(e: React.DragEvent) {
    if (!e.dataTransfer.types.includes('application/finder-item')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }
  function onDesktopDrop(e: React.DragEvent) {
    const raw = e.dataTransfer.getData('application/finder-item');
    if (!raw) return;
    try {
      const { folderId, itemId } = JSON.parse(raw) as { folderId: string; itemId: string };
      if (folderId && itemId) moveFromFolderToDesktop(folderId, itemId);
    } catch { /* bad payload */ }
  }

  // ── Open with bounce animation (delay window until bounce done) ────────
  function openWithBounce(dockKey: string, appId: string, props?: Record<string, unknown>) {
    // Skip animation entirely when an instance of this app is already running
    const alreadyRunning = windows.some((w) => w.appId === appId && !w.minimized);
    if (alreadyRunning) {
      openApp(appId, props);
      return;
    }
    setBouncingKeys((prev) => new Set([...prev, dockKey]));
    setTimeout(() => {
      setBouncingKeys((prev) => {
        const n = new Set(prev);
        n.delete(dockKey);
        return n;
      });
      openApp(appId, props);
    }, BOUNCE_MS);
  }

  // ── Rubber-band selection ──────────────────────────────────────────────
  function onDesktopMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    if (e.button !== 0) return;
    // Commit rename BEFORE preventDefault — otherwise preventDefault suppresses
    // the input's blur event and the rename never finishes.
    if (renamingId) commitRename();
    e.preventDefault();
    setCtxMenu(null);
    // Clear selection immediately on bare-desktop mousedown
    setSelectedIcons(new Set());

    const x1 = e.clientX,
      y1 = e.clientY;
    const snap = { ...iconPosRef.current }; // fresh snapshot via ref

    setSelRect({ x1, y1, x2: x1, y2: y1 });

    function onMove(ev: MouseEvent) {
      const r = { x1, y1, x2: ev.clientX, y2: ev.clientY };
      setSelRect(r);
      const minX = Math.min(r.x1, r.x2),
        maxX = Math.max(r.x1, r.x2);
      const minY = Math.min(r.y1, r.y2),
        maxY = Math.max(r.y1, r.y2);
      const hit = new Set<string>();
      for (const [id, p] of Object.entries(snap)) {
        if (p.x < maxX && p.x + ICON_W > minX && p.y < maxY && p.y + ICON_H > minY) hit.add(id);
      }
      setSelectedIcons(hit);
    }
    function onUp() {
      setSelRect(null);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  // ── Icon drag — reads refs so selection is always fresh ───────────────
  function startDrag(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu(null);

    const current = selectedIconsRef.current;
    const dragIds = current.has(id) ? Array.from(current) : [id];
    if (!current.has(id)) setSelectedIcons(new Set([id]));

    const fresh = iconPosRef.current;
    const origins: Record<string, IconPos> = {};
    for (const did of dragIds) origins[did] = { ...(fresh[did] ?? { x: 0, y: 0 }) };
    multiDragRef.current = { ids: dragIds, sx: e.clientX, sy: e.clientY, origins };
    setDraggingIds(new Set(dragIds));

    // Returns which specific trash element the cursor is over, or null
    function getHoveredTrash(x: number, y: number): 'dock' | 'desktop' | null {
      const trashEls = document.querySelectorAll('[aria-label="Trash"]');
      for (const el of Array.from(trashEls)) {
        const r = (el as HTMLElement).getBoundingClientRect();
        if (r.width === 0) continue;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        if (Math.abs(x - cx) < 56 && Math.abs(y - cy) < 56) {
          return r.top > window.innerHeight * 0.75 ? 'dock' : 'desktop';
        }
      }
      return null;
    }

    // These items can never be moved into folders
    const PROTECTED_IDS = new Set(['shortcut-trash', 'shortcut-mycomputer']);

    // Returns a folder id if cursor is over a folder icon that isn't being dragged
    function getHoveredFolder(x: number, y: number): string | null {
      const allItems = itemsRef.current;
      const pos = iconPosRef.current;
      for (const item of allItems) {
        if (item.type !== 'folder' || dragIds.includes(item.id)) continue;
        const p = pos[item.id];
        if (!p) continue;
        if (x >= p.x && x <= p.x + ICON_W && y >= p.y && y <= p.y + ICON_H) return item.id;
      }
      return null;
    }

    function onMove(ev: MouseEvent) {
      if (!multiDragRef.current) return;
      const { ids, sx, sy, origins } = multiDragRef.current;
      const dx = ev.clientX - sx,
        dy = ev.clientY - sy;
      setIconPos((prev) => {
        const next = { ...prev };
        for (const did of ids) {
          next[did] = { x: Math.max(0, origins[did].x + dx), y: Math.max(44, origins[did].y + dy) };
        }
        return next;
      });
      setNearTrashTarget(getHoveredTrash(ev.clientX, ev.clientY));
      setNearFolderTarget(getHoveredFolder(ev.clientX, ev.clientY));
    }
    function onUp(ev: MouseEvent) {
      setNearTrashTarget(null);
      setNearFolderTarget(null);
      setDraggingIds(new Set());
      multiDragRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);

      // Drop into folder?
      const targetFolder = getHoveredFolder(ev.clientX, ev.clientY);
      if (targetFolder) {
        const movedItems: DesktopFolderItem[] = [];
        for (const did of dragIds) {
          const item = itemsRef.current.find((i) => i.id === did);
          if (item && item.id !== targetFolder && !PROTECTED_IDS.has(item.id)) {
            movedItems.push({
              id: item.id,
              type: item.type,
              label: item.label,
              jobId: item.jobId,
              appId: item.appId,
              content: item.content,
              dataUrl: item.dataUrl,
            });
          }
        }
        if (movedItems.length > 0) {
          setFolderItems((prev) => {
            const existing = prev[targetFolder] ?? [];
            const existingIds = new Set(existing.map((i) => i.id));
            return {
              ...prev,
              [targetFolder]: [...existing, ...movedItems.filter((m) => !existingIds.has(m.id))],
            };
          });
          const movedIds = new Set(movedItems.map((m) => m.id));
          setItems((prev) => prev.filter((i) => !movedIds.has(i.id)));
          setIconPos((prev) => {
            const n = { ...prev };
            for (const id of movedIds) delete n[id];
            return n;
          });
          setSelectedIcons(new Set());
        }
        return;
      }

      // Drop into trash?
      if (getHoveredTrash(ev.clientX, ev.clientY) !== null) {
        for (const did of dragIds) {
          const item = itemsRef.current.find((i) => i.id === did);
          if (item && (item.type === 'folder' || item.type === 'file' || item.type === 'image')) {
            trashItem({
              id: did,
              name: item.label,
              date: new Date().toLocaleDateString('en-GB'),
              isJoke: item.type === 'file' || item.type === 'image',
              content: item.content,
              dataUrl: item.dataUrl,
            });
            setItems((prev) => prev.filter((i) => i.id !== did));
            setIconPos((prev) => {
              const n = { ...prev };
              delete n[did];
              return n;
            });
            setSelectedIcons(new Set());
          }
        }
      }
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  // ── Context menu ──────────────────────────────────────────────────────
  function onDesktopCtx(e: React.MouseEvent) {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }
  function onIconCtx(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedIconsRef.current.has(id)) setSelectedIcons(new Set([id]));
    setCtxMenu({ x: e.clientX, y: e.clientY, targetId: id });
  }

  // ── Folder ────────────────────────────────────────────────────────────
  function newFolder() {
    const id = `folder-${Date.now()}`;
    const pos = ctxMenu
      ? { x: Math.max(0, ctxMenu.x - ICON_W / 2), y: Math.max(48, ctxMenu.y - 20) }
      : { x: Math.round(window.innerWidth / 2), y: Math.round(window.innerHeight / 2) };
    setItems((prev) => [...prev, { id, type: 'folder', label: 'untitled folder' }]);
    setIconPos((prev) => ({ ...prev, [id]: pos }));
    setCtxMenu(null);
    setRenameVal('untitled folder');
    setRenamingId(id);
  }

  function newTextFile() {
    const id = `file-${Date.now()}`;
    const pos = ctxMenu
      ? { x: Math.max(0, ctxMenu.x - ICON_W / 2), y: Math.max(48, ctxMenu.y - 20) }
      : { x: Math.round(window.innerWidth / 2), y: Math.round(window.innerHeight / 2) };
    setItems((prev) => [...prev, { id, type: 'file', label: 'untitled', content: '' }]);
    setIconPos((prev) => ({ ...prev, [id]: pos }));
    setCtxMenu(null);
    setRenameVal('untitled');
    setRenamingId(id);
  }

  // ── Rename / delete ───────────────────────────────────────────────────
  function startRename(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setRenameVal(item.label);
    setRenamingId(id);
    setCtxMenu(null);
  }
  function commitRename() {
    if (!renamingId) return;
    const v = renameVal.trim();
    if (v) setItems((prev) => prev.map((i) => (i.id === renamingId ? { ...i, label: v } : i)));
    setRenamingId(null);
  }
  function deleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setIconPos((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
    setSelectedIcons((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
    setCtxMenu(null);
  }

  // ── Clean up with animation ───────────────────────────────────────────
  function cleanUp(byName = false) {
    setCleaning(true);
    setIconPos(computeCleanPositions(items, byName));
    setCtxMenu(null);
    setTimeout(() => setCleaning(false), 520);
  }

  // ── Dock item activate (bounce + delayed open) ────────────────────────
  function handleDockActivate(key: string, action: () => void) {
    if (key === 'finder' || key === 'trash' || key === 'github' || key === 'cv') {
      action();
      return;
    }
    // Skip bounce animation if app is already open
    const alreadyOpen = windows.some((w) => w.appId === key && !w.minimized);
    if (alreadyOpen) {
      action();
      return;
    }
    setBouncingKeys((prev) => new Set([...prev, key]));
    setTimeout(() => {
      setBouncingKeys((prev) => {
        const n = new Set(prev);
        n.delete(key);
        return n;
      });
      action();
    }, BOUNCE_MS);
  }

  // ── Render ────────────────────────────────────────────────────────────
  const ctxTarget = ctxMenu?.targetId ? items.find((i) => i.id === ctxMenu.targetId) : null;
  const ctxX = ctxMenu ? Math.min(ctxMenu.x, window.innerWidth - 210) : 0;
  const ctxY = ctxMenu ? Math.min(ctxMenu.y, window.innerHeight - (ctxTarget ? 180 : 260)) : 0;

  return (
    <div
      className={styles.desktop}
      style={{ background: WALLPAPERS[wallpaper] }}
      onMouseDown={onDesktopMouseDown}
      onContextMenu={onDesktopCtx}
      onClick={() => {
        if (renamingId) commitRename();
        setCtxMenu(null);
      }}
      onDragOver={onDesktopDragOver}
      onDrop={onDesktopDrop}
    >
      <MenuBar />

      {/* Rubber-band rect */}
      {selRect &&
        (() => {
          const x = Math.min(selRect.x1, selRect.x2),
            y = Math.min(selRect.y1, selRect.y2);
          const w = Math.abs(selRect.x2 - selRect.x1),
            h = Math.abs(selRect.y2 - selRect.y1);
          return (
            <div className={styles.selRect} style={{ left: x, top: y, width: w, height: h }} />
          );
        })()}

      {/* Desktop icons */}
      {items.map((item, i) => {
        const pos = iconPos[item.id] ?? { x: window.innerWidth - 96, y: 54 + i * 92 };
        const selected = selectedIcons.has(item.id);
        const renaming = renamingId === item.id;
        const job = item.jobId ? jobsData.find((j) => j.id === item.jobId) : null;

        // Trickster gets a spring transition when jumping, but not while being dragged
        const isTrickster = item.id === 'trickster';
        const isDraggingMe = draggingIds.has(item.id);
        const tricksterTransition =
          isTrickster && !isDraggingMe ? 'left 0.22s ease-out, top 0.22s ease-out' : undefined;

        const isFolderTarget = nearFolderTarget === item.id;

        return (
          <div
            key={item.id}
            className={[
              styles.icon,
              selected ? styles.iconSelected : '',
              selected ? styles.iconFocused  : '',
              cleaning ? styles.iconCleaning : '',
              isDraggingMe ? styles.iconDragging : '',
              isFolderTarget ? styles.iconFolderTarget : '',
            ].join(' ')}
            style={{ left: pos.x, top: pos.y, transition: tricksterTransition }}
            onMouseDown={(e) => {
              e.stopPropagation();
              startDrag(e, item.id);
            }}
            onMouseEnter={() => {
              if (item.id !== 'trickster') return;
              // Compute every valid grid cell, exclude occupied ones, pick randomly
              const startX  = 20;
              const startY  = 54;
              const colW    = ICON_W + ICON_GAP + 4;
              const rowH    = ICON_H + ICON_GAP;
              const maxRows = Math.max(1, Math.floor((window.innerHeight - startY - 80) / rowH));
              const maxCols = Math.max(1, Math.floor((window.innerWidth  - startX)       / colW));

              // Positions of all icons except the trickster itself
              const occupied = Object.entries(iconPosRef.current)
                .filter(([id]) => id !== 'trickster')
                .map(([, p]) => p);

              const empty: IconPos[] = [];
              for (let col = 0; col < maxCols; col++) {
                for (let row = 0; row < maxRows; row++) {
                  const gx = startX + col * colW;
                  const gy = startY + row * rowH;
                  // Skip if another icon is already close to this grid cell
                  const taken = occupied.some(
                    p => Math.abs(p.x - gx) < ICON_W * 0.7 && Math.abs(p.y - gy) < ICON_H * 0.7
                  );
                  if (!taken) empty.push({ x: gx, y: gy });
                }
              }

              if (empty.length === 0) return;
              const pick = empty[Math.floor(Math.random() * empty.length)];
              setIconPos(prev => ({ ...prev, trickster: pick }));
            }}
            onDoubleClick={() => {
              if (renaming) return;
              if (item.id === 'trickster') return; // can never open it!
              if (item.type === 'app' && item.appId) {
                openWithBounce(item.appId, item.appId);
              } else if (item.type === 'job' && item.jobId) {
                openWithBounce('experience', 'experience', {
                  jobId: item.jobId,
                  title: item.label,
                });
              } else if (item.type === 'folder') {
                openWithBounce('finder', 'finder', { folderId: item.id, folderName: item.label });
              } else if (item.type === 'file') {
                openWithBounce('texteditor', 'texteditor', {
                  fileId: item.id,
                  filename: item.label,
                  content: item.content ?? `// ${item.label}\n`,
                });
              } else if (item.type === 'image') {
                openWithBounce('imageviewer', 'imageviewer', {
                  filename: item.label,
                  dataUrl: item.dataUrl ?? '',
                });
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (e.shiftKey) {
                // Shift+click toggles individual icon in selection
                setSelectedIcons((prev) => {
                  const n = new Set(prev);
                  n.has(item.id) ? n.delete(item.id) : n.add(item.id);
                  return n;
                });
              } else if (!selectedIconsRef.current.has(item.id)) {
                // Only change selection when clicking an UNSELECTED icon
                // (clicking a selected icon keeps multi-selection for drag)
                setSelectedIcons(new Set([item.id]));
              }
            }}
            onContextMenu={(e) => onIconCtx(e, item.id)}
            role="button"
            tabIndex={0}
            aria-label={item.label}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (item.type === 'app' && item.appId) openWithBounce(item.appId, item.appId);
                else if (item.type === 'job' && item.jobId)
                  openWithBounce('experience', 'experience', {
                    jobId: item.jobId,
                    title: item.label,
                  });
                else if (item.type === 'folder')
                  openWithBounce('finder', 'finder', { folderId: item.id, folderName: item.label });
                else if (item.type === 'file')
                  openWithBounce('texteditor', 'texteditor', {
                    fileId: item.id,
                    filename: item.label,
                    content: item.content ?? `// ${item.label}\n`,
                  });
                else if (item.type === 'image')
                  openWithBounce('imageviewer', 'imageviewer', {
                    filename: item.label,
                    dataUrl: item.dataUrl ?? '',
                  });
              }
              if (item.type !== 'app') {
                if (e.key === 'F2') startRename(item.id);
                if (e.key === 'Delete') deleteItem(item.id);
              }
            }}
          >
            {item.id === 'shortcut-mycomputer' ? (
              <MyComputerIcon />
            ) : item.id === 'shortcut-trash' ? (
              <DesktopTrashIcon
                full={trashedItems.length > 0 && !trashEmptied}
                glow={nearTrashTarget === 'desktop'}
              />
            ) : item.id === 'trickster' ? (
              <TricksterFolderIcon />
            ) : item.type === 'app' && item.appId === 'doom' ? (
              <DoomIcon />
            ) : item.type === 'app' && item.appId === 'snake' ? (
              <NokiaIcon />
            ) : item.type === 'folder' ? (
              <FolderIcon />
            ) : item.type === 'image' ? (
              <ImageThumbIcon dataUrl={item.dataUrl} name={item.label} />
            ) : item.type === 'file' ? (
              <FileIcon name={item.label} />
            ) : job?.logo ? (
              <img src={job.logo} alt={item.label} className={styles.iconImg} />
            ) : (
              <div className={styles.iconFallback}>{item.label[0]}</div>
            )}

            {renaming ? (
              <input
                ref={renameRef}
                className={styles.renameInput}
                value={renameVal}
                onChange={(e) => setRenameVal(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') setRenamingId(null);
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className={`${styles.iconLabel} ${selected ? styles.iconLabelFocused : ''}`}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  startRename(item.id);
                }}
              >
                {item.label}
              </span>
            )}
          </div>
        );
      })}

      {/* Open windows */}
      {windows.map((win) => {
        if (win.appId === 'snake') return <NokiaWindow key={win.id} win={win} />;
        const Comp = APP_COMPONENTS[win.appId];
        if (!Comp) return null;
        return (
          <Window key={win.id} win={win}>
            <Comp props={win.props} />
          </Window>
        );
      })}

      <Dock
        bouncingKeys={bouncingKeys}
        onItemActivate={handleDockActivate}
        trashHighlighted={nearTrashTarget === 'dock'}
      />

      {/* Context menu */}
      {ctxMenu && (
        <div
          className={styles.ctxMenu}
          style={{ left: ctxX, top: ctxY }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {ctxTarget ? (
            <>
              {ctxTarget.type === 'app' && ctxTarget.appId && (
                <>
                  <button
                    className={styles.ctxItem}
                    onClick={() => {
                      openWithBounce(ctxTarget.appId!, ctxTarget.appId!);
                      setCtxMenu(null);
                    }}
                  >
                    Open
                  </button>
                  <div className={styles.ctxDivider} />
                </>
              )}
              {ctxTarget.type === 'job' && ctxTarget.jobId && (
                <>
                  <button
                    className={styles.ctxItem}
                    onClick={() => {
                      openWithBounce('experience', 'experience', {
                        jobId: ctxTarget.jobId,
                        title: ctxTarget.label,
                      });
                      setCtxMenu(null);
                    }}
                  >
                    Open
                  </button>
                  <div className={styles.ctxDivider} />
                </>
              )}
              {ctxTarget.type !== 'app' && (
                <button className={styles.ctxItem} onClick={() => startRename(ctxTarget.id)}>
                  Rename
                </button>
              )}
              {(ctxTarget.type === 'folder' || ctxTarget.type === 'file') && (
                <button
                  className={`${styles.ctxItem} ${styles.ctxDanger}`}
                  onClick={() => deleteItem(ctxTarget.id)}
                >
                  Delete
                </button>
              )}
              <div className={styles.ctxDivider} />
              <button
                className={styles.ctxItem}
                onClick={() => {
                  setGetInfoTarget(ctxTarget);
                  setCtxMenu(null);
                }}
              >
                Get Info
              </button>
            </>
          ) : (
            <>
              <button className={styles.ctxItem} onClick={newFolder}>
                New Folder
              </button>
              <button className={styles.ctxItem} onClick={newTextFile}>
                New Text File
              </button>
              <div className={styles.ctxDivider} />
              <button
                className={styles.ctxItem}
                onClick={() => {
                  setGetInfoTarget('desktop');
                  setCtxMenu(null);
                }}
              >
                Get Info
              </button>
              <button
                className={styles.ctxItem}
                onClick={() => {
                  setShowWallpaper(true);
                  setCtxMenu(null);
                }}
              >
                Change Background…
              </button>
              <div className={styles.ctxDivider} />
              <button className={styles.ctxItem} onClick={() => cleanUp(false)}>
                Clean Up
              </button>
              <button className={styles.ctxItem} onClick={() => cleanUp(true)}>
                Clean Up By Name
              </button>
            </>
          )}
        </div>
      )}

      {getInfoTarget && (
        <GetInfoModal target={getInfoTarget} onClose={() => setGetInfoTarget(null)} />
      )}
      {showWallpaper && (
        <WallpaperPicker
          current={wallpaper}
          onChange={setWallpaper}
          onClose={() => setShowWallpaper(false)}
        />
      )}
    </div>
  );
}

export default function Desktop() {
  return (
    <DesktopProvider>
      <DesktopSurface />
    </DesktopProvider>
  );
}
