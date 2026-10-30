import { useRef } from 'react';
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
 * The bars never hide. A `game` only differs in that they lie translucently over the picture
 * instead of taking space beside it.
 */
const SWIPE_PX = 56;

export default function PhoneShell({
  game = false,
  dark = false,
  onExit,
  children,
}: {
  /** The bars overlay the content instead of sitting beside it. */
  game?: boolean;
  /** The app's canvas is dark, so the bars draw white on dark. */
  dark?: boolean;
  onExit: () => void;
  children: ReactNode;
}) {
  const { os } = useSettings();
  const android = os === 'android';
  const drag = useRef<number | null>(null);

  function onEdgeDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = e.clientY;
  }
  function onEdgeUp(e: ReactPointerEvent<HTMLDivElement>) {
    const start = drag.current;
    drag.current = null;
    if (start !== null && start - e.clientY >= SWIPE_PX) onExit();
  }

  const tone = game || dark ? 'dark' : 'light';
  const navBar = (
    <nav className={styles.droidNav} aria-label="Navigation bar">
      <button type="button" onClick={onExit} aria-label="Back">
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
      <button type="button" onClick={onExit} aria-label="Home">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
      <button type="button" onClick={onExit} aria-label="Recents">
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
    >
      <div className={styles.status}>
        <StatusBar tone={tone} />
      </div>

      {game ? children : <div className={styles.body}>{children}</div>}

      {android ? navBar : <div className={styles.homeIndicator} aria-hidden="true" />}

      {/* iOS: the bottom edge where the home gesture starts */}
      {!android && (
        <div
          className={styles.edge}
          onPointerDown={onEdgeDown}
          onPointerUp={onEdgeUp}
          onPointerCancel={() => (drag.current = null)}
          role="button"
          aria-label="Go home"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Escape' && onExit()}
        />
      )}
    </div>
  );
}
