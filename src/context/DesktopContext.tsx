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
  doom:       { title: 'DOOM',             width: 800,  height: 640 },
  snake:      { title: 'Snake',            width: 480,  height: 560 },
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
  doom:       { width: 540, height: 460 },
  snake:      { width: 380, height: 440 },
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
  doom:       { width: 1060, height: 760 },
  snake:      { width: 640,  height: 680 },
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

export interface TrashedItem { id: string; name: string; date: string; isJoke?: boolean; content?: string }

// Joke items live in context so restoreItem() can find and remove them
const JOKE_TRASH: TrashedItem[] = [
  { id: 'joke-jquery', name: 'jQuery.js', date: '2019', isJoke: true,
    content: `// jQuery v1.11.3 — "Because we had no choice"\n(function( global, factory ) {\n  if ( typeof module === 'object' ) {\n    module.exports = factory( global );\n  } else {\n    factory( global );\n  }\n}(window, function( window ) {\n  // TODO: migrate to vanilla JS... next sprint, promise\n  console.log('jQuery loaded. I am so sorry.');\n}));` },
  { id: 'joke-confusion', name: 'var let const confusion.txt', date: '2020', isJoke: true,
    content: `My notes on JavaScript variable declarations:\n\nvar   - hoisted, function-scoped, can be redeclared. Why? ¯\\_(ツ)_/¯\nlet   - block-scoped, temporal dead zone. OK actually fine.\nconst - block-scoped, immutable binding (not the value!). Use this.\n\nTODO: stop using var\nStatus: still using var in production (2020)\nStatus: still using var in production (2021)\nStatus: stopped, had a stern talk with myself` },
  { id: 'joke-index', name: 'index2_FINAL_v3.html', date: '2021', isJoke: true,
    content: `<!DOCTYPE html>\n<html>\n<head>\n  <title>My Portfolio (FINAL - this is the real one)</title>\n  <!-- index.html was the draft -->\n  <!-- index_v2.html was the "good" draft -->\n  <!-- this one is FINAL. Do NOT edit. -->\n  <!-- note: edited 47 times since calling it FINAL -->\n</head>\n<body>\n  <h1>Hi, I am a developer</h1>\n  <!-- TODO: say something more interesting -->\n</body>\n</html>` },
  { id: 'joke-console', name: 'console.log("here").js', date: '2022', isJoke: true,
    content: `// Debug session: 3 hours, 47 minutes\n// Root cause: off-by-one error in line 12\n\nconsole.log("here");\nconsole.log("here 2");\nconsole.log("HERE");\nconsole.log("HERE??");\nconsole.log("why");\nconsole.log(data);\n// spoiler: it was not the API\nconsole.log(typeof undefined); // "undefined" ← found it` },
  { id: 'joke-spaghetti', name: 'spaghetti-code.ts', date: '2023', isJoke: true,
    content: `// Written at 2am before a deadline\n// Do not touch. It works. Nobody knows why.\n\nexport function doTheThing(x: any, y?: any, z?: any) {\n  if (x) {\n    if (y) {\n      if (z) { return x + y + z; // trust me\n      } else { return x + y; }\n    } else {\n      if (z) { return x + z; }\n    }\n  } else {\n    if (y && z) { return y + z || x || 0; // don't ask\n    }\n  }\n  return null; // :)\n}` },
  { id: 'joke-todo', name: 'TODO_do_this_later.md', date: '2024', isJoke: true,
    content: `# TODO: Do This Later\n\nCreated: January 2024\n\n## High Priority\n- [ ] Refactor auth module\n- [ ] Write tests (lol)\n- [ ] Update dependencies\n\n## Medium Priority\n- [ ] Do the thing from last sprint\n- [ ] Reply to that Slack message\n\n## Low Priority (realistically: never)\n- [ ] Document everything\n- [ ] Remove all console.logs\n- [ ] Actually learn Docker properly\n\n---\n*Est. completion: Q3 2024*\n*Actual completion: ¯\\_(ツ)_/¯*` },
];

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
  restoreItem: (id: string) => void;
  restoredItemQueue: TrashedItem[];
  ackRestoredItem: (id: string) => void;
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
  const [trashedItems,      setTrashedItems]      = useState<TrashedItem[]>(JOKE_TRASH);
  const [trashEmptied,     setTrashEmptied]     = useState(false);
  const [restoredItemQueue, setRestoredItemQueue] = useState<TrashedItem[]>([]);

  const trashItem  = useCallback((item: TrashedItem) => {
    setTrashedItems(p => [...p, item]);
    setTrashEmptied(false);
  }, []);
  const emptyTrash = useCallback(() => {
    setTrashedItems([]);
    setTrashEmptied(true);
  }, []);
  const restoreItem = useCallback((id: string) => {
    setTrashedItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item) setRestoredItemQueue(q => [...q, item]);
      return prev.filter(i => i.id !== id);
    });
  }, []);
  const ackRestoredItem = useCallback((id: string) => {
    setRestoredItemQueue(prev => prev.filter(i => i.id !== id));
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
      restoreItem, restoredItemQueue, ackRestoredItem,
    }}>
      {children}
    </DesktopContext.Provider>
  );
}
