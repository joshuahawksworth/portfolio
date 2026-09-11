/**
 * The Terminal's shell. One engine, three personalities that match the platform:
 *   macOS / iOS  → zsh on Darwin ("joshua@macbook-pro ~ %")
 *   Windows      → Windows PowerShell ("PS C:\Users\Joshua>") with cmd aliases
 *   Android      → bash in Termux ("~ $")
 *
 * Paths are resolved against a small static tree (/Users, C:\Windows, …) whose home
 * folders are mounted on the portfolio's real virtual file system, so `ls ~/Desktop`,
 * `mkdir`, `touch`, `rm` and `mv` see and change the same files as Finder and the desktop.
 */
import type { FsNode } from '../data/fileSystemSeed';
import { ROOT_IDS, type RootId } from '../data/fileSystemSeed';
import type { OsName } from './settingsStore';
import type { WindowInstance } from '../context/DesktopContext';
import { nodeDisplayName } from '../theme/platform';

export type ShellKind = 'zsh' | 'powershell' | 'bash';

export interface ShellFs {
  fs: Record<string, FsNode>;
  childrenOf: (parentId: string) => FsNode[];
  createFolder: (parentId: string, name?: string) => string;
  createFile: (parentId: string, name?: string, content?: string) => string;
  trashNodes: (ids: string[]) => number;
  renameNode: (id: string, name: string) => void;
  moveNodes: (ids: string[], parentId: string) => void;
  writeFile: (id: string, content: string) => void;
}

export interface ShellHost {
  fs: ShellFs;
  windows: WindowInstance[];
  openApp: (appId: string, props?: Record<string, unknown>) => void;
  userName: string;
}

export interface ShellLine {
  type: 'out' | 'err';
  text: string;
}

export type ShellEffect = 'clear' | 'invaders' | 'exit';

export interface ShellResult {
  lines: ShellLine[];
  cwd: string;
  effect?: ShellEffect;
}

export function shellFor(os: OsName): ShellKind {
  if (os === 'windows') return 'powershell';
  if (os === 'android') return 'bash';
  return 'zsh';
}

/* ── Static trees with mounts on the real file system ──────────────────── */
type Static = { [name: string]: Static | { mount: RootId } | { file: string } };

const ZSHRC = `# joshua's zsh config
export PATH="/usr/local/bin:$PATH"
alias ll="ls -la"
alias dev="npm run dev"
alias gs="git status"
alias gc="git commit"
alias gco="git checkout"`;

const BASHRC = `# Termux bash config
export PATH="$PREFIX/bin:$PATH"
alias ll="ls -la"
alias dev="npm run dev"
PS1='\\w \\$ '`;

const PROFILE_PS1 = `# Windows PowerShell profile
Set-Alias ll Get-ChildItem
function dev { npm run dev }
function gs { git status }`;

function tree(kind: ShellKind): Static {
  if (kind === 'powershell') {
    return {
      Users: {
        Joshua: {
          Desktop: { mount: ROOT_IDS.desktop },
          Documents: { mount: ROOT_IDS.documents },
          Downloads: { mount: ROOT_IDS.downloads },
          Pictures: {},
          'Microsoft.PowerShell_profile.ps1': { file: PROFILE_PS1 },
        },
        Public: {},
      },
      'Program Files': { mount: ROOT_IDS.applications },
      Windows: { System32: {}, Temp: {} },
      '$Recycle.Bin': { mount: ROOT_IDS.trash },
    };
  }
  if (kind === 'bash') {
    const shared: Static = {
      Desktop: { mount: ROOT_IDS.desktop },
      Documents: { mount: ROOT_IDS.documents },
      Download: { mount: ROOT_IDS.downloads },
      DCIM: {},
    };
    return {
      data: {
        data: {
          'com.termux': {
            files: {
              home: { storage: { shared }, '.bashrc': { file: BASHRC }, '.termux': {} },
              usr: { bin: {}, lib: {}, etc: {} },
            },
          },
        },
      },
      sdcard: shared,
      system: { app: { mount: ROOT_IDS.applications }, bin: {} },
      proc: {},
    };
  }
  return {
    Users: {
      joshua: {
        Desktop: { mount: ROOT_IDS.desktop },
        Documents: { mount: ROOT_IDS.documents },
        Downloads: { mount: ROOT_IDS.downloads },
        '.zshrc': { file: ZSHRC },
        '.ssh': {},
        '.Trash': { mount: ROOT_IDS.trash },
      },
      Shared: {},
    },
    Applications: { mount: ROOT_IDS.applications },
    System: { Library: {} },
    Library: {},
    bin: {},
    etc: {},
    tmp: {},
  };
}

const OS_FOR: Record<ShellKind, OsName> = { zsh: 'macos', powershell: 'windows', bash: 'android' };

const HOME: Record<ShellKind, string> = {
  zsh: '/Users/joshua',
  powershell: 'C:/Users/Joshua',
  bash: '/data/data/com.termux/files/home',
};

/* ── Entries ───────────────────────────────────────────────────────────── */
interface Entry {
  path: string;
  name: string;
  type: 'dir' | 'file';
  /** Real file-system node behind this entry, if any. */
  node?: FsNode;
  /** Static folder contents (when not backed by the file system). */
  staticChildren?: string[];
  content?: string;
  /** Folder id to create things in (mount root or node id). */
  folderId?: string;
}

function isStaticDir(v: Static[string]): v is Static {
  return !('mount' in v) && !('file' in v);
}

export class Shell {
  readonly kind: ShellKind;
  readonly home: string;
  private readonly tree: Static;
  private readonly ci: boolean;

  constructor(
    kind: ShellKind,
    private host: ShellHost
  ) {
    this.kind = kind;
    this.home = HOME[kind];
    this.tree = tree(kind);
    this.ci = kind === 'powershell';
  }

