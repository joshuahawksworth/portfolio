import { createContext, use, useState, useCallback, useRef, useMemo } from 'react';
import { APP_DEFAULTS, APP_MAX, APP_MIN } from '../components/apps/appRegistry';
import { buildSeedFileSystem, ROOT_IDS, type FsNode } from '../data/fileSystemSeed';
import { currentOs, shellInsets } from '../theme/platform';

export type { FsNode, FsNodeType } from '../data/fileSystemSeed';

export interface WindowInstance {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  savedX: number;
  savedY: number;
  savedW: number;
  savedH: number;
  props?: Record<string, unknown>;
}

const CASCADE_STEPS = 8;
function cascadePosition(idx: number, w: number, h: number) {
  const { top: menuH, bottom: dockH } = shellInsets();
  const pad = 60;
  const origins = [
    { x: 0.14, y: 0.12 },
    { x: 0.28, y: 0.14 },
    { x: 0.1, y: 0.18 },
    { x: 0.2, y: 0.1 },
    { x: 0.24, y: 0.17 },
    { x: 0.12, y: 0.13 },
    { x: 0.33, y: 0.11 },
    { x: 0.18, y: 0.2 },
  ];
  const o = origins[idx % CASCADE_STEPS];
  const bx = Math.round(window.innerWidth * o.x) + (idx % CASCADE_STEPS) * 24;
  const by = Math.round(window.innerHeight * o.y) + menuH + (idx % CASCADE_STEPS) * 20;
  return {
    x: Math.min(Math.max(bx, pad), window.innerWidth - w - pad),
    y: Math.min(Math.max(by, menuH + 10), window.innerHeight - h - dockH - 10),
  };
}

// ── File-system rules (shared by Finder, the desktop and the Trash) ────────

/** Files, images and user folders can go to the Trash; apps, jobs and system items can't. */
export function canTrashNode(node: FsNode): boolean {
  return !node.locked && (node.type === 'folder' || node.type === 'file' || node.type === 'image');
}

export function canRenameNode(node: FsNode): boolean {
  return !node.locked && node.type !== 'app' && node.type !== 'job';
}

/** Anything unlocked can be dragged into another folder (jobs and desktop app shortcuts too). */
export function canMoveNode(node: FsNode): boolean {
  return !node.locked;
}

/** Folders the user can create things in: everything but Applications and the Trash. */
export function isWritableFolder(node: FsNode | undefined): boolean {
  if (!node || node.type !== 'folder') return false;
  return node.id !== ROOT_IDS.applications && node.id !== ROOT_IDS.trash;
}

export function isInTrash(fs: Record<string, FsNode>, id: string): boolean {
  let cur: FsNode | undefined = fs[id];
  while (cur) {
    if (cur.id === ROOT_IDS.trash) return true;
    cur = cur.parentId ? fs[cur.parentId] : undefined;
  }
  return false;
}

function isDescendant(fs: Record<string, FsNode>, id: string, ancestorId: string): boolean {
  let cur: FsNode | undefined = fs[id];
  while (cur?.parentId) {
    if (cur.parentId === ancestorId) return true;
    cur = fs[cur.parentId];
  }
  return false;
}

function collectDescendants(fs: Record<string, FsNode>, id: string, out: Set<string>) {
  for (const n of Object.values(fs)) {
    if (n.parentId === id) {
      out.add(n.id);
      collectDescendants(fs, n.id, out);
    }
  }
}

/** "untitled folder", "untitled folder 2", … like Finder. */
function uniqueName(fs: Record<string, FsNode>, parentId: string, base: string): string {
  const siblings = new Set(
    Object.values(fs)
      .filter((n) => n.parentId === parentId)
      .map((n) => n.name.toLowerCase())
  );
  if (!siblings.has(base.toLowerCase())) return base;
  const dot = base.lastIndexOf('.');
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : '';
  for (let i = 2; ; i++) {
    const candidate = `${stem} ${i}${ext}`;
    if (!siblings.has(candidate.toLowerCase())) return candidate;
  }
}

