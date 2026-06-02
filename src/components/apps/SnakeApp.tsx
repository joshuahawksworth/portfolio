import { useState, useEffect, useRef } from 'react';
import styles from './SnakeApp.module.css';

const COLS = 20;
const ROWS = 20;
const TICK = 115;
const CELL = 20;
const W    = COLS * CELL;
const H    = ROWS * CELL;

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

function draw(canvas: HTMLCanvasElement, snake: Pt[], food: Pt) {
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(25,55,25,0.6)';
  ctx.lineWidth = 0.5;
  for (let i = 1; i < COLS; i++) {
    ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, H); ctx.stroke();
  }
  for (let i = 1; i < ROWS; i++) {
    ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(W, i * CELL); ctx.stroke();
  }

  // Body
  ctx.fillStyle = '#1d5e2e';
  for (let i = 1; i < snake.length; i++) {
    const { x, y } = snake[i];
    ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
  }

  // Head
  ctx.fillStyle = '#30d158';
  ctx.fillRect(snake[0].x * CELL + 1, snake[0].y * CELL + 1, CELL - 2, CELL - 2);

  // Food
  ctx.fillStyle = '#ff453a';
  ctx.beginPath();
  ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
}

export default function SnakeApp() {
  const wrapRef   = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const snakeRef  = useRef<Pt[]>([{ x: 10, y: 10 }]);
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
    const snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
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
    <div ref={wrapRef} className={styles.root} tabIndex={0} onKeyDown={handleKey}>
      <div className={styles.hud}>
        <span>Score <b>{score}</b></span>
        <span className={styles.title}>SNAKE</span>
        <span>Best <b>{best}</b></span>
      </div>

      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} width={W} height={H} className={styles.canvas} />
        {phase !== 'playing' && (
          <div className={styles.overlay}>
            {phase === 'dead' && <p className={styles.gameOver}>GAME OVER</p>}
            {phase === 'dead' && <p className={styles.deathScore}>{score}</p>}
            <button className={styles.playBtn} onClick={startGame}>
              {phase === 'idle' ? '▶  Start Game' : '▶  Play Again'}
            </button>
            <p className={styles.hint}>Arrow keys · WASD to move</p>
          </div>
        )}
      </div>

      <div className={styles.dpad}>
        <button className={styles.dpadBtn} onPointerDown={e => { e.preventDefault(); pushDir('U'); }}>▲</button>
        <div className={styles.dpadRow}>
          <button className={styles.dpadBtn} onPointerDown={e => { e.preventDefault(); pushDir('L'); }}>◄</button>
          <div className={styles.dpadCenter} />
          <button className={styles.dpadBtn} onPointerDown={e => { e.preventDefault(); pushDir('R'); }}>►</button>
        </div>
        <button className={styles.dpadBtn} onPointerDown={e => { e.preventDefault(); pushDir('D'); }}>▼</button>
      </div>
    </div>
  );
}
