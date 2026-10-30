import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { useSettings } from '../../context/SettingsContext';
import StatusBar from './StatusBar';
import styles from './PhoneShell.module.css';

/**
 * Full-screen hosting for an app on a phone, with each OS's own way out instead of a sheet
 * header.
 *
 * Android: the status bar sits above the app and the three-button navigation bar below it.
 * Back, Home and Recents all leave the app, since only one is ever open here.
 *
 * iOS: the status bar sits above the app and the home indicator over its bottom edge; a swipe
 * up from that edge goes home.
 *
 * A `game` is immersive instead: the status bar and the Android bars are hidden over the game
 * and a swipe up from the bottom edge (or a tap on it) brings them back translucently for a
 * few seconds. On iOS the home indicator auto-hides while nothing is touched; a first swipe
 * up brings it back and a swipe while it is showing goes home, as iOS does for apps that
 * defer the edge gesture.
 */
const SWIPE_PX = 56;
const ANDROID_BARS_MS = 3000;
const IOS_INDICATOR_MS = 2000;

export default function PhoneShell({
  game = false,
  dark = false,
  onExit,
  children,
}: {
  /** Immersive: bars hide over the content and return on the edge gesture. */
  game?: boolean;
  /** The app's canvas is dark, so the bars draw white on dark. */
  dark?: boolean;
  onExit: () => void;
  children: ReactNode;
}) {
  const { os } = useSettings();
  const android = os === 'android';
  const [revealed, setRevealed] = useState(true);
  const shown = !game || revealed;
  const hideTimer = useRef<number>(0);
  const drag = useRef<{ y: number; wasShown: boolean } | null>(null);

  const reveal = useCallback(
    (ms: number) => {
      if (!game) return;
      setRevealed(true);
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setRevealed(false), ms);
    },
    [game]
  );

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

  const tone = game || dark ? 'dark' : 'light';
  const navBar = (
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
  );

  return (
    <div
      className={[
        styles.shell,
        game ? styles.game : styles.app,
        dark ? styles.dark : '',
        android ? styles.android : styles.ios,
      ].join(' ')}
      onPointerDown={onAnyPointerDown}
    >
      {(!game || android) && (
        <div className={`${styles.status} ${shown ? styles.visible : ''}`}>
          <StatusBar tone={tone} />
        </div>
      )}

      {game ? children : <div className={styles.body}>{children}</div>}

      {android ? (
        navBar
      ) : (
        <div
          className={`${styles.homeIndicator} ${shown ? styles.visible : ''}`}
          aria-hidden="true"
        />
      )}

      {/* The bottom edge: where the system gesture starts on both platforms */}
      {(game || !android) && (
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
      )}
    </div>
  );
}