  update(host: ShellHost) {
    this.host = host;
  }

  /** What the desktop calls this node on the current platform (This PC, Recycle Bin…). */
  private nameOf(node: FsNode): string {
    return nodeDisplayName(node.id, node.name, OS_FOR[this.kind]);
  }

  /* ── Paths ─────────────────────────────────────────────────────────── */
  private same(a: string, b: string) {
    return this.ci ? a.toLowerCase() === b.toLowerCase() : a === b;
  }

  /** Absolute internal path ('/'-separated; 'C:/...' on Windows). */
  resolve(cwd: string, target: string): string {
    let t = target.replace(/\\/g, '/');
    if (t === '' || t === '~') return this.home;
    if (t.startsWith('~/')) t = this.home + t.slice(1);
    let abs: string;
    if (this.kind === 'powershell') {
      if (/^[a-z]:/i.test(t)) abs = t[0].toUpperCase() + t.slice(1);
      else if (t.startsWith('/')) abs = 'C:' + t;
      else abs = cwd + '/' + t;
    } else {
      abs = t.startsWith('/') ? t : cwd + '/' + t;
    }
    const root = this.kind === 'powershell' ? 'C:' : '';
    const parts: string[] = [];
    for (const seg of abs.replace(/^C:/, '').split('/')) {
      if (!seg || seg === '.') continue;
      if (seg === '..') parts.pop();
      else parts.push(seg);
    }
    return root + '/' + parts.join('/');
  }

