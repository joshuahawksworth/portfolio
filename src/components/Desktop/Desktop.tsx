import { useState, useRef, useEffect } from 'react';
import { DesktopProvider, useDesktop } from '../../context/DesktopContext';
import MenuBar from '../MenuBar/MenuBar';
import Dock from '../Dock/Dock';
import Window from '../Window/Window';
import AboutApp from '../apps/AboutApp';
import ExperienceApp from '../apps/ExperienceApp';
import SkillsApp from '../apps/SkillsApp';
import ContactApp from '../apps/ContactApp';
import LocationApp from '../apps/LocationApp';
import TerminalApp from '../apps/TerminalApp';
import FinderApp from '../apps/FinderApp';
import TrashApp from '../apps/TrashApp';
import SafariApp from '../apps/SafariApp';
import DoomApp from '../apps/DoomApp';
import SnakeApp from '../apps/SnakeApp';
import { jobsData } from '../../data/experienceData';
import styles from './Desktop.module.css';

const APP_COMPONENTS: Record<string, React.ComponentType<{ props?: Record<string, unknown> }>> = {
  about: AboutApp, experience: ExperienceApp, skills: SkillsApp,
  contact: ContactApp, location: LocationApp, terminal: TerminalApp,
  finder: FinderApp, trash: TrashApp, safari: SafariApp, githubapp: SafariApp,
  doom: DoomApp, snake: SnakeApp,
};

// ── Types ──────────────────────────────────────────────────────────────────
interface IconPos { x: number; y: number }

interface DesktopItem {
  id: string;
  type: 'job' | 'folder' | 'app';
  label: string;
  jobId?: string;
  appId?: string;
}

interface CtxMenu {
  x: number;
  y: number;
  targetId?: string;
}

// ── Wallpapers ─────────────────────────────────────────────────────────────
const WALLPAPERS = {
  space: [
    'radial-gradient(ellipse at 18% 25%, rgba(59,100,220,0.22) 0%, transparent 48%)',
    'radial-gradient(ellipse at 80% 70%, rgba(120,60,200,0.15) 0%, transparent 45%)',
    'radial-gradient(ellipse at 55% 5%, rgba(30,60,140,0.25) 0%, transparent 40%)',
    'radial-gradient(ellipse at 50% 100%, rgba(15,35,80,0.6) 0%, transparent 50%)',
    'linear-gradient(175deg, #06090f 0%, #08101e 20%, #0d1628 45%, #101c32 65%, #0c1520 80%, #06090f 100%)',
  ].join(', '),
  sunset: [
    'radial-gradient(ellipse at 30% 60%, rgba(220,80,20,0.45) 0%, transparent 55%)',
    'radial-gradient(ellipse at 70% 30%, rgba(180,40,100,0.35) 0%, transparent 50%)',
    'linear-gradient(175deg, #0a0408 0%, #1e0810 30%, #32100a 60%, #160a08 100%)',
  ].join(', '),
  ocean: [
    'radial-gradient(ellipse at 20% 40%, rgba(0,100,200,0.35) 0%, transparent 55%)',
    'radial-gradient(ellipse at 80% 20%, rgba(0,180,220,0.25) 0%, transparent 50%)',
    'linear-gradient(175deg, #020b12 0%, #061520 30%, #082030 60%, #040d18 100%)',
  ].join(', '),
  aurora: [
    'radial-gradient(ellipse at 40% 30%, rgba(0,200,100,0.28) 0%, transparent 50%)',
    'radial-gradient(ellipse at 70% 60%, rgba(100,0,200,0.22) 0%, transparent 45%)',
    'radial-gradient(ellipse at 20% 70%, rgba(0,150,180,0.22) 0%, transparent 50%)',
    'linear-gradient(175deg, #020812 0%, #050f18 30%, #040c14 60%, #030810 100%)',
  ].join(', '),
  midnight: [
    'radial-gradient(ellipse at 50% 50%, rgba(60,0,120,0.35) 0%, transparent 65%)',
    'linear-gradient(175deg, #050008 0%, #0a0015 50%, #050008 100%)',
  ].join(', '),
} as const;
type WallpaperKey = keyof typeof WALLPAPERS;

