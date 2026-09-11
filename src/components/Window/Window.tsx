import { useState, useRef, useEffect } from 'react';
import { useDesktop, WindowInstance } from '../../context/DesktopContext';
import { useOs } from '../../context/SettingsContext';
import { appIconFor } from '../../theme/platformIcons';
import { appTitleFor, shellInsets } from '../../theme/platform';
import styles from './Window.module.css';

type Dir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface Props {
  win: WindowInstance;
  children: React.ReactNode;
}

/** A region of the work area, as fractions of its width and height. */
interface SnapZone {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const Z = (label: string, x: number, y: number, w: number, h: number): SnapZone => ({
  label,
  x,
  y,
  w,
  h,
});

/** macOS Sequoia green-button menu: Move & Resize tiles, then quarters. */
const MAC_TILES: { title: string; tiles: { label: string; zone: SnapZone | 'center' }[] }[] = [
  {
    title: 'Move & Resize',
    tiles: [
      { label: 'Left', zone: Z('Left', 0, 0, 0.5, 1) },
      { label: 'Right', zone: Z('Right', 0.5, 0, 0.5, 1) },
      { label: 'Top', zone: Z('Top', 0, 0, 1, 0.5) },
      { label: 'Bottom', zone: Z('Bottom', 0, 0.5, 1, 0.5) },
    ],
  },
  {
    title: 'Fill & Arrange',
    tiles: [
      { label: 'Fill', zone: Z('Fill', 0, 0, 1, 1) },
      { label: 'Center', zone: 'center' },
      { label: 'Top Left', zone: Z('Top Left', 0, 0, 0.5, 0.5) },
      { label: 'Top Right', zone: Z('Top Right', 0.5, 0, 0.5, 0.5) },
      { label: 'Bottom Left', zone: Z('Bottom Left', 0, 0.5, 0.5, 0.5) },
      { label: 'Bottom Right', zone: Z('Bottom Right', 0.5, 0.5, 0.5, 0.5) },
    ],
  },
];

/** Windows 11 snap layouts: each card is a layout, each region a drop zone. */
const WIN_LAYOUTS: { label: string; zones: SnapZone[] }[] = [
  { label: 'Two halves', zones: [Z('Left half', 0, 0, 0.5, 1), Z('Right half', 0.5, 0, 0.5, 1)] },
  {
    label: 'Two thirds and one third',
    zones: [Z('Left two thirds', 0, 0, 2 / 3, 1), Z('Right third', 2 / 3, 0, 1 / 3, 1)],
  },
  {
    label: 'Three columns',
    zones: [
      Z('Left third', 0, 0, 1 / 3, 1),
      Z('Middle third', 1 / 3, 0, 1 / 3, 1),
      Z('Right third', 2 / 3, 0, 1 / 3, 1),
    ],
  },
  {
    label: 'Four quarters',
    zones: [
      Z('Top left', 0, 0, 0.5, 0.5),
      Z('Top right', 0.5, 0, 0.5, 0.5),
      Z('Bottom left', 0, 0.5, 0.5, 0.5),
      Z('Bottom right', 0.5, 0.5, 0.5, 0.5),
    ],
  },
  {
    label: 'Half and two quarters',
    zones: [
      Z('Left half', 0, 0, 0.5, 1),
      Z('Top right', 0.5, 0, 0.5, 0.5),
      Z('Bottom right', 0.5, 0.5, 0.5, 0.5),
    ],
  },
  {
    label: 'Three with a wide middle',
    zones: [
      Z('Left quarter', 0, 0, 0.25, 1),
      Z('Middle half', 0.25, 0, 0.5, 1),
      Z('Right quarter', 0.75, 0, 0.25, 1),
    ],
  },
];

/** Little screen with the target region filled, for the macOS tile buttons. */
function TileGlyph({ zone }: { zone: SnapZone | 'center' }) {
  const z = zone === 'center' ? Z('Center', 0.2, 0.2, 0.6, 0.6) : zone;
  return (
    <svg viewBox="0 0 30 20" width="30" height="20" aria-hidden="true">
      <rect
        x="0.5"
        y="0.5"
        width="29"
        height="19"
        rx="3"
        fill="rgba(0,0,0,0.06)"
        stroke="rgba(0,0,0,0.25)"
      />
      <rect
        x={1.5 + z.x * 27}
        y={1.5 + z.y * 17}
        width={z.w * 27}
        height={z.h * 17}
        rx="1.5"
        fill="var(--accent)"
      />
    </svg>
  );
}

export default function Window({ win, children }: Props) {
  const {
    closeWindow,
    minimizeWindow,
    toggleMaximize,
    focusWindow,
    moveWindow,
    resizeWindow,
    focusedId,
  } = useDesktop();
  const isFocused = focusedId === win.id;
  const os = useOs();
  const isWindows = os === 'windows';
  const title = appTitleFor(win.appId, win.title, os);

  // Always-current snapshot of win — eliminates every stale-closure risk
  const winRef = useRef(win);
  winRef.current = win;

  const [isMinimizing, setMinimizing] = useState(false);
  const [isTransitioning, setTransitioning] = useState(false);
  const [tilingOpen, setTilingOpen] = useState(false);
  // Windows snap layouts open on hover; a short grace period lets the pointer travel
  // from the maximize button into the flyout before it closes.
  const snapTimer = useRef<number | undefined>(undefined);
  function openSnap() {
    window.clearTimeout(snapTimer.current);
    setTilingOpen(true);
  }
  function closeSnapSoon() {
    window.clearTimeout(snapTimer.current);
    snapTimer.current = window.setTimeout(() => setTilingOpen(false), 220);
  }
  useEffect(() => () => window.clearTimeout(snapTimer.current), []);

  const snapMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!tilingOpen) return;
    // Close on any press outside the popover; presses inside must reach the option buttons.
    const close = (e: PointerEvent) => {
      if (snapMenuRef.current?.contains(e.target as Node)) return;
      setTilingOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [tilingOpen]);

