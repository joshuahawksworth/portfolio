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
import { jobsData } from '../../data/experienceData';
import styles from './Desktop.module.css';

const APP_COMPONENTS: Record<string, React.ComponentType<{ props?: Record<string, unknown> }>> = {
  about: AboutApp, experience: ExperienceApp, skills: SkillsApp,
  contact: ContactApp, location: LocationApp, terminal: TerminalApp,
  finder: FinderApp, trash: TrashApp,
};

// ── Types ──────────────────────────────────────────────────────────────────
interface IconPos { x: number; y: number }

interface DesktopItem {
  id: string;
  type: 'job' | 'folder';
  label: string;
  jobId?: string;
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
const BOUNCE_MS = 1450; // matches 1400ms animation + 50ms buffer

// ── Helpers ────────────────────────────────────────────────────────────────
function makeDefaultItems(): DesktopItem[] {
  return jobsData.map(j => ({ id: j.id, type: 'job' as const, label: j.company, jobId: j.id }));
}

function initPositions(items: DesktopItem[]): Record<string, IconPos> {
  const startX = window.innerWidth - ICON_W - 20;
  const startY = 54;
  return Object.fromEntries(
    items.map((item, i) => [item.id, { x: startX, y: startY + i * (ICON_H + ICON_GAP) }])
  );
}

function computeCleanPositions(items: DesktopItem[], sortByName: boolean): Record<string, IconPos> {
  const sorted = sortByName ? [...items].sort((a, b) => a.label.localeCompare(b.label)) : [...items];
  const maxRows = Math.max(1, Math.floor((window.innerHeight - 110) / (ICON_H + ICON_GAP)));
  const startX = window.innerWidth - ICON_W - 20;
  const startY = 54;
  return Object.fromEntries(
    sorted.map((item, i) => [
      item.id,
      {
        x: startX - Math.floor(i / maxRows) * (ICON_W + ICON_GAP),
        y: startY + (i % maxRows) * (ICON_H + ICON_GAP),
      },
    ])
  );
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
  const { windows, openApp, syncDesktopFolders } = useDesktop();

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
  const [bouncingKey,   setBouncingKey]  = useState<string | null>(null);

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
    setBouncingKey(dockKey);
    setTimeout(() => {
      setBouncingKey(null);
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
    }
    function onUp() {
      multiDragRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
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
    setBouncingKey(key);
    setTimeout(() => { setBouncingKey(null); action(); }, BOUNCE_MS);
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
              selected  ? styles.iconSelected : '',
              cleaning  ? styles.iconCleaning  : '',
            ].join(' ')}
            style={{ left: pos.x, top: pos.y }}
            onMouseDown={e => { e.stopPropagation(); startDrag(e, item.id); }}
            onDoubleClick={() => {
              if (renaming) return;
              if (item.type === 'job' && item.jobId) {
                openWithBounce('experience', 'experience', { jobId: item.jobId, title: item.label });
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
              if (e.key === 'Enter'  && item.type === 'job' && item.jobId)
                openWithBounce('experience', 'experience', { jobId: item.jobId, title: item.label });
              if (e.key === 'F2')    startRename(item.id);
              if (e.key === 'Delete') deleteItem(item.id);
            }}
          >
            {item.type === 'folder' ? <FolderIcon /> :
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

      <Dock bouncingKey={bouncingKey} onItemActivate={handleDockActivate} />

      {/* Context menu */}
      {ctxMenu && (
        <div className={styles.ctxMenu} style={{ left: ctxX, top: ctxY }}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onContextMenu={e => e.preventDefault()}>
          {ctxTarget ? (
            <>
              {ctxTarget.type === 'job' && ctxTarget.jobId && (
                <>
                  <button className={styles.ctxItem} onClick={() => {
                    openWithBounce('experience', 'experience', { jobId: ctxTarget.jobId, title: ctxTarget.label });
                    setCtxMenu(null);
                  }}>Open</button>
                  <div className={styles.ctxDivider} />
                </>
              )}
              <button className={styles.ctxItem} onClick={() => startRename(ctxTarget.id)}>Rename</button>
              <button className={`${styles.ctxItem} ${styles.ctxDanger}`} onClick={() => deleteItem(ctxTarget.id)}>Delete</button>
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
