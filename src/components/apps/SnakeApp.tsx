import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './SnakeApp.module.css';

const COLS = 20;
const ROWS = 18;
const TICK = 95;   // ms between moves — tighter than before for snappier feel
const CELL = 16;
export const SNAKE_W = COLS * CELL;
export const SNAKE_H = ROWS * CELL;

type Phase = 'idle' | 'playing' | 'dead' | 'entry' | 'submitting' | 'board';
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

// Draw a vector apple — consistent on all platforms, no emoji
function drawApple(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const cx = x + size / 2;
  const cy = y + size / 2 + 1;
  const r  = size * 0.37;
  // Body
  ctx.fillStyle = '#cc2200';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  // Stem
  ctx.fillStyle = '#5a3a10';
  ctx.fillRect(cx - 1, cy - r - 3, 2, 5);
  // Leaf
  ctx.fillStyle = '#2a7a18';
  ctx.beginPath(); ctx.ellipse(cx + 4, cy - r - 1, 4, 2, -0.5, 0, Math.PI * 2); ctx.fill();
  // Shine
  ctx.fillStyle = 'rgba(255,255,255,0.32)';
  ctx.beginPath(); ctx.arc(cx - r * 0.28, cy - r * 0.28, r * 0.22, 0, Math.PI * 2); ctx.fill();
}

function draw(canvas: HTMLCanvasElement, snake: Pt[], food: Pt) {
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#8bac0f';
  ctx.fillRect(0, 0, SNAKE_W, SNAKE_H);
  ctx.strokeStyle = 'rgba(100,130,0,0.3)'; ctx.lineWidth = 0.4;
  for (let i = 1; i < COLS; i++) { ctx.beginPath(); ctx.moveTo(i*CELL,0); ctx.lineTo(i*CELL,SNAKE_H); ctx.stroke(); }
  for (let i = 1; i < ROWS; i++) { ctx.beginPath(); ctx.moveTo(0,i*CELL); ctx.lineTo(SNAKE_W,i*CELL); ctx.stroke(); }
  ctx.fillStyle = '#306230';
  for (let i = 1; i < snake.length; i++) ctx.fillRect(snake[i].x*CELL+1, snake[i].y*CELL+1, CELL-2, CELL-2);
  ctx.fillStyle = '#0f380f';
  ctx.fillRect(snake[0].x*CELL+1, snake[0].y*CELL+1, CELL-2, CELL-2);
  drawApple(ctx, food.x*CELL, food.y*CELL, CELL);
}

// ── API ────────────────────────────────────────────────────────────────────
export interface LeaderboardEntry { name: string; score: number }

