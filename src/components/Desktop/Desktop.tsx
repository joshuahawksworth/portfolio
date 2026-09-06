import { useState, useRef, useEffect, useCallback } from 'react';
import {
  DesktopProvider,
  useDesktop,
  WindowInstance,
  DesktopFolderItem,
} from '../../context/DesktopContext';
import MenuBar from '../MenuBar/MenuBar';
import SystemPanels from '../SystemUI/SystemPanels';
import { SystemUIProvider } from '../../context/SystemUIContext';
import Dock from '../Dock/Dock';
import Window from '../Window/Window';
import SnakeApp from '../apps/SnakeApp';
import RubberDuckApp from '../apps/RubberDuckApp';
import { APP_COMPONENTS } from '../apps/appRegistry';
import { jobsData } from '../../data/experienceData';
import styles from './Desktop.module.css';

type SpacePhase = 'ready' | 'playing' | 'hit';
type SpaceSprite = { x: number; y: number };

function SpaceImpactMini({
  onPushDir,
  onFire,
}: {
  onPushDir?: (cb: (d: 'U' | 'D' | 'L' | 'R') => void) => void;
  onFire?: (cb: () => void) => void;
}) {
  const [ship, setShip] = useState({ x: 2, y: 4 });
  const [shots, setShots] = useState<SpaceSprite[]>([]);
  const [rocks, setRocks] = useState<SpaceSprite[]>([
    { x: 15, y: 2 },
    { x: 18, y: 6 },
  ]);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<SpacePhase>('ready');
  const phaseRef = useRef<SpacePhase>('ready');
  const shipRef = useRef(ship);
  const shotsRef = useRef(shots);
  const rocksRef = useRef(rocks);
  const scoreRef = useRef(score);

  useEffect(() => {
    shipRef.current = ship;
  }, [ship]);
  useEffect(() => {
    shotsRef.current = shots;
  }, [shots]);
  useEffect(() => {
    rocksRef.current = rocks;
  }, [rocks]);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  function syncPhase(next: SpacePhase) {
    phaseRef.current = next;
    setPhase(next);
  }

  function start() {
    setShip({ x: 2, y: 4 });
    setShots([]);
    setRocks([
      { x: 15, y: 2 },
      { x: 18, y: 6 },
    ]);
    setScore(0);
    scoreRef.current = 0;
    syncPhase('playing');
  }

  function pushDir(d: 'U' | 'D' | 'L' | 'R') {
    if (phaseRef.current !== 'playing') return;
    setShip((prev) => ({
      x: Math.max(1, Math.min(6, prev.x + (d === 'L' ? -1 : d === 'R' ? 1 : 0))),
      y: Math.max(1, Math.min(8, prev.y + (d === 'U' ? -1 : d === 'D' ? 1 : 0))),
    }));
  }

  function fire() {
    if (phaseRef.current !== 'playing') {
      start();
      return;
    }
    const currentShip = shipRef.current;
    setShots((prev) => [...prev, { x: currentShip.x + 2, y: currentShip.y }]);
  }

  useEffect(() => {
    onPushDir?.(pushDir);
    onFire?.(fire);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (phaseRef.current !== 'playing') return;

      const nextShots = shotsRef.current
        .map((shot) => ({ ...shot, x: shot.x + 1 }))
        .filter((shot) => shot.x < 20);
      let nextRocks = rocksRef.current.map((rock) => ({ ...rock, x: rock.x - 1 }));
      let nextScore = scoreRef.current;

      nextRocks = nextRocks.filter((rock) => {
        const hit = nextShots.some((shot) => shot.x === rock.x && shot.y === rock.y);
        if (hit) nextScore += 10;
        return !hit;
      });

      if (nextRocks.length < 3) {
        nextRocks.push({ x: 19, y: 1 + Math.floor(Math.random() * 8) });
      }
      nextRocks = nextRocks.map((rock) =>
        rock.x < 0 ? { x: 19, y: 1 + Math.floor(Math.random() * 8) } : rock
      );

      const crashed = nextRocks.some(
        (rock) => Math.abs(rock.x - shipRef.current.x) <= 1 && rock.y === shipRef.current.y
      );
      if (crashed) syncPhase('hit');

      setShots(nextShots);
      setRocks(nextRocks);
      setScore(nextScore);
      scoreRef.current = nextScore;
    }, 160);

    return () => window.clearInterval(id);
  }, []);

  return (
    <div className={styles.spaceGame}>
      <div className={styles.spaceHud}>
        <span>SPACE IMPACT</span>
        <span>{score}</span>
      </div>
      <div className={styles.spaceField}>
        <div
          className={styles.spaceShip}
          style={{ left: `${ship.x * 5}%`, top: `${ship.y * 10}%` }}
        />
        {shots.map((shot, index) => (
          <div
            key={`shot-${index}-${shot.x}-${shot.y}`}
            className={styles.spaceShot}
            style={{ left: `${shot.x * 5}%`, top: `${shot.y * 10 + 2}%` }}
          />
        ))}
        {rocks.map((rock, index) => (
          <div
            key={`rock-${index}-${rock.x}-${rock.y}`}
            className={styles.spaceRock}
            style={{ left: `${rock.x * 5}%`, top: `${rock.y * 10}%` }}
          />
        ))}
        {phase !== 'playing' && (
          <div className={styles.spaceOverlay}>
            <strong>{phase === 'hit' ? 'SIGNAL LOST' : 'CODE 3310'}</strong>
            <span>{phase === 'hit' ? 'Center key to retry' : 'Center key to start'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── NokiaWindow ── custom Nokia phone frame for Snake ─────────────────────
function NokiaWindow({ win }: { win: WindowInstance }) {
  const { closeWindow, focusWindow, moveWindow, focusedId } = useDesktop();
  const posRef = useRef({ x: win.x, y: win.y });
  const [pos, setPos] = useState({ x: win.x, y: win.y });
  const [phoneMode, setPhoneMode] = useState<'snake' | 'space'>('snake');
  const phoneModeRef = useRef(phoneMode);

  const pushDirRef = useRef<((d: 'U' | 'D' | 'L' | 'R') => void) | null>(null);
  const startGameRef = useRef<(() => void) | null>(null);
  const spacePushDirRef = useRef<((d: 'U' | 'D' | 'L' | 'R') => void) | null>(null);
  const spaceFireRef = useRef<(() => void) | null>(null);
  const phoneCodeRef = useRef('');

  useEffect(() => {
    phoneModeRef.current = phoneMode;
  }, [phoneMode]);

  const handlePushDir = useCallback((cb: (d: 'U' | 'D' | 'L' | 'R') => void) => {
    pushDirRef.current = cb;
  }, []);
  const handleStartGame = useCallback((cb: () => void) => {
    startGameRef.current = cb;
  }, []);
  const handleSpacePushDir = useCallback((cb: (d: 'U' | 'D' | 'L' | 'R') => void) => {
    spacePushDirRef.current = cb;
  }, []);
  const handleSpaceFire = useCallback((cb: () => void) => {
    spaceFireRef.current = cb;
  }, []);

  function pushPhoneDir(d: 'U' | 'D' | 'L' | 'R') {
    if (phoneModeRef.current === 'space') spacePushDirRef.current?.(d);
    else pushDirRef.current?.(d);
  }

  function pressPhoneOk() {
    if (phoneModeRef.current === 'space') spaceFireRef.current?.();
    else startGameRef.current?.();
  }

  function pressPhoneKey(k: string) {
    phoneCodeRef.current = `${phoneCodeRef.current}${k}`.slice(-8);
    if (phoneCodeRef.current.endsWith('3310')) {
      phoneModeRef.current = 'space';
      setPhoneMode('space');
      phoneCodeRef.current = '';
    }
    if (k === '*') {
      phoneModeRef.current = 'snake';
      setPhoneMode('snake');
    }
    if (phoneModeRef.current === 'space' && k === '#') spaceFireRef.current?.();
  }

  function getPhoneKeyboardKey(e: KeyboardEvent) {
    if (/^[0-9*#]$/.test(e.key)) return e.key;
    if (/^Numpad[0-9]$/.test(e.code)) return e.code.replace('Numpad', '');
    if (e.code === 'NumpadMultiply') return '*';
    return null;
  }

  // Keyboard: forward to game
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (focusedId !== win.id || e.defaultPrevented) return;
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
        e.preventDefault();
        pressPhoneOk();
        return;
      }
      const phoneKey = getPhoneKeyboardKey(e);
      if (phoneKey) {
        e.preventDefault();
        pressPhoneKey(phoneKey);
        return;
      }
      const d = MAP[e.key];
      if (d) {
        e.preventDefault();
        pushPhoneDir(d);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusedId, win.id]);

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
            {phoneMode === 'space' ? (
              <SpaceImpactMini onPushDir={handleSpacePushDir} onFire={handleSpaceFire} />
            ) : (
              <SnakeApp onPushDir={handlePushDir} onStartGame={handleStartGame} hideDpad={true} />
            )}
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
              pushPhoneDir('U');
            }}
          >
            ▲
          </button>
          <div className={styles.navRow}>
            <button
              className={styles.navBtn}
              onPointerDown={(e) => {
                e.preventDefault();
                pushPhoneDir('L');
              }}
            >
              ◄
            </button>
            <div
              className={styles.navCenterBtn}
              onPointerDown={(e) => {
                e.preventDefault();
                pressPhoneOk();
              }}
            />
            <button
              className={styles.navBtn}
              onPointerDown={(e) => {
                e.preventDefault();
                pushPhoneDir('R');
              }}
            >
              ►
            </button>
          </div>
          <button
            className={styles.navBtn}
            onPointerDown={(e) => {
              e.preventDefault();
              pushPhoneDir('D');
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
              pressPhoneOk();
            }}
          >
            {phoneMode === 'space' ? 'Fire' : 'Play'}
          </button>
          <div className={styles.nokiaCallBtns}>
            <button className={styles.nokiaCallBtn} style={{ background: '#1e6b2e' }} />
            <button className={styles.nokiaCallBtn} style={{ background: '#6b1e1e' }} />
          </div>
          <button
            className={styles.nokiaSoftKey}
            onPointerDown={(e) => {
              e.preventDefault();
              setPhoneMode((mode) => (mode === 'space' ? 'snake' : mode));
            }}
          >
            Menu
          </button>
        </div>

        {/* Numpad */}
        <div className={styles.nokiaNumpad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
            <button
              key={k}
              className={styles.nokiaNumKey}
              onPointerDown={(e) => {
                e.preventDefault();
                pressPhoneKey(k);
              }}
            >
              {k}
            </button>
          ))}
        </div>

        <div className={styles.nokiaChin} />
      </div>
    </div>
  );
}

