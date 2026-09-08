import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import styles from './TerminalApp.module.css';
import { currentOs } from '../../theme/platform';
import { useSettings } from '../../context/SettingsContext';
import { Shell, shellFor } from '../../lib/terminalShell';

interface Line {
  type: 'prompt' | 'out' | 'err' | 'blank';
  text: string;
}

const USER = 'joshua';
const HOST = 'macbook-pro';

const NEOFETCH_BY_OS: Record<string, string> = {
  macos: `
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
`,
  windows: `
        ████████  ████████         ${USER}@JOSH-DESKTOP
        ████████  ████████         -------------------
        ████████  ████████         OS: Windows 11 Pro 25H2
        ████████  ████████         Kernel: 10.0.26200
                                   Host: Surface Laptop 7
        ████████  ████████         Uptime: 6 years
        ████████  ████████         Packages: 847 (winget)
        ████████  ████████         Shell: PowerShell 7.5
        ████████  ████████         Resolution: 2496×1664
                                   Terminal: Windows Terminal
                                   CPU: Snapdragon X Elite
                                   Memory: 32 GiB / 32 GiB
`,
  android: `
          ██████████████           ${USER}@pixel
        ██████████████████         -------------------
       ██  ████████████  ██        OS: Android 16
      ██████████████████████       Kernel: Linux 6.6
      ██████████████████████       Host: Google Pixel 10 Pro
      ██████████████████████       Uptime: 6 years
      ██████████████████████       Packages: 847 (pkg)
        ██████████████████         Shell: bash 5.2
                                   Resolution: 1344×2992
                                   Terminal: Termux
                                   CPU: Google Tensor G5
                                   Memory: 16 GiB / 16 GiB
`,
  ios: `
             ██████████            ${USER}@iphone
           ██          ██          -------------------
          ██  ████████  ██         OS: iOS 26
         ██  ██      ██  ██        Kernel: Darwin 25.5.0
        ████████████████████       Host: iPhone 17 Pro
       ██                  ██      Uptime: 6 years
      ██  ██████████████████  ██   Packages: 847 (npm)
     ████████████████████████████  Shell: zsh 5.9
                                   Resolution: 1206×2622
                                   Terminal: Portfolio.app
                                   CPU: A19 Pro
                                   Memory: 12 GiB / 12 GiB
`,
};

function neofetch(): string {
  return NEOFETCH_BY_OS[currentOs()] ?? NEOFETCH_BY_OS.macos;
}

// ── Space Invaders ─────────────────────────────────────────────────────────

const GW = 480,
  GH = 380;
const PS = 3; // sprite pixel scale
const SS = 8 * PS; // sprite size = 24
const CW = SS + 16,
  CH = SS + 12; // cell 40x36
const GL = Math.floor((GW - 11 * CW) / 2); // grid left (centered)
const GT = 44; // grid top
const SPRS: [number[], number[]][] = [
  // Squid (row 0, 30pts) — two frames
  [
    [0x18, 0x3c, 0xff, 0xdb, 0xff, 0x7e, 0x18, 0x24],
    [0x18, 0x3c, 0xff, 0xdb, 0xff, 0x5a, 0xa5, 0x42],
  ],
  // Crab (rows 1-2, 20pts)
  [
    [0x81, 0x42, 0x7e, 0xdb, 0xff, 0x7e, 0x24, 0x42],
    [0x81, 0x24, 0x7e, 0xdb, 0xff, 0x7e, 0x42, 0x24],
  ],
  // Octopus (rows 3-4, 10pts)
  [
    [0x3c, 0x7e, 0xff, 0xdb, 0xff, 0xff, 0x5a, 0xa5],
    [0x3c, 0x7e, 0xff, 0xdb, 0xff, 0xff, 0xa5, 0x5a],
  ],
];
const ATYPE = (r: number) => (r === 0 ? 0 : r <= 2 ? 1 : 2);
const APTS = [30, 20, 20, 10, 10];
const ACLR = ['#ff453a', '#ffd60a', '#30d158'];
const BLK = 7; // barrier block size
const BROWS = 4,
  BCOLS = 5;
const BW = BCOLS * BLK; // 35px
const BY = GH - 104;
const BXS = [56, 152, 248, 344];

function mkBarriers(): boolean[][][] {
  return BXS.map(() =>
    Array.from({ length: BROWS }, (_, r) =>
      Array.from({ length: BCOLS }, (_, c) => !(r < 2 && c >= 1 && c <= 3))
    )
  );
}