  // ── snapping (macOS green-button tiles / Windows snap layouts) ──────────
  function snapTo(zone: SnapZone | 'center') {
    const insets = shellInsets();
    const gap = isWindows ? 0 : 8;
    const areaX = gap;
    const areaY = insets.top + gap;
    const areaW = window.innerWidth - gap * 2;
    const areaH = window.innerHeight - insets.top - insets.bottom - (isWindows ? 0 : 6) - gap * 2;
    const w = winRef.current;
    let x: number, y: number, width: number, height: number;
    if (zone === 'center') {
      width = Math.min(w.width, areaW);
      height = Math.min(w.height, areaH);
      x = areaX + Math.round((areaW - width) / 2);
      y = areaY + Math.round((areaH - height) / 2);
    } else {
      // Tiles share the gutter between them on macOS.
      const innerGap = gap;
      x = Math.round(areaX + zone.x * (areaW + innerGap));
      y = Math.round(areaY + zone.y * (areaH + innerGap));
      width = Math.round(zone.w * (areaW + innerGap) - innerGap);
      height = Math.round(zone.h * (areaH + innerGap) - innerGap);
    }
    setTransitioning(true);
    resizeWindow(w.id, x, y, width, height);
    setTimeout(() => setTransitioning(false), 260);
    setTilingOpen(false);
  }

  // ── helpers ──────────────────────────────────────────────────────────
  function addDragListeners(onMove: (ev: MouseEvent) => void, onUp: () => void) {
    function handleUp() {
      onUp();
      removeAll();
    }
    function handleVis() {
      if (document.hidden) {
        onUp();
        removeAll();
      }
    }
    function removeAll() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('visibilitychange', handleVis);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('visibilitychange', handleVis);
  }

  // ── minimize ─────────────────────────────────────────────────────────
  function handleMinimize(e: React.MouseEvent) {
    e.stopPropagation();
    setMinimizing(true);
    setTimeout(() => {
      minimizeWindow(win.id);
      setMinimizing(false);
    }, 280);
  }

  // ── maximize ─────────────────────────────────────────────────────────
  function handleMaximize(e: React.MouseEvent) {
    e.stopPropagation();
    setTransitioning(true);
    toggleMaximize(win.id);
    setTimeout(() => setTransitioning(false), 320);
  }

