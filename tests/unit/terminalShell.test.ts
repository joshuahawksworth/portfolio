import { describe, expect, it, vi } from 'vitest';
import { ROOT_IDS, type FsNode } from '../../src/data/fileSystemSeed';
import { Shell, shellFor, type ShellFs, type ShellHost } from '../../src/lib/terminalShell';

/** A tiny in-memory stand-in for DesktopContext's file system. */
function fakeFs(): ShellFs {
  const fs: Record<string, FsNode> = {};
  let n = 0;
  const add = (node: Omit<FsNode, 'createdAt' | 'modifiedAt'>) => {
    fs[node.id] = { ...node, createdAt: 1, modifiedAt: 1 };
    return node.id;
  };
  for (const id of Object.values(ROOT_IDS)) {
    add({ id, parentId: null, name: id, type: 'folder', locked: true });
  }
  add({
    id: 'readme',
    parentId: ROOT_IDS.desktop,
    name: 'README.txt',
    type: 'file',
    content: 'hello\nworld',
  });
  add({ id: 'projects', parentId: ROOT_IDS.desktop, name: 'Projects', type: 'folder' });
  add({
    id: 'chrome',
    parentId: ROOT_IDS.applications,
    name: 'Chrome',
    type: 'app',
    appId: 'safari',
  });

  const childrenOf = (parentId: string) =>
    Object.values(fs).filter((node) => node.parentId === parentId);
  return {
    fs,
    childrenOf,
    createFolder: (parentId, name = 'untitled folder') =>
      add({ id: `f${++n}`, parentId, name, type: 'folder' }),
    createFile: (parentId, name = 'untitled.txt', content = '') =>
      add({ id: `t${++n}`, parentId, name, type: 'file', content }),
    trashNodes: (ids) => {
      let moved = 0;
      for (const id of ids) {
        if (fs[id] && !fs[id].locked) {
          fs[id] = { ...fs[id], parentId: ROOT_IDS.trash };
          moved++;
        }
      }
      return moved;
    },
    renameNode: (id, name) => {
      fs[id] = { ...fs[id], name };
    },
    moveNodes: (ids, parentId) => {
      for (const id of ids) fs[id] = { ...fs[id], parentId };
    },
    writeFile: (id, content) => {
      fs[id] = { ...fs[id], content };
    },
  };
}

function makeShell(kind: 'zsh' | 'powershell' | 'bash') {
  const host: ShellHost = {
    fs: fakeFs(),
    windows: [],
    openApp: vi.fn(),
    userName: 'Joshua Hawksworth',
  };
  return { shell: new Shell(kind, host), host };
}

const text = (lines: { text: string }[]) => lines.map((l) => l.text).join('\n');

describe('shellFor', () => {
  it('picks the shell that matches the platform', () => {
    expect(shellFor('macos')).toBe('zsh');
    expect(shellFor('ios')).toBe('zsh');
    expect(shellFor('windows')).toBe('powershell');
    expect(shellFor('android')).toBe('bash');
  });
});

