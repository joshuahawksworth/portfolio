import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { formatTime } from '../../lib/clock';
import { useTime } from '../../hooks/useTime';
import styles from './ImmersiveShell.module.css';

/**
 * Full-screen ("immersive") hosting for a game on a phone, with each OS's own way out.
 *
 * Android: sticky immersive mode. The status bar and the three-button navigation bar are
 * hidden; a swipe up from the bottom edge (or a tap on it) shows them translucently over the
 * game for a few seconds. Back and Home leave the game; Recents does too, since there is only
 * ever one app open here.
 *
 * iOS: the status bar is hidden and the home indicator auto-hides while nothing is touched.
 * A first swipe up from the bottom edge brings the indicator back; swiping up on it while it
 * is showing goes home, as iOS does for apps that defer the edge gesture.
 */
const SWIPE_PX = 56;
const ANDROID_BARS_MS = 3000;
const IOS_INDICATOR_MS = 2000;

export default function ImmersiveShell({
  onExit,
  children,
}: {
  onExit: () => void;
  children: ReactNode;
}) {
  const { os, settings } = useSettings();
  const android = os === 'android';
  const now = useTime();
  const [shown, setShown] = useState(true);
  const hideTimer = useRef<number>(0);
  const drag = useRef<{ y: number; wasShown: boolean } | null>(null);

  const reveal = useCallback((ms: number) => {
    setShown(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setShown(false), ms);
  }, []);

  // Bars show briefly on entry, as they do when an app first goes immersive.
  useEffect(() => {
    reveal(android ? ANDROID_BARS_MS : IOS_INDICATOR_MS);
    return () => window.clearTimeout(hideTimer.current);
  }, [android, reveal]);

  // On iOS any touch brings the indicator back for a moment.
  function onAnyPointerDown() {
    if (!android) reveal(IOS_INDICATOR_MS);
  }

  function onEdgeDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, wasShown: shown };
  }
  function onEdgeUp(e: ReactPointerEvent<HTMLDivElement>) {
    const start = drag.current;
    drag.current = null;
    if (!start) return;
    const dy = start.y - e.clientY;
    if (android) {
      // A tap or a swipe on the edge shows the system bars.
      reveal(ANDROID_BARS_MS);
      return;
    }
    if (dy < SWIPE_PX) {
      reveal(IOS_INDICATOR_MS);
      return;
    }
    // A swipe while the indicator is hidden only brings it back; the next one goes home.
    if (start.wasShown) onExit();
    else reveal(IOS_INDICATOR_MS);
  }

  return (
    <div className={styles.shell} onPointerDown={onAnyPointerDown}>
      {children}

      {android ? (
        <>
          <div
            className={`${styles.droidStatus} ${shown ? styles.visible : ''}`}
            aria-hidden="true"
          >
            <span>{formatTime(now, { clock24h: settings.clock24h })}</span>
            <span className={styles.droidStatusIcons}>
              <svg viewBox="0 0 16 12" width="15" height="11">
                <path d="M8 11.4L15.3 4.1C11.3 0.3 4.7 0.3 0.7 4.1L8 11.4Z" fill="currentColor" />
              </svg>
              <svg viewBox="0 0 14 12" width="13" height="11">
                <path d="M0 12L13 0v12z" fill="currentColor" />
              </svg>
              <svg viewBox="0 0 10 16" width="8" height="14">
                <rect x="3" y="0" width="4" height="2" rx="0.5" fill="currentColor" />
                <rect
                  x="0.5"
                  y="2.5"
                  width="9"
                  height="13"
                  rx="1.5"
                  fill="none"
                  stroke="currentColor"
                />
                <rect x="2" y="5" width="6" height="9" fill="currentColor" />
              </svg>
            </span>
          </div>
          <nav
            className={`${styles.droidNav} ${shown ? styles.visible : ''}`}
            aria-label="Navigation bar"
            aria-hidden={!shown}
          >
            <button type="button" onClick={onExit} aria-label="Back" tabIndex={shown ? 0 : -1}>
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path
                  d="M16 4.5v15L5.5 12z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button type="button" onClick={onExit} aria-label="Home" tabIndex={shown ? 0 : -1}>
              <svg viewBox="0 0 24 24" width="22" height="22">
                <circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
            <button type="button" onClick={onExit} aria-label="Recents" tabIndex={shown ? 0 : -1}>
              <svg viewBox="0 0 24 24" width="22" height="22">
                <rect
                  x="5"
                  y="5"
                  width="14"
                  height="14"
                  rx="2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </button>
          </nav>
        </>
      ) : (
        <div
          className={`${styles.homeIndicator} ${shown ? styles.visible : ''}`}
          aria-hidden="true"
        />
      )}

      {/* The bottom edge: where the system gesture starts on both platforms */}
      <div
        className={styles.edge}
        onPointerDown={onEdgeDown}
        onPointerUp={onEdgeUp}
        onPointerCancel={() => (drag.current = null)}
        role="button"
        aria-label={android ? 'Show navigation bar' : 'Go home'}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Escape' && onExit()}
      />
    </div>
  );
}