const WALLPAPER_LABELS: Record<WallpaperKey, string> = {
  space: 'Space', sunset: 'Sunset', ocean: 'Ocean', aurora: 'Aurora', midnight: 'Midnight',
};
const WALLPAPER_SWATCH: Record<WallpaperKey, string> = {
  space: '#0d1628', sunset: '#32100a', ocean: '#082030', aurora: '#040c14', midnight: '#0a0015',
};

// ── Constants ──────────────────────────────────────────────────────────────
const ICON_W  = 76;
const ICON_H  = 84;
const ICON_GAP = 8;
const BOUNCE_MS = 1850; // matches 1800ms animation + 50ms buffer

// ── Helpers ────────────────────────────────────────────────────────────────
const APP_SHORTCUTS: DesktopItem[] = [
  { id: 'shortcut-doom',  type: 'app', label: 'DOOM',  appId: 'doom'  },
  { id: 'shortcut-snake', type: 'app', label: 'Snake', appId: 'snake' },
];

function makeDefaultItems(): DesktopItem[] {
  return [
    ...APP_SHORTCUTS,
    ...jobsData.map(j => ({ id: j.id, type: 'job' as const, label: j.company, jobId: j.id })),
  ];
}

function initPositions(items: DesktopItem[]): Record<string, IconPos> {
  const rightX = window.innerWidth - ICON_W - 20;
  const startY = 54;
  const result: Record<string, IconPos> = {};
  let leftI = 0, rightI = 0;
  for (const item of items) {
    if (item.type === 'app') {
      result[item.id] = { x: 20, y: startY + leftI++ * (ICON_H + ICON_GAP) };
    } else {
      result[item.id] = { x: rightX, y: startY + rightI++ * (ICON_H + ICON_GAP) };
    }
  }
  return result;
}

function computeCleanPositions(items: DesktopItem[], sortByName: boolean): Record<string, IconPos> {
  const apps   = items.filter(i => i.type === 'app');
  const others = items.filter(i => i.type !== 'app');
  const sorted = sortByName ? [...others].sort((a, b) => a.label.localeCompare(b.label)) : [...others];
  const maxRows = Math.max(1, Math.floor((window.innerHeight - 110) / (ICON_H + ICON_GAP)));
  const startX = window.innerWidth - ICON_W - 20;
  const startY = 54;
  const result: Record<string, IconPos> = {};
  apps.forEach((item, i) => { result[item.id] = { x: 20, y: startY + i * (ICON_H + ICON_GAP) }; });
  sorted.forEach((item, i) => {
    result[item.id] = {
      x: startX - Math.floor(i / maxRows) * (ICON_W + ICON_GAP),
      y: startY + (i % maxRows) * (ICON_H + ICON_GAP),
    };
  });
  return result;
}

// ── Sub-components ─────────────────────────────────────────────────────────
function FolderIcon() {
  return (
    <svg viewBox="0 0 52 44" fill="none" width="48" height="48">
      <path d="M2 9Q2 5 6 5L20 5L24 9L47 9Q49 9 49 11L49 38Q49 40 47 40L5 40Q3 40 3 38Z"
        fill="#4a9eff" opacity="0.88"/>
      <path d="M2 9Q2 5 6 5L20 5L24 9L47 9Q49 9 49 11L49 14L2 14Z"
        fill="rgba(255,255,255,0.22)"/>
    </svg>
  );
}

function DoomIcon() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#060000"/>
      <text x="24" y="30" textAnchor="middle"
        fontFamily="Impact, Arial Black, sans-serif"
        fontSize="17" fontWeight="900" letterSpacing="2"
        fill="#cc1500"
        style={{ filter: 'drop-shadow(0 0 6px rgba(200,20,0,0.7))' }}>DOOM</text>
    </svg>
  );
}

