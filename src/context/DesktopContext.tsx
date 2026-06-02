import { createContext, use, useState, useCallback, useRef } from 'react';

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

export const APP_DEFAULTS: Record<string, { title: string; width: number; height: number }> = {
  about:      { title: 'About Josh',       width: 600,  height: 500 },
  experience: { title: 'Work Experience',  width: 820,  height: 580 },
  skills:     { title: 'Skills & Tech',    width: 560,  height: 460 },
  contact:    { title: 'New Message',      width: 520,  height: 480 },
  location:   { title: 'Manchester, UK',   width: 700,  height: 520 },
  terminal:   { title: 'Terminal',         width: 680,  height: 460 },
  finder:     { title: 'Finder',           width: 780,  height: 520 },
  trash:      { title: 'Trash',            width: 480,  height: 360 },
  safari:     { title: 'Google Chrome',    width: 900,  height: 620 },
  githubapp:  { title: 'GitHub',           width: 900,  height: 620 },
};

// Minimum resize bounds per app
export const APP_MIN: Record<string, { width: number; height: number }> = {
  about:      { width: 400, height: 300 },
  experience: { width: 500, height: 380 },
  skills:     { width: 360, height: 280 },
  contact:    { width: 360, height: 300 },
  location:   { width: 380, height: 280 },
  terminal:   { width: 380, height: 240 },
  finder:     { width: 460, height: 320 },
  trash:      { width: 320, height: 240 },
  safari:     { width: 600, height: 400 },
  githubapp:  { width: 600, height: 400 },
};

// Per-app "zoom" target (green button) — bounded by screen at runtime
export const APP_MAX: Record<string, { width: number; height: number }> = {
  about:      { width: 720,  height: 600 },
  experience: { width: 1060, height: 700 },
  skills:     { width: 820,  height: 620 },
  contact:    { width: 680,  height: 560 },
  location:   { width: 960,  height: 700 },
  terminal:   { width: 960,  height: 640 },
  finder:     { width: 1060, height: 720 },
  trash:      { width: 580,  height: 440 },
};

const CASCADE_STEPS = 8;
function cascadePosition(idx: number, w: number, h: number) {
  const menuH = 28;
  const dockH = 90;
  const pad   = 60;
  const origins = [
    { x: 0.14, y: 0.12 }, { x: 0.28, y: 0.14 }, { x: 0.10, y: 0.18 },
    { x: 0.20, y: 0.10 }, { x: 0.24, y: 0.17 }, { x: 0.12, y: 0.13 },
    { x: 0.33, y: 0.11 }, { x: 0.18, y: 0.20 },
  ];
  const o = origins[idx % CASCADE_STEPS];
  const bx = Math.round(window.innerWidth  * o.x) + (idx % CASCADE_STEPS) * 24;
  const by = Math.round(window.innerHeight * o.y) + menuH + (idx % CASCADE_STEPS) * 20;
  return {
    x: Math.min(Math.max(bx, pad), window.innerWidth  - w - pad),
    y: Math.min(Math.max(by, menuH + 10), window.innerHeight - h - dockH - 10),
  };
}

/** Folder created by the user on the desktop, shared via context so Finder can see it */
export interface DesktopFolder { id: string; label: string }

export interface TrashedItem { id: string; name: string; date: string }

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
  desktopFolders: DesktopFolder[];
  syncDesktopFolders: (folders: DesktopFolder[]) => void;
  trashedItems: TrashedItem[];
  trashEmptied: boolean;
  trashItem: (item: TrashedItem) => void;
  emptyTrash: () => void;
}

export const DesktopContext = createContext<DesktopCtx | null>(null);

export function useDesktop() {
  const ctx = use(DesktopContext);
  if (!ctx) throw new Error('useDesktop outside DesktopProvider');
  return ctx;
}

let zTop = 100;

function makeAbout(): WindowInstance {
  const d = APP_DEFAULTS.about;
  const { x, y } = cascadePosition(0, d.width, d.height);
  return {
    id: 'about-0', appId: 'about', title: d.title,
    x, y, width: d.width, height: d.height,
    zIndex: ++zTop, minimized: false, maximized: false,
    savedX: x, savedY: y, savedW: d.width, savedH: d.height,
  };
}

