import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { useTime } from '../../hooks/useTime';
import { useSettings } from '../../context/SettingsContext';
import { useSession } from '../../context/SessionContext';
import { WALLPAPERS } from '../../data/wallpapers';
import { formatLockTime, formatLongDate, formatShortDate } from '../../lib/clock';
import { initialsOf } from '../../lib/settingsStore';
import styles from './Login.module.css';

interface Props {
  onLogin: () => void;
}

/** Shared unlock behaviour: any key, a click on the prompt, or a swipe up on phones. */
function useUnlock(onLogin: () => void, listenForKeys = true) {
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  const swipeStart = useRef<number | null>(null);

  const enter = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    setTimeout(onLogin, 500);
  }, [onLogin]);

  useEffect(() => {
    if (!listenForKeys) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape' || e.key.length === 1) enter();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enter, listenForKeys]);

  const onPointerDown = (e: PointerEvent) => {
    swipeStart.current = e.clientY;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (swipeStart.current !== null && swipeStart.current - e.clientY > 60) enter();
    swipeStart.current = null;
  };

  return { leaving, enter, swipe: { onPointerDown, onPointerUp } };
}

function useLockClock() {
  const now = useTime();
  const { settings } = useSettings();
  return { now, time: formatLockTime(now, settings.clock24h) };
}

/* ── macOS ─────────────────────────────────────────────────────────────── */
function MacLogin({ onLogin }: Props) {
  const { settings, wallpaper } = useSettings();
  const [visible, setVisible] = useState(false);
  const { leaving, enter } = useUnlock(onLogin);
  const { now, time } = useLockClock();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`${styles.screen} ${visible ? styles.show : ''} ${leaving ? styles.leave : ''}`}
      style={{ backgroundImage: `url(${WALLPAPERS[wallpaper]})` }}
    >
      <div className={styles.clock}>
        <div className={styles.time}>{time}</div>
        <div className={styles.date}>{formatLongDate(now)}</div>
      </div>

      <div
        className={styles.card}
        onClick={enter}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && enter()}
      >
        <div className={styles.avatar}>{initialsOf(settings.userName)}</div>
        <p className={styles.name}>{settings.userName}</p>
        <p className={styles.hint}>Click or press any key to log in</p>
      </div>
    </div>
  );
}

/* ── Windows 11 ────────────────────────────────────────────────────────── */
function WindowsLogin({ onLogin }: Props) {
  const { settings, wallpaper } = useSettings();
  const { shutDown, restart } = useSession();
  const [stage, setStage] = useState<'lock' | 'signin'>('lock');
  const [visible, setVisible] = useState(false);
  const [powerOpen, setPowerOpen] = useState(false);
  const { leaving, enter } = useUnlock(onLogin, stage === 'signin');
  const { now, time } = useLockClock();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (stage !== 'lock') return;
    function dismiss() {
      setStage('signin');
    }
    window.addEventListener('keydown', dismiss);
    window.addEventListener('pointerdown', dismiss);
    return () => {
      window.removeEventListener('keydown', dismiss);
      window.removeEventListener('pointerdown', dismiss);
    };
  }, [stage]);

  useEffect(() => {
    if (stage === 'signin') inputRef.current?.focus();
  }, [stage]);

  return (
    <div
      className={[
        styles.screen,
        styles.win,
        visible ? styles.show : '',
        leaving ? styles.leave : '',
        stage === 'signin' ? styles.winSignin : '',
      ].join(' ')}
      style={{ backgroundImage: `url(${WALLPAPERS[wallpaper]})` }}
    >
      {stage === 'lock' ? (
        <div className={styles.winLock}>
          <div className={styles.winTime}>{time}</div>
          <div className={styles.winDate}>{formatLongDate(now)}</div>
        </div>
      ) : (
        <div className={styles.winPanel}>
          <div className={styles.winAvatar}>{initialsOf(settings.userName)}</div>
          <div className={styles.winName}>{settings.userName}</div>
          <form
            className={styles.winForm}
            onSubmit={(e) => {
              e.preventDefault();
              enter();
            }}
          >
            <input
              ref={inputRef}
              className={styles.winInput}
              type="password"
              placeholder="PIN"
              aria-label="PIN"
              autoComplete="off"
            />
            <button type="submit" className={styles.winGo} aria-label="Sign in">
              <svg
                viewBox="0 0 16 16"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </button>
          </form>
          <button type="button" className={styles.winLink} onClick={enter}>
            Sign-in options
          </button>
          <p className={styles.winHint}>Any PIN (or Enter) signs in</p>
        </div>
      )}

      <div className={styles.winTray}>
        <span className={styles.winTrayIcon} title={settings.wifi ? settings.network : 'Wi-Fi off'}>
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M8 12.2a1.4 1.4 0 110 2.8 1.4 1.4 0 010-2.8z" />
            <path
              d="M4.6 9.9a4.8 4.8 0 016.8 0l-1.05 1.05a3.3 3.3 0 00-4.7 0L4.6 9.9z"
              opacity={settings.wifi ? 1 : 0.3}
            />
            <path
              d="M1.6 6.9a9 9 0 0112.8 0l-1.05 1.05a7.5 7.5 0 00-10.7 0L1.6 6.9z"
              opacity={settings.wifi ? 1 : 0.3}
            />
          </svg>
        </span>
        <span className={styles.winTrayIcon} title="Accessibility">
          <svg
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <circle cx="8" cy="3" r="1.4" fill="currentColor" stroke="none" />
            <path d="M3 6.2l5 .9 5-.9M8 7.1v3.4M8 10.5l-2.2 3.6M8 10.5l2.2 3.6" />
          </svg>
        </span>
        <span className={styles.winPower}>
          <button
            type="button"
            className={styles.winTrayIcon}
            onClick={(e) => {
              e.stopPropagation();
              setPowerOpen((o) => !o);
            }}
            aria-label="Power"
            aria-expanded={powerOpen}
          >
            <svg
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d="M8 2v6" />
              <path d="M4.5 4.6a5 5 0 1 0 7 0" />
            </svg>
          </button>
          {powerOpen && (
            <div className={styles.winPowerMenu} onPointerDown={(e) => e.stopPropagation()}>
              <button type="button" onClick={shutDown}>
                Shut down
              </button>
              <button type="button" onClick={restart}>
                Restart
              </button>
            </div>
          )}
        </span>
      </div>
    </div>
  );
}