function NokiaIcon() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Phone body */}
      <rect x="9" y="1" width="30" height="46" rx="7" fill="#1c2233"/>
      <rect x="10" y="2" width="28" height="44" rx="6" fill="#243044"/>
      {/* Top speaker grill */}
      <rect x="18" y="5" width="12" height="2" rx="1" fill="#161f2e"/>
      {/* Screen bezel */}
      <rect x="12" y="9" width="24" height="18" rx="2.5" fill="#0d0f0d"/>
      {/* LCD screen */}
      <rect x="13" y="10" width="22" height="16" rx="1.5" fill="#1c2c10"/>
      {/* Snake game pixels on screen */}
      {/* Snake head */}
      <rect x="22" y="12" width="3" height="3" fill="#4ddd4d"/>
      {/* Snake body */}
      <rect x="19" y="12" width="3" height="3" fill="#35bb35"/>
      <rect x="16" y="12" width="3" height="3" fill="#2aaa2a"/>
      <rect x="16" y="15" width="3" height="3" fill="#2aaa2a"/>
      <rect x="16" y="18" width="3" height="3" fill="#2aaa2a"/>
      <rect x="19" y="18" width="3" height="3" fill="#2aaa2a"/>
      <rect x="22" y="18" width="3" height="3" fill="#2aaa2a"/>
      {/* Food */}
      <rect x="30" y="13" width="2" height="2" fill="#88ff44"/>
      {/* Nokia logo text */}
      <text x="24" y="32" textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="4.5" fontWeight="700" letterSpacing="1.2"
        fill="#5a78a0">NOKIA</text>
      {/* Navigation key (oval d-pad) */}
      <ellipse cx="24" cy="37.5" rx="5.5" ry="3.5" fill="#1a2535"/>
      <circle cx="24" cy="37.5" r="2.5" fill="#141d28"/>
      <circle cx="24" cy="37.5" r="1.2" fill="#1e2a3a"/>
      {/* Left soft key */}
      <rect x="12" y="34" width="7" height="4" rx="2" fill="#1a2535"/>
      {/* Right soft key */}
      <rect x="29" y="34" width="7" height="4" rx="2" fill="#1a2535"/>
      {/* Number keys row 1 */}
      <rect x="12" y="40" width="6" height="3" rx="1.5" fill="#1a2535"/>
      <rect x="21" y="40" width="6" height="3" rx="1.5" fill="#1a2535"/>
      <rect x="30" y="40" width="6" height="3" rx="1.5" fill="#1a2535"/>
      {/* Number keys row 2 */}
      <rect x="12" y="44" width="6" height="2.5" rx="1.2" fill="#1a2535"/>
      <rect x="21" y="44" width="6" height="2.5" rx="1.2" fill="#1a2535"/>
      <rect x="30" y="44" width="6" height="2.5" rx="1.2" fill="#1a2535"/>
    </svg>
  );
}

