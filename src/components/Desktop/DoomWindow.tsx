/**
 * DOOM's own window: a gunmetal frame with the game at a fixed 16:10 (the DOSBox frame,
 * never squashed to the window) and a controls guide down the right that lays the keys
 * out as they sit on a keyboard, lighting up as they are pressed. The guide is open by
 * default and can be hidden, at which point the window simply narrows.
 */
import { useEffect, useRef, useState } from 'react';
import { useDesktop, type WindowInstance } from '../../context/DesktopContext';
import { useOs } from '../../context/SettingsContext';
import DoomApp from '../apps/DoomApp';
import styles from './DoomWindow.module.css';

interface Key {
  code: string;
  label: string;
  wide?: boolean;
}

const WASD: (Key | null)[][] = [
  [null, { code: 'KeyW', label: 'W' }, null],
  [
    { code: 'KeyA', label: 'A' },
    { code: 'KeyS', label: 'S' },
    { code: 'KeyD', label: 'D' },
  ],
];
const ARROWS: (Key | null)[][] = [
  [null, { code: 'ArrowUp', label: '↑' }, null],
  [
    { code: 'ArrowLeft', label: '←' },
    { code: 'ArrowDown', label: '↓' },
    { code: 'ArrowRight', label: '→' },
  ],
];
const ACTIONS: { key: Key; does: string }[] = [
  { key: { code: 'Space', label: 'Space', wide: true }, does: 'Shoot' },
  { key: { code: 'KeyF', label: 'F' }, does: 'Use / open door' },
  { key: { code: 'ShiftLeft', label: 'Shift', wide: true }, does: 'Run' },
  { key: { code: 'Enter', label: 'Enter', wide: true }, does: 'Confirm' },
  { key: { code: 'Escape', label: 'Esc' }, does: 'Pause / menu' },
];
const WEAPONS: Key[] = [1, 2, 3, 4, 5, 6, 7].map((n) => ({ code: `Digit${n}`, label: `${n}` }));

const KEY_ALIASES: Record<string, string> = { ShiftRight: 'ShiftLeft' };

export default function DoomWindow({ win }: { win: WindowInstance }) {
  const { closeWindow, focusWindow, moveWindow, minimizeWindow, focusedId } = useDesktop();
  const os = useOs();
  const posRef = useRef({ x: win.x, y: win.y });
  const [pos, setPos] = useState({ x: win.x, y: win.y });
  const [guide, setGuide] = useState(true);
  const [muted, setMuted] = useState(false);
  const [held, setHeld] = useState<Set<string>>(() => new Set());
  const focused = focusedId === win.id;

  // Light the keycaps as the keys are pressed (only while this window has the keyboard).
  useEffect(() => {
    if (!focused) {
      setHeld(new Set());
      return;
    }
    const code = (e: KeyboardEvent) => KEY_ALIASES[e.code] ?? e.code;
    const down = (e: KeyboardEvent) =>
      setHeld((prev) => (prev.has(code(e)) ? prev : new Set(prev).add(code(e))));
    const up = (e: KeyboardEvent) =>
      setHeld((prev) => {
        if (!prev.has(code(e))) return prev;
        const next = new Set(prev);
        next.delete(code(e));
        return next;
      });
    const clear = () => setHeld(new Set());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
    };
  }, [focused]);

  function onBarMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    focusWindow(win.id);
    const sx = e.clientX - posRef.current.x;
    const sy = e.clientY - posRef.current.y;
    function onMove(ev: MouseEvent) {
      const nx = ev.clientX - sx;
      const ny = Math.max(28, ev.clientY - sy);
      posRef.current = { x: nx, y: ny };
      setPos({ x: nx, y: ny });
      moveWindow(win.id, nx, ny);
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  if (win.minimized) return null;

  const cap = (k: Key | null, i: number) =>
    k ? (
      <span
        key={k.code}
        className={`${styles.key} ${k.wide ? styles.keyWide : ''} ${held.has(k.code) ? styles.keyDown : ''}`}
      >
        {k.label}
      </span>
    ) : (
      <span key={`gap-${i}`} className={styles.keyGap} />
    );

  const closeBtn = (
    <button
      type="button"
      className={os === 'windows' ? styles.closeWin : styles.closeMac}
      onClick={() => closeWindow(win.id)}
      onMouseDown={(e) => e.stopPropagation()}
      aria-label="Close"
    >
      {os === 'windows' ? '✕' : ''}
    </button>
  );

  return (
    <div
      data-window=""
      className={`${styles.frame} ${focused ? styles.focused : ''} ${os === 'windows' ? styles.frameWin : ''}`}
      style={{ left: pos.x, top: pos.y, zIndex: win.zIndex }}
      onMouseDown={(e) => {
        e.stopPropagation();
        focusWindow(win.id);
      }}
    >
      <div className={styles.bar} onMouseDown={onBarMouseDown}>
        {os !== 'windows' && closeBtn}
        <span className={styles.wordmark}>DOOM</span>
        <span className={styles.barSub}>DOSBox</span>
        <span className={styles.barFill} />
        <button
          type="button"
          className={`${styles.barBtn} ${muted ? styles.barBtnOn : ''}`}
          onClick={() => setMuted((m) => !m)}
          onMouseDown={(e) => e.stopPropagation()}
          aria-pressed={muted}
        >
          {muted ? 'Unmute' : 'Mute'}
        </button>
        <button
          type="button"
          className={`${styles.barBtn} ${guide ? styles.barBtnOn : ''}`}
          onClick={() => setGuide((g) => !g)}
          onMouseDown={(e) => e.stopPropagation()}
          aria-pressed={guide}
        >
          Controls
        </button>
        <button
          type="button"
          className={styles.barBtn}
          onClick={() => minimizeWindow(win.id)}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Minimise"
        >
          –
        </button>
        {os === 'windows' && closeBtn}
      </div>

      <div className={styles.body}>
        <div className={styles.game}>
          <DoomApp props={{ muted }} />
        </div>

        {guide && (
          <aside className={styles.guide} aria-label="DOOM controls">
            <div className={styles.pair}>
              <section className={styles.section}>
                <h3 className={styles.heading}>Move</h3>
                <div className={styles.cluster}>{WASD.map((row) => row.map(cap))}</div>
                <p className={styles.note}>
                  <b>W S</b> forward / back
                  <br />
                  <b>A D</b> strafe
                </p>
              </section>

              <section className={styles.section}>
                <h3 className={styles.heading}>Look</h3>
                <div className={styles.cluster}>{ARROWS.map((row) => row.map(cap))}</div>
                <p className={styles.note}>
                  <b>← →</b> turn
                  <br />
                  <b>↑ ↓</b> menus
                </p>
              </section>
            </div>

            <section className={styles.section}>
              <h3 className={styles.heading}>Actions</h3>
              <ul className={styles.actions}>
                {ACTIONS.map(({ key, does }) => (
                  <li key={key.code} className={styles.action}>
                    {cap(key, 0)}
                    <span className={styles.does}>{does}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className={styles.section}>
              <h3 className={styles.heading}>Weapons</h3>
              <div className={styles.row}>{WEAPONS.map(cap)}</div>
            </section>
          </aside>
        )}
      </div>
    </div>
  );
}
