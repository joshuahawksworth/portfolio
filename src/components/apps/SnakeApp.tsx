import { useState, useEffect, useRef } from 'react';
import styles from './SnakeApp.module.css';

const COLS = 20;
const ROWS = 18;
const TICK = 115;
const CELL = 16;
export const SNAKE_W = COLS * CELL;
export const SNAKE_H = ROWS * CELL;

type Phase = 'idle' | 'playing' | 'dead' | 'entry' | 'board';
type Dir   = 'U' | 'D' | 'L' | 'R';
type Pt    = { x: number; y: number };

const OPPOSITE: Record<Dir, Dir> = { U:'D', D:'U', L:'R', R:'L' };
const DELTA:    Record<Dir, Pt>  = { U:{x:0,y:-1}, D:{x:0,y:1}, L:{x:-1,y:0}, R:{x:1,y:0} };

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function randPt(snake: Pt[]): Pt {
  let p: Pt;
  do { p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }; }
  while (snake.some(s => s.x === p.x && s.y === p.y));
  return p;
}

let appleCache: HTMLCanvasElement | null = null;
function getAppleCanvas(size: number): HTMLCanvasElement {
  if (!appleCache || appleCache.width !== size) {
    appleCache = document.createElement('canvas');
    appleCache.width  = size;
    appleCache.height = size;
    const ctx = appleCache.getContext('2d')!;
    ctx.font = `${size - 2}px serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🍎', size / 2, size / 2 + 1);
  }
  return appleCache;
}

function draw(canvas: HTMLCanvasElement, snake: Pt[], food: Pt) {
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#8bac0f';
  ctx.fillRect(0, 0, SNAKE_W, SNAKE_H);

  ctx.strokeStyle = 'rgba(100,130,0,0.3)';
  ctx.lineWidth = 0.4;
  for (let i = 1; i < COLS; i++) {
    ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, SNAKE_H); ctx.stroke();
  }
  for (let i = 1; i < ROWS; i++) {
    ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(SNAKE_W, i * CELL); ctx.stroke();
  }

  ctx.fillStyle = '#306230';
  for (let i = 1; i < snake.length; i++) {
    const { x, y } = snake[i];
    ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
  }

  ctx.fillStyle = '#0f380f';
  const { x: hx, y: hy } = snake[0];
  ctx.fillRect(hx * CELL + 1, hy * CELL + 1, CELL - 2, CELL - 2);

  ctx.drawImage(getAppleCanvas(CELL), food.x * CELL, food.y * CELL, CELL, CELL);
}

// ── API helpers ────────────────────────────────────────────────────────────
export interface LeaderboardEntry { name: string; score: number }

async function fetchBoard(): Promise<LeaderboardEntry[]> {
  try {
    const r = await fetch('/api/leaderboard');
    if (!r.ok) return [];
    return await r.json();
  } catch { return []; }
}

async function submitScore(name: string, score: number): Promise<boolean> {
  try {
    const r = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score }),
    });
    return r.ok;
  } catch { return false; }
}

// ── Props ──────────────────────────────────────────────────────────────────
export interface SnakeAppProps {
  onPushDir?: (cb: (d: Dir) => void) => void;
  onStartGame?: (cb: () => void) => void;
  hideDpad?: boolean;
  props?: Record<string, unknown>;
}

export default function SnakeApp({ onPushDir, onStartGame, hideDpad, props: outerProps }: SnakeAppProps) {
  const shouldHideDpad = hideDpad ?? (outerProps?.hideDpad === true);

  const wrapRef   = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const snakeRef  = useRef<Pt[]>([{ x: 10, y: 9 }]);
  const foodRef   = useRef<Pt>({ x: 5, y: 5 });
  const dirRef    = useRef<Dir>('R');
  const queueRef  = useRef<Dir[]>([]);
  const phaseRef  = useRef<Phase>('idle');
  const scoreRef  = useRef(0);
  const bestRef   = useRef(0);

  const [score, setScore] = useState(0);
  const [best,  setBest]  = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');

  // Name entry state
  const [nameChars,  setNameChars]  = useState<[string,string,string]>(['A','A','A']);
  const [nameCursor, setNameCursor] = useState(0);
  const nameRef   = useRef<[string,string,string]>(['A','A','A']);
  const cursorRef = useRef(0);

  // Leaderboard state
  const [board,       setBoard]       = useState<LeaderboardEntry[]>([]);
  const [boardStatus, setBoardStatus] = useState<'idle'|'loading'|'done'>('idle');
  const [submitOk,    setSubmitOk]    = useState<boolean | null>(null);

  function setPhaseSync(p: Phase) { phaseRef.current = p; setPhase(p); }

  // ── Name entry helpers ───────────────────────────────────────────────────
  function nameCharAt(cursor: number) { return nameRef.current[cursor]; }
  function setChar(cursor: number, ch: string) {
    const next = [...nameRef.current] as [string,string,string];
    next[cursor] = ch;
    nameRef.current = next;
    setNameChars(next);
  }
  function nudgeLetter(cursor: number, dir: 1 | -1) {
    const cur = nameCharAt(cursor);
    const idx = (ALPHA.indexOf(cur) + dir + 26) % 26;
    setChar(cursor, ALPHA[idx]);
  }
  function advanceCursor() {
    const next = cursorRef.current + 1;
    if (next > 2) {
      // All three letters confirmed — submit
      doSubmit(nameRef.current.join(''));
    } else {
      cursorRef.current = next;
      setNameCursor(next);
    }
  }

  async function doSubmit(name: string) {
    setPhaseSync('board');
    setBoardStatus('loading');
    const [ok, entries] = await Promise.all([
      submitScore(name, scoreRef.current),
      fetchBoard(),
    ]);
    setSubmitOk(ok);
    setBoard(entries);
    setBoardStatus('done');
  }

  async function openBoard() {
    setPhaseSync('board');
    setBoardStatus('loading');
    const entries = await fetchBoard();
    setBoard(entries);
    setBoardStatus('done');
  }

  // ── Game controls ────────────────────────────────────────────────────────
  function pushDir(d: Dir) {
    const p = phaseRef.current;

    if (p === 'entry') {
      if (d === 'U') nudgeLetter(cursorRef.current, -1);
      if (d === 'D') nudgeLetter(cursorRef.current,  1);
      if (d === 'L' && cursorRef.current > 0) { cursorRef.current--; setNameCursor(c => c - 1); }
      if (d === 'R' && cursorRef.current < 2) { cursorRef.current++; setNameCursor(c => c + 1); }
      return;
    }

    if (p === 'board') { return; }

    if (p !== 'playing') { startGame(); return; }
    const q    = queueRef.current;
    const last = q.length > 0 ? q[q.length - 1] : dirRef.current;
    if (d !== OPPOSITE[last] && q.length < 2) q.push(d);
  }

  function startGame() {
    if (phaseRef.current === 'board') {
      // From leaderboard → back to idle
      setPhaseSync('idle');
      return;
    }
    if (phaseRef.current === 'entry') return;

    const snake = [{ x: 10, y: 9 }, { x: 9, y: 9 }, { x: 8, y: 9 }];
    const food  = randPt(snake);
    snakeRef.current = snake;
    foodRef.current  = food;
    dirRef.current   = 'R';
    queueRef.current = [];
    scoreRef.current = 0;
    // Reset name entry state
    nameRef.current   = ['A','A','A'];
    cursorRef.current = 0;
    setNameChars(['A','A','A']);
    setNameCursor(0);
    setSubmitOk(null);
    setPhaseSync('playing');
    setScore(0);
    if (canvasRef.current) draw(canvasRef.current, snake, food);
    wrapRef.current?.focus();
  }

  function handleCenterPress() {
    if (phaseRef.current === 'entry') { advanceCursor(); return; }
    if (phaseRef.current === 'board') { setPhaseSync('idle'); return; }
    startGame();
  }

  // Stable wrappers for NokiaWindow
  const pushDirRef2    = useRef(pushDir);
  const startGameRef2  = useRef(handleCenterPress);
  pushDirRef2.current   = pushDir;
  startGameRef2.current = handleCenterPress;

  useEffect(() => {
    onPushDir?.((d) => pushDirRef2.current(d));
    onStartGame?.(() => startGameRef2.current());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (canvasRef.current) draw(canvasRef.current, snakeRef.current, foodRef.current);
    wrapRef.current?.focus();
  }, []);

  // ── Game loop ────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (phaseRef.current !== 'playing') return;
      if (queueRef.current.length > 0) dirRef.current = queueRef.current.shift()!;

      const snake = snakeRef.current;
      const { x: dx, y: dy } = DELTA[dirRef.current];
      const nx = snake[0].x + dx;
      const ny = snake[0].y + dy;

      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS ||
          snake.some(s => s.x === nx && s.y === ny)) {
        phaseRef.current = 'dead';
        setPhase('dead');
        return;
      }

      const ate  = nx === foodRef.current.x && ny === foodRef.current.y;
      const next = [{ x: nx, y: ny }, ...snake];
      if (!ate) next.pop();
      snakeRef.current = next;

      if (ate) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        if (scoreRef.current > bestRef.current) {
          bestRef.current = scoreRef.current;
          setBest(scoreRef.current);
        }
        foodRef.current = randPt(next);
      }

      if (canvasRef.current) draw(canvasRef.current, next, foodRef.current);
    }, TICK);
    return () => clearInterval(id);
  }, []);

  // ── Keyboard handler ─────────────────────────────────────────────────────
  function handleKey(e: React.KeyboardEvent) {
    const MAP: Record<string, Dir> = {
      ArrowUp:'U', w:'U', W:'U',
      ArrowDown:'D', s:'D', S:'D',
      ArrowLeft:'L', a:'L', A:'L',
      ArrowRight:'R', d:'R', D:'R',
    };

    if (phaseRef.current === 'entry') {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advanceCursor(); return; }
      if (e.key === 'ArrowUp'   || e.key === 'w') { e.preventDefault(); nudgeLetter(cursorRef.current, -1); return; }
      if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); nudgeLetter(cursorRef.current,  1); return; }
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        e.preventDefault();
        if (cursorRef.current > 0) { cursorRef.current--; setNameCursor(c => c - 1); }
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        e.preventDefault();
        if (cursorRef.current < 2) { cursorRef.current++; setNameCursor(c => c + 1); }
        return;
      }
      return;
    }

    if (phaseRef.current === 'board') {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { setPhaseSync('idle'); }
      return;
    }

    if ((e.key === ' ' || e.key === 'Enter') && phaseRef.current !== 'playing') {
      startGame(); return;
    }
    const d = MAP[e.key];
    if (!d) return;
    e.preventDefault();
    pushDir(d);
  }

  // ── Overlay content ──────────────────────────────────────────────────────
  function OverlayContent() {
    if (phase === 'dead') {
      return (
        <div className={styles.overlayInner}>
          <p className={styles.gameOver}>GAME OVER</p>
          <p className={styles.deathScore}>{score}</p>
          {score > 0 ? (
            <>
              <p className={styles.enterNameLabel}>Enter your name</p>
              <div className={styles.nameEntry}>
                {([0,1,2] as const).map(i => (
                  <div key={i} className={`${styles.nameChar} ${nameCursor === i ? styles.nameCharActive : ''}`}>
                    {nameChars[i]}
                  </div>
                ))}
              </div>
              <p className={styles.nameHint}>↑↓ change  ←→ move  ✓ confirm</p>
            </>
          ) : (
            <button className={styles.playBtn} onClick={startGame}>▶  AGAIN</button>
          )}
        </div>
      );
    }

    if (phase === 'entry') {
      return (
        <div className={styles.overlayInner}>
          <p className={styles.enterNameLabel}>Enter your name</p>
          <div className={styles.nameEntry}>
            {([0,1,2] as const).map(i => (
              <div key={i} className={`${styles.nameChar} ${nameCursor === i ? styles.nameCharActive : ''}`}>
                {nameChars[i]}
              </div>
            ))}
          </div>
          <p className={styles.nameHint}>↑↓ change  ←→ move  ✓ confirm</p>
        </div>
      );
    }

    if (phase === 'board') {
      return (
        <div className={styles.boardOverlay}>
          <p className={styles.boardTitle}>🏆 TOP SCORES</p>
          {submitOk === true && (
            <p className={styles.boardSubmitted}>Score submitted!</p>
          )}
          {boardStatus === 'loading' && <p className={styles.boardLoading}>Loading…</p>}
          {boardStatus === 'done' && board.length === 0 && (
            <p className={styles.boardEmpty}>No scores yet — be first!</p>
          )}
          {boardStatus === 'done' && board.length > 0 && (
            <ol className={styles.boardList}>
              {board.map((e, i) => (
                <li key={i} className={styles.boardRow}>
                  <span className={styles.boardRank}>#{i + 1}</span>
                  <span className={styles.boardName}>{e.name}</span>
                  <span className={styles.boardScore}>{e.score}</span>
                </li>
              ))}
            </ol>
          )}
          <button className={styles.playBtn} style={{ marginTop: 6 }} onClick={() => setPhaseSync('idle')}>
            CLOSE
          </button>
        </div>
      );
    }

    if (phase === 'idle') {
      return (
        <div className={styles.overlayInner}>
          <button className={styles.playBtn} onClick={startGame}>▶  START</button>
          <button className={styles.boardBtn} onClick={openBoard}>🏆 SCORES</button>
        </div>
      );
    }

    return null;
  }

  // When game ends and score > 0, transition to entry phase
  useEffect(() => {
    if (phase === 'dead' && scoreRef.current > 0) {
      // Small delay so the GAME OVER flash is visible before entering name mode
      const t = setTimeout(() => {
        nameRef.current   = ['A','A','A'];
        cursorRef.current = 0;
        setNameChars(['A','A','A']);
        setNameCursor(0);
        setPhaseSync('entry');
      }, 900);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <div ref={wrapRef} className={styles.gameArea} tabIndex={0} onKeyDown={handleKey}>
      {/* Status bar */}
      <div className={styles.statusBar}>
        <span>{score}</span>
        <span className={styles.gameName}>SNAKE</span>
        <span>HI: {best}</span>
      </div>

      {/* Canvas */}
      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} width={SNAKE_W} height={SNAKE_H} className={styles.canvas} />
        {phase !== 'playing' && (
          <div className={styles.overlay}>
            <OverlayContent />
          </div>
        )}
      </div>

      {/* D-pad */}
      {!shouldHideDpad && (
        <div className={styles.dpad}>
          <button className={styles.dpadBtn} onPointerDown={e => { e.preventDefault(); pushDir('U'); }}>▲</button>
          <div className={styles.dpadRow}>
            <button className={styles.dpadBtn} onPointerDown={e => { e.preventDefault(); pushDir('L'); }}>◄</button>
            <div className={styles.dpadCenter} onPointerDown={e => { e.preventDefault(); handleCenterPress(); }} />
            <button className={styles.dpadBtn} onPointerDown={e => { e.preventDefault(); pushDir('R'); }}>►</button>
          </div>
          <button className={styles.dpadBtn} onPointerDown={e => { e.preventDefault(); pushDir('D'); }}>▼</button>
        </div>
      )}
    </div>
  );
}