function GetInfoModal({ target, onClose }: { target: 'desktop' | DesktopItem; onClose: () => void }) {
  const isDesktop = target === 'desktop';
  const name     = isDesktop ? 'Desktop' : (target as DesktopItem).label;
  const kind     = isDesktop ? 'Folder'  : (target as DesktopItem).type === 'folder' ? 'Folder' : 'Application';
  const jobInfo  = !isDesktop && (target as DesktopItem).jobId
    ? jobsData.find(j => j.id === (target as DesktopItem).jobId) : null;
  const ua       = navigator.userAgent;
  const browser  = /Firefox/.test(ua) ? 'Firefox' : /Edg\//.test(ua) ? 'Edge'
    : /Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari'
    : /Opera|OPR/.test(ua) ? 'Opera' : 'Unknown';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.getInfo} onClick={e => e.stopPropagation()}>
        <div className={styles.getInfoTitleBar}>
          <button className={styles.trafficClose} onClick={onClose} aria-label="Close" />
        </div>
        <div className={styles.getInfoHead}>
          {isDesktop || kind === 'Folder' ? (
            <svg viewBox="0 0 52 44" fill="none" width="48" height="40">
              <path d="M2 9Q2 5 6 5L20 5L24 9L47 9Q49 9 49 11L49 38Q49 40 47 40L5 40Q3 40 3 38Z" fill="#4a9eff" opacity="0.9"/>
              <path d="M2 9Q2 5 6 5L20 5L24 9L47 9Q49 9 49 11L49 14L2 14Z" fill="rgba(255,255,255,0.28)"/>
            </svg>
          ) : jobInfo?.logo ? (
            <img src={jobInfo.logo} alt={name}
              style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'contain',
                background: 'rgba(255,255,255,0.12)', padding: 4 }} />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: 10,
              background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, color: 'white' }}>{name[0]}</div>
          )}
          <div>
            <div className={styles.getInfoName}>{name}</div>
            <div className={styles.getInfoMeta}>{kind}</div>
          </div>
        </div>
        <div className={styles.getInfoSection}>
          <div className={styles.getInfoSectionTitle}>▾ General:</div>
          <table className={styles.getInfoTable}><tbody>
            <tr><td>Kind:</td><td>{kind}</td></tr>
            <tr><td>Where:</td><td>~/Desktop</td></tr>
            {isDesktop ? (
              <>
                <tr><td>Browser:</td><td>{browser}</td></tr>
                <tr><td>Screen:</td><td>{window.screen.width} × {window.screen.height}</td></tr>
                <tr><td>Built with:</td><td>React 19 + TypeScript</td></tr>
                <tr><td>Bundler:</td><td>Vite</td></tr>
              </>
            ) : jobInfo ? (
              <>
                <tr><td>Role:</td><td>{jobInfo.role}</td></tr>
                <tr><td>Period:</td><td>{jobInfo.period}</td></tr>
              </>
            ) : null}
          </tbody></table>
        </div>
        {isDesktop && (
          <div className={styles.getInfoSection}>
            <div className={styles.getInfoSectionTitle}>▾ More Info:</div>
            <p className={styles.getInfoBody}>Joshua Hawksworth's portfolio — frontend developer specialising in React &amp; TypeScript.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function WallpaperPicker({ current, onChange, onClose }: {
  current: WallpaperKey; onChange: (k: WallpaperKey) => void; onClose: () => void;
}) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.wallpaperPicker} onClick={e => e.stopPropagation()}>
        <div className={styles.wallpaperTitle}>Change Background</div>
        <div className={styles.wallpaperSwatches}>
          {(Object.keys(WALLPAPERS) as WallpaperKey[]).map(key => (
            <button key={key}
              className={`${styles.wallpaperSwatch} ${current === key ? styles.wallpaperActive : ''}`}
              style={{ background: WALLPAPER_SWATCH[key] }}
              onClick={() => { onChange(key); onClose(); }}>
              {WALLPAPER_LABELS[key]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── DesktopSurface ─────────────────────────────────────────────────────────
function DesktopSurface() {
  const { windows, openApp, syncDesktopFolders, trashItem } = useDesktop();

  const [items,         setItems]        = useState<DesktopItem[]>(makeDefaultItems);
  const [iconPos,       setIconPos]      = useState<Record<string, IconPos>>(() => initPositions(makeDefaultItems()));
  const [selectedIcons, setSelectedIcons]= useState<Set<string>>(new Set());
  const [selRect,       setSelRect]      = useState<{ x1:number; y1:number; x2:number; y2:number } | null>(null);
  const [ctxMenu,       setCtxMenu]      = useState<CtxMenu | null>(null);
  const [renamingId,    setRenamingId]   = useState<string | null>(null);
  const [renameVal,     setRenameVal]    = useState('');
  const [getInfoTarget, setGetInfoTarget]= useState<'desktop' | DesktopItem | null>(null);
  const [showWallpaper, setShowWallpaper]= useState(false);
  const [wallpaper,     setWallpaper]    = useState<WallpaperKey>('space');
  const [cleaning,      setCleaning]     = useState(false);
  const [bouncingKeys,  setBouncingKeys] = useState<Set<string>>(new Set());
  const [nearTrash,     setNearTrash]    = useState(false);
  const [draggingIds,   setDraggingIds]  = useState<Set<string>>(new Set());

  // Refs for always-fresh state inside event handler closures
  const selectedIconsRef = useRef<Set<string>>(new Set());
  const iconPosRef       = useRef<Record<string, IconPos>>({});
  const multiDragRef     = useRef<{ ids:string[]; sx:number; sy:number; origins:Record<string,IconPos> } | null>(null);
  const renameRef        = useRef<HTMLInputElement>(null);

  useEffect(() => { selectedIconsRef.current = selectedIcons; }, [selectedIcons]);
  useEffect(() => { iconPosRef.current = iconPos; }, [iconPos]);

  // Keep icons in viewport on resize
  useEffect(() => {
    function onResize() {
      setIconPos(prev => {
        const next = { ...prev };
        for (const id in next) {
          next[id] = {
            x: Math.min(next[id].x, window.innerWidth  - ICON_W  - 4),
            y: Math.min(next[id].y, window.innerHeight - ICON_H - 4),
          };
        }
        return next;
      });
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (renamingId) { renameRef.current?.focus(); renameRef.current?.select(); }
  }, [renamingId]);

  // Keep Finder in sync with desktop folder list
  useEffect(() => {
    syncDesktopFolders(
      items.filter(i => i.type === 'folder').map(i => ({ id: i.id, label: i.label }))
    );
  }, [items, syncDesktopFolders]);

  // ── Open with bounce animation (delay window until bounce done) ────────
  function openWithBounce(dockKey: string, appId: string, props?: Record<string, unknown>) {
    setBouncingKeys(prev => new Set([...prev, dockKey]));
    setTimeout(() => {
      setBouncingKeys(prev => { const n = new Set(prev); n.delete(dockKey); return n; });
      openApp(appId, props);
    }, BOUNCE_MS);
  }

  // ── Rubber-band selection ──────────────────────────────────────────────
  function onDesktopMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    if (e.button !== 0) return;
    // Commit rename BEFORE preventDefault — otherwise preventDefault suppresses
    // the input's blur event and the rename never finishes.
    if (renamingId) commitRename();
    e.preventDefault();
    setCtxMenu(null);
    // Clear selection immediately on bare-desktop mousedown
    setSelectedIcons(new Set());

    const x1 = e.clientX, y1 = e.clientY;
    const snap = { ...iconPosRef.current }; // fresh snapshot via ref

    setSelRect({ x1, y1, x2: x1, y2: y1 });

    function onMove(ev: MouseEvent) {
      const r = { x1, y1, x2: ev.clientX, y2: ev.clientY };
      setSelRect(r);
      const minX = Math.min(r.x1, r.x2), maxX = Math.max(r.x1, r.x2);
      const minY = Math.min(r.y1, r.y2), maxY = Math.max(r.y1, r.y2);
      const hit = new Set<string>();
      for (const [id, p] of Object.entries(snap)) {
        if (p.x < maxX && p.x + ICON_W > minX && p.y < maxY && p.y + ICON_H > minY) hit.add(id);
      }
      setSelectedIcons(hit);
    }
    function onUp() {
      setSelRect(null);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }

  // ── Icon drag — reads refs so selection is always fresh ───────────────
  function startDrag(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu(null);

    const current = selectedIconsRef.current;
    const dragIds = current.has(id) ? Array.from(current) : [id];
    if (!current.has(id)) setSelectedIcons(new Set([id]));

    const fresh   = iconPosRef.current;
    const origins: Record<string, IconPos> = {};
    for (const did of dragIds) origins[did] = { ...(fresh[did] ?? { x: 0, y: 0 }) };
    multiDragRef.current = { ids: dragIds, sx: e.clientX, sy: e.clientY, origins };
    setDraggingIds(new Set(dragIds));

    // Only folder items can be dragged to trash
    const isDraggingFolder = dragIds.some(did => items.find(i => i.id === did)?.type === 'folder');

    function isInTrashZone(x: number, y: number) {
      // Trash is second-to-last item in dock. Dock width ≈ 648px, trash at center+283px from left.
      const trashX = window.innerWidth / 2 + 283;
      const trashY = window.innerHeight - 55;
      return Math.abs(x - trashX) < 44 && Math.abs(y - trashY) < 50;
    }

    function onMove(ev: MouseEvent) {
      if (!multiDragRef.current) return;
      const { ids, sx, sy, origins } = multiDragRef.current;
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      setIconPos(prev => {
        const next = { ...prev };
        for (const did of ids) {
          next[did] = { x: Math.max(0, origins[did].x + dx), y: Math.max(44, origins[did].y + dy) };
        }
        return next;
      });
      if (isDraggingFolder) {
        const firstPos = iconPosRef.current[dragIds[0]];
        if (firstPos) setNearTrash(isInTrashZone(firstPos.x + 38, firstPos.y + 42));
      }
    }
    function onUp() {
      setNearTrash(false);
      setDraggingIds(new Set());
      multiDragRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      if (!isDraggingFolder) return;
      const freshPos = iconPosRef.current;
      for (const did of dragIds) {
        const p = freshPos[did];
        if (p && isInTrashZone(p.x + 38, p.y + 42)) {
          const item = items.find(i => i.id === did);
          if (item && item.type === 'folder') {
            trashItem({ id: did, name: item.label, date: new Date().toLocaleDateString('en-GB') });
            setItems(prev => prev.filter(i => i.id !== did));
            setIconPos(prev => { const n = { ...prev }; delete n[did]; return n; });
            setSelectedIcons(new Set());
          }
        }
      }
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }

  // ── Context menu ──────────────────────────────────────────────────────
  function onDesktopCtx(e: React.MouseEvent) {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }
  function onIconCtx(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedIconsRef.current.has(id)) setSelectedIcons(new Set([id]));
    setCtxMenu({ x: e.clientX, y: e.clientY, targetId: id });
  }

  // ── Folder ────────────────────────────────────────────────────────────
  function newFolder() {
    const id  = `folder-${Date.now()}`;
    const pos = ctxMenu
      ? { x: Math.max(0, ctxMenu.x - ICON_W / 2), y: Math.max(48, ctxMenu.y - 20) }
      : { x: Math.round(window.innerWidth / 2), y: Math.round(window.innerHeight / 2) };
    setItems(prev  => [...prev, { id, type: 'folder', label: 'untitled folder' }]);
    setIconPos(prev => ({ ...prev, [id]: pos }));
    setCtxMenu(null);
    setRenameVal('untitled folder');
    setRenamingId(id);
  }

  // ── Rename / delete ───────────────────────────────────────────────────
  function startRename(id: string) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    setRenameVal(item.label);
    setRenamingId(id);
    setCtxMenu(null);
  }
  function commitRename() {
    if (!renamingId) return;
    const v = renameVal.trim();
    if (v) setItems(prev => prev.map(i => i.id === renamingId ? { ...i, label: v } : i));
    setRenamingId(null);
  }
  function deleteItem(id: string) {
    setItems(prev    => prev.filter(i => i.id !== id));
    setIconPos(prev  => { const n = { ...prev }; delete n[id]; return n; });
    setSelectedIcons(prev => { const n = new Set(prev); n.delete(id); return n; });
    setCtxMenu(null);
  }

  // ── Clean up with animation ───────────────────────────────────────────
  function cleanUp(byName = false) {
    setCleaning(true);
    setIconPos(computeCleanPositions(items, byName));
    setCtxMenu(null);
    setTimeout(() => setCleaning(false), 520);
  }

  // ── Dock item activate (bounce + delayed open) ────────────────────────
  function handleDockActivate(key: string, action: () => void) {
    if (key === 'finder' || key === 'trash' || key === 'github' || key === 'cv') { action(); return; }
    // Skip bounce animation if app is already open
    const alreadyOpen = windows.some(w => w.appId === key && !w.minimized);
    if (alreadyOpen) { action(); return; }
    setBouncingKeys(prev => new Set([...prev, key]));
    setTimeout(() => { setBouncingKeys(prev => { const n = new Set(prev); n.delete(key); return n; }); action(); }, BOUNCE_MS);
  }

  // ── Render ────────────────────────────────────────────────────────────
  const ctxTarget = ctxMenu?.targetId ? items.find(i => i.id === ctxMenu.targetId) : null;
  const ctxX      = ctxMenu ? Math.min(ctxMenu.x, window.innerWidth  - 210) : 0;
  const ctxY      = ctxMenu ? Math.min(ctxMenu.y, window.innerHeight - (ctxTarget ? 180 : 260)) : 0;

  return (
    <div
      className={styles.desktop}
      style={{ background: WALLPAPERS[wallpaper] }}
      onMouseDown={onDesktopMouseDown}
      onContextMenu={onDesktopCtx}
      onClick={() => { if (renamingId) commitRename(); setCtxMenu(null); }}
    >
      <MenuBar />

      {/* Rubber-band rect */}
      {selRect && (() => {
        const x = Math.min(selRect.x1, selRect.x2), y = Math.min(selRect.y1, selRect.y2);
        const w = Math.abs(selRect.x2 - selRect.x1), h = Math.abs(selRect.y2 - selRect.y1);
        return <div className={styles.selRect} style={{ left: x, top: y, width: w, height: h }} />;
      })()}

      {/* Desktop icons */}
      {items.map((item, i) => {
        const pos      = iconPos[item.id] ?? { x: window.innerWidth - 96, y: 54 + i * 92 };
        const selected = selectedIcons.has(item.id);
        const renaming = renamingId === item.id;
        const job      = item.jobId ? jobsData.find(j => j.id === item.jobId) : null;

        return (
          <div
            key={item.id}
            className={[
              styles.icon,
              selected             ? styles.iconSelected  : '',
              cleaning             ? styles.iconCleaning  : '',
              draggingIds.has(item.id) ? styles.iconDragging : '',
            ].join(' ')}
            style={{ left: pos.x, top: pos.y }}
            onMouseDown={e => { e.stopPropagation(); startDrag(e, item.id); }}
            onDoubleClick={() => {
              if (renaming) return;
              if (item.type === 'app' && item.appId) {
                openWithBounce(item.appId, item.appId);
              } else if (item.type === 'job' && item.jobId) {
                openWithBounce('experience', 'experience', { jobId: item.jobId, title: item.label });
              } else if (item.type === 'folder') {
                openWithBounce('finder', 'finder', { folderId: item.id, folderName: item.label });
              }
            }}
            onClick={e => {
              e.stopPropagation();
              if (e.shiftKey) {
                // Shift+click toggles individual icon in selection
                setSelectedIcons(prev => {
                  const n = new Set(prev);
                  n.has(item.id) ? n.delete(item.id) : n.add(item.id);
                  return n;
                });
              } else if (!selectedIconsRef.current.has(item.id)) {
                // Only change selection when clicking an UNSELECTED icon
                // (clicking a selected icon keeps multi-selection for drag)
                setSelectedIcons(new Set([item.id]));
              }
            }}
            onContextMenu={e => onIconCtx(e, item.id)}
            role="button"
            tabIndex={0}
            aria-label={item.label}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (item.type === 'app' && item.appId)
                  openWithBounce(item.appId, item.appId);
                else if (item.type === 'job' && item.jobId)
                  openWithBounce('experience', 'experience', { jobId: item.jobId, title: item.label });
                else if (item.type === 'folder')
                  openWithBounce('finder', 'finder', { folderId: item.id, folderName: item.label });
              }
              if (item.type !== 'app') {
                if (e.key === 'F2')     startRename(item.id);
                if (e.key === 'Delete') deleteItem(item.id);
              }
            }}
          >
            {item.type === 'app' && item.appId === 'doom' ? <DoomIcon /> :
             item.type === 'app' && item.appId === 'snake' ? <NokiaIcon /> :
             item.type === 'folder' ? <FolderIcon /> :
             job?.logo ? <img src={job.logo} alt={item.label} className={styles.iconImg} /> :
             <div className={styles.iconFallback}>{item.label[0]}</div>}

            {renaming ? (
              <input ref={renameRef} className={styles.renameInput}
                value={renameVal}
                onChange={e => setRenameVal(e.target.value)}
                onBlur={commitRename}
                onKeyDown={e => {
                  if (e.key === 'Enter')  commitRename();
                  if (e.key === 'Escape') setRenamingId(null);
                  e.stopPropagation();
                }}
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
              />
            ) : (
              <span className={styles.iconLabel}
                onDoubleClick={e => { e.stopPropagation(); startRename(item.id); }}>
                {item.label}
              </span>
            )}
          </div>
        );
      })}

      {/* Open windows */}
      {windows.map(win => {
        const Comp = APP_COMPONENTS[win.appId];
        if (!Comp) return null;
        return <Window key={win.id} win={win}><Comp props={win.props} /></Window>;
      })}

      <Dock bouncingKeys={bouncingKeys} onItemActivate={handleDockActivate} trashHighlighted={nearTrash} />

      {/* Context menu */}
      {ctxMenu && (
        <div className={styles.ctxMenu} style={{ left: ctxX, top: ctxY }}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onContextMenu={e => e.preventDefault()}>
          {ctxTarget ? (
            <>
              {ctxTarget.type === 'app' && ctxTarget.appId && (
                <>
                  <button className={styles.ctxItem} onClick={() => {
                    openWithBounce(ctxTarget.appId!, ctxTarget.appId!);
                    setCtxMenu(null);
                  }}>Open</button>
                  <div className={styles.ctxDivider} />
                </>
              )}
              {ctxTarget.type === 'job' && ctxTarget.jobId && (
                <>
                  <button className={styles.ctxItem} onClick={() => {
                    openWithBounce('experience', 'experience', { jobId: ctxTarget.jobId, title: ctxTarget.label });
                    setCtxMenu(null);
                  }}>Open</button>
                  <div className={styles.ctxDivider} />
                </>
              )}
              {ctxTarget.type !== 'app' && (
                <button className={styles.ctxItem} onClick={() => startRename(ctxTarget.id)}>Rename</button>
              )}
              {ctxTarget.type === 'folder' && (
                <button className={`${styles.ctxItem} ${styles.ctxDanger}`} onClick={() => deleteItem(ctxTarget.id)}>Delete</button>
              )}
              <div className={styles.ctxDivider} />
              <button className={styles.ctxItem} onClick={() => { setGetInfoTarget(ctxTarget); setCtxMenu(null); }}>Get Info</button>
            </>
          ) : (
            <>
              <button className={styles.ctxItem} onClick={newFolder}>New Folder</button>
              <div className={styles.ctxDivider} />
              <button className={styles.ctxItem} onClick={() => { setGetInfoTarget('desktop'); setCtxMenu(null); }}>Get Info</button>
              <button className={styles.ctxItem} onClick={() => { setShowWallpaper(true); setCtxMenu(null); }}>Change Background…</button>
              <div className={styles.ctxDivider} />
              <button className={styles.ctxItem} onClick={() => cleanUp(false)}>Clean Up</button>
              <button className={styles.ctxItem} onClick={() => cleanUp(true)}>Clean Up By Name</button>
            </>
          )}
        </div>
      )}

      {getInfoTarget && <GetInfoModal target={getInfoTarget} onClose={() => setGetInfoTarget(null)} />}
      {showWallpaper  && <WallpaperPicker current={wallpaper} onChange={setWallpaper} onClose={() => setShowWallpaper(false)} />}
    </div>
  );
}

export default function Desktop() {
  return (
    <DesktopProvider>
      <DesktopSurface />
    </DesktopProvider>
  );
}