describe('zsh on macOS', () => {
  it('starts in the home folder with a macOS prompt', () => {
    const { shell } = makeShell('zsh');
    expect(shell.home).toBe('/Users/joshua');
    expect(shell.prompt(shell.home)).toBe('joshua@macbook-pro ~ % ');
    expect(shell.prompt('/Users/joshua/Desktop')).toBe('joshua@macbook-pro ~/Desktop % ');
  });

  it('lists the real desktop through the ~/Desktop mount', () => {
    const { shell } = makeShell('zsh');
    const res = shell.run('ls ~/Desktop', shell.home, []);
    expect(text(res.lines)).toContain('README.txt');
    expect(text(res.lines)).toContain('Projects');
  });

  it('cds, cats files and reports missing paths the zsh way', () => {
    const { shell } = makeShell('zsh');
    const cd = shell.run('cd Desktop', shell.home, []);
    expect(cd.cwd).toBe('/Users/joshua/Desktop');
    expect(text(shell.run('cat README.txt', cd.cwd, []).lines)).toBe('hello\nworld');
    const missing = shell.run('cat nope.txt', cd.cwd, []);
    expect(missing.lines[0]).toEqual({
      type: 'err',
      text: 'cat: nope.txt: No such file or directory',
    });
    expect(shell.run('frobnicate', cd.cwd, []).lines[0].text).toBe(
      'zsh: command not found: frobnicate'
    );
  });

  it('creates, moves and trashes files on the shared file system', () => {
    const { shell, host } = makeShell('zsh');
    const cwd = '/Users/joshua/Desktop';
    expect(shell.run('mkdir notes && touch notes/todo.txt', cwd, []).lines).toEqual([]);
    const notes = host.fs.childrenOf(ROOT_IDS.desktop).find((n) => n.name === 'notes');
    expect(notes?.type).toBe('folder');
    expect(host.fs.childrenOf(notes!.id).map((n) => n.name)).toEqual(['todo.txt']);

    shell.run('mv notes/todo.txt done.txt', cwd, []);
    expect(host.fs.childrenOf(ROOT_IDS.desktop).map((n) => n.name)).toContain('done.txt');

    expect(shell.run('rm notes', cwd, []).lines[0].text).toBe('rm: notes: is a directory');
    shell.run('rm -r notes', cwd, []);
    expect(host.fs.childrenOf(ROOT_IDS.trash).map((n) => n.name)).toContain('notes');
  });

  it('refuses to write into /Applications', () => {
    const { shell } = makeShell('zsh');
    const res = shell.run('touch /Applications/x', shell.home, []);
    expect(res.lines[0].type).toBe('err');
  });

  it('opens apps, files and urls', () => {
    const { shell, host } = makeShell('zsh');
    shell.run('open chrome', shell.home, []);
    expect(host.openApp).toHaveBeenCalledWith('safari', undefined);
    shell.run('open github.com', shell.home, []);
    expect(host.openApp).toHaveBeenCalledWith('safari', { url: 'https://github.com' });
    shell.run('nano ~/Desktop/README.txt', shell.home, []);
    expect(host.openApp).toHaveBeenCalledWith(
      'texteditor',
      expect.objectContaining({ fileId: 'readme', filename: 'README.txt' })
    );
  });

  it('expands variables and chains commands', () => {
    const { shell } = makeShell('zsh');
    expect(text(shell.run('echo $HOME', shell.home, []).lines)).toBe('/Users/joshua');
    const chain = shell.run('cd Desktop && pwd ; echo done', shell.home, []);
    expect(text(chain.lines)).toBe('/Users/joshua/Desktop\ndone');
    expect(chain.cwd).toBe('/Users/joshua/Desktop');
    const short = shell.run('cd nowhere && echo never || echo fallback', shell.home, []);
    expect(text(short.lines)).toContain('fallback');
    expect(text(short.lines)).not.toContain('never');
  });

  it('tab-completes commands and paths', () => {
    const { shell } = makeShell('zsh');
    expect(shell.complete(shell.home, 'sw_')).toEqual(['sw_vers']);
    expect(shell.complete(shell.home, 'ls Des')).toEqual(['Desktop/']);
    expect(shell.complete(shell.home, 'cat Desktop/RE')).toEqual(['Desktop/README.txt']);
  });

  it('clears, exits and launches invaders through effects', () => {
    const { shell } = makeShell('zsh');
    expect(shell.run('clear', shell.home, []).effect).toBe('clear');
    expect(shell.run('exit', shell.home, []).effect).toBe('exit');
    expect(shell.run('spaceinvaders', shell.home, []).effect).toBe('invaders');
  });
});