  // ── drag title bar ───────────────────────────────────────────────────
  function handleTitleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    // Capture starting position NOW (before any state update can change it)
    const startMX = e.clientX;
    const startMY = e.clientY;
    const startWX = winRef.current.x;
    const startWY = winRef.current.y;
    const id = winRef.current.id;

    setTransitioning(false);

    addDragListeners(
      (ev) =>
        moveWindow(
          id,
          Math.max(0, startWX + ev.clientX - startMX),
          Math.max(shellInsets().top, startWY + ev.clientY - startMY)
        ),
      () => {}
    );
  }

  // ── resize handles ───────────────────────────────────────────────────
  function handleResizeMouseDown(e: React.MouseEvent, dir: Dir) {
    e.stopPropagation();
    e.preventDefault();
    setTransitioning(false);
    focusWindow(win.id);

    const startMX = e.clientX,
      startMY = e.clientY;
    const ox = winRef.current.x,
      oy = winRef.current.y;
    const ow = winRef.current.width,
      oh = winRef.current.height;
    const id = winRef.current.id;

    addDragListeners(
      (ev) => {
        const dx = ev.clientX - startMX,
          dy = ev.clientY - startMY;
        let x = ox,
          y = oy,
          w = ow,
          h = oh;
        if (dir.includes('e')) w = ow + dx;
        if (dir.includes('s')) h = oh + dy;
        if (dir.includes('w')) {
          w = ow - dx;
          x = ox + dx;
        }
        if (dir.includes('n')) {
          h = oh - dy;
          y = oy + dy;
        }
        resizeWindow(id, x, y, w, h);
      },
      () => {}
    );
  }

  if (win.minimized && !isMinimizing) return null;

  return (
    <div
      data-window=""
      className={[
        styles.outer,
        isWindows ? styles.win : '',
        isTransitioning ? styles.transitioning : '',
        isMinimizing ? styles.minimizing : '',
      ].join(' ')}
      style={{
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        zIndex: win.zIndex,
        // Zoom in/out of the dock (bottom centre of the screen)
        transformOrigin: `${window.innerWidth / 2 - win.x}px ${window.innerHeight - 40 - win.y}px`,
      }}
    >
      {/* Resize handles — outside visible window so they sit on the edges */}
      {(['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as Dir[]).map((dir) => (
        <div
          key={dir}
          className={`${styles.handle} ${styles[`h${dir}`]}`}
          onMouseDown={(e) => handleResizeMouseDown(e, dir)}
        />
      ))}

      {/* Visible window surface
          onMouseDown here fires for ANY click inside the window → always focuses it.
          Title-bar drag bubbles up to this naturally. */}
      <div
        className={`${styles.window} ${isFocused ? styles.focused : styles.blurred}`}
        onMouseDown={() => focusWindow(win.id)}
      >
        {/* Title bar — drag starts here, focus fires from parent above */}
        <div
          className={styles.titleBar}
          onMouseDown={handleTitleMouseDown}
          onDoubleClick={isWindows ? handleMaximize : undefined}
        >
          {isWindows && (
            <span className={styles.winAppIcon} aria-hidden="true">
              {appIconFor(win.appId, os)}
            </span>
          )}
          <div className={styles.lights} hidden={isWindows}>
            {/* Buttons: stopPropagation on mouseDown prevents the title bar's
                drag handler from seeing this event. onClick works normally. */}
            <button
              type="button"
              className={`${styles.dot} ${styles.red}`}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                closeWindow(win.id);
              }}
              aria-label="Close"
            >
              <svg viewBox="0 0 8 8" className={styles.dotIcon}>
                <path
                  d="M2 2l4 4M6 2l-4 4"
                  stroke="#820d05"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className={`${styles.dot} ${styles.yellow}`}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleMinimize}
              aria-label="Minimize"
            >
              <svg viewBox="0 0 8 8" className={styles.dotIcon}>
                <path d="M1.5 4h5" stroke="#775209" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
            <button
              type="button"
              className={`${styles.dot} ${styles.green}`}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                setTilingOpen(false);
                handleMaximize(e);
              }}
              onMouseEnter={openSnap}
              onMouseLeave={closeSnapSoon}
              aria-label={win.maximized ? 'Restore' : 'Zoom'}
            >
              <svg viewBox="0 0 8 8" className={styles.dotIcon}>
                {win.maximized ? (
                  <path
                    d="M2.5 1.5H1.5v1M5.5 1.5H6.5v1M2.5 6.5H1.5v-1M5.5 6.5H6.5v-1"
                    stroke="#075315"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    fill="none"
                  />
                ) : (
                  <path
                    d="M1.5 6.5L6.5 1.5M4 1.5H6.5V4M1.5 4.5V7H4"
                    stroke="#075315"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    fill="none"
                  />
                )}
              </svg>
            </button>
          </div>
          <span className={styles.title}>{title}</span>
          {isWindows && (
            <div className={styles.captions} onMouseDown={(e) => e.stopPropagation()}>
              <button
                type="button"
                className={styles.caption}
                onClick={handleMinimize}
                aria-label="Minimize"
              >
                <svg viewBox="0 0 10 10" width="10" height="10">
                  <path d="M0 5h10" stroke="currentColor" strokeWidth="1" />
                </svg>
              </button>
              <button
                type="button"
                className={styles.caption}
                onClick={(e) => {
                  setTilingOpen(false);
                  handleMaximize(e);
                }}
                onMouseEnter={openSnap}
                onMouseLeave={closeSnapSoon}
                aria-label={win.maximized ? 'Restore' : 'Maximize'}
              >
                <svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor">
                  {win.maximized ? (
                    <>
                      <rect x="0.5" y="2.5" width="7" height="7" rx="1" />
                      <path d="M2.5 2.5v-1a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-1" />
                    </>
                  ) : (
                    <rect x="0.5" y="0.5" width="9" height="9" rx="1.5" />
                  )}
                </svg>
              </button>
              <button
                type="button"
                className={`${styles.caption} ${styles.captionClose}`}
                onClick={(e) => {
                  e.stopPropagation();
                  closeWindow(win.id);
                }}
                aria-label="Close"
              >
                <svg viewBox="0 0 10 10" width="10" height="10">
                  <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1" />
                </svg>
              </button>
            </div>
          )}
          {tilingOpen && (
            <div
              ref={snapMenuRef}
              className={isWindows ? styles.snapLayouts : styles.snapPopover}
              role="menu"
              aria-label={isWindows ? 'Snap layouts' : 'Window tiling'}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseEnter={openSnap}
              onMouseLeave={closeSnapSoon}
            >
              {isWindows
                ? WIN_LAYOUTS.map((layout, i) => (
                    <div
                      key={i}
                      className={styles.snapLayout}
                      role="group"
                      aria-label={layout.label}
                    >
                      {layout.zones.map((zone) => (
                        <button
                          key={zone.label}
                          type="button"
                          role="menuitem"
                          className={styles.snapZone}
                          style={{
                            left: `${zone.x * 100}%`,
                            top: `${zone.y * 100}%`,
                            width: `${zone.w * 100}%`,
                            height: `${zone.h * 100}%`,
                          }}
                          title={`${layout.label}: ${zone.label}`}
                          aria-label={`${layout.label}: ${zone.label}`}
                          onClick={() => snapTo(zone)}
                        />
                      ))}
                    </div>
                  ))
                : MAC_TILES.map((group, gi) => (
                    <div key={gi} className={styles.snapGroup}>
                      <span className={styles.snapGroupTitle}>{group.title}</span>
                      <div className={styles.snapRow}>
                        {group.tiles.map((tile) => (
                          <button
                            key={tile.label}
                            type="button"
                            role="menuitem"
                            className={styles.snapTile}
                            title={tile.label}
                            aria-label={tile.label}
                            onClick={() => snapTo(tile.zone)}
                          >
                            <TileGlyph zone={tile.zone} />
                            <span>{tile.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
            </div>
          )}
        </div>

        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
