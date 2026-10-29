import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import styles from './DoomApp.module.css';

interface CIEvents {
  onFrame: (cb: (rgb: Uint8Array | null, rgba: Uint8Array | null) => void) => void;
  onFrameSize: (cb: (w: number, h: number) => void) => void;
  onSoundPush: (cb: (samples: Float32Array) => void) => void;
  onExit: (cb: () => void) => void;
}
interface CI {
  soundFrequency: () => number;
  exit: () => Promise<void>;
  sendKeyEvent: (keyCode: number, pressed: boolean) => void;
  events: () => CIEvents;
}
declare global {
  interface Window {
    emulators: { pathPrefix: string; dosboxDirect: (b: Uint8Array) => Promise<CI> };
  }
}

// DOSBox key codes (from js-dos' mapping: DOM keyCode → DOSBox key). This bundle's DEFAULT.CFG
// binds W/S to move, A/D to strafe, the arrows to turn (and menus), Ctrl to fire, Space to use.
const K = {
  w: 87,
  s: 83,
  a: 65,
  d: 68,
  left: 263,
  right: 262,
  up: 265,
  down: 264,
  ctrl: 341, // fire
  space: 32, // use / open
  shift: 340, // run
  enter: 257,
  esc: 256,
};

/** Browser key → DOSBox key while the DOOM window has the keyboard. */
const KEYMAP: Record<string, number> = {
  KeyW: K.w,
  KeyS: K.s,
  KeyA: K.a,
  KeyD: K.d,
  ArrowLeft: K.left,
  ArrowRight: K.right,
  ArrowUp: K.up,
  ArrowDown: K.down,
  Space: K.ctrl, // Space shoots, as most people expect
  KeyF: K.space, // F uses / opens
  ShiftLeft: K.shift,
  ShiftRight: K.shift,
  Enter: K.enter,
  Escape: K.esc,
  ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((n) => [`Digit${n}`, 48 + n])),
};

const PREVENT_DEFAULT = new Set([
  'Space',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'AltLeft',
  'AltRight',
]);

type Status = 'loading' | 'ready' | 'error';

/**
 * DOOM in a standard window: DOSBox boots straight into the game, the frame scales to whatever
 * size the window is, and the keyboard drives it while the window is focused. On phones the
 * game gets on-screen controls under the picture.
 */