export function DesktopProvider({
  children,
  startWithAbout = true,
}: {
  children: React.ReactNode;
  startWithAbout?: boolean;
}) {
  const [windows, setWindows] = useState<WindowInstance[]>(() => startWithAbout ? [makeAbout()] : []);
  const [focusedId, setFocusedId] = useState<string | null>(() => startWithAbout ? 'about-0' : null);
  const [desktopFolders, setDesktopFolders] = useState<DesktopFolder[]>([]);
  const syncDesktopFolders = useCallback((folders: DesktopFolder[]) => setDesktopFolders(folders), []);
  const [trashedItems,  setTrashedItems]  = useState<TrashedItem[]>([]);
  const [trashEmptied, setTrashEmptied]  = useState(false);
  const trashItem  = useCallback((item: TrashedItem) => {
    setTrashedItems(p => [...p, item]);
    setTrashEmptied(false);
  }, []);
  const emptyTrash = useCallback(() => {
    setTrashedItems([]);
    setTrashEmptied(true);
  }, []);
  const counter = useRef(1);

  const focusWindow = useCallback((id: string) => {
    setWindows(p => p.map(w => w.id === id ? { ...w, zIndex: ++zTop, minimized: false } : w));
    setFocusedId(id);
  }, []);

  const openApp = useCallback((appId: string, props?: Record<string, unknown>) => {
    const defaults = APP_DEFAULTS[appId];
    if (!defaults) return;

    counter.current += 1;
    const idx   = counter.current;
    const newZ  = ++zTop;
    const id    = `${appId}-${idx}`;
    const { x, y } = cascadePosition(idx, defaults.width, defaults.height);

    setWindows(prev => {
      const existing = props?.jobId
        ? prev.find(w => w.props?.jobId === props.jobId)
        : props?.url
          ? prev.find(w => w.appId === appId && w.props?.url === props.url)
          : (!props ? prev.find(w => w.appId === appId && !w.props?.jobId) : undefined);

      if (existing) {
        setFocusedId(existing.id);
        return prev.map(w => w.id === existing.id
          ? { ...w, zIndex: newZ, minimized: false }
          : w);
      }

      setFocusedId(id);
      return [...prev, {
        id, appId,
        title: (props?.title as string) ?? defaults.title,
        x, y, width: defaults.width, height: defaults.height,
        zIndex: newZ, minimized: false, maximized: false,
        savedX: x, savedY: y, savedW: defaults.width, savedH: defaults.height,
        props,
      }];
    });
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows(p => p.filter(w => w.id !== id));
    setFocusedId(p => (p === id ? null : p));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(p => p.map(w => w.id === id ? { ...w, minimized: true } : w));
    setFocusedId(null);
  }, []);

  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows(p => p.map(w => w.id === id ? { ...w, x, y } : w));
  }, []);

  const resizeWindow = useCallback((id: string, x: number, y: number, width: number, height: number) => {
    setWindows(p => p.map(w => {
      if (w.id !== id) return w;
      const min = APP_MIN[w.appId] ?? { width: 320, height: 240 };
      return {
        ...w,
        x, y,
        width:  Math.max(min.width,  width),
        height: Math.max(min.height, height),
      };
    }));
  }, []);

  const toggleMaximize = useCallback((id: string) => {
    setWindows(p => p.map(w => {
      if (w.id !== id) return w;
      if (w.maximized) {
        return { ...w, maximized: false, x: w.savedX, y: w.savedY, width: w.savedW, height: w.savedH };
      }
      const maxDef  = APP_MAX[w.appId] ?? { width: 900, height: 600 };
      const menuH   = 28;
      const dockH   = 90;
      const newW    = Math.min(maxDef.width,  window.innerWidth  - 60);
      const newH    = Math.min(maxDef.height, window.innerHeight - menuH - dockH - 40);
      const nx      = Math.round((window.innerWidth  - newW) / 2);
      const ny      = menuH + Math.round((window.innerHeight - menuH - dockH - newH) / 2);
      return {
        ...w, maximized: true,
        savedX: w.x, savedY: w.y, savedW: w.width, savedH: w.height,
        x: nx, y: ny, width: newW, height: newH,
        zIndex: ++zTop,
      };
    }));
    setFocusedId(id);
  }, []);

  return (
    <DesktopContext.Provider value={{
      windows, focusedId,
      openApp, closeWindow, minimizeWindow, focusWindow, moveWindow, resizeWindow, toggleMaximize,
      desktopFolders, syncDesktopFolders,
      trashedItems, trashEmptied, trashItem, emptyTrash,
    }}>
      {children}
    </DesktopContext.Provider>
  );
}
