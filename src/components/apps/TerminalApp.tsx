import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import styles from './TerminalApp.module.css';

interface Line { type: 'prompt' | 'out' | 'err' | 'blank'; text: string }

const USER = 'joshua';
const HOST = 'macbook-pro';
const INIT_CWD = `/Users/${USER}`;

const FS: Record<string, string[]> = {
  '/':                              ['Users', 'Applications', 'System'],
  '/Users':                         [USER],
  [`/Users/${USER}`]:               ['Desktop', 'Documents', 'Downloads', '.zshrc', '.ssh'],
  [`/Users/${USER}/Desktop`]:       ['CMap-Software.app', '17-Oranges.app', 'Access-Group.app', 'Drawing-Room.app', 'Langley-Foxall.app', 'eDynamix.app'],
  [`/Users/${USER}/Documents`]:     ['README.md', 'CV.pdf', 'Projects', 'Notes.txt'],
  [`/Users/${USER}/Documents/Projects`]: ['cmap-mail', 'kwando', 'orderbee', 'tofs-app', 'ciclozone', 'webmaster'],
  [`/Users/${USER}/Downloads`]:     ['dotnet-blazor.pdf', 'react-19-guide.pdf'],
  '/Applications':                  ['About.app', 'Experience.app', 'Skills.app', 'Contact.app', 'Location.app', 'Terminal.app', 'Finder.app', 'Safari.app'],
};

const FILE_CONTENTS: Record<string, string> = {
  [`/Users/${USER}/.zshrc`]:
    `# ${USER}'s zsh config\nexport PATH="/usr/local/bin:$PATH"\nalias ll="ls -la"\nalias dev="npm run dev"\nalias gs="git status"\nalias gc="git commit"\nalias gco="git checkout"`,
  [`/Users/${USER}/Documents/README.md`]:
    `# Joshua Hawksworth\n\nSenior Full Stack Developer | Manchester, UK\n\n6+ years building React & React Native applications across\nmultiple industries. Specialising in TypeScript, React.js,\nand mobile development.\n\nContact : joshuahawksworth@me.com\nGitHub  : github.com/joshuahawksworth\nLinkedIn: linkedin.com/in/joshuahawksworth`,
  [`/Users/${USER}/Documents/Notes.txt`]:
    `TODO:\n- Learn .NET Blazor (in progress)\n- Finish automotive side project with dad\n- Win game jam\n- Let Jiji stop breaking the keyboard`,
};

const NEOFETCH = `
             ██████████            ${USER}@${HOST}
           ██          ██          -------------------
          ██  ████████  ██         OS: macOS 26.0 Tahoe
         ██  ██      ██  ██        Kernel: Darwin 25.5.0
        ████████████████████       Host: MacBook Pro (M4)
       ██                  ██      Uptime: 6 years
      ██  ██████████████████  ██   Packages: 847 (npm)
     ████████████████████████████  Shell: zsh 5.9
                                   Resolution: 2560×1664
                                   Terminal: Portfolio.app
                                   CPU: Apple M4 (12-core)
                                   Memory: 16 GiB / 16 GiB
`;

// ── Slot machine data (matching real slotslop) ─────────────────────────────
const HARNESS = ['Codex', 'OpenCode', 'Pi', 'Antigravity CLI', 'Cursor CLI'];
const MODEL   = ['Haiku 4.6', 'Opus 4.8', 'GPT-5.5', 'GPT-5.4', 'GPT-5.4-mini'];
const EFFORT  = ['low', 'medium', 'high', 'no-reasoning', 'max'];

const COL_COLORS = ['#22c55e', '#ec4899', '#06b6d4'] as const;
const COL_NAMES  = ['HARNESS', 'MODEL', 'EFFORT'] as const;

type SlotState = {
  task: string;
  idx: [number, number, number];
  stopped: [boolean, boolean, boolean];
  done: boolean;
};

// ── Rainbow bar ────────────────────────────────────────────────────────────
const RAINBOW = 'linear-gradient(90deg,#ff0080,#ff4d00,#ffe000,#00d4ff,#a855f7,#ff0080)';

// ── Confetti overlay ───────────────────────────────────────────────────────
type Particle = { x:number; y:number; vx:number; vy:number; color:string; rot:number; rSpeed:number; w:number; h:number };
const CONF_COLORS = ['#ff0080','#ff8c00','#ffe000','#00d4ff','#a855f7','#22c55e','#ec4899','#06b6d4'];

function ConfettiOverlay({ active }: { active: boolean }) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const parts = useRef<Particle[]>([]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (!active) return;
    const cv = cvRef.current;
    if (!cv) return;
    cv.width  = cv.offsetWidth;
    cv.height = cv.offsetHeight;
    const W = cv.width, H = cv.height;

    parts.current = Array.from({ length: 160 }, () => ({
      x: W * (0.2 + Math.random() * 0.6),
      y: H * 0.5,
      vx: (Math.random() - 0.5) * 14,
      vy: -(Math.random() * 16 + 6),
      color: CONF_COLORS[Math.floor(Math.random() * CONF_COLORS.length)],
      rot: Math.random() * Math.PI * 2,
      rSpeed: (Math.random() - 0.5) * 0.25,
      w: Math.random() * 10 + 5,
      h: Math.random() * 5 + 3,
    }));

    function frame() {
      if (!cv) return;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of parts.current) {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.35;
        p.vx *= 0.98;
        p.rot += p.rSpeed;
        if (p.y < H + 20) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - p.y / (H * 1.2));
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return (
    <canvas ref={cvRef} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 5,
    }}/>
  );
}

