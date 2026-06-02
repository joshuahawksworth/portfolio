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
    `# Joshua Hawksworth\n\nSenior Full Stack Developer | Manchester, UK\n\n6+ years building React & React Native applications across\nmultiple industries. Specialising in TypeScript, React.js,\nand mobile development.\n\nContact : joshuahawksworth@me.com\nGitHub  : github.com/joshhawksworth\nLinkedIn: linkedin.com/in/joshuahawksworth`,
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

function resolvePath(cwd: string, target: string): string {
  if (target.startsWith('/')) return target;
  if (target === '..') return cwd.split('/').slice(0, -1).join('/') || '/';
  if (target === '.') return cwd;
  return cwd === '/' ? `/${target}` : `${cwd}/${target}`;
}

export default function TerminalApp({ props }: { props?: Record<string, unknown> }) {
  const { openApp } = useDesktop();
  const [cwd, setCwd] = useState(INIT_CWD);
  const [lines, setLines] = useState<Line[]>([
    { type: 'out', text: 'Last login: ' + new Date().toDateString() + ' on ttys001' },
    { type: 'blank', text: '' },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoRanRef = useRef(false);

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
    return `${USER}@${HOST} ${c.replace(`/Users/${USER}`, '~')} % `;
  }

  function push(...newLines: Line[]) {
    setLines(p => [...p, ...newLines]);
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

      case 'whoami':
        push({ type: 'out', text: USER });
        break;

      case 'date':
        push({ type: 'out', text: new Date().toString() });
        break;

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
        const models = ['gpt-4o', 'claude-opus-4', 'gemini-2.5', 'deepseek-r1', 'grok-3', 'llama-3.3', 'mistral-large', 'o3-mini'];
        const agents = ['CodeWizard', 'BugSlayer', 'ArchitectGPT', 'OptimiserBot', 'ReviewDaemon', 'RefactorAI'];
        const efforts = ['low', 'medium', 'high', 'ultra', 'maximum', 'overkill', '∞'];
        const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

        push({ type: 'out', text: '' });
        push({ type: 'out', text: '🎰  SLOTSLOP — by t3gg' });
        push({ type: 'out', text: '   "Claude Code, but make it a slot machine"' });
        push({ type: 'out', text: '' });
        push({ type: 'out', text: 'Spinning reels...' });
        push({ type: 'out', text: '' });

        let count = 0;
        const totalSpins = 10;
        const interval = setInterval(() => {
          count++;
          const bar = `  [ ${pick(models).padEnd(16)} | ${pick(agents).padEnd(14)} | effort: ${pick(efforts)} ]`;
          push({ type: 'out', text: bar });
          if (count >= totalSpins) {
            clearInterval(interval);
            const finalModel = 'claude-opus-4';
            const finalAgent = 'ArchitectGPT';
            const finalEffort = 'ultra';
            setTimeout(() => {
              push({ type: 'out', text: '' });
              push({ type: 'out', text: '🎯  JACKPOT! Final selection:' });
              push({ type: 'out', text: `  Model:  ${finalModel}` });
              push({ type: 'out', text: `  Agent:  ${finalAgent}` });
              push({ type: 'out', text: `  Effort: ${finalEffort}` });
              push({ type: 'out', text: '' });
              push({ type: 'out', text: '  Cost estimate: $4.20  |  Tokens: ∞  |  Vibes: immaculate' });
              push({ type: 'out', text: '' });
              push({ type: 'out', text: '"Engineered to make you feel in control while burning credits."' });
              push({ type: 'out', text: '                                                  — Theo Browne' });
              push({ type: 'out', text: '' });
            }, 300);
          }
        }, 120);
        break;
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
          { type: 'out', text: '  slotslop       — AI model slot machine (by t3gg)' },
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
    <div className={styles.root} onClick={() => inputRef.current?.focus()}>
      <div className={styles.output}>
        {lines.map((l, i) => (
          <div key={i} className={`${styles.line} ${styles[l.type]}`}>{l.text || ' '}</div>
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
    </div>
  );
}
