import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  DesktopProvider,
  useDesktop,
  canMoveNode,
  canRenameNode,
  canTrashNode,
  type FsNode,
  type WindowInstance,
} from '../../context/DesktopContext';
import { ROOT_IDS } from '../../data/fileSystemSeed';
import { openTargetFor } from '../../lib/openNode';
import { NodeIcon, nodeKind } from '../icons/NodeIcon';
import { PlatformFolderIcon } from '../icons/PlatformFileIcons';
import { FINDER_DRAG_TYPE } from '../apps/FinderApp';
import MenuBar from '../MenuBar/MenuBar';
import Taskbar from '../Taskbar/Taskbar';
import SystemPanels from '../SystemUI/SystemPanels';
import NotificationBanners from '../SystemUI/NotificationBanners';
import DynamicWallpaper, { isDynamicDark, useDynamicLook } from './DynamicWallpaper';
import { useWelcomeNotifications } from '../../hooks/useWelcomeNotifications';
import { SystemUIProvider } from '../../context/SystemUIContext';
import { useSettings } from '../../context/SettingsContext';
import { currentOs, nodeDisplayName } from '../../theme/platform';
import DesktopWidgets from './DesktopWidgets';
import {
  DARK_WALLPAPERS,
  WALLPAPERS,
  WALLPAPER_LABELS,
  availableWallpapersFor,
  preloadWallpapers,
  type WallpaperKey,
} from '../../data/wallpapers';
import type { OsName } from '../../lib/settingsStore';
import Dock from '../Dock/Dock';
import Window from '../Window/Window';
import SnakeApp from '../apps/SnakeApp';
import RubberDuckApp from '../apps/RubberDuckApp';
import { APP_COMPONENTS } from '../apps/appRegistry';
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

/** A desktop icon: a thin view over a file-system node that lives in the Desktop folder. */
interface DesktopItem {
  id: string;
  type: FsNode['type'];
  label: string;
  appId?: string;
  node: FsNode;
}

