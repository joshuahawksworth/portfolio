import { useState, useEffect, useRef } from 'react';
import styles from './SnakeApp.module.css';

const COLS = 20;
const ROWS = 18;
const TICK = 115;
const CELL = 16;
export const SNAKE_W = COLS * CELL;  // 320
export const SNAKE_H = ROWS * CELL;  // 288

type Phase = 'idle' | 'playing' | 'dead';
type Dir   = 'U' | 'D' | 'L' | 'R';
type Pt    = { x: number; y: number };

const OPPOSITE: Record<Dir, Dir> = { U:'D', D:'U', L:'R', R:'L' };
const DELTA:    Record<Dir, Pt>  = { U:{x:0,y:-1}, D:{x:0,y:1}, L:{x:-1,y:0}, R:{x:1,y:0} };

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

// Props shape used both standalone and from NokiaWindow
export interface SnakeAppProps {
  onPushDir?: (cb: (d: Dir) => void) => void;
  onStartGame?: (cb: () => void) => void;
  hideDpad?: boolean;
  props?: Record<string, unknown>;
}

export default function SnakeApp({ onPushDir, onStartGame, hideDpad, props: outerProps }: SnakeAppProps) {
  // Support hideDpad via generic props when rendered from window system
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

  function pushDir(d: Dir) {
    if (phaseRef.current !== 'playing') { startGame(); return; }
    const q    = queueRef.current;
    const last = q.length > 0 ? q[q.length - 1] : dirRef.current;
    if (d !== OPPOSITE[last] && q.length < 2) q.push(d);
  }

  function startGame() {
    const snake = [{ x: 10, y: 9 }, { x: 9, y: 9 }, { x: 8, y: 9 }];
    const food  = randPt(snake);
    snakeRef.current = snake;
    foodRef.current  = food;
    dirRef.current   = 'R';
    queueRef.current = [];
    scoreRef.current = 0;
    phaseRef.current = 'playing';
    setScore(0);
    setPhase('playing');
    if (canvasRef.current) draw(canvasRef.current, snake, food);
    wrapRef.current?.focus();
  }

  function handleKey(e: React.KeyboardEvent) {
    const MAP: Record<string, Dir> = {
      ArrowUp:'U', w:'U', W:'U',
      ArrowDown:'D', s:'D', S:'D',
      ArrowLeft:'L', a:'L', A:'L',
      ArrowRight:'R', d:'R', D:'R',
    };
    if ((e.key === ' ' || e.key === 'Enter') && phaseRef.current !== 'playing') {
      startGame(); return;
    }
    const d = MAP[e.key];
    if (!d) return;
    e.preventDefault();
    pushDir(d);
  }

  // Keep latest versions in refs so the stable wrappers below always call current closures
  const pushDirRef2   = useRef(pushDir);
  const startGameRef2 = useRef(startGame);
  pushDirRef2.current   = pushDir;
  startGameRef2.current = startGame;

  // Expose stable wrappers to NokiaWindow once on mount — never re-runs
  useEffect(() => {
    onPushDir?.((d) => pushDirRef2.current(d));
    onStartGame?.(() => startGameRef2.current());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (canvasRef.current) draw(canvasRef.current, snakeRef.current, foodRef.current);
    wrapRef.current?.focus();
  }, []);

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
            {phase === 'dead' && <p className={styles.gameOver}>GAME OVER</p>}
            {phase === 'dead' && <p className={styles.deathScore}>{score}</p>}
            <button className={styles.playBtn} onClick={startGame}>
              {phase === 'idle' ? '▶  START' : '▶  AGAIN'}
            </button>
          </div>
        )}
      </div>

      {/* D-pad — shown on mobile / non-Nokia usage */}
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