// ── Single slot column ─────────────────────────────────────────────────────
function SlotColumn({
  name, items, curIdx, stopped, active, color,
}: {
  name: string; items: string[]; curIdx: number;
  stopped: boolean; active: boolean; color: string;
}) {
  const len  = items.length;
  const rows = [-2, -1, 0, 1, 2].map(offset => {
    const i = ((curIdx + offset) % len + len) % len;
    return { text: items[i], selected: offset === 0 };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', minWidth: 172, gap: 0 }}>
      {/* Coloured banner header */}
      <div style={{
        background: stopped
          ? `linear-gradient(135deg, ${color}cc, ${color}88)`
          : active
            ? `linear-gradient(135deg, ${color}44, ${color}22)`
            : 'rgba(255,255,255,0.05)',
        border: `1.5px solid ${active || stopped ? color : 'rgba(255,255,255,0.1)'}`,
        borderBottom: 'none',
        borderRadius: '6px 6px 0 0',
        padding: '7px 14px',
        textAlign: 'center',
        color: stopped ? '#000' : active ? color : 'rgba(255,255,255,0.45)',
        fontWeight: 800,
        fontSize: 12,
        letterSpacing: 3,
        textTransform: 'uppercase' as const,
        textShadow: active && !stopped ? `0 0 16px ${color}` : 'none',
        boxShadow: active ? `0 0 20px ${color}44` : 'none',
        transition: 'all 200ms',
      }}>
        {stopped ? `✓ ${name}` : active ? `▶ ${name}` : name}
      </div>

      {/* Reel box */}
      <div style={{
        border: `1.5px solid ${active || stopped ? color : 'rgba(255,255,255,0.1)'}`,
        borderTop: 'none',
        borderRadius: '0 0 6px 6px',
        overflow: 'hidden',
        boxShadow: active ? `0 0 20px ${color}44, inset 0 0 20px rgba(0,0,0,0.4)` : 'inset 0 0 10px rgba(0,0,0,0.3)',
        transition: 'border-color 200ms, box-shadow 200ms',
      }}>
        {rows.map(({ text, selected }, i) => (
          <div key={i} style={{
            padding: '5px 14px',
            background: selected
              ? (stopped ? `${color}dd` : `${color}ee`)
              : i === 0 || i === 4 ? 'rgba(255,255,255,0.02)' : 'transparent',
            color: selected ? '#000' : 'rgba(255,255,255,0.5)',
            fontWeight: selected ? 800 : 400,
            fontSize: 13,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            transition: 'background 60ms',
            borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}>
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Full slot machine TUI ──────────────────────────────────────────────────
function SlotSlopUI({ slot, onKey }: {
  slot: SlotState;
  onKey: (e: KeyboardEvent<HTMLDivElement>) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => { containerRef.current?.focus(); }, []);

  const activeCol: number = slot.stopped[0] ? (slot.stopped[1] ? (slot.stopped[2] ? -1 : 2) : 1) : 0;
  const activeName = activeCol >= 0 ? COL_NAMES[activeCol as 0 | 1 | 2].toLowerCase() : '';

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKey}
      style={{
        position: 'absolute', inset: 0,
        background: '#050505',
        display: 'flex', flexDirection: 'column',
        fontFamily: "'SF Mono','Fira Code','Cascadia Code',Menlo,monospace",
        outline: 'none', userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Confetti fires when all reels locked */}
      <ConfettiOverlay active={slot.done} />

      {/* Rainbow stripe */}
      <div style={{ height: 6, background: RAINBOW, flexShrink: 0, opacity: 0.95 }}/>

      {/* Header */}
      <div style={{
        textAlign: 'center', padding: '16px 0 2px',
        color: 'white', fontSize: 20, fontWeight: 800, letterSpacing: 7,
        textShadow: '0 0 30px rgba(255,255,255,0.3)',
      }}>
        🎰  SLOT-SLOP  🎰
      </div>
      <div style={{
        textAlign: 'center',
        fontSize: 11, marginBottom: 16, letterSpacing: 1,
        background: RAINBOW,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontWeight: 600,
      }}>
        task: {slot.task || 'run something cool'}
      </div>

      {/* Columns */}
      <div style={{
        flex: 1, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        gap: 20, padding: '0 20px',
      }}>
        {([HARNESS, MODEL, EFFORT] as const).map((items, ci) => (
          <SlotColumn
            key={ci}
            name={COL_NAMES[ci]}
            items={items}
            curIdx={slot.idx[ci]}
            stopped={slot.stopped[ci]}
            active={activeCol === ci}
            color={COL_COLORS[ci]}
          />
        ))}
      </div>

      {/* Rainbow stripe */}
      <div style={{ height: 6, background: RAINBOW, flexShrink: 0, opacity: 0.95 }}/>

      {/* Footer */}
      <div style={{
        textAlign: 'center', padding: '8px 0 10px',
        fontSize: 12, letterSpacing: 0.5,
      }}>
        {slot.done ? (
          <span style={{
            fontWeight: 800, fontSize: 13,
            background: RAINBOW,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            ✓ locked in — {HARNESS[slot.idx[0]]} · {MODEL[slot.idx[1]]} · {EFFORT[slot.idx[2]]}
          </span>
        ) : activeCol >= 0 ? (
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>
            press <strong style={{ color: 'white' }}>space</strong> to stop the{' '}
            <strong style={{ color: COL_COLORS[activeCol as 0 | 1 | 2], textShadow: `0 0 10px ${COL_COLORS[activeCol as 0|1|2]}` }}>
              {activeName}
            </strong> reel
            {'  '}<span style={{ opacity: 0.35 }}>(q to quit)</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

// ── Space Invaders ─────────────────────────────────────────────────────────

const GW = 480, GH = 380;
const PS = 3; // sprite pixel scale
const SS = 8 * PS; // sprite size = 24
const CW = SS + 16, CH = SS + 12; // cell 40x36
const GL = Math.floor((GW - 11 * CW) / 2); // grid left (centered)
const GT = 44; // grid top
const SPRS: [number[], number[]][] = [
  // Squid (row 0, 30pts) — two frames
  [[0x18,0x3c,0xff,0xdb,0xff,0x7e,0x18,0x24],[0x18,0x3c,0xff,0xdb,0xff,0x5a,0xa5,0x42]],
  // Crab (rows 1-2, 20pts)
  [[0x81,0x42,0x7e,0xdb,0xff,0x7e,0x24,0x42],[0x81,0x24,0x7e,0xdb,0xff,0x7e,0x42,0x24]],
  // Octopus (rows 3-4, 10pts)
  [[0x3c,0x7e,0xff,0xdb,0xff,0xff,0x5a,0xa5],[0x3c,0x7e,0xff,0xdb,0xff,0xff,0xa5,0x5a]],
];
const ATYPE = (r: number) => r === 0 ? 0 : r <= 2 ? 1 : 2;
const APTS  = [30,20,20,10,10];
const ACLR  = ['#ff453a','#ffd60a','#30d158'];
const BLK   = 7;  // barrier block size
const BROWS = 4, BCOLS = 5;
const BW    = BCOLS * BLK; // 35px
const BY    = GH - 104;
const BXS   = [56, 152, 248, 344];

function mkBarriers(): boolean[][][] {
  return BXS.map(() => Array.from({length: BROWS}, (_, r) =>
    Array.from({length: BCOLS}, (_, c) => !(r < 2 && c >= 1 && c <= 3))
  ));
}

interface SI {
  phase: 'intro'|'playing'|'dead'|'over'|'win';
  score: number; lives: number; level: number;
  px: number; // player x (centre)
  aliens: { alive: boolean; type: number; r: number; c: number }[];
  bullets: { x: number; y: number; pl: boolean }[];
  barriers: boolean[][][];
  aox: number; // alien offset x
  aoy: number; // alien offset y
  adir: number; // 1=right -1=left
  aframe: number;
  amv: number; // move timer
  ami: number; // move interval (frames)
  asht: number; // shoot timer
  ufoX: number; ufoOn: boolean; ufoTimer: number;
  exps: { x: number; y: number; t: number }[]; // explosions
  deadT: number;
}

function mkState(level = 1): SI {
  return {
    phase: 'intro', score: 0, lives: 3, level,
    px: GW / 2,
    aliens: Array.from({length: 5}, (_, r) =>
      Array.from({length: 11}, (_, c) => ({ alive: true, type: ATYPE(r), r, c }))
    ).flat(),
    bullets: [], barriers: mkBarriers(),
    aox: 0, aoy: 0, adir: 1, aframe: 0,
    amv: 0, ami: 40, asht: 120,
    ufoX: -50, ufoOn: false, ufoTimer: 600,
    exps: [], deadT: 0,
  };
}

function SpaceInvadersGame({ onQuit }: { onQuit: (score: number) => void }) {
  const cvRef   = useRef<HTMLCanvasElement>(null);
  const stRef   = useRef<SI>(mkState());
  const rafRef  = useRef(0);
  const dirRef  = useRef(0);    // -1, 0, 1
  const fireRef = useRef(false);
  const hiRef   = useRef(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [, forceRender] = useState(0);

  // Scale canvas to fit wrapper
  useEffect(() => {
    function resize() {
      if (!wrapRef.current || !cvRef.current) return;
      const { clientWidth: W, clientHeight: H } = wrapRef.current;
      const scale = Math.min(W / GW, H / GH);
      cvRef.current.style.width  = `${GW * scale}px`;
      cvRef.current.style.height = `${GH * scale}px`;
    }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Draw helper
  function draw(ctx: CanvasRenderingContext2D, st: SI) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, GW, GH);

    if (st.phase === 'intro') {
      ctx.fillStyle = '#30d158';
      ctx.font = 'bold 28px "SF Mono","Fira Code",Menlo,monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SPACE INVADERS', GW/2, GH/2 - 40);
      ctx.font = '14px "SF Mono","Fira Code",Menlo,monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('← → to move  SPACE to fire', GW/2, GH/2);
      ctx.fillText('Swipe on mobile · ESC to quit', GW/2, GH/2 + 22);
      ctx.font = 'bold 16px "SF Mono","Fira Code",Menlo,monospace';
      ctx.fillStyle = '#ffd60a';
      ctx.fillText('Press SPACE or tap to start', GW/2, GH/2 + 60);
      return;
    }

    if (st.phase === 'over') {
      ctx.fillStyle = '#ff453a';
      ctx.font = 'bold 32px "SF Mono","Fira Code",Menlo,monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', GW/2, GH/2 - 20);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = '16px "SF Mono","Fira Code",Menlo,monospace';
      ctx.fillText(`Score: ${st.score}`, GW/2, GH/2 + 18);
      ctx.fillText('SPACE to restart · ESC to quit', GW/2, GH/2 + 44);
      return;
    }

    if (st.phase === 'win') {
      ctx.fillStyle = '#30d158';
      ctx.font = 'bold 28px "SF Mono","Fira Code",Menlo,monospace';
      ctx.textAlign = 'center';
      ctx.fillText('YOU WIN!', GW/2, GH/2 - 20);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = '16px "SF Mono","Fira Code",Menlo,monospace';
      ctx.fillText(`Score: ${st.score}`, GW/2, GH/2 + 18);
      ctx.fillText('SPACE for next level · ESC to quit', GW/2, GH/2 + 44);
      return;
    }

    // HUD
    ctx.fillStyle = '#30d158';
    ctx.font = '13px "SF Mono","Fira Code",Menlo,monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE ${st.score}`, 8, 18);
    ctx.textAlign = 'center';
    ctx.fillText(`HI ${hiRef.current}`, GW/2, 18);
    ctx.textAlign = 'right';
    ctx.fillText(`LIVES ${'♥'.repeat(st.lives)}`, GW - 8, 18);
    // Divider
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(0, 24, GW, 1);

    // UFO
    if (st.ufoOn) {
      ctx.fillStyle = '#ff2d55';
      ctx.fillRect(st.ufoX, 30, 36, 12);
      ctx.fillRect(st.ufoX + 8, 24, 20, 8);
      ctx.fillStyle = '#000';
      ctx.fillRect(st.ufoX + 6, 32, 5, 5);
      ctx.fillRect(st.ufoX + 14, 32, 5, 5);
      ctx.fillRect(st.ufoX + 22, 32, 5, 5);
    }

    // Aliens
    for (const a of st.aliens) {
      if (!a.alive) continue;
      const ax = GL + a.c * CW + st.aox;
      const ay = GT + a.r * CH + st.aoy;
      const sprite = SPRS[a.type][st.aframe];
      ctx.fillStyle = ACLR[a.type];
      for (let row = 0; row < 8; row++) {
        const bits = sprite[row];
        for (let col = 0; col < 8; col++) {
          if (bits & (0x80 >> col)) {
            ctx.fillRect(ax + col * PS, ay + row * PS, PS, PS);
          }
        }
      }
    }

    // Player — classic Space Invaders cannon shape
    if (st.phase !== 'dead' || Math.floor(st.deadT / 8) % 2 === 0) {
      const px = st.px;
      const py = PLAYER_Y;
      ctx.fillStyle = '#4a9eff';
      // Gun barrel (thin, centred)
      ctx.fillRect(px - 2, py - 22, 4, 8);
      // Upper body
      ctx.fillRect(px - 7, py - 15, 14, 6);
      // Base (wide, flat)
      ctx.fillRect(px - 13, py - 9, 26, 9);
      // Cockpit highlight
      ctx.fillStyle = 'rgba(160, 210, 255, 0.55)';
      ctx.fillRect(px - 2, py - 14, 4, 3);
    }

    // Bullets
    for (const b of st.bullets) {
      ctx.fillStyle = b.pl ? '#fff' : '#ff453a';
      ctx.fillRect(b.x - 1.5, b.y, 3, b.pl ? 10 : 8);
    }

    // Barriers
    for (let i = 0; i < st.barriers.length; i++) {
      for (let r = 0; r < BROWS; r++) {
        for (let c = 0; c < BCOLS; c++) {
          if (st.barriers[i][r][c]) {
            ctx.fillStyle = '#30d158';
            ctx.fillRect(BXS[i] + c * BLK, BY + r * BLK, BLK - 1, BLK - 1);
          }
        }
      }
    }

    // Explosions
    for (const ex of st.exps) {
      ctx.fillStyle = `rgba(255, 200, 50, ${ex.t / 15})`;
      ctx.font = `${14 + (15 - ex.t)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('*', ex.x, ex.y);
    }

    // Ground line
    ctx.fillStyle = 'rgba(48, 209, 88, 0.5)';
    ctx.fillRect(0, GH - 22, GW, 2);

    // Level indicator
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`LVL ${st.level}`, GW/2, GH - 8);
  }

  // Game tick
  const tick = useCallback(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const st = stRef.current;

    if (st.phase === 'intro' || st.phase === 'over' || st.phase === 'win') {
      draw(ctx, st);
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    if (st.phase === 'dead') {
      st.deadT++;
      if (st.deadT > 90) {
        if (st.lives <= 0) {
          st.phase = 'over';
        } else {
          st.px = GW / 2;
          st.bullets = [];
          st.phase = 'playing';
        }
      }
      draw(ctx, st);
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    // Move player
    const dir = dirRef.current;
    if (dir !== 0) {
      st.px = Math.max(14, Math.min(GW - 14, st.px + dir * 3));
    }

    // Fire
    if (fireRef.current) {
      fireRef.current = false;
      if (!st.bullets.some(b => b.pl)) {
        st.bullets.push({ x: st.px, y: PLAYER_Y - 22, pl: true });
      }
    }

    // Move bullets
    st.bullets = st.bullets.filter(b => b.y > -10 && b.y < GH + 10);
    for (const b of st.bullets) {
      b.y += b.pl ? -8 : 4;
    }

    // Check player bullet vs aliens
    const pb = st.bullets.find(b => b.pl);
    if (pb) {
      for (const a of st.aliens) {
        if (!a.alive) continue;
        const ax = GL + a.c * CW + st.aox;
        const ay = GT + a.r * CH + st.aoy;
        if (pb.x >= ax && pb.x <= ax + SS && pb.y >= ay && pb.y <= ay + SS) {
          a.alive = false;
          st.score += APTS[a.r] ?? 10;
          hiRef.current = Math.max(hiRef.current, st.score);
          st.exps.push({ x: ax + SS/2, y: ay + SS/2, t: 15 });
          st.bullets = st.bullets.filter(b => !b.pl);
          break;
        }
      }
    }

    // Check player bullet vs UFO
    if (pb && st.ufoOn) {
      if (pb.x >= st.ufoX && pb.x <= st.ufoX + 36 && pb.y >= 24 && pb.y <= 44) {
        st.score += 100;
        st.exps.push({ x: st.ufoX + 18, y: 34, t: 15 });
        st.ufoOn = false;
        st.ufoTimer = 600;
        st.bullets = st.bullets.filter(b => !b.pl);
      }
    }

    // Check player bullet vs barriers
    if (pb) {
      for (let i = 0; i < st.barriers.length; i++) {
        const bx = BXS[i];
        if (pb.x >= bx && pb.x <= bx + BW && pb.y >= BY && pb.y <= BY + BROWS * BLK) {
          const c = Math.floor((pb.x - bx) / BLK);
          const r = Math.floor((pb.y - BY) / BLK);
          if (r >= 0 && r < BROWS && c >= 0 && c < BCOLS && st.barriers[i][r][c]) {
            st.barriers[i][r][c] = false;
            st.bullets = st.bullets.filter(b => !b.pl);
            break;
          }
        }
      }
    }

    // Alien bullets vs player
    const aliensHit = st.bullets.filter(b => !b.pl &&
      Math.abs(b.x - st.px) < 14 && b.y >= PLAYER_Y - 22 && b.y <= PLAYER_Y + 2
    );
    if (aliensHit.length > 0) {
      st.lives--;
      st.exps.push({ x: st.px, y: PLAYER_Y - 11, t: 15 });
      st.bullets = st.bullets.filter(b => b.pl);
      st.phase = 'dead';
      st.deadT = 0;
    }

    // Alien bullets vs barriers
    for (const ab of st.bullets.filter(b => !b.pl)) {
      for (let i = 0; i < st.barriers.length; i++) {
        const bx = BXS[i];
        if (ab.x >= bx && ab.x <= bx + BW && ab.y >= BY && ab.y <= BY + BROWS * BLK) {
          const c = Math.floor((ab.x - bx) / BLK);
          const r = Math.floor((ab.y - BY) / BLK);
          if (r >= 0 && r < BROWS && c >= 0 && c < BCOLS && st.barriers[i][r][c]) {
            st.barriers[i][r][c] = false;
            ab.y = GH + 100; // remove
          }
        }
      }
    }

    // Alien movement
    st.amv--;
    if (st.amv <= 0) {
      const liveAliens = st.aliens.filter(a => a.alive);
      if (liveAliens.length === 0) { st.phase = 'win'; draw(ctx, st); rafRef.current = requestAnimationFrame(tick); return; }
      st.ami = Math.max(4, Math.floor(4 + liveAliens.length * 1.5));
      st.amv = st.ami;
      st.aframe = 1 - st.aframe;

      const leftMost  = liveAliens.reduce((m, a) => Math.min(m, a.c), Infinity);
      const rightMost = liveAliens.reduce((m, a) => Math.max(m, a.c), -Infinity);
      const lx = GL + leftMost  * CW + st.aox;
      const rx = GL + rightMost * CW + st.aox + SS;

      if (st.adir === 1 && rx >= GW - 6) {
        st.aoy += 16;
        st.adir = -1;
      } else if (st.adir === -1 && lx <= 6) {
        st.aoy += 16;
        st.adir = 1;
      } else {
        st.aox += st.adir * 8;
      }
    }

    // Alien sprites erode barriers they physically overlap
    for (const a of st.aliens) {
      if (!a.alive) continue;
      const ax = GL + a.c * CW + st.aox;
      const ay = GT + a.r * CH + st.aoy;
      for (let i = 0; i < st.barriers.length; i++) {
        const bx = BXS[i];
        if (ax + SS < bx || ax > bx + BW || ay + SS < BY || ay > BY + BROWS * BLK) continue;
        for (let r = 0; r < BROWS; r++) {
          for (let c = 0; c < BCOLS; c++) {
            if (!st.barriers[i][r][c]) continue;
            const blkX = bx + c * BLK;
            const blkY = BY + r * BLK;
            if (ax < blkX + BLK && ax + SS > blkX && ay < blkY + BLK && ay + SS > blkY) {
              st.barriers[i][r][c] = false;
            }
          }
        }
      }
    }

    // Alien shoot
    st.asht--;
    if (st.asht <= 0) {
      st.asht = 40 + Math.floor(Math.random() * 60);
      const alive = st.aliens.filter(a => a.alive);
      if (alive.length > 0) {
        const shooter = alive[Math.floor(Math.random() * alive.length)];
        const ax = GL + shooter.c * CW + st.aox + SS / 2;
        const ay = GT + shooter.r * CH + st.aoy + SS;
        st.bullets.push({ x: ax, y: ay, pl: false });
      }
    }

    // UFO
    st.ufoTimer--;
    if (st.ufoTimer <= 0 && !st.ufoOn) {
      st.ufoOn = true;
      st.ufoX = -40;
      st.ufoTimer = 700 + Math.floor(Math.random() * 400);
    }
    if (st.ufoOn) {
      st.ufoX += 2;
      if (st.ufoX > GW + 10) st.ufoOn = false;
    }

    // Win check (before bottom — killing the last alien while it's at the bottom = win)
    if (!st.aliens.some(a => a.alive)) {
      st.phase = 'win';
    }

    // Alien reached bottom — ONLY alive aliens count
    if (st.phase === 'playing') {
      const liveBottom = st.aliens
        .filter(a => a.alive)
        .reduce((m, a) => Math.max(m, GT + a.r * CH + st.aoy + SS), -Infinity);
      if (liveBottom !== -Infinity && liveBottom >= PLAYER_Y - 20) {
        st.lives = 0;
        st.phase = 'over';
      }
    }

    // Age explosions
    st.exps = st.exps.map(e => ({ ...e, t: e.t - 1 })).filter(e => e.t > 0);

    draw(ctx, st);
    rafRef.current = requestAnimationFrame(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  // Keyboard
  useEffect(() => {
    function onDown(e: globalThis.KeyboardEvent) {
      if (e.key === 'ArrowLeft'  || e.key === 'a') dirRef.current = -1;
      if (e.key === 'ArrowRight' || e.key === 'd') dirRef.current = 1;
      if (e.key === ' ') {
        e.preventDefault();
        const st = stRef.current;
        if (st.phase === 'intro') { st.phase = 'playing'; return; }
        if (st.phase === 'over')  { stRef.current = mkState(1); forceRender(n => n+1); return; }
        if (st.phase === 'win')   { stRef.current = mkState(st.level + 1); forceRender(n => n+1); return; }
        fireRef.current = true;
      }
      if (e.key === 'Escape') onQuit(stRef.current.score);
    }
    function onUp(e: globalThis.KeyboardEvent) {
      if (e.key === 'ArrowLeft'  || e.key === 'a') { if (dirRef.current === -1) dirRef.current = 0; }
      if (e.key === 'ArrowRight' || e.key === 'd') { if (dirRef.current ===  1) dirRef.current = 0; }
    }
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [onQuit]);

  // Touch controls
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let startX = 0;
    let moved = false;

    function onTouchStart(e: TouchEvent) {
      e.preventDefault();
      startX = e.touches[0].clientX;
      moved = false;
      dirRef.current = 0;
    }
    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      const dx = e.touches[0].clientX - startX;
      if (Math.abs(dx) > 10) {
        moved = true;
        dirRef.current = dx > 0 ? 1 : -1;
        // Reset start for continuous movement
        startX = e.touches[0].clientX;
      }
    }
    function onTouchEnd(e: TouchEvent) {
      e.preventDefault();
      dirRef.current = 0;
      if (!moved) {
        const st = stRef.current;
        if (st.phase === 'intro') { st.phase = 'playing'; return; }
        if (st.phase === 'over')  { stRef.current = mkState(1); forceRender(n => n+1); return; }
        if (st.phase === 'win')   { stRef.current = mkState(st.level + 1); forceRender(n => n+1); return; }
        fireRef.current = true;
      }
    }
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove',  onTouchMove,  { passive: false });
    el.addEventListener('touchend',   onTouchEnd,   { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove',  onTouchMove);
      el.removeEventListener('touchend',   onTouchEnd);
    };
  }, []);

  const PLAYER_Y = GH - 24;

  return (
    <div ref={wrapRef} style={{
      position: 'absolute', inset: 0,
      background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column',
      userSelect: 'none', touchAction: 'none',
    }}>
      <canvas
        ref={cvRef}
        width={GW}
        height={GH}
        style={{ imageRendering: 'pixelated' }}
      />
      <div style={{ position: 'absolute', bottom: 6, right: 10, fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
        ESC to quit
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
function resolvePath(cwd: string, target: string): string {
  if (target.startsWith('/')) return target;
  if (target === '..') return cwd.split('/').slice(0, -1).join('/') || '/';
  if (target === '.') return cwd;
  return cwd === '/' ? `/${target}` : `${cwd}/${target}`;
}

// ── Main component ─────────────────────────────────────────────────────────
export default function TerminalApp({ props }: { props?: Record<string, unknown> }) {
  const { openApp } = useDesktop();
  const [cwd, setCwd] = useState(INIT_CWD);
  const [lines, setLines] = useState<Line[]>([
    { type: 'out', text: 'Last login: ' + new Date().toDateString() + ' on ttys001' },
    { type: 'blank', text: '' },
  ]);
  const [input, setInput]   = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [slot, setSlot]     = useState<SlotState | null>(null);
  const [showInvaders, setShowInvaders] = useState(false);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const autoRanRef   = useRef(false);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const slotRef      = useRef<SlotState | null>(null);
  const completedRef = useRef(false);

  useEffect(() => { slotRef.current = slot; }, [slot]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  useEffect(() => {
    const cmd = props?.autoRun as string | undefined;
    if (cmd && !autoRanRef.current) {
      autoRanRef.current = true;
      setTimeout(() => runCommand(cmd), 400);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup interval on unmount
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  function prompt(c: string) {
    return `${USER}@${HOST} ${c.replace(`/Users/${USER}`, '~')} % `;
  }

  function push(...newLines: Line[]) {
    setLines(p => [...p, ...newLines]);
  }

  function startSlot(task: string) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    completedRef.current = false;
    const init: SlotState = {
      task,
      idx: [0, 0, 0],
      stopped: [false, false, false],
      done: false,
    };
    setSlot(init);
    slotRef.current = init;

    intervalRef.current = setInterval(() => {
      const cur = slotRef.current;
      if (!cur || cur.done) return;
      setSlot(prev => {
        if (!prev || prev.done) return prev;
        return {
          ...prev,
          idx: [
            prev.stopped[0] ? prev.idx[0] : (prev.idx[0] + 1) % HARNESS.length,
            prev.stopped[1] ? prev.idx[1] : (prev.idx[1] + 1) % MODEL.length,
            prev.stopped[2] ? prev.idx[2] : (prev.idx[2] + 1) % EFFORT.length,
          ],
        };
      });
    }, 80);
  }

  function stopNextReel() {
    setSlot(prev => {
      if (!prev || prev.done) return prev;
      const stopped = [...prev.stopped] as [boolean, boolean, boolean];
      const nextCol = stopped.findIndex(s => !s);
      if (nextCol === -1) return prev;
      stopped[nextCol] = true;
      const allDone = stopped.every(Boolean);
      if (allDone && !completedRef.current) {
        completedRef.current = true;
        if (intervalRef.current) clearInterval(intervalRef.current);
        const finalIdx = prev.idx;
        setTimeout(() => {
          setSlot(s => s ? { ...s, done: true } : s);
          setTimeout(() => {
            setSlot(null);
            push({ type: 'blank', text: '' });
            push({ type: 'out', text: `🎯  Locked in: ${HARNESS[finalIdx[0]]} · ${MODEL[finalIdx[1]]} · ${EFFORT[finalIdx[2]]}` });
            push({ type: 'blank', text: '' });
          }, 1400);
        }, 300);
      }
      return { ...prev, stopped };
    });
  }

  function handleSlotKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === ' ' || e.key === 'Meta' || e.metaKey) {
      e.preventDefault();
      stopNextReel();
    } else if (e.key === 'q' || e.key === 'Q' || e.key === 'Escape') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setSlot(null);
      push({ type: 'out', text: 'slotslop: aborted.' });
      push({ type: 'blank', text: '' });
    }
  }

  function runCommand(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) { push({ type: 'blank', text: '' }); return; }

    push({ type: 'prompt', text: prompt(cwd) + raw });
    setHistory(p => [trimmed, ...p]);
    setHistIdx(-1);

    const [cmd, ...args] = trimmed.split(/\s+/);

    switch (cmd) {
      case 'clear':
        setLines([]);
        return;

      case 'ls': {
        const target = args[0] ? resolvePath(cwd, args[0]) : cwd;
        const entries = FS[target];
        if (!entries) { push({ type: 'err', text: `ls: ${args[0]}: No such file or directory` }); break; }
        push({ type: 'out', text: entries.join('    ') });
        break;
      }

      case 'pwd':
        push({ type: 'out', text: cwd });
        break;

      case 'cd': {
        if (!args[0] || args[0] === '~') { setCwd(INIT_CWD); break; }
        const target = resolvePath(cwd, args[0]);
        if (FS[target]) { setCwd(target); }
        else push({ type: 'err', text: `cd: no such file or directory: ${args[0]}` });
        break;
      }

      case 'echo':
        push({ type: 'out', text: args.join(' ') });
        break;

      case 'cat': {
        if (!args[0]) { push({ type: 'err', text: 'cat: missing operand' }); break; }
        const path = resolvePath(cwd, args[0]);
        const content = FILE_CONTENTS[path];
        if (content) {
          content.split('\n').forEach(l => push({ type: 'out', text: l }));
        } else if (FS[path]) {
          push({ type: 'err', text: `cat: ${args[0]}: Is a directory` });
        } else {
          push({ type: 'err', text: `cat: ${args[0]}: No such file or directory` });
        }
        break;
      }

      case 'whoami':  push({ type: 'out', text: USER }); break;
      case 'date':    push({ type: 'out', text: new Date().toString() }); break;

      case 'uname':
        push({ type: 'out', text: args.includes('-a') ? 'Darwin macbook-pro 25.5.0 Darwin Kernel Version 25.5.0 arm64' : 'Darwin' });
        break;

      case 'uptime':
        push({ type: 'out', text: `${new Date().toTimeString().split(' ')[0]} up 6 years, 3:42, 1 user, load averages: 0.42 0.38 0.41` });
        break;

      case 'history':
        history.slice(0, 20).forEach((h, i) => push({ type: 'out', text: `  ${String(i + 1).padStart(3)}  ${h}` }));
        break;

      case 'open': {
        const appMap: Record<string, string> = {
          about: 'about', experience: 'experience', skills: 'skills',
          contact: 'contact', location: 'location', finder: 'finder', trash: 'trash', safari: 'safari',
        };
        const key = args[0]?.replace('.app', '').toLowerCase();
        if (key && appMap[key]) {
          openApp(appMap[key]);
          push({ type: 'out', text: `Opening ${args[0]}…` });
        } else {
          push({ type: 'err', text: `open: no application named '${args[0]}'` });
        }
        break;
      }

      case 'slotslop': {
        const task = args.join(' ').replace(/^["']|["']$/g, '') || 'run something cool';
        push({ type: 'blank', text: '' });
        setTimeout(() => startSlot(task), 100);
        return; // skip the trailing blank push
      }

      case 'spaceinvaders':
      case 'invaders': {
        push({ type: 'blank', text: '' });
        setTimeout(() => setShowInvaders(true), 100);
        return;
      }

      case 'neofetch':
        NEOFETCH.trim().split('\n').forEach(l => push({ type: 'out', text: l }));
        break;

      case 'help':
        push(
          { type: 'out', text: 'Available commands:' },
          { type: 'out', text: '  ls [path]        — list directory contents' },
          { type: 'out', text: '  cd [path]        — change directory' },
          { type: 'out', text: '  pwd              — print working directory' },
          { type: 'out', text: '  cat [file]       — print file contents' },
          { type: 'out', text: '  echo [text]      — print text' },
          { type: 'out', text: '  open [app]       — open an application' },
          { type: 'out', text: '  whoami           — print username' },
          { type: 'out', text: '  date             — print current date' },
          { type: 'out', text: '  uname [-a]       — print system info' },
          { type: 'out', text: '  uptime           — show system uptime' },
          { type: 'out', text: '  history          — show command history' },
          { type: 'out', text: '  neofetch         — system info art' },
          { type: 'out', text: '  slotslop [task]  — AI slot machine (by t3gg)' },
          { type: 'out', text: '  spaceinvaders    — 👾 play Space Invaders' },
          { type: 'out', text: '  clear            — clear the terminal' },
          { type: 'out', text: '  help             — show this help' },
        );
        break;

      default:
        push({ type: 'err', text: `${cmd}: command not found` });
    }

    push({ type: 'blank', text: '' });
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      runCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(next);
      setInput(history[next] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setInput(next === -1 ? '' : history[next] ?? '');
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  }

  return (
    <div className={styles.root} style={{ position: 'relative' }} onClick={() => !slot && inputRef.current?.focus()}>
      {/* Normal terminal output */}
      <div className={styles.output}>
        {lines.map((l, i) => (
          <div key={i} className={`${styles.line} ${styles[l.type]}`}>{l.text || ' '}</div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className={styles.inputRow}>
        <span className={styles.promptLabel}>{prompt(cwd)}</span>
        <input
          ref={inputRef}
          className={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          spellCheck={false}
          autoComplete="off"
          autoFocus
        />
        <span className={styles.cursor} />
      </div>

      {/* Slot machine TUI overlay */}
      {slot && (
        <SlotSlopUI
          slot={slot}
          onKey={handleSlotKey}
        />
      )}

      {/* Space Invaders overlay */}
      {showInvaders && (
        <SpaceInvadersGame
          onQuit={(score) => {
            setShowInvaders(false);
            push({ type: 'out', text: `Game over! Final score: ${score}` });
            push({ type: 'blank', text: '' });
          }}
        />
      )}
    </div>
  );
}