async function fetchBoard(): Promise<LeaderboardEntry[]> {
  try { const r = await fetch('/api/leaderboard'); return r.ok ? r.json() : []; } catch { return []; }
}
async function submitScore(name: string, score: number): Promise<boolean> {
  try {
    const r = await fetch('/api/leaderboard', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
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

  // Game state in refs (for use inside setInterval)
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

  // Name entry
  const [nameChars, setNameChars] = useState<[string,string,string]>(['A','A','A']);
  const [cursor,    setCursor]    = useState(0);
  const nameRef   = useRef<[string,string,string]>(['A','A','A']);
  const cursorRef = useRef(0);

  // Leaderboard
  const [board,       setBoard]       = useState<LeaderboardEntry[]>([]);
  const [boardStatus, setBoardStatus] = useState<'idle'|'loading'|'done'>('idle');
  const [submitOk,    setSubmitOk]    = useState<boolean | null>(null);

  function syncPhase(p: Phase) { phaseRef.current = p; setPhase(p); }

  // ── Name entry helpers (button-driven only) ───────────────────────────────
  function nudge(slot: number, dir: 1 | -1) {
    const cur = nameRef.current[slot];
    const idx = (ALPHA.indexOf(cur) + dir + 26) % 26;
    const next = [...nameRef.current] as [string,string,string];
    next[slot] = ALPHA[idx];
    nameRef.current = next;
    setNameChars(next);
  }
  function moveCursor(slot: number) {
    cursorRef.current = slot;
    setCursor(slot);
  }

  const handleConfirm = useCallback(() => {
    const name = nameRef.current.join('');
    syncPhase('submitting');
    setBoardStatus('loading');
    Promise.all([submitScore(name, scoreRef.current), fetchBoard()]).then(([ok, entries]) => {
      setSubmitOk(ok);
      setBoard(entries);
      setBoardStatus('done');
      syncPhase('board');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSkip = useCallback(() => {
    syncPhase('board');
    setBoardStatus('loading');
    fetchBoard().then(entries => { setBoard(entries); setBoardStatus('done'); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openBoard() {
    syncPhase('board');
    setBoardStatus('loading');
    const entries = await fetchBoard();
    setBoard(entries);
    setBoardStatus('done');
  }

  // ── Game controls ─────────────────────────────────────────────────────────
  // pushDir is ONLY for movement during gameplay; Nokia D-pad uses it
  function pushDir(d: Dir) {
    if (phaseRef.current !== 'playing') return;
    const q    = queueRef.current;
    const last = q.length > 0 ? q[q.length - 1] : dirRef.current;
    if (d !== OPPOSITE[last] && q.length < 2) q.push(d);
  }

  // startGame is called from the Nokia centre button / Play soft-key
  // — only restarts if we're genuinely on a restart screen
  function triggerStart() {
    if (phaseRef.current === 'idle') startGame();
  }

  function startGame() {
    const snake = [{ x:10,y:9 }, { x:9,y:9 }, { x:8,y:9 }];
    const food  = randPt(snake);
    snakeRef.current  = snake;
    foodRef.current   = food;
    dirRef.current    = 'R';
    queueRef.current  = [];
    scoreRef.current  = 0;
    nameRef.current   = ['A','A','A'];
    cursorRef.current = 0;
    setNameChars(['A','A','A']);
    setCursor(0);
    setSubmitOk(null);
    setBoard([]);
    setBoardStatus('idle');
    syncPhase('playing');
    setScore(0);
    if (canvasRef.current) draw(canvasRef.current, snake, food);
    wrapRef.current?.focus();
  }

  // Stable wrappers for NokiaWindow
  const pushDirRef2   = useRef(pushDir);
  const triggerRef    = useRef(triggerStart);
  pushDirRef2.current  = pushDir;
  triggerRef.current   = triggerStart;

  useEffect(() => {
    onPushDir?.((d) => pushDirRef2.current(d));
    onStartGame?.(() => triggerRef.current());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (canvasRef.current) draw(canvasRef.current, snakeRef.current, foodRef.current);
    wrapRef.current?.focus();
  }, []);

  // ── Game loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (phaseRef.current !== 'playing') return;
      if (queueRef.current.length > 0) dirRef.current = queueRef.current.shift()!;

      const snake = snakeRef.current;
      const { x: dx, y: dy } = DELTA[dirRef.current];
      const nx = snake[0].x + dx, ny = snake[0].y + dy;

      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || snake.some(s => s.x===nx && s.y===ny)) {
        if (scoreRef.current > 0) {
          // Go straight to name entry — no delay
          nameRef.current   = ['A','A','A'];
          cursorRef.current = 0;
          setNameChars(['A','A','A']);
          setCursor(0);
          phaseRef.current = 'entry';
          setPhase('entry');
        } else {
          phaseRef.current = 'dead';
          setPhase('dead');
        }
        return;
      }

      const ate  = nx === foodRef.current.x && ny === foodRef.current.y;
      const next = [{ x: nx, y: ny }, ...snake];
      if (!ate) next.pop();
      snakeRef.current = next;

      if (ate) {
        scoreRef.current++;
        setScore(scoreRef.current);
        if (scoreRef.current > bestRef.current) { bestRef.current = scoreRef.current; setBest(scoreRef.current); }
        foodRef.current = randPt(next);
      }

      if (canvasRef.current) draw(canvasRef.current, next, foodRef.current);
    }, TICK);
    return () => clearInterval(id);
  }, []);


  // ── Keyboard ──────────────────────────────────────────────────────────────
  function handleKey(e: React.KeyboardEvent) {
    // Name entry — arrow keys navigate letters/slots, Enter submits
    if (phaseRef.current === 'entry') {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        nudge(cursorRef.current, -1); // up = previous letter
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        nudge(cursorRef.current, 1);  // down = next letter
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (cursorRef.current > 0) moveCursor(cursorRef.current - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (cursorRef.current < 2) moveCursor(cursorRef.current + 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleConfirm();
      }
      return;
    }

    // Gameplay — arrow keys only
    if (phaseRef.current !== 'playing') return;
    const MAP: Record<string, Dir> = {
      ArrowUp:'U', w:'U', W:'U',
      ArrowDown:'D', s:'D', S:'D',
      ArrowLeft:'L', a:'L', A:'L',
      ArrowRight:'R', d:'R', D:'R',
    };
    const d = MAP[e.key];
    if (d) { e.preventDefault(); pushDir(d); }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div ref={wrapRef} className={styles.gameArea} tabIndex={0} onKeyDown={handleKey}>
      <div className={styles.statusBar}>
        <span>{score}</span>
        <span className={styles.gameName}>SNAKE</span>
        <span>HI: {best}</span>
      </div>

      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} width={SNAKE_W} height={SNAKE_H} className={styles.canvas} />

        {/* ── Idle screen ── */}
        {phase === 'idle' && (
          <div className={styles.overlay}>
            <div className={styles.overlayInner}>
              <button className={styles.playBtn} onClick={startGame}>▶  START</button>
              <button className={styles.boardBtn} onClick={openBoard}>🏆 SCORES</button>
            </div>
          </div>
        )}

        {/* ── Game Over (score = 0) ── */}
        {phase === 'dead' && scoreRef.current === 0 && (
          <div className={styles.overlay}>
            <div className={styles.overlayInner}>
              <p className={styles.gameOver}>GAME OVER</p>
              <p className={styles.deathScore}>0</p>
              <button className={styles.playBtn} onClick={startGame}>▶  RETRY</button>
            </div>
          </div>
        )}

        {/* ── Game Over (score > 0) — brief flash before entry ── */}
        {phase === 'dead' && scoreRef.current > 0 && (
          <div className={styles.overlay}>
            <div className={styles.overlayInner}>
              <p className={styles.gameOver}>GAME OVER</p>
              <p className={styles.deathScore}>{score}</p>
              <p className={styles.enterNameLabel} style={{ opacity: 0.6 }}>loading name entry…</p>
            </div>
          </div>
        )}

        {/* ── Name entry ── */}
        {(phase === 'entry' || phase === 'submitting') && (
          <div className={styles.overlay}>
            <div className={styles.overlayInner}>
              <p className={styles.gameOver}>SCORE: {score}</p>
              <p className={styles.enterNameLabel}>Enter your name</p>

              {/* Letter slots with up/down arrows */}
              <div className={styles.nameEntry}>
                {([0,1,2] as const).map(i => (
                  <div key={i} className={styles.nameSlotGroup}>
                    <button
                      className={styles.letterArrow}
                      onClick={() => { moveCursor(i); nudge(i, -1); }}
                      disabled={phase === 'submitting'}
                    >▲</button>
                    <div
                      className={`${styles.nameChar} ${cursor === i ? styles.nameCharActive : ''}`}
                      onClick={() => moveCursor(i)}
                    >
                      {nameChars[i]}
                    </div>
                    <button
                      className={styles.letterArrow}
                      onClick={() => { moveCursor(i); nudge(i, 1); }}
                      disabled={phase === 'submitting'}
                    >▼</button>
                  </div>
                ))}
              </div>

              {/* Confirm */}
              <button
                className={styles.confirmBtn}
                onClick={handleConfirm}
                disabled={phase === 'submitting'}
              >
                {phase === 'submitting' ? 'SAVING…' : '✓ SUBMIT'}
              </button>
            </div>
          </div>
        )}

        {/* ── Leaderboard ── */}
        {phase === 'board' && (
          <div className={styles.overlay}>
            <div className={styles.boardOverlay}>
              <p className={styles.boardTitle}>🏆 TOP SCORES</p>
              {submitOk === true && <p className={styles.boardSubmitted}>Score saved!</p>}
              {boardStatus === 'loading' && <p className={styles.boardLoading}>Loading…</p>}
              {boardStatus === 'done' && board.length === 0 && (
                <p className={styles.boardEmpty}>No scores yet — be first!</p>
              )}
              {boardStatus === 'done' && board.length > 0 && (
                <ol className={styles.boardList}>
                  {board.map((e, i) => (
                    <li key={i} className={`${styles.boardRow} ${i === 0 ? styles.boardRowFirst : ''}`}>
                      <span className={styles.boardRank}>#{i+1}</span>
                      <span className={styles.boardName}>{e.name}</span>
                      <span className={styles.boardScore}>{e.score}</span>
                    </li>
                  ))}
                </ol>
              )}
              <button className={styles.playBtn} style={{ marginTop: 6 }} onClick={startGame}>
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}
      </div>

      {/* D-pad */}
      {!shouldHideDpad && (
        <div className={styles.dpad}>
          <button className={styles.dpadBtn} onPointerDown={e => { e.preventDefault(); pushDir('U'); }}>▲</button>
          <div className={styles.dpadRow}>
            <button className={styles.dpadBtn} onPointerDown={e => { e.preventDefault(); pushDir('L'); }}>◄</button>
            <div className={styles.dpadCenter} />
            <button className={styles.dpadBtn} onPointerDown={e => { e.preventDefault(); pushDir('R'); }}>►</button>
          </div>
          <button className={styles.dpadBtn} onPointerDown={e => { e.preventDefault(); pushDir('D'); }}>▼</button>
        </div>
      )}
    </div>
  );
}