export default function DoomApp() {
  // Only drive the game while its window is the focused one; otherwise every other app
  // (the Terminal, text fields) would lose Space, Enter, the arrows and WASD to DOOM.
  const { windows, focusedId } = useDesktop();
  const doomFocused = windows.some((w) => w.id === focusedId && w.appId === 'doom');
  const focusedRef = useRef(doomFocused);
  focusedRef.current = doomFocused;
  const isMobile = useIsMobile();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ciRef = useRef<CI | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const mutedRef = useRef(false);

  const [status, setStatus] = useState<Status>('loading');
  const [muted, setMuted] = useState(false);
  const [hint, setHint] = useState(true);

  useEffect(() => {
    mutedRef.current = muted;
    if (!muted && audioRef.current?.state === 'suspended') audioRef.current.resume();
  }, [muted]);

  // The controls line goes away on its own once the game has been up for a while.
  useEffect(() => {
    if (status !== 'ready') return;
    const t = setTimeout(() => setHint(false), 9000);
    return () => clearTimeout(t);
  }, [status]);

  // ── Boot DOSBox ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let stopped = false;

    (async () => {
      if (!window.emulators) {
        setStatus('error');
        return;
      }
      window.emulators.pathPrefix = '/emulators/';
      try {
        const res = await fetch('/doom.jsdos');
        if (!res.ok) throw new Error('doom.jsdos not found');
        const bundle = new Uint8Array(await res.arrayBuffer());
        if (stopped) return;

        const ci = await window.emulators.dosboxDirect(bundle);
        if (stopped) {
          ci.exit();
          return;
        }
        ciRef.current = ci;

        const ev = ci.events();
        let ctx: CanvasRenderingContext2D | null = null;
        let img: ImageData | null = null;

        ev.onFrameSize((w, h) => {
          canvas.width = w;
          canvas.height = h;
          ctx = canvas.getContext('2d');
          img = ctx?.createImageData(w, h) ?? null;
          setStatus('ready');
        });

        ev.onFrame((rgb, rgba) => {
          if (!ctx || !img) return;
          if (rgba) {
            img.data.set(rgba);
          } else if (rgb) {
            for (let i = 0, j = 0; i < img.data.length; i += 4, j += 3) {
              img.data[i] = rgb[j];
              img.data[i + 1] = rgb[j + 1];
              img.data[i + 2] = rgb[j + 2];
              img.data[i + 3] = 255;
            }
          }
          ctx.putImageData(img, 0, 0);
        });

        try {
          const freq = ci.soundFrequency();
          const ac = new AudioContext({ sampleRate: freq });
          audioRef.current = ac;
          let next = 0;
          ev.onSoundPush((samples) => {
            if (mutedRef.current) return;
            if (ac.state === 'suspended') ac.resume();
            const buf = ac.createBuffer(1, samples.length, freq);
            buf.getChannelData(0).set(samples);
            const src = ac.createBufferSource();
            src.buffer = buf;
            src.connect(ac.destination);
            const t = Math.max(ac.currentTime, next);
            src.start(t);
            next = t + buf.duration;
          });
        } catch {
          /* audio optional */
        }
      } catch (err) {
        console.error('DOOM:', err);
        setStatus('error');
      }
    })();

    return () => {
      stopped = true;
      ciRef.current?.exit().catch(() => {});
      audioRef.current?.close().catch(() => {});
    };
  }, []);

  // ── Keyboard (desktop) ─────────────────────────────────────────────────
  useEffect(() => {
    const held = new Set<string>();
    const down = (e: KeyboardEvent) => {
      if (!focusedRef.current) return;
      if (PREVENT_DEFAULT.has(e.code)) e.preventDefault();
      const key = KEYMAP[e.code];
      if (key === undefined || held.has(e.code)) return;
      held.add(e.code);
      setHint(false);
      ciRef.current?.sendKeyEvent(key, true);
    };
    const up = (e: KeyboardEvent) => {
      held.delete(e.code);
      const key = KEYMAP[e.code];
      if (key !== undefined && focusedRef.current) ciRef.current?.sendKeyEvent(key, false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // ── Touch controls (phones) ────────────────────────────────────────────
  function pad(key: number, label: string, className = '') {
    const press = (pressed: boolean) => (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (pressed) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* synthetic events have no active pointer */
        }
        if (audioRef.current?.state === 'suspended') audioRef.current.resume();
      }
      ciRef.current?.sendKeyEvent(key, pressed);
    };
    return (
      <button
        type="button"
        className={`${styles.pad} ${className}`}
        onPointerDown={press(true)}
        onPointerUp={press(false)}
        onPointerCancel={press(false)}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={label}
      >
        {label}
      </button>
    );
  }

  return (
    <div className={`${styles.root} ${isMobile ? styles.rootMobile : ''}`}>
      <div className={styles.screen}>
        <canvas
          ref={canvasRef}
          className={`${styles.canvas} ${status === 'ready' ? styles.show : ''}`}
        />
        {status !== 'ready' && (
          <p className={styles.status} role="status">
            {status === 'error' ? 'DOOM could not start.' : 'Starting DOSBox…'}
          </p>
        )}
        {status === 'ready' && hint && !isMobile && (
          <p className={styles.hint}>W A S D move · ← → turn · Space fire · F use · Esc menu</p>
        )}
        <button
          type="button"
          className={styles.mute}
          onClick={() => setMuted((m) => !m)}
          aria-pressed={muted}
        >
          {muted ? 'Unmute' : 'Mute'}
        </button>
      </div>

      {isMobile && (
        <div className={styles.controls} aria-label="DOOM controls">
          <div className={styles.dpad}>
            <span />
            {pad(K.w, '↑')}
            <span />
            {pad(K.left, '←')}
            {pad(K.s, '↓')}
            {pad(K.right, '→')}
          </div>
          <div className={styles.actions}>
            <div className={styles.row}>
              {pad(K.esc, 'Esc', styles.padSmall)}
              {pad(K.enter, 'Enter', styles.padSmall)}
            </div>
            <div className={styles.row}>
              {pad(K.space, 'Use', styles.padWide)}
              {pad(K.ctrl, 'Fire', styles.padFire)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