/* ── Phone lock screens ─────────────────────────────────────────────────── */
function StatusGlyphs({ light = true }: { light?: boolean }) {
  return (
    <div
      className={`${styles.phoneStatus} ${light ? '' : styles.phoneStatusDark}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 18 12" width="17" height="11">
        <rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor" />
        <rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor" />
        <rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor" />
        <rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor" />
      </svg>
      <svg viewBox="0 0 16 12" width="16" height="12">
        <path
          d="M1.4 4.6C5.1 1.2 10.9 1.2 14.6 4.6L13.1 6.1C10.2 3.5 5.8 3.5 2.9 6.1L1.4 4.6ZM3.9 7.1C6.2 5.1 9.8 5.1 12.1 7.1L10.6 8.6C9.1 7.4 6.9 7.4 5.4 8.6L3.9 7.1ZM6.4 9.6C7.3 8.9 8.7 8.9 9.6 9.6L8 11.2L6.4 9.6Z"
          fill="currentColor"
        />
      </svg>
      <svg viewBox="0 0 27 12" width="26" height="12">
        <rect
          x="0.5"
          y="0.5"
          width="22"
          height="11"
          rx="3"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.4"
        />
        <rect x="2" y="2" width="17" height="8" rx="1.8" fill="currentColor" />
        <path d="M24.2 4.2v3.6a2 2 0 0 0 0-3.6Z" fill="currentColor" fillOpacity="0.4" />
      </svg>
    </div>
  );
}

function useTorch() {
  const [torch, setTorch] = useState(false);
  const [shutter, setShutter] = useState(0);
  return {
    torch,
    toggleTorch: () => setTorch((t) => !t),
    shutter,
    snap: () => setShutter((n) => n + 1),
  };
}

function IphoneLock({ onLogin }: Props) {
  const { wallpaper } = useSettings();
  const [visible, setVisible] = useState(false);
  const { leaving, enter, swipe } = useUnlock(onLogin);
  const { now, time } = useLockClock();
  const { torch, toggleTorch, shutter, snap } = useTorch();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={[
        styles.screen,
        styles.phone,
        styles.iphone,
        visible ? styles.show : '',
        leaving ? styles.leave : '',
        torch ? styles.torchOn : '',
      ].join(' ')}
      style={{ backgroundImage: `url(${WALLPAPERS[wallpaper]})` }}
      {...swipe}
    >
      <StatusGlyphs />
      <div className={styles.iosTop}>
        <svg viewBox="0 0 20 20" width="20" height="20" fill="#fff" aria-hidden="true">
          <rect x="4" y="8.5" width="12" height="9" rx="2.5" />
          <path d="M6.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="#fff" strokeWidth="1.8" />
        </svg>
        <div className={styles.iosDate}>{formatLongDate(now)}</div>
        <div className={styles.iosTime}>{time}</div>
      </div>

      {shutter > 0 && <div key={shutter} className={styles.shutter} aria-hidden="true" />}

      <div className={styles.iosBottom}>
        <button
          type="button"
          className={`${styles.iosCircle} ${torch ? styles.iosCircleOn : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleTorch();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-pressed={torch}
          aria-label="Flashlight"
        >
          <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
            <path d="M6 2h8v3l-2 3v8a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 8 16V8L6 5z" />
          </svg>
        </button>
        <button
          type="button"
          className={styles.iosCircle}
          onClick={(e) => {
            e.stopPropagation();
            snap();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Camera"
        >
          <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
            <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h2l1-1.5h5l1 1.5h2A1.5 1.5 0 0 1 17 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 14.5z" />
            <circle cx="10" cy="10.5" r="3" fill="#000" opacity="0.6" />
          </svg>
        </button>
      </div>
      <button type="button" className={styles.phoneUnlock} onClick={enter}>
        Swipe up to unlock
      </button>
      <div className={styles.homeBar} aria-hidden="true" />
    </div>
  );
}

function AndroidLock({ onLogin }: Props) {
  const { wallpaper, settings } = useSettings();
  const [visible, setVisible] = useState(false);
  const { leaving, enter, swipe } = useUnlock(onLogin);
  const { now } = useLockClock();
  const { torch, toggleTorch, shutter, snap } = useTorch();
  const h = settings.clock24h ? now.getHours() : ((now.getHours() + 11) % 12) + 1;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={[
        styles.screen,
        styles.phone,
        styles.android,
        visible ? styles.show : '',
        leaving ? styles.leave : '',
        torch ? styles.torchOn : '',
      ].join(' ')}
      style={{ backgroundImage: `url(${WALLPAPERS[wallpaper]})` }}
      {...swipe}
    >
      <StatusGlyphs light={wallpaper !== 'pixel' && wallpaper !== 'pixelCoral'} />
      <div className={styles.droidClock} aria-label={formatLockTime(now, settings.clock24h)}>
        <span>{h.toString().padStart(2, '0')}</span>
        <span>{now.getMinutes().toString().padStart(2, '0')}</span>
      </div>
      <div className={styles.droidGlance}>
        <span>{formatShortDate(now)}</span>
        <span className={styles.droidDot}>•</span>
        <span>Manchester</span>
      </div>

      {shutter > 0 && <div key={shutter} className={styles.shutter} aria-hidden="true" />}

      <div className={styles.droidBottom}>
        <button
          type="button"
          className={`${styles.droidPill} ${torch ? styles.droidPillOn : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleTorch();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-pressed={torch}
          aria-label="Flashlight"
        >
          <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
            <path d="M6 2h8v3l-2 3v8a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 8 16V8L6 5z" />
          </svg>
        </button>
        <button type="button" className={styles.droidFinger} onClick={enter} aria-label="Unlock">
          <svg
            viewBox="0 0 24 24"
            width="30"
            height="30"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M6.5 8a7 7 0 0 1 11 0M5 12a8 8 0 0 1 14 0v1M8 12a5 5 0 0 1 8 0v3M12 12v7M9.5 20a4 4 0 0 0 5 0M15 16.5a3 3 0 0 1-6 0V12" />
          </svg>
        </button>
        <button
          type="button"
          className={styles.droidPill}
          onClick={(e) => {
            e.stopPropagation();
            snap();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Camera"
        >
          <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
            <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h2l1-1.5h5l1 1.5h2A1.5 1.5 0 0 1 17 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 14.5z" />
            <circle cx="10" cy="10.5" r="3" fill="#000" opacity="0.6" />
          </svg>
        </button>
      </div>
      <button type="button" className={styles.phoneUnlock} onClick={enter}>
        Swipe up to unlock
      </button>
      <div className={`${styles.homeBar} ${styles.homeBarDroid}`} aria-hidden="true" />
    </div>
  );
}

export default function Login({ onLogin }: Props) {
  const { os } = useSettings();
  if (os === 'windows') return <WindowsLogin onLogin={onLogin} />;
  if (os === 'ios') return <IphoneLock onLogin={onLogin} />;
  if (os === 'android') return <AndroidLock onLogin={onLogin} />;
  return <MacLogin onLogin={onLogin} />;
}
