import { useState, useRef, useEffect, KeyboardEvent } from 'react';
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
const RAINBOW = 'linear-gradient(90deg,#ff0000,#ff7f00,#ffff00,#00ff00,#00ffff,#0000ff,#8b00ff,#ff0000)';

function RainbowBar() {
  return (
    <div style={{
      height: 5, background: RAINBOW, flexShrink: 0,
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
  const len = items.length;
  // Show 5 rows: 2 above, selected, 2 below (wraps)
  const rows = [-2, -1, 0, 1, 2].map(offset => {
    const i = ((curIdx + offset) % len + len) % len;
    return { text: items[i], selected: offset === 0 };
  });

  const colWidth = 18;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      minWidth: 180, gap: 0,
    }}>
      {/* Column header */}
      <div style={{
        color: active ? color : 'rgba(255,255,255,0.55)',
        fontWeight: 700, fontSize: 13, letterSpacing: 2,
        marginBottom: 10, textAlign: 'center',
      }}>
        {active ? `• ${name} •` : name}
      </div>

      {/* Column box */}
      <div style={{
        border: `1.5px solid ${active ? color : 'rgba(255,255,255,0.12)'}`,
        borderRadius: 4,
        padding: '4px 0',
        width: '100%',
        boxShadow: active ? `0 0 12px ${color}55` : 'none',
        transition: 'border-color 200ms, box-shadow 200ms',
      }}>
        {rows.map(({ text, selected }, i) => (
          <div key={i} style={{
            padding: '3px 14px',
            background: selected ? color : 'transparent',
            color: selected ? '#000' : 'rgba(255,255,255,0.65)',
            fontWeight: selected ? 700 : 400,
            fontSize: 13,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: colWidth + 'ch',
            transition: 'background 60ms',
          }}>
            {text}
          </div>
        ))}
      </div>

      {/* Stopped indicator */}
      <div style={{
        marginTop: 6, fontSize: 11,
        color: stopped ? color : 'transparent',
        letterSpacing: 1,
      }}>
        ✓ locked
      </div>
    </div>
  );
}

// ── Full slot machine TUI ──────────────────────────────────────────────────
function SlotSlopUI({ slot, onKey, onQuit }: {
  slot: SlotState;
  onKey: (e: KeyboardEvent<HTMLDivElement>) => void;
  onQuit: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => { containerRef.current?.focus(); }, []);

  const activeCol = slot.stopped[0] ? (slot.stopped[1] ? (slot.stopped[2] ? -1 : 2) : 1) : 0;
  const activeName = activeCol >= 0 ? COL_NAMES[activeCol].toLowerCase() : '';

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKey}
      style={{
        position: 'absolute', inset: 0,
        background: '#0a0a0a',
        display: 'flex', flexDirection: 'column',
        fontFamily: "'SF Mono','Fira Code','Cascadia Code',Menlo,monospace",
        outline: 'none', userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      <RainbowBar />

      {/* Header */}
      <div style={{
        textAlign: 'center', padding: '18px 0 4px',
        color: 'white', fontSize: 18, fontWeight: 700, letterSpacing: 6,
      }}>
        🎰  S L O T - S L O P  🎰
      </div>
      <div style={{
        textAlign: 'center', color: 'rgba(255,255,255,0.55)',
        fontSize: 12, marginBottom: 14, letterSpacing: 1,
      }}>
        task: {slot.task || 'run something cool'}
      </div>

      {/* Columns */}
      <div style={{
        flex: 1, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        gap: 32, padding: '0 24px',
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

      <RainbowBar />

      {/* Footer */}
      <div style={{
        textAlign: 'center', padding: '8px 0 10px',
        fontSize: 12, color: 'rgba(255,255,255,0.5)',
        letterSpacing: 0.5,
      }}>
        {slot.done ? (
          <span style={{ color: '#22c55e', fontWeight: 700 }}>
            ✓ locked in — running {HARNESS[slot.idx[0]]} · {MODEL[slot.idx[1]]} · {EFFORT[slot.idx[2]]}…
          </span>
        ) : activeCol >= 0 ? (
          <>
            press <strong style={{ color: 'white' }}>⌘ / space</strong> to stop the{' '}
            <strong style={{ color: COL_COLORS[activeCol] }}>{activeName}</strong> reel
            {'    '}
            <span style={{ opacity: 0.4 }}>(q to quit)</span>
          </>
        ) : null}
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

      case 'neofetch':
        NEOFETCH.trim().split('\n').forEach(l => push({ type: 'out', text: l }));
        break;

      case 'help':
        push(
          { type: 'out', text: 'Available commands:' },
          { type: 'out', text: '  ls [path]      — list directory contents' },
          { type: 'out', text: '  cd [path]      — change directory' },
          { type: 'out', text: '  pwd            — print working directory' },
          { type: 'out', text: '  cat [file]     — print file contents' },
          { type: 'out', text: '  echo [text]    — print text' },
          { type: 'out', text: '  open [app]     — open an application' },
          { type: 'out', text: '  whoami         — print username' },
          { type: 'out', text: '  date           — print current date' },
          { type: 'out', text: '  uname [-a]     — print system info' },
          { type: 'out', text: '  uptime         — show system uptime' },
          { type: 'out', text: '  history        — show command history' },
          { type: 'out', text: '  neofetch       — system info art' },
          { type: 'out', text: '  slotslop [task] — AI slot machine (by t3gg)' },
          { type: 'out', text: '  clear          — clear the terminal' },
          { type: 'out', text: '  help           — show this help' },
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
          onQuit={() => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setSlot(null);
          }}
        />
      )}
    </div>
  );
}