let nodeCounter = 0;
function newId(prefix: string) {
  nodeCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${nodeCounter}`;
}

export interface NewFileInput {
  name: string;
  type?: 'file' | 'image';
  content?: string;
  dataUrl?: string;
}

interface DesktopCtx {
  windows: WindowInstance[];
  focusedId: string | null;
  openApp: (appId: string, props?: Record<string, unknown>) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, x: number, y: number, w: number, h: number) => void;
  toggleMaximize: (id: string) => void;

  /** The whole virtual file system, keyed by node id. */
  fs: Record<string, FsNode>;
  /** Direct children of a folder in creation order. */
  childrenOf: (parentId: string) => FsNode[];
  /** Create a folder and return its id (name is made unique like Finder does). */
  createFolder: (parentId: string, name?: string) => string;
  /** Create a text file and return its id. */
  createFile: (parentId: string, name?: string, content?: string) => string;
  /** Add an uploaded file or image to a folder and return its id. */
  addFile: (parentId: string, file: NewFileInput) => string;
  renameNode: (id: string, name: string) => void;
  /** Replace a text file's content (the Text Editor's Save). */
  writeFile: (id: string, content: string) => void;
  /** Move nodes into a folder. Locked nodes and cyclic moves are skipped. */
  moveNodes: (ids: string[], parentId: string) => void;
  /** Move nodes to the Trash, remembering where they came from. Returns how many moved. */
  trashNodes: (ids: string[]) => number;
  /** Put trashed nodes back where they came from (or the desktop if that folder is gone). */
  restoreNodes: (ids: string[]) => void;
  emptyTrash: () => void;
  /** Number of items sitting in the Trash (drives the full/empty bin icon). */
  trashCount: number;
}

export const DesktopContext = createContext<DesktopCtx | null>(null);

export function useDesktop() {
  const ctx = use(DesktopContext);
  if (!ctx) throw new Error('useDesktop outside DesktopProvider');
  return ctx;
}

let zTop = 100;

/** Shrink a requested size so the window fits between the shell bars, honouring the app minimum. */
function fitToWorkArea(appId: string, width: number, height: number) {
  const { top, bottom } = shellInsets();
  const min = APP_MIN[appId] ?? { width: 320, height: 240 };
  const maxW = Math.max(min.width, window.innerWidth - 24);
  const maxH = Math.max(min.height, window.innerHeight - top - bottom - 16);
  return { width: Math.min(width, maxW), height: Math.min(height, maxH) };
}

function makeAbout(): WindowInstance {
  const base = APP_DEFAULTS.about;
  const d = { ...base, ...fitToWorkArea('about', base.width, base.height) };
  const { x, y } = cascadePosition(0, d.width, d.height);
  return {
    id: 'about-0',
    appId: 'about',
    title: d.title,
    x,
    y,
    width: d.width,
    height: d.height,
    zIndex: ++zTop,
    minimized: false,
    maximized: false,
    savedX: x,
    savedY: y,
    savedW: d.width,
    savedH: d.height,
  };
}

export function DesktopProvider({
  children,
  startWithAbout = true,
}: {
  children: React.ReactNode;
  startWithAbout?: boolean;
}) {
  const [windows, setWindows] = useState<WindowInstance[]>(() =>
    startWithAbout ? [makeAbout()] : []
  );
  const [focusedId, setFocusedId] = useState<string | null>(() =>
    startWithAbout ? 'about-0' : null
  );

  // ── File system ────────────────────────────────────────────────────────
  const [fs, setFs] = useState<Record<string, FsNode>>(buildSeedFileSystem);
  // Mirror so callers that create-then-act in one event (new folder → rename) see fresh data.
  const fsRef = useRef(fs);
  fsRef.current = fs;

  const childrenOf = useCallback(
    (parentId: string) =>
      Object.values(fs)
        .filter((n) => n.parentId === parentId)
        .sort((a, b) => a.createdAt - b.createdAt),
    [fs]
  );

  const trashCount = useMemo(
    () => Object.values(fs).filter((n) => n.parentId === ROOT_IDS.trash).length,
    [fs]
  );

  const insertNode = useCallback((node: FsNode) => {
    fsRef.current = { ...fsRef.current, [node.id]: node };
    setFs(fsRef.current);
  }, []);

  const createFolder = useCallback(
    (parentId: string, name = 'untitled folder') => {
      const now = Date.now();
      const id = newId('folder');
      insertNode({
        id,
        parentId,
        name: uniqueName(fsRef.current, parentId, name),
        type: 'folder',
        createdAt: now,
        modifiedAt: now,
      });
      return id;
    },
    [insertNode]
  );

  const createFile = useCallback(
    (parentId: string, name = 'untitled.txt', content = '') => {
      const now = Date.now();
      const id = newId('file');
      insertNode({
        id,
        parentId,
        name: uniqueName(fsRef.current, parentId, name),
        type: 'file',
        content,
        createdAt: now,
        modifiedAt: now,
      });
      return id;
    },
    [insertNode]
  );

  const addFile = useCallback(
    (parentId: string, file: NewFileInput) => {
      const now = Date.now();
      const id = newId('upload');
      insertNode({
        id,
        parentId,
        name: uniqueName(fsRef.current, parentId, file.name),
        type: file.type ?? (file.dataUrl ? 'image' : 'file'),
        content: file.content,
        dataUrl: file.dataUrl,
        createdAt: now,
        modifiedAt: now,
      });
      return id;
    },
    [insertNode]
  );

  const renameNode = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setFs((prev) => {
      const node = prev[id];
      if (!node || !canRenameNode(node) || node.name === trimmed) return prev;
      const next = { ...prev, [id]: { ...node, name: trimmed, modifiedAt: Date.now() } };
      fsRef.current = next;
      return next;
    });
  }, []);

  const writeFile = useCallback((id: string, content: string) => {
    setFs((prev) => {
      const node = prev[id];
      if (!node || node.type !== 'file' || node.content === content) return prev;
      const next = { ...prev, [id]: { ...node, content, modifiedAt: Date.now() } };
      fsRef.current = next;
      return next;
    });
  }, []);

  const moveNodes = useCallback((ids: string[], parentId: string) => {
    setFs((prev) => {
      const target = prev[parentId];
      if (!target || target.type !== 'folder') return prev;
      let changed = false;
      const next = { ...prev };
      const now = Date.now();
      for (const id of ids) {
        const node = next[id];
        if (!node || !canMoveNode(node) || node.parentId === parentId) continue;
        if (id === parentId || isDescendant(next, parentId, id)) continue; // no cycles
        next[id] = {
          ...node,
          parentId,
          name: uniqueName(next, parentId, node.name),
          modifiedAt: now,
          trashedFrom: undefined,
          trashedAt: undefined,
        };
        changed = true;
      }
      if (!changed) return prev;
      fsRef.current = next;
      return next;
    });
  }, []);

  const trashNodes = useCallback((ids: string[]) => {
    let moved = 0;
    const prev = fsRef.current;
    const next = { ...prev };
    const now = Date.now();
    for (const id of ids) {
      const node = next[id];
      if (!node || !canTrashNode(node) || node.parentId === ROOT_IDS.trash) continue;
      next[id] = {
        ...node,
        parentId: ROOT_IDS.trash,
        trashedFrom: node.parentId ?? ROOT_IDS.desktop,
        trashedAt: now,
      };
      moved += 1;
    }
    if (moved > 0) {
      fsRef.current = next;
      setFs(next);
    }
    return moved;
  }, []);

  const restoreNodes = useCallback((ids: string[]) => {
    setFs((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const id of ids) {
        const node = next[id];
        if (!node || node.parentId !== ROOT_IDS.trash) continue;
        const from = node.trashedFrom;
        const dest =
          from && next[from] && next[from].type === 'folder' && !isInTrash(next, from)
            ? from
            : ROOT_IDS.desktop;
        next[id] = {
          ...node,
          parentId: dest,
          name: uniqueName(next, dest, node.name),
          trashedFrom: undefined,
          trashedAt: undefined,
          isJoke: undefined,
        };
        changed = true;
      }
      if (!changed) return prev;
      fsRef.current = next;
      return next;
    });
  }, []);

  const emptyTrash = useCallback(() => {
    setFs((prev) => {
      const doomed = new Set<string>();
      collectDescendants(prev, ROOT_IDS.trash, doomed);
      if (doomed.size === 0) return prev;
      const next: Record<string, FsNode> = {};
      for (const n of Object.values(prev)) if (!doomed.has(n.id)) next[n.id] = n;
      fsRef.current = next;
      return next;
    });
  }, []);

  // ── Windows ────────────────────────────────────────────────────────────
  const counter = useRef(1);

  const focusWindow = useCallback((id: string) => {
    setWindows((p) => p.map((w) => (w.id === id ? { ...w, zIndex: ++zTop, minimized: false } : w)));
    setFocusedId(id);
  }, []);

  const openApp = useCallback((appId: string, props?: Record<string, unknown>) => {
    const defaults = APP_DEFAULTS[appId];
    if (!defaults) return;

    counter.current += 1;
    const idx = counter.current;
    const newZ = ++zTop;
    const id = `${appId}-${idx}`;
    const wanted = {
      width: typeof props?.width === 'number' ? props.width : defaults.width,
      height: typeof props?.height === 'number' ? props.height : defaults.height,
    };
    // Never open a window larger than the work area (small laptops, short browser windows).
    const { width, height } = fitToWorkArea(appId, wanted.width, wanted.height);
    const { x, y } = cascadePosition(idx, width, height);

    setWindows((prev) => {
      const existing = props?.jobId
        ? prev.find((w) => w.props?.jobId === props.jobId)
        : props?.url
          ? prev.find((w) => w.appId === appId && w.props?.url === props.url)
          : !props
            ? prev.find((w) => w.appId === appId && !w.props?.jobId)
            : undefined;

      if (existing) {
        setFocusedId(existing.id);
        return prev.map((w) =>
          w.id === existing.id ? { ...w, zIndex: newZ, minimized: false } : w
        );
      }

      setFocusedId(id);
      return [
        ...prev,
        {
          id,
          appId,
          title: (props?.title as string) ?? defaults.title,
          x,
          y,
          width,
          height,
          zIndex: newZ,
          minimized: false,
          maximized: false,
          savedX: x,
          savedY: y,
          savedW: width,
          savedH: height,
          props,
        },
      ];
    });
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows((p) => p.filter((w) => w.id !== id));
    setFocusedId((p) => (p === id ? null : p));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((p) => p.map((w) => (w.id === id ? { ...w, minimized: true } : w)));
    setFocusedId(null);
  }, []);

  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows((p) => p.map((w) => (w.id === id ? { ...w, x, y } : w)));
  }, []);

  const resizeWindow = useCallback(
    (id: string, x: number, y: number, width: number, height: number) => {
      setWindows((p) =>
        p.map((w) => {
          if (w.id !== id) return w;
          const min = APP_MIN[w.appId] ?? { width: 320, height: 240 };
          return {
            ...w,
            x,
            y,
            width: Math.max(min.width, width),
            height: Math.max(min.height, height),
          };
        })
      );
    },
    []
  );

  const toggleMaximize = useCallback((id: string) => {
    setWindows((p) =>
      p.map((w) => {
        if (w.id !== id) return w;
        if (w.maximized) {
          return {
            ...w,
            maximized: false,
            x: w.savedX,
            y: w.savedY,
            width: w.savedW,
            height: w.savedH,
          };
        }
        const maxDef = APP_MAX[w.appId] ?? { width: 900, height: 600 };
        const { top: menuH, bottom: dockH } = shellInsets();
        // Windows maximises to the whole work area; macOS "zooms" to the app's ideal size.
        const fill = currentOs() === 'windows';
        const newW = fill ? window.innerWidth : Math.min(maxDef.width, window.innerWidth - 60);
        const newH = fill
          ? window.innerHeight - dockH
          : Math.min(maxDef.height, window.innerHeight - menuH - dockH - 40);
        const nx = fill ? 0 : Math.round((window.innerWidth - newW) / 2);
        const ny = fill ? 0 : menuH + Math.round((window.innerHeight - menuH - dockH - newH) / 2);
        return {
          ...w,
          maximized: true,
          savedX: w.x,
          savedY: w.y,
          savedW: w.width,
          savedH: w.height,
          x: nx,
          y: ny,
          width: newW,
          height: newH,
          zIndex: ++zTop,
        };
      })
    );
    setFocusedId(id);
  }, []);

  return (
    <DesktopContext.Provider
      value={{
        windows,
        focusedId,
        openApp,
        closeWindow,
        minimizeWindow,
        focusWindow,
        moveWindow,
        resizeWindow,
        toggleMaximize,
        fs,
        childrenOf,
        createFolder,
        createFile,
        addFile,
        renameNode,
        writeFile,
        moveNodes,
        trashNodes,
        restoreNodes,
        emptyTrash,
        trashCount,
      }}
    >
      {children}
    </DesktopContext.Provider>
  );
}
