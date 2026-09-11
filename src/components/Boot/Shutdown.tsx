import { useEffect, useRef } from 'react';
import type { OsName } from '../../lib/settingsStore';
import { WindowsLogo } from '../icons/WindowsIcons';
import styles from './Boot.module.css';

export type ShutdownMode = 'restart' | 'shutdown';

interface Props {
  /** The OS that is going down (captured before any platform change). */
  os: OsName;
  mode: ShutdownMode;
  onDone: () => void;
}

const DURATION = 2600;

const JH_PATH =
  'm 64.986601,198.54254 c 17.955449,0 30.263619,-9.55694 30.263619,-30.55323 V 98.773958 H 74.97794 v 68.925752 c 0,10.13614 -4.199258,12.74258 -10.860151,12.74258 -6.950496,0 -9.846536,-4.77847 -13.03218,-10.42575 l -16.507428,9.99134 c 4.778466,10.13614 14.190596,18.53466 30.40842,18.53466 z m 49.811939,-1.30322 h 20.27228 V 167.2653 h 42.13738 v 29.97402 h 20.27228 V 98.773958 H 177.2082 V 149.16505 H 135.07082 V 98.773958 h -20.27228 z';

/** The eight-bar "gear" spinner Apple platforms show while shutting down. */
function AppleSpinner() {
  return (
    <span className={styles.appleSpinner} aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <span
          key={i}
          style={{ transform: `rotate(${i * 45}deg)`, animationDelay: `${-1 + i * 0.125}s` }}
        />
      ))}
    </span>
  );
}

/**
 * Per-OS shutdown / restart screens, shown before powering off, restarting and when the
 * platform is switched (the old OS shuts down, the new one boots).
 */
export default function Shutdown({ os, mode, onDone }: Props) {
  // Same guard as Boot: the timer runs from mount and ignores re-renders, so a resize
  // during the shutdown animation cannot restart it.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    const t = setTimeout(() => onDoneRef.current(), DURATION);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.backgroundColor;
    html.style.backgroundColor = '#000';
    document.body.style.backgroundColor = '#000';
    return () => {
      html.style.backgroundColor = prev;
      document.body.style.backgroundColor = '';
    };
  }, []);

  const restarting = mode === 'restart';

  if (os === 'windows') {
    return (
      <div className={`${styles.screen} ${styles.shutdown}`} role="status" aria-live="polite">
        <div className={styles.logoWrap}>
          <WindowsLogo size={72} color="#3aa0ff" />
        </div>
        <div className={styles.winSpinner} aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={styles.winDot} style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
        <p className={styles.shutdownText}>{restarting ? 'Restarting' : 'Shutting down'}</p>
      </div>
    );
  }

  if (os === 'android') {
    return (
      <div className={`${styles.screen} ${styles.shutdown}`} role="status" aria-live="polite">
        <span className={styles.droidSpinner} aria-hidden="true" />
        <p className={`${styles.shutdownText} ${styles.shutdownTextDroid}`}>
          {restarting ? 'Restarting…' : 'Powering off…'}
        </p>
      </div>
    );
  }

  // macOS and iOS: the logo dims and the progress wheel spins; Apple shows no text.
  return (
    <div
      className={`${styles.screen} ${styles.shutdown}`}
      role="status"
      aria-live="polite"
      aria-label={restarting ? 'Restarting' : 'Shutting down'}
    >
      <div className={`${styles.logoWrap} ${styles.shutdownLogo}`}>
        <svg
          viewBox="0 0 212 212"
          width="72"
          height="72"
          className={styles.logo}
          aria-hidden="true"
        >
          <rect width="212" height="212" fill="#f7df1e" rx="18" />
          <path d={JH_PATH} fill="#333" />
        </svg>
      </div>
      <AppleSpinner />
    </div>
  );
}