interface CtxMenu {
  x: number;
  y: number;
  targetId?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
const ICON_W = 76;
const ICON_H = 84;
const ICON_GAP = 8;
// The dock reports when its launch bounce ends; this only clears a bounce whose animationend
// never arrived (animations disabled, tab hidden). Windows open immediately regardless.
const BOUNCE_MS = 4000;

function toItem(node: FsNode): DesktopItem {
  return {
    id: node.id,
    type: node.type,
    label: node.name,
    appId: node.appId,
    node,
  };
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
  if (currentOs() === 'windows') return GRID_RIGHT_PAD + col * colW;
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

// All icons stack down the RIGHT side in as many columns as needed
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
  return initPositions(sorted);
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
  const kind = isDesktop ? 'Folder' : nodeKind((target as DesktopItem).node);
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
          {isDesktop ? (
            <PlatformFolderIcon os={currentOs()} size={48} />
          ) : (
            <NodeIcon node={(target as DesktopItem).node} size={48} />
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
              ) : (
                <>
                  <tr>
                    <td>Created:</td>
                    <td>
                      {new Date((target as DesktopItem).node.createdAt).toLocaleDateString('en-GB')}
                    </td>
                  </tr>
                  <tr>
                    <td>Modified:</td>
                    <td>
                      {new Date((target as DesktopItem).node.modifiedAt).toLocaleDateString(
                        'en-GB'
                      )}
                    </td>
                  </tr>
                </>
              )}
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
  os,
  current,
  onChange,
  onClose,
}: {
  os: OsName;
  current: WallpaperKey;
  onChange: (k: WallpaperKey) => void;
  onClose: () => void;
}) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.wallpaperPicker} onClick={(e) => e.stopPropagation()}>
        <div className={styles.wallpaperTitle}>
          {os === 'windows' ? 'Choose a background' : 'Change Background'}
        </div>
        <div className={styles.wallpaperSwatches}>
          {availableWallpapersFor(os).map((key) => (
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
    focusedId,
    blurWindows,
    openApp,
    childrenOf,
    createFolder,
    createFile,
    renameNode,
    moveNodes,
    trashNodes,
    trashCount,
  } = useDesktop();

  const { settings, os, wallpaper, setWallpaper } = useSettings();
  const isWindows = os === 'windows';
  useWelcomeNotifications();
  const dynamicLook = useDynamicLook(wallpaper);

  // Desktop icons are simply the children of the Desktop folder.
  const items = useMemo(
    () =>
      childrenOf(ROOT_IDS.desktop).map((node) => {
        const item = toItem(node);
        return { ...item, label: nodeDisplayName(node.id, item.label, os) };
      }),
    [childrenOf, os]
  );

  const [iconPos, setIconPos] = useState<Record<string, IconPos>>(() => initPositions(items));
  const [selectedIcons, setSelectedIcons] = useState<Set<string>>(new Set());
  const [selRect, setSelRect] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(
    null
  );
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [getInfoTarget, setGetInfoTarget] = useState<'desktop' | DesktopItem | null>(null);
  const [showWallpaper, setShowWallpaper] = useState(false);
  useEffect(() => preloadWallpapers(os), [os]);
  const [cleaning, setCleaning] = useState(false);
  const [bouncingKeys, setBouncingKeys] = useState<Set<string>>(new Set());
  const [nearTrashTarget, setNearTrashTarget] = useState<'dock' | 'desktop' | null>(null);
  const [draggingIds, setDraggingIds] = useState<Set<string>>(new Set());
  const [nearFolderTarget, setNearFolderTarget] = useState<string | null>(null);

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

  // Give newly arrived icons (uploads, restores, items moved out of folders) a free
  // grid cell, and forget positions of icons that left the desktop.
  useEffect(() => {
    setIconPos((prev) => {
      const ids = new Set(items.map((i) => i.id));
      let changed = false;
      const next: Record<string, IconPos> = {};
      for (const id in prev) {
        if (ids.has(id)) next[id] = prev[id];
        else changed = true;
      }
      for (const item of items) {
        if (!next[item.id]) {
          next[item.id] = findEmptyGridCell(next);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setSelectedIcons((prev) => {
      const ids = new Set(items.map((i) => i.id));
      const kept = Array.from(prev).filter((id) => ids.has(id));
      return kept.length === prev.size ? prev : new Set(kept);
    });
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

  // ── Trash / move helpers (work on many icons at once) ─────────────────
  const trashIds = useCallback(
    (ids: string[]) => {
      const trashable = ids.filter((id) => {
        const item = itemsRef.current.find((i) => i.id === id);
        return item && canTrashNode(item.node);
      });
      if (trashable.length === 0) return;
      trashNodes(trashable);
      setSelectedIcons(new Set());
      setCtxMenu(null);
    },
    [trashNodes]
  );

  /** Ids the context menu / keyboard should act on: the whole selection if it includes the target. */
  function actionIds(targetId: string): string[] {
    const sel = selectedIconsRef.current;
    return sel.has(targetId) ? Array.from(sel) : [targetId];
  }

  // Desktop-wide shortcuts while no window has focus: ⌘A selects all, ⌘⌫ / Delete trashes.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (focusedId) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const cmd = e.metaKey || e.ctrlKey;
      if (cmd && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelectedIcons(new Set(itemsRef.current.map((i) => i.id)));
      } else if ((cmd && e.key === 'Backspace') || e.key === 'Delete') {
        if (selectedIconsRef.current.size > 0) {
          e.preventDefault();
          trashIds(Array.from(selectedIconsRef.current));
        }
      } else if (e.key === 'Escape') {
        setSelectedIcons(new Set());
        setCtxMenu(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusedId, trashIds]);

  // ── Finder → Desktop drag-and-drop ────────────────────────────────────
  function onDesktopDragOver(e: React.DragEvent) {
    if (!e.dataTransfer.types.includes(FINDER_DRAG_TYPE)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }
  function onDesktopDrop(e: React.DragEvent) {
    const raw = e.dataTransfer.getData(FINDER_DRAG_TYPE);
    if (!raw) return;
    try {
      const { ids } = JSON.parse(raw) as { ids: string[] };
      if (!Array.isArray(ids) || ids.length === 0) return;
      // Land the icons where they were dropped, fanning out extra ones below.
      const claimed = { ...iconPosRef.current };
      ids.forEach((id, i) => {
        claimed[id] = {
          x: Math.max(0, Math.min(e.clientX - ICON_W / 2, window.innerWidth - ICON_W - 4)),
          y: Math.max(
            44,
            Math.min(e.clientY - 20 + i * (ICON_H + ICON_GAP), window.innerHeight - ICON_H - 4)
          ),
        };
      });
      setIconPos(claimed);
      moveNodes(ids, ROOT_IDS.desktop);
    } catch {
      /* bad payload */
    }
  }

  // ── Open with bounce animation ─────────────────────────────────────────
  function clearBounce(dockKey: string) {
    setBouncingKeys((prev) => {
      if (!prev.has(dockKey)) return prev;
      const n = new Set(prev);
      n.delete(dockKey);
      return n;
    });
  }

  function openWithBounce(dockKey: string, appId: string, props?: Record<string, unknown>) {
    // Skip animation entirely when an instance of this app is already running
    const alreadyRunning = windows.some((w) => w.appId === appId && !w.minimized);
    openApp(appId, props);
    if (alreadyRunning) return;
    setBouncingKeys((prev) => new Set([...prev, dockKey]));
    setTimeout(() => {
      setBouncingKeys((prev) => {
        const n = new Set(prev);
        n.delete(dockKey);
        return n;
      });
    }, BOUNCE_MS);
  }

  function openItem(item: DesktopItem) {
    if (item.id === 'trickster') return; // can never open it!
    const target = openTargetFor(item.node);
    if (target.kind === 'folder') {
      openWithBounce('finder', 'finder', { folderId: item.id, folderName: item.label });
    } else if (target.kind === 'url') {
      window.open(target.url, '_blank');
    } else {
      openWithBounce(target.appId, target.appId, target.props);
    }
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
    // Clear selection immediately on bare-desktop mousedown; the desktop is frontmost now.
    setSelectedIcons(new Set());
    blurWindows();

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

      // Drop into folder? (locked items such as Macintosh HD are refused by the file system)
      const targetFolder = getHoveredFolder(ev.clientX, ev.clientY);
      if (targetFolder) {
        const movable = dragIds.filter((did) => {
          const item = itemsRef.current.find((i) => i.id === did);
          return item && did !== targetFolder && canMoveNode(item.node);
        });
        if (movable.length > 0) {
          moveNodes(movable, targetFolder);
          setSelectedIcons(new Set());
        } else {
          // Snap protected items back to where they started
          setIconPos((prev) => ({ ...prev, ...origins }));
        }
        return;
      }

      // Drop into trash?
      if (getHoveredTrash(ev.clientX, ev.clientY) !== null) {
        const trashable = dragIds.filter((did) => {
          const item = itemsRef.current.find((i) => i.id === did);
          return item && canTrashNode(item.node);
        });
        if (trashable.length > 0) trashIds(trashable);
        // Anything that can't be trashed springs back
        const stay = dragIds.filter((did) => !trashable.includes(did));
        if (stay.length > 0) {
          setIconPos((prev) => {
            const next = { ...prev };
            for (const did of stay) next[did] = origins[did];
            return next;
          });
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

  // ── Folder / file creation ────────────────────────────────────────────
  function spawnPosition(): IconPos {
    return ctxMenu
      ? { x: Math.max(0, ctxMenu.x - ICON_W / 2), y: Math.max(48, ctxMenu.y - 20) }
      : { x: Math.round(window.innerWidth / 2), y: Math.round(window.innerHeight / 2) };
  }

  function newFolder() {
    const pos = spawnPosition();
    const id = createFolder(ROOT_IDS.desktop);
    setIconPos((prev) => ({ ...prev, [id]: pos }));
    setSelectedIcons(new Set([id]));
    setCtxMenu(null);
    setRenameVal('untitled folder');
    setRenamingId(id);
  }

  function newTextFile() {
    const pos = spawnPosition();
    const id = createFile(ROOT_IDS.desktop, 'untitled.txt');
    setIconPos((prev) => ({ ...prev, [id]: pos }));
    setSelectedIcons(new Set([id]));
    setCtxMenu(null);
    setRenameVal('untitled.txt');
    setRenamingId(id);
  }

  // ── Rename ────────────────────────────────────────────────────────────
  function startRename(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item || !canRenameNode(item.node)) return;
    setRenameVal(item.label);
    setRenamingId(id);
    setCtxMenu(null);
  }
  function commitRename() {
    if (!renamingId) return;
    renameNode(renamingId, renameVal);
    setRenamingId(null);
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
    if (key === 'finder' || key === 'trash' || key === 'cv') {
      action();
      return;
    }
    // Skip bounce animation if app is already open
    const alreadyOpen = windows.some((w) => w.appId === key && !w.minimized);
    if (alreadyOpen) {
      action();
      return;
    }
    action();
    setBouncingKeys((prev) => new Set([...prev, key]));
    setTimeout(() => {
      setBouncingKeys((prev) => {
        const n = new Set(prev);
        n.delete(key);
        return n;
      });
    }, BOUNCE_MS);
  }

  // ── Render ────────────────────────────────────────────────────────────
  const ctxTarget = ctxMenu?.targetId ? items.find((i) => i.id === ctxMenu.targetId) : null;
  const ctxIds = ctxTarget ? actionIds(ctxTarget.id) : [];
  const ctxTrashable = ctxIds.filter((id) => {
    const item = items.find((i) => i.id === id);
    return item && canTrashNode(item.node);
  });
  const ctxX = ctxMenu ? Math.min(ctxMenu.x, window.innerWidth - 256) : 0;
  const ctxY = ctxMenu ? Math.min(ctxMenu.y, window.innerHeight - (ctxTarget ? 180 : 260)) : 0;
  const trashFull = trashCount > 0;
  void settings;

  return (
    <div
      className={[
        styles.desktop,
        DARK_WALLPAPERS.has(wallpaper) || isDynamicDark(dynamicLook) ? styles.desktopDark : '',
        isWindows ? styles.desktopWin : '',
      ].join(' ')}
      data-os={os}
      onMouseDown={onDesktopMouseDown}
      onContextMenu={onDesktopCtx}
      onClick={() => {
        if (renamingId) commitRename();
        setCtxMenu(null);
      }}
      onDragOver={onDesktopDragOver}
      onDrop={onDesktopDrop}
    >
      {/* Every wallpaper for this OS stays mounted so switching is instant. The current one
          is always included: a fallback from another OS's set still has to render. */}
      {[...new Set([...availableWallpapersFor(os), wallpaper])].map((key) => (
        <div
          key={key}
          className={`${styles.wallpaper} ${key === wallpaper ? styles.wallpaperActive : ''}`}
          style={{ backgroundImage: `url(${WALLPAPERS[key]})` }}
          aria-hidden
        />
      ))}
      <DynamicWallpaper wallpaper={wallpaper} className={styles.wallpaperLayer} />
      {!isWindows && <DesktopWidgets />}
      {isWindows ? <Taskbar /> : <MenuBar />}

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
              selected && focusedId === null ? styles.iconFrontmost : '',
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
              openItem(item);
            }}
            onClick={(e) => {
              e.stopPropagation();
              blurWindows();
              if (e.shiftKey || e.metaKey || e.ctrlKey) {
                // Modifier-click toggles individual icon in selection
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
              if (e.key === 'Enter') openItem(item);
              if (e.key === 'F2' && canRenameNode(item.node)) startRename(item.id);
              if (e.key === 'Delete' || (e.key === 'Backspace' && (e.metaKey || e.ctrlKey))) {
                e.preventDefault();
                trashIds(actionIds(item.id));
              }
            }}
          >
            <span className={styles.iconArt}>
              <NodeIcon
                node={item.node}
                size={50}
                trashFull={trashFull}
                trashGlow={item.appId === 'trash' && nearTrashTarget === 'desktop'}
              />
            </span>

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
                  if (!canRenameNode(item.node)) return;
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

      {!isWindows && (
        <Dock
          bouncingKeys={bouncingKeys}
          onBounceEnd={clearBounce}
          onItemActivate={handleDockActivate}
          trashHighlighted={nearTrashTarget === 'dock'}
        />
      )}

      <NotificationBanners />
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
              {ctxTarget.id !== 'trickster' && (
                <>
                  <button
                    className={styles.ctxItem}
                    onClick={() => {
                      openItem(ctxTarget);
                      setCtxMenu(null);
                    }}
                  >
                    Open
                  </button>
                  <div className={styles.ctxDivider} />
                </>
              )}
              {ctxIds.length === 1 && canRenameNode(ctxTarget.node) && (
                <button className={styles.ctxItem} onClick={() => startRename(ctxTarget.id)}>
                  Rename
                </button>
              )}
              {ctxTrashable.length > 0 && (
                <button
                  className={`${styles.ctxItem} ${styles.ctxDanger}`}
                  onClick={() => trashIds(ctxTrashable)}
                >
                  {isWindows
                    ? 'Delete'
                    : ctxTrashable.length > 1
                      ? `Move ${ctxTrashable.length} Items to Trash`
                      : 'Move to Trash'}
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
                {isWindows ? 'Properties' : 'Get Info'}
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
                  setSelectedIcons(new Set(items.map((i) => i.id)));
                  setCtxMenu(null);
                }}
              >
                Select All
              </button>
              <button
                className={styles.ctxItem}
                onClick={() => {
                  setGetInfoTarget('desktop');
                  setCtxMenu(null);
                }}
              >
                {isWindows ? 'Properties' : 'Get Info'}
              </button>
              <button
                className={styles.ctxItem}
                onClick={() => {
                  setShowWallpaper(true);
                  setCtxMenu(null);
                }}
              >
                {isWindows ? 'Choose background…' : 'Change Background…'}
              </button>
              {isWindows ? (
                <>
                  <button
                    className={styles.ctxItem}
                    onClick={() => {
                      openApp('settings', { pane: 'system' });
                      setCtxMenu(null);
                    }}
                  >
                    Display settings
                  </button>
                  <button
                    className={styles.ctxItem}
                    onClick={() => {
                      openApp('settings', { pane: 'personalization' });
                      setCtxMenu(null);
                    }}
                  >
                    Personalise
                  </button>
                </>
              ) : (
                <button
                  className={styles.ctxItem}
                  onClick={() => {
                    openApp('settings', { pane: 'wallpaper' });
                    setCtxMenu(null);
                  }}
                >
                  Wallpaper Settings…
                </button>
              )}
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
          os={os}
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