  /** How the shell prints a path: backslashes on Windows, ~ for home elsewhere. */
  display(path: string, tilde = true): string {
    if (this.kind === 'powershell') return path.replace(/\//g, '\\').replace(/^C:\\?$/, 'C:\\');
    if (tilde && (path === this.home || path.startsWith(this.home + '/'))) {
      return '~' + path.slice(this.home.length);
    }
    return path;
  }

  prompt(cwd: string): string {
    if (this.kind === 'powershell') return `PS ${this.display(cwd)}> `;
    if (this.kind === 'bash') return `${this.display(cwd)} $ `;
    return `joshua@macbook-pro ${this.display(cwd)} % `;
  }

  banner(): string[] {
    if (this.kind === 'powershell') {
      return [
        'Windows PowerShell',
        'Copyright (C) Microsoft Corporation. All rights reserved.',
        '',
        'Install the latest PowerShell for new features and improvements! https://aka.ms/PSWindows',
        '',
      ];
    }
    if (this.kind === 'bash') {
      return [
        'Welcome to Termux!',
        '',
        'Docs:       https://termux.dev/docs',
        'Community:  https://termux.dev/community',
        '',
        'Working with packages:',
        ' - Search:  pkg search <query>',
        ' - Install: pkg install <package>',
        ' - Upgrade: pkg upgrade',
        '',
        "Type 'help' for the commands this portfolio understands.",
        '',
      ];
    }
    return [`Last login: ${new Date().toDateString()} on ttys001`, ''];
  }

  /** Look a path up: a static folder, a mounted file-system node, or nothing. */
  lookup(path: string): Entry | null {
    const segs = path.replace(/^C:/, '').split('/').filter(Boolean);
    let node: Static = this.tree;
    let i = 0;
    for (; i < segs.length; i++) {
      const key = Object.keys(node).find((k) => this.same(k, segs[i]));
      if (!key) return null;
      const next = node[key];
      if (isStaticDir(next)) {
        node = next;
        continue;
      }
      if ('file' in next) {
        return i === segs.length - 1 ? { path, name: key, type: 'file', content: next.file } : null;
      }
      // Mounted: walk the real file system for the rest of the path.
      return this.lookupFs(next.mount, key, segs.slice(i + 1), path);
    }
    return {
      path,
      name: segs[segs.length - 1] ?? (this.kind === 'powershell' ? 'C:' : '/'),
      type: 'dir',
      staticChildren: Object.keys(node),
    };
  }

  private lookupFs(rootId: string, rootName: string, rest: string[], path: string): Entry | null {
    let id = rootId;
    let name = rootName;
    let node: FsNode | undefined = this.host.fs.fs[rootId];
    for (const seg of rest) {
      const child = this.host.fs
        .childrenOf(id)
        .find((n) => this.same(n.name, seg) || this.same(this.nameOf(n), seg));
      if (!child) return null;
      node = child;
      id = child.id;
      name = this.nameOf(child);
      if (child.type !== 'folder' && seg !== rest[rest.length - 1]) return null;
    }
    if (!node) return null;
    if (node.type === 'folder') return { path, name, type: 'dir', node, folderId: id };
    return { path, name, type: 'file', node, content: fileText(node) };
  }

  children(entry: Entry): { name: string; type: 'dir' | 'file'; node?: FsNode }[] {
    if (entry.folderId !== undefined) {
      return this.host.fs.childrenOf(entry.folderId).map((n) => ({
        name: this.nameOf(n),
        type: n.type === 'folder' ? 'dir' : 'file',
        node: n,
      }));
    }
    const segs = entry.path.replace(/^C:/, '').split('/').filter(Boolean);
    let node: Static = this.tree;
    for (const s of segs) {
      const key = Object.keys(node).find((k) => this.same(k, s));
      const next = key ? node[key] : undefined;
      if (!next || !isStaticDir(next)) break;
      node = next;
    }
    return Object.entries(node).map(([name, v]) => ({
      name,
      type: 'file' in v ? 'file' : 'dir',
    }));
  }

  /* ── Environment ───────────────────────────────────────────────────── */
  env(cwd: string): Record<string, string> {
    const user = this.host.userName.split(' ')[0].toLowerCase();
    if (this.kind === 'powershell') {
      return {
        USERPROFILE: this.display(this.home),
        HOMEPATH: '\\Users\\Joshua',
        HOMEDRIVE: 'C:',
        USERNAME: user,
        COMPUTERNAME: 'JOSH-DESKTOP',
        OS: 'Windows_NT',
        PATH: 'C:\\Windows\\System32;C:\\Windows;C:\\Program Files\\nodejs',
        TEMP: 'C:\\Users\\Joshua\\AppData\\Local\\Temp',
        PWD: this.display(cwd),
        SHELL: 'powershell.exe',
      };
    }
    if (this.kind === 'bash') {
      return {
        HOME: this.home,
        USER: 'u0_a247',
        SHELL: '/data/data/com.termux/files/usr/bin/bash',
        PREFIX: '/data/data/com.termux/files/usr',
        PATH: '/data/data/com.termux/files/usr/bin',
        TMPDIR: '/data/data/com.termux/files/usr/tmp',
        EXTERNAL_STORAGE: '/sdcard',
        ANDROID_ROOT: '/system',
        PWD: cwd,
        TERM: 'xterm-256color',
        LANG: 'en_GB.UTF-8',
      };
    }
    return {
      HOME: this.home,
      USER: user,
      SHELL: '/bin/zsh',
      PATH: '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
      TMPDIR: '/tmp',
      PWD: cwd,
      TERM: 'xterm-256color',
      LANG: 'en_GB.UTF-8',
      EDITOR: 'nano',
    };
  }

  /** Expand $VAR / ${VAR} (zsh, bash), $env:VAR and %VAR% (PowerShell). */
  expand(text: string, cwd: string): string {
    const env = this.env(cwd);
    const get = (name: string) => {
      const key = Object.keys(env).find((k) => this.same(k, name));
      return key ? env[key] : '';
    };
    if (this.kind === 'powershell') {
      return text
        .replace(/\$env:([A-Za-z_]\w*)/gi, (_, n) => get(n))
        .replace(/%([A-Za-z_]\w*)%/g, (_, n) => get(n))
        .replace(/\$HOME\b/g, this.display(this.home))
        .replace(/\$PWD\b/g, this.display(cwd));
    }
    return text.replace(/\$\{(\w+)\}|\$(\w+)/g, (_, a, b) => get(a ?? b));
  }

  /** Tab completion: commands (first word) or paths (later words). */
  complete(cwd: string, line: string): string[] {
    const atCommand = !/\s/.test(line.trimStart());
    const partial = line.slice(line.lastIndexOf(' ') + 1);
    if (atCommand) {
      const names = this.commandNames();
      return names.filter(
        (n) => n.toLowerCase().startsWith(partial.toLowerCase()) && n !== partial
      );
    }
    const norm = partial.replace(/\\/g, '/');
    const cut = norm.lastIndexOf('/');
    const dirPart = cut >= 0 ? norm.slice(0, cut + 1) : '';
    const namePart = norm.slice(cut + 1);
    const dir = this.lookup(this.resolve(cwd, dirPart || '.'));
    if (!dir || dir.type !== 'dir') return [];
    const sep = this.kind === 'powershell' ? '\\' : '/';
    return this.children(dir)
      .filter((k) => k.name.toLowerCase().startsWith(namePart.toLowerCase()))
      .filter((k) => namePart.startsWith('.') || !k.name.startsWith('.'))
      .map((k) => {
        const name = k.name.includes(' ') ? `'${k.name}'` : k.name;
        return dirPart.replace(/\//g, sep) + name + (k.type === 'dir' ? sep : '');
      });
  }

  commandNames(): string[] {
    const shared = [
      'cd',
      'pwd',
      'echo',
      'mkdir',
      'tree',
      'whoami',
      'hostname',
      'ping',
      'history',
      'help',
      'clear',
      'exit',
      'neofetch',
      'spaceinvaders',
    ];
    if (this.kind === 'powershell') {
      return [
        ...shared,
        'dir',
        'ls',
        'Get-ChildItem',
        'Set-Location',
        'Get-Location',
        'type',
        'Get-Content',
        'ni',
        'New-Item',
        'del',
        'Remove-Item',
        'ren',
        'Rename-Item',
        'move',
        'Move-Item',
        'copy',
        'Copy-Item',
        'notepad',
        'start',
        'Start-Process',
        'Get-Process',
        'tasklist',
        'systeminfo',
        'ipconfig',
        'ver',
        'winver',
        'Get-Date',
        'Get-ChildItem',
        'cls',
        'winfetch',
        'calc',
        'explorer',
        'set',
      ].sort();
    }
    const unix = [
      ...shared,
      'ls',
      'cat',
      'touch',
      'rm',
      'rmdir',
      'mv',
      'cp',
      'nano',
      'vim',
      'uname',
      'date',
      'uptime',
      'ifconfig',
      'ps',
      'top',
      'env',
      'printenv',
      'export',
    ];
    if (this.kind === 'bash') {
      return [
        ...unix,
        'termux-open',
        'termux-open-url',
        'termux-info',
        'pkg',
        'apt',
        'getprop',
        'am',
      ].sort();
    }
    return [...unix, 'open', 'say', 'sw_vers', 'code', 'calc', 'finder'].sort();
  }

  /* ── Commands ──────────────────────────────────────────────────────── */
  /** Run a whole line: `a && b`, `a ; b` and `a || b` chain like the real shells. */
  run(raw: string, cwd: string, history: string[]): ShellResult {
    const lines: ShellLine[] = [];
    let here = cwd;
    let lastFailed = false;
    let skipUntilOr = false;
    for (const { text, op } of splitChain(raw)) {
      // `&&` only runs after success, `||` only after failure, `;` always.
      if (op === '&&' && lastFailed) {
        skipUntilOr = true;
        continue;
      }
      if (op === '||' && !lastFailed && !skipUntilOr) continue;
      skipUntilOr = false;
      const res = this.runOne(this.expand(text, here), here, history);
      lines.push(...res.lines);
      here = res.cwd;
      lastFailed = res.lines.some((l) => l.type === 'err');
      if (res.effect) return { lines, cwd: here, effect: res.effect };
    }
    return { lines, cwd: here };
  }

  private runOne(raw: string, cwd: string, history: string[]): ShellResult {
    const out: ShellLine[] = [];
    const say = (text = '') => out.push({ type: 'out', text });
    const err = (text: string) => out.push({ type: 'err', text });
    const tokens = tokenize(raw.trim());
    if (tokens.length === 0) return { lines: out, cwd };
    const cmdRaw = tokens[0];
    const cmd = this.ci ? cmdRaw.toLowerCase() : cmdRaw;
    const args = tokens.slice(1);
    const flags = new Set(args.filter((a) => a.startsWith('-')).map((a) => a.toLowerCase()));
    const operands = args.filter((a) => !a.startsWith('-'));
    const ps = this.kind === 'powershell';
    const missing = (what: string) =>
      ps
        ? `${cmdRaw} : Cannot find path '${what}' because it does not exist.`
        : `${cmdRaw}: ${what}: No such file or directory`;

    const alias: Record<string, string> = ps
      ? {
          'get-childitem': 'ls',
          dir: 'ls',
          gci: 'ls',
          'set-location': 'cd',
          chdir: 'cd',
          sl: 'cd',
          'get-location': 'pwd',
          gl: 'pwd',
          'get-content': 'cat',
          type: 'cat',
          gc: 'cat',
          'write-output': 'echo',
          'write-host': 'echo',
          'clear-host': 'clear',
          cls: 'clear',
          'get-date': 'date',
          'new-item': 'ni',
          md: 'mkdir',
          'remove-item': 'rm',
          del: 'rm',
          erase: 'rm',
          ri: 'rm',
          'rename-item': 'ren',
          'move-item': 'mv',
          move: 'mv',
          'copy-item': 'cp',
          copy: 'cp',
          'start-process': 'start',
          'get-history': 'history',
          'get-help': 'help',
          'get-process': 'ps',
          tasklist: 'ps',
          'get-computerinfo': 'systeminfo',
          winfetch: 'neofetch',
          screenfetch: 'neofetch',
          open: 'start',
          man: 'help',
        }
      : {
          ll: 'ls',
          dir: 'ls',
          screenfetch: 'neofetch',
          'xdg-open': 'open',
          'termux-open': 'open',
          'termux-open-url': 'open',
          start: 'open',
          cls: 'clear',
          man: 'help',
          edit: 'nano',
          vi: 'nano',
          vim: 'nano',
          code: 'nano',
        };
    const command = alias[cmd] ?? cmd;
    const fs = this.host.fs;

    const entryAt = (p: string) => this.lookup(this.resolve(cwd, p));
    const parentAndName = (p: string) => {
      const abs = this.resolve(cwd, p);
      const idx = abs.lastIndexOf('/');
      const parentPath = idx <= (ps ? 2 : 0) ? abs.slice(0, idx + 1) : abs.slice(0, idx);
      return { parent: this.lookup(parentPath), name: abs.slice(idx + 1), abs };
    };
    const writable = (e: Entry | null) =>
      e &&
      e.type === 'dir' &&
      e.folderId !== undefined &&
      e.folderId !== ROOT_IDS.applications &&
      e.folderId !== ROOT_IDS.trash;

    switch (command) {
      case 'clear':
        return { lines: [], cwd, effect: 'clear' };

      case 'exit':
      case 'logout':
        say(ps ? '' : 'logout');
        return { lines: out, cwd, effect: 'exit' };

      case 'ls': {
        const target = operands[0] ?? '.';
        const entry = entryAt(target);
        if (!entry) {
          err(missing(target));
          break;
        }
        if (entry.type === 'file') {
          say(entry.name);
          break;
        }
        const kids = this.children(entry).filter(
          (k) =>
            flags.has('-a') ||
            flags.has('-la') ||
            flags.has('-al') ||
            flags.has('-force') ||
            !k.name.startsWith('.')
        );
        if (ps) {
          say('');
          say(`    Directory: ${this.display(entry.path)}`);
          say('');
          say('Mode                 LastWriteTime         Length Name');
          say('----                 -------------         ------ ----');
          for (const k of kids) {
            const when = k.node ? new Date(k.node.modifiedAt) : new Date(2026, 0, 12, 9, 30);
            const mode = k.type === 'dir' ? 'd-----' : '-a----';
            const len = k.type === 'dir' ? '' : String(sizeOf(k.node));
            say(
              `${mode.padEnd(20)} ${fmtDate(when)}   ${fmtTime(when)} ${len.padStart(14)} ${k.name}`
            );
          }
          say('');
        } else if (flags.has('-l') || flags.has('-la') || flags.has('-al')) {
          say(`total ${kids.length * 8}`);
          for (const k of kids) {
            const when = k.node ? new Date(k.node.modifiedAt) : new Date(2026, 0, 12, 9, 30);
            const perms = k.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--';
            say(
              `${perms}  1 ${this.host.userName.split(' ')[0].toLowerCase().padEnd(8)} staff ${String(sizeOf(k.node)).padStart(7)} ${fmtLs(when)} ${k.name}`
            );
          }
        } else {
          say(kids.map((k) => (k.name.includes(' ') ? `'${k.name}'` : k.name)).join('   '));
        }
        break;
      }

      case 'pwd':
        say(ps ? '\nPath\n----\n' + this.display(cwd) + '\n' : this.display(cwd, false));
        break;

      case 'cd': {
        const target = operands[0] ?? '~';
        const entry = entryAt(target);
        if (!entry) {
          err(
            ps
              ? `Set-Location : Cannot find path '${this.display(this.resolve(cwd, target))}' because it does not exist.`
              : `cd: no such file or directory: ${target}`
          );
          break;
        }
        if (entry.type !== 'dir') {
          err(
            ps
              ? `Set-Location : Cannot find path '${target}' because it is not a directory.`
              : `cd: not a directory: ${target}`
          );
          break;
        }
        return { lines: out, cwd: this.resolve(cwd, target) };
      }

      case 'cat': {
        if (!operands[0]) {
          err(
            ps ? 'Get-Content : Missing an argument for parameter Path.' : 'cat: missing operand'
          );
          break;
        }
        for (const target of operands) {
          const entry = entryAt(target);
          if (!entry) err(missing(target));
          else if (entry.type === 'dir')
            err(
              ps
                ? `Get-Content : Access to the path '${target}' is denied.`
                : `cat: ${target}: Is a directory`
            );
          else (entry.content ?? '').split('\n').forEach((l) => say(l));
        }
        break;
      }

      case 'echo':
        say(args.join(' ').replace(/^(['"])(.*)\1$/, '$2'));
        break;

      case 'mkdir': {
        const target = operands[0];
        if (!target) {
          err(ps ? 'New-Item : Missing an argument for parameter Path.' : 'mkdir: missing operand');
          break;
        }
        const { parent, name } = parentAndName(target);
        if (!writable(parent)) {
          err(
            ps
              ? `New-Item : Access to the path '${this.display(this.resolve(cwd, target))}' is denied.`
              : `mkdir: ${target}: Permission denied`
          );
          break;
        }
        fs.createFolder(parent!.folderId!, name);
        if (ps) say(`Created directory: ${this.display(this.resolve(cwd, target))}`);
        break;
      }

      case 'touch':
      case 'ni': {
        const isDir =
          ps &&
          args.some(
            (a, i) =>
              a.toLowerCase() === '-itemtype' && (args[i + 1] ?? '').toLowerCase().startsWith('dir')
          );
        const target = operands.find((o) => !/^(directory|file)$/i.test(o));
        if (!target) {
          err(
            ps
              ? 'New-Item : Missing an argument for parameter Path.'
              : 'touch: missing file operand'
          );
          break;
        }
        const { parent, name } = parentAndName(target);
        if (!writable(parent)) {
          err(
            ps ? `New-Item : Access to the path is denied.` : `touch: ${target}: Permission denied`
          );
          break;
        }
        const existing = entryAt(target);
        if (existing?.node) {
          if (!ps) break; // touch on an existing file just bumps the time
          err(
            `New-Item : An item with the specified name ${this.display(existing.path)} already exists.`
          );
          break;
        }
        if (isDir) fs.createFolder(parent!.folderId!, name);
        else fs.createFile(parent!.folderId!, name, '');
        if (ps)
          say(
            `Created ${isDir ? 'directory' : 'file'}: ${this.display(this.resolve(cwd, target))}`
          );
        break;
      }

      case 'rm':
      case 'rmdir': {
        const target = operands[0];
        if (!target) {
          err(
            ps
              ? 'Remove-Item : Missing an argument for parameter Path.'
              : `${cmdRaw}: missing operand`
          );
          break;
        }
        const entry = entryAt(target);
        if (!entry) {
          err(missing(target));
          break;
        }
        if (!entry.node) {
          err(
            ps
              ? `Remove-Item : Access to the path '${target}' is denied.`
              : `${cmdRaw}: ${target}: Operation not permitted`
          );
          break;
        }
        if (
          entry.type === 'dir' &&
          !ps &&
          !flags.has('-r') &&
          !flags.has('-rf') &&
          command !== 'rmdir'
        ) {
          err(`rm: ${target}: is a directory`);
          break;
        }
        if (
          entry.type === 'dir' &&
          ps &&
          this.children(entry).length > 0 &&
          !flags.has('-recurse') &&
          !flags.has('-r')
        ) {
          err(
            `Remove-Item : The item at ${this.display(entry.path)} has children and the Recurse parameter was not specified.`
          );
          break;
        }
        const moved = fs.trashNodes([entry.node.id]);
        if (moved === 0)
          err(
            ps
              ? `Remove-Item : Access to the path '${target}' is denied.`
              : `${cmdRaw}: ${target}: Operation not permitted`
          );
        break;
      }

      case 'mv':
      case 'ren': {
        const [from, to] = operands;
        if (!from || !to) {
          err(
            ps
              ? `${cmdRaw} : Missing an argument for parameter Destination.`
              : `${cmdRaw}: missing file operand`
          );
          break;
        }
        const src = entryAt(from);
        if (!src?.node) {
          err(src ? `${cmdRaw}: ${from}: Operation not permitted` : missing(from));
          break;
        }
        const dest = entryAt(to);
        if (dest && dest.type === 'dir' && command === 'mv') {
          if (!writable(dest)) {
            err(`${cmdRaw}: ${to}: Permission denied`);
            break;
          }
          fs.moveNodes([src.node.id], dest.folderId!);
          break;
        }
        const { parent, name } = parentAndName(to);
        if (!writable(parent)) {
          err(`${cmdRaw}: ${to}: Permission denied`);
          break;
        }
        if (parent!.folderId !== src.node.parentId) fs.moveNodes([src.node.id], parent!.folderId!);
        fs.renameNode(src.node.id, name);
        break;
      }

      case 'cp': {
        const [from, to] = operands;
        if (!from || !to) {
          err(`${cmdRaw}: missing file operand`);
          break;
        }
        const src = entryAt(from);
        if (!src) {
          err(missing(from));
          break;
        }
        if (src.type === 'dir') {
          err(
            ps
              ? 'Copy-Item : Copying folders is not supported here.'
              : `cp: ${from} is a directory (not copied).`
          );
          break;
        }
        const dest = entryAt(to);
        const { parent, name } =
          dest?.type === 'dir' ? { parent: dest, name: src.name } : parentAndName(to);
        if (!writable(parent)) {
          err(`${cmdRaw}: ${to}: Permission denied`);
          break;
        }
        fs.createFile(parent!.folderId!, name, src.content ?? '');
        break;
      }

      case 'nano': {
        const target = operands[0];
        if (!target) {
          err(`${cmdRaw}: missing file operand`);
          break;
        }
        const entry = entryAt(target);
        if (!entry || entry.type === 'dir' || !entry.node) {
          err(entry ? `${cmdRaw}: ${target}: not a text file` : missing(target));
          break;
        }
        this.host.openApp('texteditor', {
          fileId: entry.node.id,
          filename: entry.node.name,
          content: entry.content ?? '',
        });
        say(
          `Opening ${entry.name} in ${ps ? 'Notepad' : this.kind === 'bash' ? 'Keep' : 'Text Editor'}…`
        );
        break;
      }

      case 'notepad': {
        const target = operands[0];
        const entry = target ? entryAt(target) : null;
        if (target && (!entry || !entry.node || entry.type === 'dir')) {
          err(missing(target));
          break;
        }
        this.host.openApp(
          'texteditor',
          entry?.node
            ? { fileId: entry.node.id, filename: entry.node.name, content: entry.content ?? '' }
            : undefined
        );
        break;
      }

      case 'open':
      case 'start': {
        const target = operands[0];
        if (!target) {
          err(
            ps
              ? 'Start-Process : Missing an argument for parameter FilePath.'
              : 'usage: open <app|file|url>'
          );
          break;
        }
        if (/^https?:\/\//i.test(target) || /^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(target)) {
          this.host.openApp('safari', {
            url: target.startsWith('http') ? target : `https://${target}`,
          });
          say(`Opening ${target} in ${ps ? 'Google Chrome' : 'Chrome'}…`);
          break;
        }
        const appId = APP_ALIASES[target.toLowerCase().replace(/\.(app|exe)$/, '')];
        if (appId) {
          this.host.openApp(appId, undefined);
          say(`Opening ${target}…`);
          break;
        }
        const entry = entryAt(target);
        if (entry?.node) {
          if (entry.node.type === 'app' && entry.node.appId) this.host.openApp(entry.node.appId);
          else if (entry.type === 'dir') this.host.openApp('finder', { folderId: entry.node.id });
          else
            this.host.openApp('texteditor', {
              fileId: entry.node.id,
              filename: entry.node.name,
              content: entry.content ?? '',
            });
          say(`Opening ${entry.name}…`);
          break;
        }
        err(
          ps
            ? `Start-Process : This command cannot be run because '${target}' was not found.`
            : `${cmdRaw}: no application named '${target}'`
        );
        break;
      }

      case 'whoami':
        say(
          ps
            ? `josh-desktop\\${this.host.userName.split(' ')[0].toLowerCase()}`
            : this.kind === 'bash'
              ? 'u0_a247'
              : this.host.userName.split(' ')[0].toLowerCase()
        );
        break;
      case 'hostname':
        say(ps ? 'JOSH-DESKTOP' : this.kind === 'bash' ? 'localhost' : 'macbook-pro');
        break;
      case 'date':
        say(
          ps
            ? new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'medium' })
            : new Date().toString()
        );
        break;
      case 'ver':
        say('');
        say('Microsoft Windows [Version 10.0.26200.1000]');
        break;
      case 'winver':
        say('Windows 11 Pro, version 25H2 (OS Build 26200.1000)');
        break;
      case 'sw_vers':
        say('ProductName:\t\tmacOS');
        say('ProductVersion:\t\t26.0');
        say('BuildVersion:\t\t25A5306g');
        break;
      case 'uname':
        if (this.kind === 'bash')
          say(
            flags.has('-a')
              ? 'Linux localhost 6.6.30-android16-5 #1 SMP PREEMPT aarch64 Android'
              : 'Linux'
          );
        else
          say(
            flags.has('-a')
              ? 'Darwin macbook-pro 25.5.0 Darwin Kernel Version 25.5.0 arm64'
              : 'Darwin'
          );
        break;
      case 'getprop': {
        const props: Record<string, string> = {
          'ro.build.version.release': '16',
          'ro.build.version.sdk': '36',
          'ro.product.model': 'Pixel 10 Pro',
          'ro.product.manufacturer': 'Google',
          'ro.build.id': 'BP2A.260905.010',
        };
        if (operands[0]) say(props[operands[0]] ?? '');
        else Object.entries(props).forEach(([k, v]) => say(`[${k}]: [${v}]`));
        break;
      }
      case 'termux-info':
        say('Termux version: 0.119.0');
        say('Android version: 16');
        say('Device model: Google Pixel 10 Pro');
        say('Kernel: Linux 6.6.30-android16-5 aarch64');
        say('Packages: 847 installed');
        break;
      case 'pkg':
      case 'apt': {
        const sub = operands[0];
        const pkgName = operands[1];
        if (sub === 'install' || sub === 'i') {
          if (!pkgName) {
            err('pkg: no package specified');
            break;
          }
          say(`Reading package lists... Done`);
          say(`Building dependency tree... Done`);
          say(`The following NEW packages will be installed:\n  ${pkgName}`);
          say(
            `Get:1 https://packages.termux.dev/apt/termux-main stable/main aarch64 ${pkgName} [1,204 kB]`
          );
          say(`Setting up ${pkgName} ... Done`);
        } else if (sub === 'search') {
          say(`${pkgName ?? ''}/stable 1.0 aarch64\n  ${pkgName ?? 'package'} for Termux`);
        } else if (sub === 'upgrade' || sub === 'update') {
          say('Reading package lists... Done');
          say('All packages are up to date.');
        } else if (sub === 'list-installed') {
          ['bash', 'coreutils', 'git', 'nodejs', 'openssh', 'python', 'termux-api', 'vim'].forEach(
            (p) => say(`${p}/stable,now aarch64 [installed]`)
          );
        } else {
          say('Usage: pkg command [arguments]');
          say('  install <package>   search <query>   upgrade   list-installed');
        }
        break;
      }
      case 'uptime':
        say(
          `${new Date().toTimeString().split(' ')[0]} up 6 years, 3:42, 1 user, load averages: 0.42 0.38 0.41`
        );
        break;
      case 'systeminfo':
        [
          ['Host Name', 'JOSH-DESKTOP'],
          ['OS Name', 'Microsoft Windows 11 Pro'],
          ['OS Version', '10.0.26200 N/A Build 26200'],
          ['System Manufacturer', 'Microsoft Corporation'],
          ['System Model', 'Surface Laptop 7'],
          ['Processor', 'Snapdragon X Elite, 12 cores'],
          ['Total Physical Memory', '32,768 MB'],
          ['Registered Owner', this.host.userName],
        ].forEach(([k, v]) => say(`${(k + ':').padEnd(28)}${v}`));
        break;
      case 'ipconfig':
      case 'ifconfig':
      case 'ip':
        if (ps) {
          say('');
          say('Windows IP Configuration');
          say('');
          say('Wireless LAN adapter Wi-Fi:');
          say('');
          say('   Connection-specific DNS Suffix  . : home');
          say('   IPv4 Address. . . . . . . . . . . : 192.168.1.42');
          say('   Subnet Mask . . . . . . . . . . . : 255.255.255.0');
          say('   Default Gateway . . . . . . . . . : 192.168.1.1');
        } else {
          say('en0: flags=8863<UP,BROADCAST,SMART,RUNNING,SIMPLEX,MULTICAST> mtu 1500');
          say('\tinet 192.168.1.42 netmask 0xffffff00 broadcast 192.168.1.255');
          say('\tstatus: active');
        }
        break;
      case 'ping': {
        const host = operands[0] ?? 'hawksworth.dev';
        say(`PING ${host} (76.76.21.21): 56 data bytes`);
        [12.4, 11.9, 12.1, 12.6].forEach((t, i) =>
          say(`64 bytes from 76.76.21.21: icmp_seq=${i} ttl=56 time=${t} ms`)
        );
        say(`--- ${host} ping statistics ---`);
        say('4 packets transmitted, 4 packets received, 0.0% packet loss');
        break;
      }
      case 'ps':
      case 'top': {
        if (ps) {
          say('');
          say(' NPM(K)    PM(M)      WS(M)     CPU(s)     Id  SI ProcessName');
          say(' ------    -----      -----     ------     --  -- -----------');
          this.host.windows.forEach((w, i) =>
            say(
              `${String(120 + i * 7).padStart(7)} ${String(48.2 + i * 5).padStart(8)} ${String(96.4 + i * 9).padStart(10)} ${String((1.2 + i * 0.4).toFixed(2)).padStart(10)} ${String(4120 + i * 44).padStart(6)}   1 ${w.appId}`
            )
          );
        } else {
          say('  PID TTY           TIME CMD');
          this.host.windows.forEach((w, i) =>
            say(
              `${String(4120 + i * 44).padStart(5)} ttys001    0:0${i}.${String(12 + i * 7).padStart(2, '0')} ${w.appId}`
            )
          );
        }
        break;
      }
      case 'tree': {
        const entry = entryAt(operands[0] ?? '.');
        if (!entry || entry.type !== 'dir') {
          err(missing(operands[0] ?? '.'));
          break;
        }
        say(this.display(entry.path));
        const walk = (e: Entry, prefix: string, depth: number) => {
          const kids = this.children(e).filter((k) => !k.name.startsWith('.'));
          kids.forEach((k, i) => {
            const last = i === kids.length - 1;
            say(`${prefix}${last ? '└── ' : '├── '}${k.name}`);
            if (k.type === 'dir' && depth < 2) {
              const sub = this.lookup(e.path.replace(/\/$/, '') + '/' + k.name);
              if (sub) walk(sub, prefix + (last ? '    ' : '│   '), depth + 1);
            }
          });
        };
        walk(entry, '', 0);
        break;
      }
      case 'env':
      case 'printenv':
      case 'set': {
        const env = this.env(cwd);
        if (operands[0] && command === 'printenv') say(env[operands[0]] ?? '');
        else Object.entries(env).forEach(([k, v]) => say(`${k}=${v}`));
        break;
      }
      case 'export':
      case 'alias':
        break;
      case 'am':
        say(
          operands[0] === 'start'
            ? 'Starting: Intent { act=android.intent.action.MAIN }'
            : 'usage: am start <intent>'
        );
        break;
      case 'history':
        history.slice(0, 20).forEach((h, i) => say(`  ${String(i + 1).padStart(3)}  ${h}`));
        break;
      case 'say':
        if (typeof speechSynthesis !== 'undefined' && operands.length) {
          speechSynthesis.speak(new SpeechSynthesisUtterance(operands.join(' ')));
        } else if (!operands.length) err('usage: say <text>');
        break;
      case 'calc':
        this.host.openApp('calculator');
        break;
      case 'explorer':
      case 'finder':
        this.host.openApp('finder');
        break;
      case 'spaceinvaders':
      case 'invaders':
        return { lines: out, cwd, effect: 'invaders' };
      case 'neofetch':
        return { lines: out, cwd };
      case 'help':
        this.help().forEach((l) => say(l));
        break;
      default:
        err(
          ps
            ? `${cmdRaw} : The term '${cmdRaw}' is not recognized as the name of a cmdlet, function, script file, or operable program.`
            : this.kind === 'bash'
              ? `bash: ${cmdRaw}: command not found`
              : `zsh: command not found: ${cmdRaw}`
        );
    }
    return { lines: out, cwd };
  }

  help(): string[] {
    if (this.kind === 'powershell') {
      return [
        'Commands this PowerShell understands (cmd aliases work too):',
        '  dir | ls | Get-ChildItem   list a folder        cd | Set-Location     change folder',
        '  pwd | Get-Location         current folder       type | Get-Content    print a file',
        '  mkdir <name>               new folder           ni <name>             new file',
        '  del | Remove-Item          delete (to Recycle Bin)   ren | mv           rename or move',
        '  copy | Copy-Item           copy a file          notepad <file>        edit in Notepad',
        '  start <app|url>            open an app or site  tree                  folder tree',
        '  Get-Process | tasklist     running apps         systeminfo            this PC',
        '  ipconfig · ping · ver · winver · whoami · hostname · Get-Date · winfetch',
        '  cls · history · help · spaceinvaders · exit',
      ];
    }
    if (this.kind === 'bash') {
      return [
        'Commands this Termux shell understands:',
        '  ls [-la] · cd · pwd · cat · echo · mkdir · touch · rm [-r] · mv · cp · tree',
        '  nano|vim <file>   edit in Keep       termux-open <app|url>   open an app or site',
        '  pkg install|search|upgrade|list-installed          termux-info · getprop',
        '  uname [-a] · whoami · hostname · date · uptime · ifconfig · ping · ps',
        '  clear · history · help · neofetch · spaceinvaders · exit',
      ];
    }
    return [
      'Commands this zsh understands:',
      '  ls [-la] · cd · pwd · cat · echo · mkdir · touch · rm [-r] · mv · cp · tree',
      '  open <app|file|url>   open an app, file or site   nano|vim|code <file>   edit',
      '  say <text>            speak (really)              calc · finder',
      '  uname [-a] · sw_vers · whoami · hostname · date · uptime · ifconfig · ping · ps',
      '  clear · history · help · neofetch · spaceinvaders · exit',
    ];
  }
}

const APP_ALIASES: Record<string, string> = {
  about: 'about',
  experience: 'experience',
  skills: 'skills',
  contact: 'contact',
  mail: 'contact',
  gmail: 'contact',
  location: 'location',
  maps: 'location',
  finder: 'finder',
  explorer: 'finder',
  files: 'finder',
  trash: 'trash',
  bin: 'trash',
  safari: 'safari',
  chrome: 'safari',
  edge: 'safari',
  browser: 'safari',
  github: 'githubdesktop',
  'github desktop': 'githubdesktop',
  outlook: 'outlook',
  postman: 'postman',
  xcode: 'xcode',
  'android studio': 'androidstudio',
  androidstudio: 'androidstudio',
  spotify: 'spotify',
  word: 'word',
  'app store': 'appstore',
  appstore: 'appstore',
  store: 'appstore',
  terminal: 'terminal',
  calculator: 'calculator',
  calc: 'calculator',
  settings: 'settings',
  'system settings': 'settings',
  texteditor: 'texteditor',
  textedit: 'texteditor',
  code: 'texteditor',
  vscode: 'texteditor',
  'visual studio code': 'texteditor',
  notepad: 'texteditor',
  keep: 'texteditor',
  preview: 'imageviewer',
  photos: 'imageviewer',
  doom: 'doom',
  snake: 'snake',
  claude: 'askjosh',
  duck: 'rubberduck',
};

/* ── helpers ────────────────────────────────────────────────────────────── */
/** Split `a && b ; c || d` into segments, respecting quotes. */
function splitChain(line: string): { text: string; op: '' | '&&' | '||' | ';' }[] {
  const parts: { text: string; op: '' | '&&' | '||' | ';' }[] = [];
  let buf = '';
  let quote: string | null = null;
  let op: '' | '&&' | '||' | ';' = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      buf += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      buf += ch;
      continue;
    }
    const two = line.slice(i, i + 2);
    if (two === '&&' || two === '||' || ch === ';') {
      if (buf.trim()) parts.push({ text: buf.trim(), op });
      op = ch === ';' ? ';' : (two as '&&' | '||');
      buf = '';
      if (ch !== ';') i++;
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) parts.push({ text: buf.trim(), op });
  return parts;
}

function tokenize(line: string): string[] {
  const out: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}

function fileText(node: FsNode): string {
  if (node.type === 'app') return `<application bundle: ${node.name}>`;
  if (node.type === 'job') return `<work experience: ${node.name} — open it from the desktop>`;
  if (node.type === 'image') return '<binary image data>';
  if (node.url) return `<PDF document: ${node.name}>`;
  return node.content ?? '';
}

function sizeOf(node?: FsNode): number {
  if (!node) return 4096;
  if (node.type === 'folder') return 4096;
  return (
    Math.max(
      0,
      (node.content?.length ?? 0) + (node.dataUrl ? Math.round(node.dataUrl.length * 0.75) : 0)
    ) || 1024
  );
}

const pad2 = (n: number) => String(n).padStart(2, '0');
function fmtDate(d: Date) {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function fmtTime(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function fmtLs(d: Date) {
  return `${d.toLocaleString('en-US', { month: 'short' })} ${String(d.getDate()).padStart(2)} ${fmtTime(d)}`;
}
