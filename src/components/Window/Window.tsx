import { useState, useRef, useEffect } from 'react';
import { useDesktop, WindowInstance } from '../../context/DesktopContext';
import styles from './Window.module.css';

type Dir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface Props {
  win: WindowInstance;
  children: React.ReactNode;
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

  // Always-current snapshot of win — eliminates every stale-closure risk
  const winRef = useRef(win);
  winRef.current = win;

  const [isMinimizing, setMinimizing] = useState(false);
  const [isTransitioning, setTransitioning] = useState(false);
  const [tilingOpen, setTilingOpen] = useState(false);

  useEffect(() => {
    if (!tilingOpen) return;
    const close = () => setTilingOpen(false);
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [tilingOpen]);

  // ── tiling (macOS window layout menu) ────────────────────────────────
  function tile(kind: 'left' | 'right' | 'top' | 'bottom' | 'fill' | 'center') {
    const menuH = 29;
    const dockH = 96;
    const gap = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight - menuH - dockH;
    const w = winRef.current;
    let x = gap,
      y = menuH + gap,
      width = vw - gap * 2,
      height = vh - gap * 2;
    if (kind === 'left' || kind === 'right') width = Math.floor((vw - gap * 3) / 2);
    if (kind === 'right') x = gap * 2 + width;
    if (kind === 'top' || kind === 'bottom') height = Math.floor((vh - gap * 3) / 2);
    if (kind === 'bottom') y = menuH + gap * 2 + height;
    if (kind === 'center') {
      width = Math.min(w.width, vw - gap * 2);
      height = Math.min(w.height, vh - gap * 2);
      x = Math.round((vw - width) / 2);
      y = menuH + Math.round((vh - height) / 2);
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
          Math.max(29, startWY + ev.clientY - startMY)
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
      className={[
        styles.outer,
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
        <div className={styles.titleBar} onMouseDown={handleTitleMouseDown}>
          <div className={styles.lights}>
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
              onClick={handleMaximize}
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
          <span className={styles.title}>{win.title}</span>
          <button
            type="button"
            className={styles.titleAction}
            aria-label="Window tiling options"
            title="Window layout"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setTilingOpen((o) => !o);
            }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" />
              <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" />
              <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" />
              <rect x="9" y="9" width="5.5" height="5.5" rx="1.2" />
            </svg>
          </button>
          {tilingOpen && (
            <div className={styles.tilingMenu} onMouseDown={(e) => e.stopPropagation()}>
              <button type="button" className={styles.tilingItem} onClick={() => tile('fill')}>
                Fill
              </button>
              <button type="button" className={styles.tilingItem} onClick={() => tile('center')}>
                Center
              </button>
              <button type="button" className={styles.tilingItem} onClick={() => tile('left')}>
                Left Half
              </button>
              <button type="button" className={styles.tilingItem} onClick={() => tile('right')}>
                Right Half
              </button>
              <button type="button" className={styles.tilingItem} onClick={() => tile('top')}>
                Top Half
              </button>
              <button type="button" className={styles.tilingItem} onClick={() => tile('bottom')}>
                Bottom Half
              </button>
            </div>
          )}
        </div>

        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