describe('PowerShell on Windows', () => {
  it('uses a Windows prompt, drive paths and backslashes', () => {
    const { shell } = makeShell('powershell');
    expect(shell.home).toBe('C:/Users/Joshua');
    expect(shell.prompt(shell.home)).toBe('PS C:\\Users\\Joshua> ');
    expect(shell.run('cd desktop', shell.home, []).cwd).toBe('C:/Users/Joshua/desktop');
    expect(shell.run('cd C:\\', shell.home, []).cwd).toBe('C:/');
    expect(shell.prompt('C:/')).toBe('PS C:\\> ');
  });

  it('prints Get-ChildItem tables and accepts cmd aliases', () => {
    const { shell } = makeShell('powershell');
    const out = text(shell.run('dir ~\\Desktop', shell.home, []).lines);
    expect(out).toContain('Directory: C:\\Users\\Joshua\\Desktop');
    expect(out).toContain('Mode                 LastWriteTime');
    expect(out).toMatch(/d-----.*Projects/);
    expect(out).toMatch(/-a----.*README\.txt/);
    expect(text(shell.run('Get-ChildItem', 'C:/Users/Joshua/Desktop', []).lines)).toContain(
      'README.txt'
    );
    expect(text(shell.run('type README.txt', 'C:/Users/Joshua/Desktop', []).lines)).toBe(
      'hello\nworld'
    );
  });

  it('reports errors like PowerShell', () => {
    const { shell } = makeShell('powershell');
    expect(shell.run('foo', shell.home, []).lines[0].text).toContain(
      "foo : The term 'foo' is not recognized"
    );
    expect(shell.run('cd nope', shell.home, []).lines[0].text).toContain(
      "Set-Location : Cannot find path 'C:\\Users\\Joshua\\nope'"
    );
  });

  it('creates items with New-Item / ni and mkdir', () => {
    const { shell, host } = makeShell('powershell');
    const cwd = 'C:/Users/Joshua/Desktop';
    expect(text(shell.run('ni hello.txt', cwd, []).lines)).toContain('Created file');
    expect(host.fs.childrenOf(ROOT_IDS.desktop).map((n) => n.name)).toContain('hello.txt');
    shell.run('New-Item -ItemType Directory build', cwd, []);
    expect(host.fs.childrenOf(ROOT_IDS.desktop).find((n) => n.name === 'build')?.type).toBe(
      'folder'
    );
    shell.run('del hello.txt', cwd, []);
    expect(host.fs.childrenOf(ROOT_IDS.trash).map((n) => n.name)).toContain('hello.txt');
  });

  it('expands $env: and %VAR% and knows Windows commands', () => {
    const { shell } = makeShell('powershell');
    expect(text(shell.run('echo $env:USERPROFILE', shell.home, []).lines)).toBe(
      'C:\\Users\\Joshua'
    );
    expect(text(shell.run('echo %COMPUTERNAME%', shell.home, []).lines)).toBe('JOSH-DESKTOP');
    expect(text(shell.run('ver', shell.home, []).lines)).toContain('Microsoft Windows [Version');
    expect(text(shell.run('systeminfo', shell.home, []).lines)).toContain('Windows 11 Pro');
    expect(text(shell.run('whoami', shell.home, []).lines)).toBe('josh-desktop\\joshua');
  });

  it('starts apps and sites with start', () => {
    const { shell, host } = makeShell('powershell');
    shell.run('start notepad', shell.home, []);
    expect(host.openApp).toHaveBeenCalledWith('texteditor', undefined);
    shell.run('start https://example.com', shell.home, []);
    expect(host.openApp).toHaveBeenCalledWith('safari', { url: 'https://example.com' });
  });
});

describe('bash in Termux on Android', () => {
  it('lives in the Termux home with a bash prompt', () => {
    const { shell } = makeShell('bash');
    expect(shell.home).toBe('/data/data/com.termux/files/home');
    expect(shell.prompt(shell.home)).toBe('~ $ ');
    expect(shell.banner()[0]).toBe('Welcome to Termux!');
  });

  it('reaches the desktop via ~/storage/shared and /sdcard', () => {
    const { shell } = makeShell('bash');
    expect(text(shell.run('ls ~/storage/shared/Desktop', shell.home, []).lines)).toContain(
      'README.txt'
    );
    expect(text(shell.run('ls /sdcard/Desktop', shell.home, []).lines)).toContain('Projects');
  });

  it('speaks bash and Termux', () => {
    const { shell } = makeShell('bash');
    expect(shell.run('nope', shell.home, []).lines[0].text).toBe('bash: nope: command not found');
    expect(text(shell.run('pkg install vim', shell.home, []).lines)).toContain('Setting up vim');
    expect(text(shell.run('uname -a', shell.home, []).lines)).toContain('Android');
    expect(text(shell.run('getprop ro.product.model', shell.home, []).lines)).toBe('Pixel 10 Pro');
    expect(text(shell.run('echo $PREFIX', shell.home, []).lines)).toBe(
      '/data/data/com.termux/files/usr'
    );
  });
});