function DuckWindow({ win }: { win: WindowInstance }) {
  const { closeWindow, focusWindow, moveWindow } = useDesktop();
  const posRef = useRef({ x: win.x, y: win.y });
  const [pos, setPos] = useState({ x: win.x, y: win.y });

  function onDuckMouseDown(e: React.MouseEvent) {
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
      className={styles.duckWindow}
      style={{ left: pos.x, top: pos.y, zIndex: win.zIndex }}
      onMouseDown={(e) => {
        e.stopPropagation();
        focusWindow(win.id);
      }}
    >
      <div onMouseDown={onDuckMouseDown}>
        <RubberDuckApp frameless onClose={() => closeWindow(win.id)} />
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
  dataUrl?: string; // base64 data URL for uploaded images
}

interface CtxMenu {
  x: number;
  y: number;
  targetId?: string;
}

// ── Wallpapers ─────────────────────────────────────────────────────────────
const WALLPAPERS = {
  gold: '/wallpapers/golden-gate.jpg',
  catalina: '/wallpapers/catalina-night.jpg',
  tahoe: '/wallpapers/tahoe-day.jpg',
  wave: '/wallpapers/blue-wave.jpg',
} as const;
type WallpaperKey = keyof typeof WALLPAPERS;

/** Wallpapers dark enough that the menu bar should flip to white text (like macOS). */
const DARK_WALLPAPERS: ReadonlySet<WallpaperKey> = new Set<WallpaperKey>(['catalina', 'wave']);

const WALLPAPER_LABELS: Record<WallpaperKey, string> = {
  gold: 'Golden Gate',
  catalina: 'Catalina',
  tahoe: 'Tahoe',
  wave: 'Sequoia',
};

// ── Constants ──────────────────────────────────────────────────────────────
const ICON_W = 76;
const ICON_H = 84;
const ICON_GAP = 8;
const BOUNCE_MS = 1850; // matches 1800ms animation + 50ms buffer

const DESKTOP_TRASH_BLOCKLIST = new Set(['shortcut-trash', 'shortcut-mycomputer', 'trickster']);

function canTrashDesktopItem(item: DesktopItem): boolean {
  return (
    (item.type === 'folder' || item.type === 'file' || item.type === 'image') &&
    !DESKTOP_TRASH_BLOCKLIST.has(item.id)
  );
}

// ── Grid helper ───────────────────────────────────────────────────────────
// Returns the first grid cell not already occupied by any icon in `taken`.
// `taken` is a snapshot of current iconPos — mutate a local copy to reserve
// cells for multiple items being placed in the same batch.
// Icons are laid out macOS-style: the first column hugs the right edge, then
// columns grow leftwards.
const GRID_START_Y = 54;
const GRID_RIGHT_PAD = 20;
function gridColX(col: number): number {
  const colW = ICON_W + ICON_GAP + 4;
  return window.innerWidth - GRID_RIGHT_PAD - ICON_W - col * colW;
}

function findEmptyGridCell(taken: Record<string, IconPos>): IconPos {
  const startX = GRID_RIGHT_PAD;
  const startY = GRID_START_Y;
  const colW = ICON_W + ICON_GAP + 4;
  const rowH = ICON_H + ICON_GAP;
  const maxRows = Math.max(1, Math.floor((window.innerHeight - startY - 80) / rowH));
  const maxCols = Math.max(1, Math.floor((window.innerWidth - startX) / colW));

  const occupied = Object.values(taken);

  for (let col = 0; col < maxCols; col++) {
    for (let row = 0; row < maxRows; row++) {
      const gx = gridColX(col);
      const gy = startY + row * rowH;
      const hit = occupied.some(
        (p) => Math.abs(p.x - gx) < ICON_W * 0.7 && Math.abs(p.y - gy) < ICON_H * 0.7
      );
      if (!hit) return { x: gx, y: gy };
    }
  }
  // All cells full — overflow below the grid
  const n = Object.keys(taken).length;
  return {
    x: gridColX(0),
    y: startY + (n % maxRows) * rowH + maxRows * rowH,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────
// Desktop-level app shortcuts
const APP_SHORTCUTS: DesktopItem[] = [
  { id: 'shortcut-mycomputer', type: 'app', label: 'Macintosh HD', appId: 'finder' },
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
  const startY = GRID_START_Y;
  const maxRows = Math.max(1, Math.floor((window.innerHeight - startY - 80) / (ICON_H + ICON_GAP)));
  const result: Record<string, IconPos> = {};
  items.forEach((item, i) => {
    result[item.id] = {
      x: gridColX(Math.floor(i / maxRows)),
      y: startY + (i % maxRows) * (ICON_H + ICON_GAP),
    };
  });
  return result;
}

function computeCleanPositions(items: DesktopItem[], sortByName: boolean): Record<string, IconPos> {
  const sorted = sortByName
    ? [...items].sort((a, b) => a.label.localeCompare(b.label))
    : [...items];
  const startY = GRID_START_Y;
  const maxRows = Math.max(1, Math.floor((window.innerHeight - startY - 80) / (ICON_H + ICON_GAP)));
  const result: Record<string, IconPos> = {};
  sorted.forEach((item, i) => {
    result[item.id] = {
      x: gridColX(Math.floor(i / maxRows)),
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
        style={{
          width: 48,
          height: 48,
          borderRadius: 6,
          objectFit: 'cover',
          display: 'block',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}
      />
    );
  }
  // Fallback generic image icon
  return (
    <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
      <rect
        x="2"
        y="4"
        width="44"
        height="40"
        rx="5"
        fill="#1e3a4a"
        stroke="#06b6d4"
        strokeWidth="1.5"
      />
      <circle cx="16" cy="16" r="4" fill="#06b6d4" opacity="0.7" />
      <path d="M4 34 L14 22 L22 30 L32 18 L44 34Z" fill="#06b6d4" opacity="0.35" />
      <path
        d="M4 34 L14 22 L22 30 L32 18 L44 34"
        stroke="#06b6d4"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
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
  // Macintosh HD — a light grey drive with a soft top light, like macOS Golden Gate
  return (
    <svg viewBox="0 0 52 52" fill="none" width="50" height="50">
      <defs>
        <linearGradient id="hdBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9e6e1" />
          <stop offset="1" stopColor="#b9b4ad" />
        </linearGradient>
        <linearGradient id="hdFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7f5f1" />
          <stop offset="1" stopColor="#d7d2ca" />
        </linearGradient>
      </defs>
      <rect x="4" y="9" width="44" height="34" rx="9" fill="url(#hdBody)" />
      <rect x="4.5" y="9.5" width="43" height="33" rx="8.5" stroke="rgba(255,255,255,0.7)" />
      <rect x="9" y="14" width="34" height="18" rx="5" fill="url(#hdFace)" />
      <rect x="9.5" y="14.5" width="33" height="17" rx="4.5" stroke="rgba(0,0,0,0.06)" />
      <rect x="13" y="35" width="26" height="3" rx="1.5" fill="rgba(0,0,0,0.12)" />
      <circle cx="40" cy="36.5" r="1.6" fill="#34c759" />
      <path d="M14 19h24" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 23h16" stroke="rgba(0,0,0,0.06)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function DesktopTrashIcon({ full, glow }: { full: boolean; glow?: boolean }) {
  // Frosted grey bin — translucent body so the wallpaper shows through slightly
  return (
    <svg
      viewBox="0 0 52 56"
      fill="none"
      width="46"
      height="50"
      style={
        glow
          ? {
              filter:
                'drop-shadow(0 0 8px rgba(0,122,255,0.7)) drop-shadow(0 0 16px rgba(0,122,255,0.4))',
            }
          : { filter: 'drop-shadow(0 4px 8px rgba(70,40,10,0.22))' }
      }
    >
      <defs>
        <linearGradient id="binBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f4f2ee" stopOpacity="0.92" />
          <stop offset="0.5" stopColor="#d9d5ce" stopOpacity="0.9" />
          <stop offset="1" stopColor="#c8c3bb" stopOpacity="0.92" />
        </linearGradient>
        <linearGradient id="binLid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbfaf8" />
          <stop offset="1" stopColor="#d2cdc5" />
        </linearGradient>
      </defs>
      {full && (
        <g>
          <rect
            x="17"
            y="7"
            width="6"
            height="10"
            rx="1.5"
            fill="#f2c96b"
            transform="rotate(-12 20 12)"
          />
          <rect x="25" y="5" width="6" height="12" rx="1.5" fill="#fff" stroke="rgba(0,0,0,0.12)" />
          <rect
            x="31"
            y="8"
            width="6"
            height="9"
            rx="1.5"
            fill="#9fd0ff"
            transform="rotate(10 34 12)"
          />
        </g>
      )}
      <path d="M11 17h30l-3.2 30.5a3 3 0 0 1-3 2.5H17.2a3 3 0 0 1-3-2.5Z" fill="url(#binBody)" />
      <path
        d="M11.5 17.5h29l-3.1 29.9a2.5 2.5 0 0 1-2.5 2.1H17.1a2.5 2.5 0 0 1-2.5-2.1Z"
        stroke="rgba(0,0,0,0.12)"
      />
      <path
        d="M18 22l1.5 24M26 22v24M34 22l-1.5 24"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M17 18c0-1 1-2 2-2h14c1 0 2 1 2 2" fill="none" />
      <rect x="9" y="14" width="34" height="4.5" rx="2.25" fill="url(#binLid)" />
      <rect x="9.5" y="14.5" width="33" height="3.5" rx="1.75" stroke="rgba(0,0,0,0.12)" />
      <rect
        x="22"
        y="11"
        width="8"
        height="3.5"
        rx="1.75"
        fill="#e2ddd5"
        stroke="rgba(0,0,0,0.12)"
      />
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
      {/* Nokia logo — pixel-art rects, no font dependency */}
      <g fill="#5a78a0" opacity="0.9">
        {/* N */}
        <rect x="11" y="29" width="1" height="4" />
        <rect x="12" y="30" width="1" height="1" />
        <rect x="13" y="31" width="1" height="1" />
        <rect x="14" y="29" width="1" height="4" />
        {/* O */}
        <rect x="16" y="29" width="3" height="1" />
        <rect x="16" y="32" width="3" height="1" />
        <rect x="16" y="30" width="1" height="2" />
        <rect x="18" y="30" width="1" height="2" />
        {/* K */}
        <rect x="20" y="29" width="1" height="4" />
        <rect x="21" y="30" width="1" height="1" />
        <rect x="22" y="29" width="1" height="1" />
        <rect x="22" y="31" width="1" height="1" />
        <rect x="23" y="32" width="1" height="1" />
        {/* I */}
        <rect x="25" y="29" width="3" height="1" />
        <rect x="26" y="30" width="1" height="2" />
        <rect x="25" y="32" width="3" height="1" />
        {/* A */}
        <rect x="29" y="30" width="3" height="1" />
        <rect x="29" y="29" width="1" height="4" />
        <rect x="31" y="29" width="1" height="4" />
        <rect x="30" y="31" width="1" height="1" />
      </g>
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
              style={{ backgroundImage: `url(${WALLPAPERS[key]})` }}
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
  const [wallpaper, setWallpaperState] = useState<WallpaperKey>(() => {
    try {
      const saved = localStorage.getItem('portfolio.wallpaper');
      return saved && saved in WALLPAPERS ? (saved as WallpaperKey) : 'gold';
    } catch {
      return 'gold';
    }
  });
  const setWallpaper = useCallback((k: WallpaperKey) => {
    setWallpaperState(k);
    try {
      localStorage.setItem('portfolio.wallpaper', k);
    } catch {
      /* private mode */
    }
  }, []);
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
      setItems((prev) => {
        if (prev.some((i) => i.id === uf.id)) return prev;
        return [
          ...prev,
          { id: uf.id, type, label: uf.name, content: uf.content, dataUrl: uf.dataUrl },
        ];
      });
      setIconPos((prev) => ({ ...prev, [uf.id]: pos }));
      ackUploadedFile(uf.id);
    }
  }, [uploadedFileQueue, ackUploadedFile]);

  // Process items moved back to desktop from a Finder folder
  useEffect(() => {
    if (pendingFromFolder.length === 0) return;
    const claimed = { ...iconPosRef.current };
    for (const fi of pendingFromFolder) {
      // Remove from local folderItems so the sync doesn't restore it back to context
      setFolderItems((prev) => {
        const next = { ...prev };
        for (const folderId in next) {
          next[folderId] = next[folderId].filter((item) => item.id !== fi.id);
        }
        return next;
      });
      const pos = findEmptyGridCell(claimed);
      claimed[fi.id] = pos;
      setItems((prev) => {
        if (prev.some((i) => i.id === fi.id)) return prev;
        return [
          ...prev,
          {
            id: fi.id,
            type: fi.type,
            label: fi.label,
            jobId: fi.jobId,
            appId: fi.appId,
            content: fi.content,
            dataUrl: fi.dataUrl,
          },
        ];
      });
      setIconPos((prev) => ({ ...prev, [fi.id]: pos }));
      ackFromFolder(fi.id);
    }
  }, [pendingFromFolder, ackFromFolder]);

  // Handle restored items from trash — add them back to desktop
  useEffect(() => {
    if (restoredItemQueue.length === 0) return;
    const claimed = { ...iconPosRef.current };
    for (const item of restoredItemQueue) {
      const type: DesktopItem['type'] = item.dataUrl ? 'image' : item.isJoke ? 'file' : 'folder';
      const pos = findEmptyGridCell(claimed);
      claimed[item.id] = pos;
      setItems((prev) => {
        if (prev.some((i) => i.id === item.id)) return prev;
        return [
          ...prev,
          { id: item.id, type, label: item.name, content: item.content, dataUrl: item.dataUrl },
        ];
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
    } catch {
      /* bad payload */
    }
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
          if (item && canTrashDesktopItem(item)) {
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
  function trashDesktopItem(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item || !canTrashDesktopItem(item)) return;
    trashItem({
      id,
      name: item.label,
      date: new Date().toLocaleDateString('en-GB'),
      isJoke: item.type === 'file' || item.type === 'image',
      content: item.content,
      dataUrl: item.dataUrl,
    });
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
      className={`${styles.desktop} ${DARK_WALLPAPERS.has(wallpaper) ? styles.desktopDark : ''}`}
      onMouseDown={onDesktopMouseDown}
      onContextMenu={onDesktopCtx}
      onClick={() => {
        if (renamingId) commitRename();
        setCtxMenu(null);
      }}
      onDragOver={onDesktopDragOver}
      onDrop={onDesktopDrop}
    >
      <div
        className={styles.wallpaper}
        style={{ backgroundImage: `url(${WALLPAPERS[wallpaper]})` }}
        aria-hidden
      />
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
        const pos = iconPos[item.id] ?? { x: gridColX(0), y: GRID_START_Y + i * 92 };
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
              selected ? styles.iconFocused : '',
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
              const startX = GRID_RIGHT_PAD;
              const startY = GRID_START_Y;
              const colW = ICON_W + ICON_GAP + 4;
              const rowH = ICON_H + ICON_GAP;
              const maxRows = Math.max(1, Math.floor((window.innerHeight - startY - 80) / rowH));
              const maxCols = Math.max(1, Math.floor((window.innerWidth - startX) / colW));

              // Positions of all icons except the trickster itself
              const occupied = Object.entries(iconPosRef.current)
                .filter(([id]) => id !== 'trickster')
                .map(([, p]) => p);

              const empty: IconPos[] = [];
              for (let col = 0; col < maxCols; col++) {
                for (let row = 0; row < maxRows; row++) {
                  const gx = gridColX(col);
                  const gy = startY + row * rowH;
                  // Skip if another icon is already close to this grid cell
                  const taken = occupied.some(
                    (p) => Math.abs(p.x - gx) < ICON_W * 0.7 && Math.abs(p.y - gy) < ICON_H * 0.7
                  );
                  if (!taken) empty.push({ x: gx, y: gy });
                }
              }

              if (empty.length === 0) return;
              const pick = empty[Math.floor(Math.random() * empty.length)];
              setIconPos((prev) => ({ ...prev, trickster: pick }));
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
                  if (n.has(item.id)) {
                    n.delete(item.id);
                  } else {
                    n.add(item.id);
                  }
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
              if (item.type !== 'app' && item.type !== 'job') {
                if (e.key === 'F2') startRename(item.id);
              }
              if (e.key === 'Delete' && canTrashDesktopItem(item)) trashDesktopItem(item.id);
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
        if (win.appId === 'rubberduck') return <DuckWindow key={win.id} win={win} />;
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

      <SystemPanels />

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
              {ctxTarget.type !== 'app' && ctxTarget.type !== 'job' && (
                <button className={styles.ctxItem} onClick={() => startRename(ctxTarget.id)}>
                  Rename
                </button>
              )}
              {canTrashDesktopItem(ctxTarget) && (
                <button
                  className={`${styles.ctxItem} ${styles.ctxDanger}`}
                  onClick={() => trashDesktopItem(ctxTarget.id)}
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
      <SystemUIProvider>
        <DesktopSurface />
      </SystemUIProvider>
    </DesktopProvider>
  );
}
