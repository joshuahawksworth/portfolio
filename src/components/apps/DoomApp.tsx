import { useEffect, useRef, useState } from 'react';
import styles from './DoomApp.module.css';

interface CIEvents {
  onFrame:     (cb: (rgb: Uint8Array | null, rgba: Uint8Array | null) => void) => void;
  onFrameSize: (cb: (w: number, h: number) => void) => void;
  onSoundPush: (cb: (samples: Float32Array) => void) => void;
  onExit:      (cb: () => void) => void;
}
interface CI {
  soundFrequency:  () => number;
  exit:            () => Promise<void>;
  sendKeyEvent:    (keyCode: number, pressed: boolean) => void;
  events:          () => CIEvents;
}
declare global {
  interface Window {
    emulators: { pathPrefix: string; dosboxDirect: (b: Uint8Array) => Promise<CI> };
  }
}

// DOSBox key codes (from js-dos Ia mapping: DOM keyCode → DOSBox key)
// This bundle's DEFAULT.CFG: key_up=17(W) key_down=31(S) strafeL=30(A) strafeR=32(D)
// key_left=75(←) key_right=77(→) key_fire=29(Ctrl) key_use=57(Space)
const K = {
  w:     87,   // W letter  → DOS scan 17 → Doom: move forward
  s:     83,   // S letter  → DOS scan 31 → Doom: move backward
  a:     65,   // A letter  → DOS scan 30 → Doom: strafe left (direct binding)
  d:     68,   // D letter  → DOS scan 32 → Doom: strafe right (direct binding)
  left:  263,  // ← arrow  → DOS scan 75 → Doom: turn left
  right: 262,  // → arrow  → DOS scan 77 → Doom: turn right
  up:    265,  // ↑ arrow  → menu navigation
  down:  264,  // ↓ arrow  → menu navigation
  ctrl:  341,  // Ctrl      → DOS scan 29 → Doom: fire
  space: 32,   // Space     → DOS scan 57 → Doom: use/open
  shift: 340,  // Shift     → DOS scan 54 → Doom: run
  enter: 257,
  esc:   256,
  d1:49, d2:50, d3:51, d4:52, d5:53, d6:54, d7:55,
};

const CONTROLS = [
  { keys: 'W / S',   action: 'Move forward / back'   },
  { keys: 'A / D',   action: 'Strafe left / right'   },
  { keys: '← →',    action: 'Turn camera'            },
  { keys: 'Space',   action: 'Shoot'                  },
  { keys: 'F',       action: 'Use / Open door'        },
  { keys: 'Shift',   action: 'Run'                    },
  { keys: '1 – 7',   action: 'Select weapon'          },
  { keys: '↑ ↓',    action: 'Navigate menu'          },
  { keys: 'Enter',   action: 'Confirm'                },
  { keys: 'Escape',  action: 'Pause / Menu'           },
];

type Status = 'loading' | 'ready' | 'error';