interface SI {
  phase: 'intro' | 'playing' | 'dead' | 'over' | 'win';
  score: number;
  lives: number;
  level: number;
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
  ufoX: number;
  ufoOn: boolean;
  ufoTimer: number;
  exps: { x: number; y: number; t: number }[]; // explosions
  deadT: number;
}

function mkState(level = 1): SI {
  return {
    phase: 'intro',
    score: 0,
    lives: 3,
    level,
    px: GW / 2,
    aliens: Array.from({ length: 5 }, (_, r) =>
      Array.from({ length: 11 }, (_, c) => ({ alive: true, type: ATYPE(r), r, c }))
    ).flat(),
    bullets: [],
    barriers: mkBarriers(),
    aox: 0,
    aoy: 0,
    adir: 1,
    aframe: 0,
    amv: 0,
    ami: 40,
    asht: 120,
    ufoX: -50,
    ufoOn: false,
    ufoTimer: 600,
    exps: [],
    deadT: 0,
  };
}

function SpaceInvadersGame({ onQuit }: { onQuit: (score: number) => void }) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const stRef = useRef<SI>(mkState());
  const rafRef = useRef(0);
  const dirRef = useRef(0); // -1, 0, 1
  const fireRef = useRef(false);
  const hiRef = useRef(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [, forceRender] = useState(0);

  // Scale canvas to fit wrapper
  useEffect(() => {
    function resize() {
      if (!wrapRef.current || !cvRef.current) return;
      const { clientWidth: W, clientHeight: H } = wrapRef.current;
      const scale = Math.min(W / GW, H / GH);
      cvRef.current.style.width = `${GW * scale}px`;
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
      ctx.fillText('SPACE INVADERS', GW / 2, GH / 2 - 40);
      ctx.font = '14px "SF Mono","Fira Code",Menlo,monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('← → to move  SPACE to fire', GW / 2, GH / 2);
      ctx.fillText('Swipe on mobile · ESC to quit', GW / 2, GH / 2 + 22);
      ctx.font = 'bold 16px "SF Mono","Fira Code",Menlo,monospace';
      ctx.fillStyle = '#ffd60a';
      ctx.fillText('Press SPACE or tap to start', GW / 2, GH / 2 + 60);
      return;
    }

    if (st.phase === 'over') {
      ctx.fillStyle = '#ff453a';
      ctx.font = 'bold 32px "SF Mono","Fira Code",Menlo,monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', GW / 2, GH / 2 - 20);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = '16px "SF Mono","Fira Code",Menlo,monospace';
      ctx.fillText(`Score: ${st.score}`, GW / 2, GH / 2 + 18);
      ctx.fillText('SPACE to restart · ESC to quit', GW / 2, GH / 2 + 44);
      return;
    }

    if (st.phase === 'win') {
      ctx.fillStyle = '#30d158';
      ctx.font = 'bold 28px "SF Mono","Fira Code",Menlo,monospace';
      ctx.textAlign = 'center';
      ctx.fillText('YOU WIN!', GW / 2, GH / 2 - 20);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = '16px "SF Mono","Fira Code",Menlo,monospace';
      ctx.fillText(`Score: ${st.score}`, GW / 2, GH / 2 + 18);
      ctx.fillText('SPACE for next level · ESC to quit', GW / 2, GH / 2 + 44);
      return;
    }

    // HUD
    ctx.fillStyle = '#30d158';
    ctx.font = '13px "SF Mono","Fira Code",Menlo,monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE ${st.score}`, 8, 18);
    ctx.textAlign = 'center';
    ctx.fillText(`HI ${hiRef.current}`, GW / 2, 18);
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
    ctx.fillText(`LVL ${st.level}`, GW / 2, GH - 8);
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
      if (!st.bullets.some((b) => b.pl)) {
        st.bullets.push({ x: st.px, y: PLAYER_Y - 22, pl: true });
      }
    }

    // Move bullets
    st.bullets = st.bullets.filter((b) => b.y > -10 && b.y < GH + 10);
    for (const b of st.bullets) {
      b.y += b.pl ? -8 : 4;
    }

    // Check player bullet vs aliens
    const pb = st.bullets.find((b) => b.pl);
    if (pb) {
      for (const a of st.aliens) {
        if (!a.alive) continue;
        const ax = GL + a.c * CW + st.aox;
        const ay = GT + a.r * CH + st.aoy;
        if (pb.x >= ax && pb.x <= ax + SS && pb.y >= ay && pb.y <= ay + SS) {
          a.alive = false;
          st.score += APTS[a.r] ?? 10;
          hiRef.current = Math.max(hiRef.current, st.score);
          st.exps.push({ x: ax + SS / 2, y: ay + SS / 2, t: 15 });
          st.bullets = st.bullets.filter((b) => !b.pl);
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
        st.bullets = st.bullets.filter((b) => !b.pl);
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
            st.bullets = st.bullets.filter((b) => !b.pl);
            break;
          }
        }
      }
    }

    // Alien bullets vs player
    const aliensHit = st.bullets.filter(
      (b) => !b.pl && Math.abs(b.x - st.px) < 14 && b.y >= PLAYER_Y - 22 && b.y <= PLAYER_Y + 2
    );
    if (aliensHit.length > 0) {
      st.lives--;
      st.exps.push({ x: st.px, y: PLAYER_Y - 11, t: 15 });
      st.bullets = st.bullets.filter((b) => b.pl);
      st.phase = 'dead';
      st.deadT = 0;
    }

    // Alien bullets vs barriers
    for (const ab of st.bullets.filter((b) => !b.pl)) {
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
      const liveAliens = st.aliens.filter((a) => a.alive);
      if (liveAliens.length === 0) {
        st.phase = 'win';
        draw(ctx, st);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      st.ami = Math.max(4, Math.floor(4 + liveAliens.length * 1.5));
      st.amv = st.ami;
      st.aframe = 1 - st.aframe;

      const leftMost = liveAliens.reduce((m, a) => Math.min(m, a.c), Infinity);
      const rightMost = liveAliens.reduce((m, a) => Math.max(m, a.c), -Infinity);
      const lx = GL + leftMost * CW + st.aox;
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
      const alive = st.aliens.filter((a) => a.alive);
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
    if (!st.aliens.some((a) => a.alive)) {
      st.phase = 'win';
    }

    // Alien reached bottom — ONLY alive aliens count
    if (st.phase === 'playing') {
      const liveBottom = st.aliens
        .filter((a) => a.alive)
        .reduce((m, a) => Math.max(m, GT + a.r * CH + st.aoy + SS), -Infinity);
      if (liveBottom !== -Infinity && liveBottom >= PLAYER_Y - 20) {
        st.lives = 0;
        st.phase = 'over';
      }
    }

    // Age explosions
    st.exps = st.exps.map((e) => ({ ...e, t: e.t - 1 })).filter((e) => e.t > 0);

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
      if (e.key === 'ArrowLeft' || e.key === 'a') dirRef.current = -1;
      if (e.key === 'ArrowRight' || e.key === 'd') dirRef.current = 1;
      if (e.key === ' ') {
        e.preventDefault();
        const st = stRef.current;
        if (st.phase === 'intro') {
          st.phase = 'playing';
          return;
        }
        if (st.phase === 'over') {
          stRef.current = mkState(1);
          forceRender((n) => n + 1);
          return;
        }
        if (st.phase === 'win') {
          stRef.current = mkState(st.level + 1);
          forceRender((n) => n + 1);
          return;
        }
        fireRef.current = true;
      }
      if (e.key === 'Escape') onQuit(stRef.current.score);
    }
    function onUp(e: globalThis.KeyboardEvent) {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        if (dirRef.current === -1) dirRef.current = 0;
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        if (dirRef.current === 1) dirRef.current = 0;
      }
    }
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
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
        if (st.phase === 'intro') {
          st.phase = 'playing';
          return;
        }
        if (st.phase === 'over') {
          stRef.current = mkState(1);
          forceRender((n) => n + 1);
          return;
        }
        if (st.phase === 'win') {
          stRef.current = mkState(st.level + 1);
          forceRender((n) => n + 1);
          return;
        }
        fireRef.current = true;
      }
    }
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const PLAYER_Y = GH - 24;

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'absolute',
        inset: 0,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      <canvas ref={cvRef} width={GW} height={GH} style={{ imageRendering: 'pixelated' }} />
      <div
        style={{
          position: 'absolute',
          bottom: 6,
          right: 10,
          fontSize: 10,
          color: 'rgba(255,255,255,0.25)',
          fontFamily: 'monospace',
        }}
      >
        ESC to quit
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function TerminalApp({ props }: { props?: Record<string, unknown> }) {
  const desktop = useDesktop();
  const { openApp, windows } = desktop;
  const { os, settings } = useSettings();
  const isMobile = useIsMobile();

  // One shell per platform; it reads the live file system through `host`.
  const kind = shellFor(os);
  const shellRef = useRef<Shell | null>(null);
  const host = {
    fs: desktop,
    windows,
    openApp,
    userName: settings.userName,
  };
  if (!shellRef.current || shellRef.current.kind !== kind) shellRef.current = new Shell(kind, host);
  shellRef.current.update(host);
  const shell = shellRef.current;

  const [cwd, setCwd] = useState(() => shell.home);
  const [lines, setLines] = useState<Line[]>(() =>
    shell.banner().map((text) => ({ type: text ? 'out' : 'blank', text }))
  );
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [showInvaders, setShowInvaders] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoRanRef = useRef(false);

  // Switching platform swaps the shell: new prompt, home and banner.
  const kindRef = useRef(kind);
  useEffect(() => {
    if (kindRef.current === kind) return;
    kindRef.current = kind;
    setCwd(shell.home);
    setLines(shell.banner().map((text) => ({ type: text ? 'out' : 'blank', text })));
  }, [kind, shell]);

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

  function prompt(c: string) {
    return shell.prompt(c);
  }

  function push(...newLines: Line[]) {
    setLines((p) => [...p, ...newLines]);
  }

  function runCommand(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      push({ type: 'blank', text: '' });
      return;
    }

    push({ type: 'prompt', text: prompt(cwd) + raw });
    setHistory((p) => [trimmed, ...p]);
    setHistIdx(-1);

    const first = trimmed.split(/\s+/)[0].toLowerCase();
    if (first === 'neofetch' || first === 'winfetch' || first === 'screenfetch') {
      neofetch()
        .trim()
        .split('\n')
        .forEach((l) => push({ type: 'out', text: l }));
      push({ type: 'blank', text: '' });
      return;
    }

    const result = shell.run(trimmed, cwd, history);
    if (result.effect === 'clear') {
      setLines([]);
      return;
    }
    if (result.effect === 'invaders') {
      push({ type: 'blank', text: '' });
      setTimeout(() => setShowInvaders(true), 100);
      return;
    }
    if (result.effect === 'exit') {
      const me = windows.find((w) => w.appId === 'terminal');
      result.lines.forEach((l) => push({ type: l.type, text: l.text }));
      if (me) setTimeout(() => desktop.closeWindow(me.id), 300);
      return;
    }
    result.lines.forEach((l) =>
      l.text.split('\n').forEach((text) => push({ type: text ? l.type : 'blank', text }))
    );
    if (result.cwd !== cwd) setCwd(result.cwd);
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
      setInput(next === -1 ? '' : (history[next] ?? ''));
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      push({ type: 'prompt', text: prompt(cwd) + input + '^C' });
      setInput('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const matches = shell.complete(cwd, input);
      if (matches.length === 0) return;
      const head = input.slice(0, input.lastIndexOf(' ') + 1);
      if (matches.length === 1) {
        const m = matches[0];
        setInput(head + m + (m.endsWith('/') || m.endsWith('\\') ? '' : ' '));
        return;
      }
      // Fill the common prefix, then list the options like a real shell.
      let common = matches[0];
      for (const m of matches) {
        let k = 0;
        while (k < common.length && k < m.length && common[k].toLowerCase() === m[k].toLowerCase())
          k++;
        common = common.slice(0, k);
      }
      setInput(head + common);
      push({ type: 'prompt', text: prompt(cwd) + input });
      push({ type: 'out', text: matches.join('   ') });
    }
  }

  return (
    <div
      className={styles.root}
      style={{ position: 'relative' }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Normal terminal output */}
      <div className={styles.output}>
        {lines.map((l, i) => (
          <div key={i} className={`${styles.line} ${styles[l.type]}`}>
            {l.text || ' '}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className={styles.inputRow}>
        <span className={styles.promptLabel}>{prompt(cwd)}</span>
        <input
          ref={inputRef}
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          spellCheck={false}
          autoComplete="off"
          autoFocus={!isMobile}
        />
        <span className={styles.cursor} />
      </div>

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
