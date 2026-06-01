import { useState, useRef } from 'react';
import { useDesktop, WindowInstance } from '../../context/DesktopContext';
import styles from './Window.module.css';

type Dir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface Props { win: WindowInstance; children: React.ReactNode }

export default function Window({ win, children }: Props) {
  const { closeWindow, minimizeWindow, toggleMaximize, focusWindow, moveWindow, resizeWindow, focusedId } = useDesktop();
  const isFocused = focusedId === win.id;

  // Always-current snapshot of win — eliminates every stale-closure risk
  const winRef = useRef(win);
  winRef.current = win;

  const [isMinimizing,   setMinimizing]   = useState(false);
  const [isTransitioning, setTransitioning] = useState(false);

  // ── helpers ──────────────────────────────────────────────────────────
  function addDragListeners(
    onMove: (ev: MouseEvent) => void,
    onUp: () => void,
  ) {
    function handleUp() { onUp(); removeAll(); }
    function handleVis() { if (document.hidden) { onUp(); removeAll(); } }
    function removeAll() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   handleUp);
      document.removeEventListener('visibilitychange', handleVis);
    }
    document.addEventListener('mousemove',        onMove);
    document.addEventListener('mouseup',          handleUp);
    document.addEventListener('visibilitychange', handleVis);
  }

  // ── minimize ─────────────────────────────────────────────────────────
  function handleMinimize(e: React.MouseEvent) {
    e.stopPropagation();
    setMinimizing(true);
    setTimeout(() => { minimizeWindow(win.id); setMinimizing(false); }, 280);
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
    const id      = winRef.current.id;

    setTransitioning(false);

    addDragListeners(
      (ev) => moveWindow(id, Math.max(0, startWX + ev.clientX - startMX),
                             Math.max(28, startWY + ev.clientY - startMY)),
      () => {},
    );
  }

  // ── resize handles ───────────────────────────────────────────────────
  function handleResizeMouseDown(e: React.MouseEvent, dir: Dir) {
    e.stopPropagation();
    e.preventDefault();
    setTransitioning(false);
    focusWindow(win.id);

    const startMX = e.clientX, startMY = e.clientY;
    const ox = winRef.current.x,     oy = winRef.current.y;
    const ow = winRef.current.width,  oh = winRef.current.height;
    const id = winRef.current.id;

    addDragListeners(
      (ev) => {
        const dx = ev.clientX - startMX, dy = ev.clientY - startMY;
        let x = ox, y = oy, w = ow, h = oh;
        if (dir.includes('e')) w = ow + dx;
        if (dir.includes('s')) h = oh + dy;
        if (dir.includes('w')) { w = ow - dx; x = ox + dx; }
        if (dir.includes('n')) { h = oh - dy; y = oy + dy; }
        resizeWindow(id, x, y, w, h);
      },
      () => {},
    );
  }

  if (win.minimized && !isMinimizing) return null;

  return (
    <div
      className={[
        styles.outer,
        isTransitioning ? styles.transitioning : '',
        isMinimizing    ? styles.minimizing    : '',
      ].join(' ')}
      style={{ left: win.x, top: win.y, width: win.width, height: win.height, zIndex: win.zIndex }}
    >
      {/* Resize handles — outside visible window so they sit on the edges */}
      {(['n','s','e','w','ne','nw','se','sw'] as Dir[]).map(dir => (
        <div key={dir} className={`${styles.handle} ${styles[`h${dir}`]}`}
          onMouseDown={e => handleResizeMouseDown(e, dir)} />
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
            <button type="button" className={`${styles.dot} ${styles.red}`}
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); closeWindow(win.id); }}
              aria-label="Close">
              <svg viewBox="0 0 8 8" className={styles.dotIcon}>
                <path d="M2 2l4 4M6 2l-4 4" stroke="rgba(0,0,0,0.6)" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </button>
            <button type="button" className={`${styles.dot} ${styles.yellow}`}
              onMouseDown={e => e.stopPropagation()}
              onClick={handleMinimize}
              aria-label="Minimize">
              <svg viewBox="0 0 8 8" className={styles.dotIcon}>
                <path d="M1.5 4h5" stroke="rgba(0,0,0,0.6)" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </button>
            <button type="button" className={`${styles.dot} ${styles.green}`}
              onMouseDown={e => e.stopPropagation()}
              onClick={handleMaximize}
              aria-label={win.maximized ? 'Restore' : 'Zoom'}>
              <svg viewBox="0 0 8 8" className={styles.dotIcon}>
                {win.maximized
                  ? <path d="M2.5 1.5H1.5v1M5.5 1.5H6.5v1M2.5 6.5H1.5v-1M5.5 6.5H6.5v-1"
                      stroke="rgba(0,0,0,0.6)" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
                  : <path d="M1.5 6.5L6.5 1.5M4 1.5H6.5V4M1.5 4.5V7H4"
                      stroke="rgba(0,0,0,0.6)" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
                }
              </svg>
            </button>
          </div>
          <span className={styles.title}>{win.title}</span>
          <div style={{ width: 60, flexShrink: 0 }} />
        </div>

        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