export default function DoomApp() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const ciRef      = useRef<CI | null>(null);
  const audioRef   = useRef<AudioContext | null>(null);
  const mutedRef   = useRef(false);

  const [status,     setStatus]     = useState<Status>('loading');
  const [panelOpen,  setPanelOpen]  = useState(false);
  const [muted,      setMuted]      = useState(false);

  // ── Boot DOSBox ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let stopped = false;

    (async () => {
      if (!window.emulators) { setStatus('error'); return; }
      window.emulators.pathPrefix = '/emulators/';
      try {
        const res = await fetch('/doom.jsdos');
        if (!res.ok) throw new Error('doom.jsdos not found');
        const bundle = new Uint8Array(await res.arrayBuffer());
        if (stopped) return;

        const ci = await window.emulators.dosboxDirect(bundle);
        if (stopped) { ci.exit(); return; }
        ciRef.current = ci;

        const ev = ci.events();
        let ctx: CanvasRenderingContext2D | null = null;
        let img: ImageData | null = null;

        ev.onFrameSize((w, h) => {
          canvas.width = w; canvas.height = h;
          ctx = canvas.getContext('2d');
          img = ctx?.createImageData(w, h) ?? null;
          setStatus('ready');
        });

        ev.onFrame((rgb, rgba) => {
          if (!ctx || !img) return;
          if (rgba) { img.data.set(rgba); }
          else if (rgb) {
            for (let i = 0, j = 0; i < img.data.length; i += 4, j += 3) {
              img.data[i] = rgb[j]; img.data[i+1] = rgb[j+1];
              img.data[i+2] = rgb[j+2]; img.data[i+3] = 255;
            }
          }
          ctx.putImageData(img, 0, 0);
        });

        // Audio
        try {
          const freq = ci.soundFrequency();
          const ac = new AudioContext({ sampleRate: freq });
          audioRef.current = ac;
          let next = 0;
          ev.onSoundPush(samples => {
            if (mutedRef.current) return;
            if (ac.state === 'suspended') ac.resume();
            const buf = ac.createBuffer(1, samples.length, freq);
            buf.getChannelData(0).set(samples);
            const src = ac.createBufferSource();
            src.buffer = buf; src.connect(ac.destination);
            const t = Math.max(ac.currentTime, next);
            src.start(t); next = t + buf.duration;
          });
        } catch { /* audio optional */ }

      } catch (err) { console.error('DOOM:', err); setStatus('error'); }
    })();

    return () => {
      stopped = true;
      ciRef.current?.exit().catch(() => {});
      audioRef.current?.close().catch(() => {});
    };
  }, []);

  // ── Keyboard only — no mouse interaction with game ─────────────────────
  useEffect(() => {
    const held = new Set<string>();

    const dn = (e: KeyboardEvent) => {
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
      if (e.code === 'AltLeft' || e.code === 'AltRight') e.preventDefault();
      if (held.has(e.code)) return;
      held.add(e.code);

      const ci = ciRef.current;
      if (!ci) return;

      switch (e.code) {
        // WASD — send letter key codes matching doom's DEFAULT.CFG bindings
        case 'KeyW': ci.sendKeyEvent(K.w, true); break;   // forward
        case 'KeyS': ci.sendKeyEvent(K.s, true); break;   // backward
        case 'KeyA': ci.sendKeyEvent(K.a, true); break;   // strafe left
        case 'KeyD': ci.sendKeyEvent(K.d, true); break;   // strafe right
        // Arrow keys — turn camera left/right, navigate menus up/down
        case 'ArrowLeft':  ci.sendKeyEvent(K.left,  true); break;
        case 'ArrowRight': ci.sendKeyEvent(K.right, true); break;
        case 'ArrowUp':    ci.sendKeyEvent(K.up,    true); break;
        case 'ArrowDown':  ci.sendKeyEvent(K.down,  true); break;
        // Actions
        case 'Space':                            ci.sendKeyEvent(K.ctrl,  true); break; // fire
        case 'KeyF':                             ci.sendKeyEvent(K.space, true); break; // use/open
        case 'ShiftLeft': case 'ShiftRight':     ci.sendKeyEvent(K.shift, true); break; // run
        case 'Enter':                            ci.sendKeyEvent(K.enter, true); break;
        case 'Escape':                           ci.sendKeyEvent(K.esc,   true); break;
        // Weapons
        case 'Digit1': ci.sendKeyEvent(K.d1, true); break;
        case 'Digit2': ci.sendKeyEvent(K.d2, true); break;
        case 'Digit3': ci.sendKeyEvent(K.d3, true); break;
        case 'Digit4': ci.sendKeyEvent(K.d4, true); break;
        case 'Digit5': ci.sendKeyEvent(K.d5, true); break;
        case 'Digit6': ci.sendKeyEvent(K.d6, true); break;
        case 'Digit7': ci.sendKeyEvent(K.d7, true); break;
      }
    };

    const up = (e: KeyboardEvent) => {
      held.delete(e.code);
      const ci = ciRef.current;
      if (!ci) return;
      switch (e.code) {
        case 'KeyW': ci.sendKeyEvent(K.w, false); break;
        case 'KeyS': ci.sendKeyEvent(K.s, false); break;
        case 'KeyA': ci.sendKeyEvent(K.a, false); break;
        case 'KeyD': ci.sendKeyEvent(K.d, false); break;
        case 'ArrowLeft':  ci.sendKeyEvent(K.left,  false); break;
        case 'ArrowRight': ci.sendKeyEvent(K.right, false); break;
        case 'ArrowUp':    ci.sendKeyEvent(K.up,    false); break;
        case 'ArrowDown':  ci.sendKeyEvent(K.down,  false); break;
        case 'Space':                            ci.sendKeyEvent(K.ctrl,  false); break;
        case 'KeyF':                             ci.sendKeyEvent(K.space, false); break;
        case 'ShiftLeft': case 'ShiftRight':     ci.sendKeyEvent(K.shift, false); break;
        case 'Enter':                            ci.sendKeyEvent(K.enter, false); break;
        case 'Escape':                           ci.sendKeyEvent(K.esc,   false); break;
        case 'Digit1': ci.sendKeyEvent(K.d1, false); break;
        case 'Digit2': ci.sendKeyEvent(K.d2, false); break;
        case 'Digit3': ci.sendKeyEvent(K.d3, false); break;
        case 'Digit4': ci.sendKeyEvent(K.d4, false); break;
        case 'Digit5': ci.sendKeyEvent(K.d5, false); break;
        case 'Digit6': ci.sendKeyEvent(K.d6, false); break;
        case 'Digit7': ci.sendKeyEvent(K.d7, false); break;
      }
    };

    window.addEventListener('keydown', dn);
    window.addEventListener('keyup',   up);
    return () => {
      window.removeEventListener('keydown', dn);
      window.removeEventListener('keyup',   up);
    };
  }, []);

  function toggleMute(e: React.MouseEvent) {
    e.stopPropagation();
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (!next && audioRef.current?.state === 'suspended') {
      audioRef.current.resume();
    }
  }

  function togglePanel(e: React.MouseEvent) {
    e.stopPropagation();
    setPanelOpen(v => !v);
  }

  return (
    <div className={styles.root}>
      {/* Loading / error splash */}
      {status !== 'ready' && (
        <div className={styles.splash}>
          <div className={styles.doomTitle}>DOOM</div>
          <div className={styles.bar}><div className={styles.fill} /></div>
          <p className={styles.sub}>
            {status === 'error' ? 'Failed to start DOOM' : 'Loading engine…'}
          </p>
        </div>
      )}

      {/* Game canvas — keyboard only, no mouse interaction */}
      <canvas
        ref={canvasRef}
        className={`${styles.canvas} ${status === 'ready' ? styles.show : ''}`}
        style={{ cursor: 'default' }}
      />

      {/* Controls panel — slides in from the right, isolated from game */}
      <div
        className={`${styles.panel} ${panelOpen ? styles.panelOpen : ''}`}
        onMouseDown={e => e.stopPropagation()}
        onMouseUp={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.panelInner}>
          {/* Mute button */}
          <button
            className={`${styles.muteBtn} ${muted ? styles.muteBtnMuted : ''}`}
            onMouseDown={e => e.stopPropagation()}
            onClick={toggleMute}
          >
            {muted ? (
              <>
                <MuteIcon /> <span>Unmute</span>
              </>
            ) : (
              <>
                <SoundIcon /> <span>Mute</span>
              </>
            )}
          </button>

          <p className={styles.panelTitle}>Controls</p>

          <table className={styles.tbl}>
            <tbody>
              {CONTROLS.map(({ keys, action }) => (
                <tr key={action}>
                  <td className={styles.tblKey}>{keys}</td>
                  <td className={styles.tblVal}>{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toggle tab — permanently visible on right edge */}
      <button
        className={`${styles.tab} ${panelOpen ? styles.tabOpen : ''}`}
        onMouseDown={e => e.stopPropagation()}
        onMouseUp={e => e.stopPropagation()}
        onClick={togglePanel}
        aria-label="Toggle controls"
      >
        <span className={styles.tabArrow}>{panelOpen ? '›' : '‹'}</span>
        <span className={styles.tabLabel}>Controls</span>
      </button>
    </div>
  );
}

function SoundIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  );
}

function MuteIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <line x1="23" y1="9" x2="17" y2="15"/>
      <line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
  );
}
