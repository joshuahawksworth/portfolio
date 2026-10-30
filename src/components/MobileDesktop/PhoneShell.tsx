import { useRef } from 'react';
import type {
  PointerEvent as ReactPointerEvent,
  ReactNode,
  TouchEvent as ReactTouchEvent,
} from 'react';
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
/** How far up from the bottom an iOS home swipe may start. Safari and the system own the
 *  very bottom edge on a real iPhone, and a mouse in Chrome needs room too, so the gesture is
 *  read from well above the edge rather than from a thin strip on it. */
const HOME_ZONE_PX = 110;

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
  const touch = useRef<{ y: number; last: number } | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  function onTouchStart(e: ReactTouchEvent) {
    if (android) return;
    const t = e.touches[0];
    const bottom = shellRef.current?.getBoundingClientRect().bottom ?? window.innerHeight;
    touch.current = bottom - t.clientY <= HOME_ZONE_PX ? { y: t.clientY, last: t.clientY } : null;
  }
  function onTouchMove(e: ReactTouchEvent) {
    if (touch.current) touch.current.last = e.touches[0].clientY;
  }
  function onTouchEnd() {
    const t = touch.current;
    touch.current = null;
    if (t && t.y - t.last >= SWIPE_PX) onExit();
  }

  // Mouse (Chrome's device mode, a desktop at phone width): the same zone, via pointer events.
  // Touches are handled below; a finger would otherwise count twice.
  function onPointerDown(e: ReactPointerEvent) {
    if (android || e.pointerType !== 'mouse') return;
    const bottom = shellRef.current?.getBoundingClientRect().bottom ?? window.innerHeight;
    drag.current = bottom - e.clientY <= HOME_ZONE_PX ? e.clientY : null;
  }
  function onPointerUp(e: ReactPointerEvent) {
    const start = drag.current;
    drag.current = null;
    if (e.pointerType === 'mouse' && start !== null && start - e.clientY >= SWIPE_PX) onExit();
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
      ref={shellRef}
      className={[
        styles.shell,
        game ? styles.game : styles.app,
        dark ? styles.dark : '',
        android ? styles.android : styles.ios,
      ].join(' ')}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <div className={styles.status}>
        <StatusBar tone={tone} />
      </div>

      {game ? children : <div className={styles.body}>{children}</div>}

      {android ? navBar : <div className={styles.homeIndicator} aria-hidden="true" />}
    </div>
  );
}
