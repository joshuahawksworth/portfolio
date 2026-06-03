import { useState, useRef } from 'react';
import {
  LiquidCanvas, GlassContainer, Glass, Html,
  Frame, ZStack, Transform,
} from '@liquid-dom/react';
import { DesktopProvider, useDesktop, WindowInstance } from '../../context/DesktopContext';
import { useTime } from '../../hooks/useTime';
import AboutApp from '../apps/AboutApp';
import ExperienceApp from '../apps/ExperienceApp';
import SkillsApp from '../apps/SkillsApp';
import ContactApp from '../apps/ContactApp';
import LocationApp from '../apps/LocationApp';
import TerminalApp from '../apps/TerminalApp';
import FinderApp from '../apps/FinderApp';
import TrashApp from '../apps/TrashApp';
import { AboutLogoIcon } from '../icons/AboutLogoIcon';
import styles from './LiquidDesktop.module.css';

const APP_COMPONENTS: Record<string, React.ComponentType<{ props?: Record<string, unknown> }>> = {
  about: AboutApp, experience: ExperienceApp, skills: SkillsApp,
  contact: ContactApp, location: LocationApp, terminal: TerminalApp,
  finder: FinderApp, trash: TrashApp,
};

const WALLPAPERS: Record<string, string> = {
  space: [
    'radial-gradient(ellipse at 18% 25%, rgba(59,100,220,0.22) 0%, transparent 48%)',
    'radial-gradient(ellipse at 80% 70%, rgba(120,60,200,0.15) 0%, transparent 45%)',
    'linear-gradient(175deg, #06090f 0%, #0d1628 50%, #06090f 100%)',
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
    'linear-gradient(175deg, #020812 0%, #050f18 30%, #040c14 60%, #030810 100%)',
  ].join(', '),
  midnight: [
    'radial-gradient(ellipse at 50% 50%, rgba(60,0,120,0.35) 0%, transparent 65%)',
    'linear-gradient(175deg, #050008 0%, #0a0015 50%, #050008 100%)',
  ].join(', '),
};
const WALLPAPER_SWATCH: Record<string, string> = {
  space: '#0d1628', sunset: '#32100a', ocean: '#082030', aurora: '#040c14', midnight: '#0a0015',
};

// ── Dock icon SVGs ────────────────────────────────────────────────────────────
let _gid = 0;
function MacIcon({ top, bottom, children }: { top: string; bottom: string; children?: React.ReactNode }) {
  const id = useRef(`lg${++_gid}`).current;
  return (
    <svg viewBox="0 0 44 44" fill="none" width="44" height="44">
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor={top} /><stop offset="1" stopColor={bottom} />
        </linearGradient>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0.22)" /><stop offset="1" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <rect width="44" height="44" rx="11" fill={`url(#${id}g)`} />
      <rect width="44" height="20" rx="11" fill={`url(#${id}l)`} />
      {children}
    </svg>
  );
}

const DOCK_ICONS: Record<string, React.ReactNode> = {
  finder: <MacIcon top="#5ecfff" bottom="#1a7aff"><ellipse cx="22" cy="21" rx="11" ry="10" fill="white" opacity="0.95"/><circle cx="17" cy="19" r="2.2" fill="#1a7aff"/><circle cx="27" cy="19" r="2.2" fill="#1a7aff"/><circle cx="17.8" cy="18.3" r="0.8" fill="white"/><circle cx="27.8" cy="18.3" r="0.8" fill="white"/><path d="M16 24 Q22 29 28 24" stroke="#1a7aff" strokeWidth="1.6" strokeLinecap="round" fill="none"/></MacIcon>,
  github: <svg viewBox="0 0 44 44" width="44" height="44" fill="none"><rect width="44" height="44" rx="11" fill="#1b1f24"/><rect width="44" height="20" rx="11" fill="rgba(255,255,255,0.07)"/><g transform="translate(6,6) scale(1.333)"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="white" opacity="0.92"/></g></svg>,
  about: <AboutLogoIcon size={44} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.35)' }} />,
  experience: <MacIcon top="#ffa030" bottom="#c25c00"><rect x="8" y="17" width="28" height="18" rx="3" fill="rgba(255,255,255,0.92)"/><path d="M16 17v-3a2 2 0 012-2h8a2 2 0 012 2v3" stroke="rgba(255,255,255,0.92)" strokeWidth="2" fill="none"/><rect x="18.5" y="23" width="7" height="4" rx="1.5" fill="#c25c00"/></MacIcon>,
  skills: <MacIcon top="#d070ff" bottom="#7928ca"><path d="M16 16L9 22L16 28" stroke="rgba(255,255,255,0.9)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M28 16L35 22L28 28" stroke="rgba(255,255,255,0.9)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M25 14L19 30" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round"/></MacIcon>,
  contact: <MacIcon top="#3a9fff" bottom="#0060df"><rect x="7" y="12" width="30" height="21" rx="3.5" fill="rgba(255,255,255,0.92)"/><path d="M7 15L22 24L37 15" stroke="#0060df" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></MacIcon>,
  location: <MacIcon top="#34d870" bottom="#1a8f3f"><path d="M22 8 Q31 11 31 18 Q31 27 22 36 Q13 27 13 18 Q13 11 22 8Z" fill="rgba(255,255,255,0.92)"/><circle cx="22" cy="18" r="4" fill="#1a8f3f"/><circle cx="22" cy="18" r="1.8" fill="white"/></MacIcon>,
  terminal: <MacIcon top="#3a3a3c" bottom="#1c1c1e"><path d="M10 22L17 16L10 22L17 28" stroke="#30d158" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M20 28H34" stroke="#30d158" strokeWidth="2.2" strokeLinecap="round"/></MacIcon>,
  cv: <MacIcon top="#ff5257" bottom="#c0292e"><rect x="10" y="6" width="24" height="32" rx="3" fill="rgba(255,255,255,0.92)"/><path d="M14 18H30M14 22H30M14 26H23" stroke="#c0292e" strokeWidth="1.5" strokeLinecap="round"/></MacIcon>,
  trash: <MacIcon top="#aeaeb2" bottom="#6c6c70"><path d="M11 14H33M20 10H24M13 14L15 36H29L31 14" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M19 19V31M22 19V31M25 19V31" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3" strokeLinecap="round"/></MacIcon>,
};

const DOCK_LABELS: Record<string, string> = {
  github: 'GitHub', about: 'About', experience: 'Experience', skills: 'Skills',
  contact: 'Contact', location: 'Location', terminal: 'Terminal', cv: 'CV',
  finder: 'Finder', trash: 'Trash',
};
const DOCK_ORDER = ['github', 'about', 'experience', 'skills', 'contact', 'location', 'terminal', 'cv'];

// ── DockItem (module-level so it doesn't recreate on each render) ─────────────
interface DockItemProps {
  dkey: string;
  hoveredKey: string | null;
  hasOpen: (k: string) => boolean;
  onHover: (k: string | null) => void;
  onAction: (k: string) => void;
}

function DockItemEl({ dkey, hoveredKey, hasOpen, onHover, onAction }: DockItemProps) {
  const isHovered = hoveredKey === dkey;
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', paddingBottom: 7 }}
      onMouseEnter={() => onHover(dkey)}
      onMouseLeave={() => onHover(null)}
    >
      <div style={{
        position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
        transform: `translateX(-50%) translateY(${isHovered ? 0 : 4}px)`,
        fontSize: 12, color: 'rgba(255,255,255,0.95)', whiteSpace: 'nowrap',
        background: 'rgba(20,20,30,0.9)', padding: '4px 10px', borderRadius: 7,
        border: '1px solid rgba(255,255,255,0.1)',
        opacity: isHovered ? 1 : 0, pointerEvents: 'none',
        transition: 'opacity 130ms ease, transform 130ms ease',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', zIndex: 10,
      }}>{DOCK_LABELS[dkey]}</div>
      <button
        onClick={() => onAction(dkey)}
        style={{
          width: 54, height: 54, background: 'none', border: 'none', padding: 0,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 14,
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
          transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.5))',
        }}
        aria-label={DOCK_LABELS[dkey]}
      >{DOCK_ICONS[dkey]}</button>
      {hasOpen(dkey) && (
        <span style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.8)',
        }} />
      )}
    </div>
  );
}

// ── LiquidMenuBarInner ────────────────────────────────────────────────────────
function LiquidMenuBarInner() {
  const { windows, focusedId } = useDesktop();
  const time = useTime();
  const appName = windows.find(w => w.id === focusedId)?.title ?? 'Finder';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: '100%', padding: '0 14px', color: 'rgba(255,255,255,0.9)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 15 }}>&#63743;</span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{appName}</span>
        {['File', 'View', 'Window', 'Help'].map(m => (
          <span key={m} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', cursor: 'default' }}>{m}</span>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="rgba(255,255,255,0.82)">
          <path d="M8 12a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/>
          <path d="M4.5 9.5a4.9 4.9 0 017 0l-1.1 1.1a3.4 3.4 0 00-4.8 0L4.5 9.5z"/>
          <path d="M1.5 6.5a8.5 8.5 0 0113 0L13.4 7.6a7 7 0 00-10.8 0L1.5 6.5z"/>
        </svg>
        <svg width="22" height="12" viewBox="0 0 22 12" fill="none" stroke="rgba(255,255,255,0.82)" strokeWidth="1.2">
          <rect x="0.5" y="0.5" width="18" height="11" rx="2.5"/>
          <rect x="2" y="2" width="14" height="8" rx="1.5" fill="rgba(255,255,255,0.82)" stroke="none"/>
          <path d="M19.5 4v4" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', whiteSpace: 'nowrap' }}>
          {time.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}{' '}
          {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

// ── LiquidDockInner ───────────────────────────────────────────────────────────
function LiquidDockInner({ wallpaper, onWallpaperChange }: { wallpaper: string; onWallpaperChange: (w: string) => void }) {
  const { openApp, windows } = useDesktop();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  function hasOpen(key: string) { return windows.some(w => w.appId === key && !w.minimized); }

  function handleAction(key: string) {
    if (key === 'github') { window.open('https://github.com/joshuahawksworth', '_blank'); return; }
    if (key === 'cv') { window.open('/JoshuaHawksworthCV.pdf', '_blank'); return; }
    openApp(key);
  }

  const Sep = () => <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.2)', margin: '0 3px', alignSelf: 'center' }} />;

  return (
    <div style={{ position: 'relative' }}>
      {showPicker && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 12px)', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(20,22,32,0.96)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
          padding: '10px 14px', display: 'flex', gap: 10, zIndex: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}>
          {Object.entries(WALLPAPER_SWATCH).map(([key, color]) => (
            <button key={key} onClick={() => { onWallpaperChange(key); setShowPicker(false); }}
              style={{ width: 28, height: 28, borderRadius: '50%', background: color, cursor: 'pointer', padding: 0,
                border: wallpaper === key ? '2px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.2)' }}
              aria-label={key} />
          ))}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, padding: '10px 14px 12px' }}>
        <DockItemEl dkey="finder" hoveredKey={hoveredKey} hasOpen={hasOpen} onHover={setHoveredKey} onAction={handleAction} />
        <Sep />
        {DOCK_ORDER.map(k => (
          <DockItemEl key={k} dkey={k} hoveredKey={hoveredKey} hasOpen={hasOpen} onHover={setHoveredKey} onAction={handleAction} />
        ))}
        <Sep />
        <DockItemEl dkey="trash" hoveredKey={hoveredKey} hasOpen={hasOpen} onHover={setHoveredKey} onAction={handleAction} />
        <Sep />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', paddingBottom: 7 }}
          onMouseEnter={() => setHoveredKey('wallpaper')} onMouseLeave={() => setHoveredKey(null)}>
          <div style={{
            position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
            transform: `translateX(-50%) translateY(${hoveredKey === 'wallpaper' ? 0 : 4}px)`,
            fontSize: 12, color: 'rgba(255,255,255,0.95)', whiteSpace: 'nowrap',
            background: 'rgba(20,20,30,0.9)', padding: '4px 10px', borderRadius: 7,
            border: '1px solid rgba(255,255,255,0.1)', opacity: hoveredKey === 'wallpaper' ? 1 : 0,
            pointerEvents: 'none', transition: 'opacity 130ms ease, transform 130ms ease',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', zIndex: 10,
          }}>Wallpaper</div>
          <button onClick={() => setShowPicker(v => !v)}
            style={{ width: 54, height: 54, background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14,
              transform: hoveredKey === 'wallpaper' ? 'translateY(-4px)' : 'translateY(0)',
              transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)', filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.5))' }}
            aria-label="Change wallpaper">
            <svg viewBox="0 0 44 44" width="44" height="44" fill="none">
              <rect width="44" height="44" rx="11" fill={WALLPAPER_SWATCH[wallpaper] ?? '#0d1628'}/>
              <rect width="44" height="20" rx="11" fill="rgba(255,255,255,0.12)"/>
              <circle cx="22" cy="22" r="9" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none"/>
              <path d="M22 13v18M13 22h18" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── LiquidWindowChrome ────────────────────────────────────────────────────────
function LiquidWindowChrome({ win }: { win: WindowInstance }) {
  const { closeWindow, minimizeWindow, toggleMaximize, focusWindow, moveWindow } = useDesktop();
  const winRef = useRef(win);
  winRef.current = win;
  const AppComponent = APP_COMPONENTS[win.appId];

  function handleTitleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    const startMX = e.clientX, startMY = e.clientY;
    const startWX = winRef.current.x, startWY = winRef.current.y;
    const id = winRef.current.id;
    function onMove(ev: MouseEvent) {
      moveWindow(id, Math.max(0, startWX + ev.clientX - startMX), Math.max(28, startWY + ev.clientY - startMY));
    }
    function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', borderRadius: 12,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    }} onMouseDown={() => focusWindow(win.id)}>
      <div style={{
        height: 40, flexShrink: 0, display: 'flex', alignItems: 'center',
        padding: '0 16px', cursor: 'grab', userSelect: 'none',
        background: 'rgba(22,24,36,0.96)', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }} onMouseDown={handleTitleMouseDown}>
        <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
          {[
            { color: '#FF5F57', label: 'Close', action: () => closeWindow(win.id) },
            { color: '#FEBC2E', label: 'Minimize', action: () => minimizeWindow(win.id) },
            { color: '#28C840', label: 'Zoom', action: () => toggleMaximize(win.id) },
          ].map(({ color, label, action }) => (
            <button key={label} style={{ width: 12, height: 12, borderRadius: '50%', background: color, border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
              onMouseDown={e => e.stopPropagation()} onClick={action} aria-label={label} />
          ))}
        </div>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)', pointerEvents: 'none' }}>
          {win.title}
        </span>
        <div style={{ width: 60, flexShrink: 0 }} />
      </div>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {AppComponent ? <AppComponent props={win.props} /> : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            App not found
          </div>
        )}
      </div>
    </div>
  );
}

// ── LiquidDesktopInner ────────────────────────────────────────────────────────
// Dock dimensions — matches flex layout: 11 items + 3 seps + padding
const DOCK_W = 760;
const DOCK_H = 83;

function LiquidDesktopInner() {
  const { windows, focusedId } = useDesktop();
  const [wallpaper, setWallpaper] = useState('space');
  const [gpuError, setGpuError] = useState<string | null>(null);

  const visibleWindows = windows.filter(w => !w.minimized).sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className={styles.desktop} style={{ background: WALLPAPERS[wallpaper] }}>
      <div className={styles.flagNotice}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0 }}>
          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 110 1.5A.75.75 0 018 4zm1 8H7v-5h2v5z"/>
        </svg>
        <span>
          Content needs <code>chrome://flags/#canvas-draw-element</code>
          {gpuError && <em> · GPU error — enable the flag &amp; restart Chrome</em>}
        </span>
      </div>

      {/*
        LiquidCanvas fills the viewport via inset:0 — no explicit pixel dimensions.
        This lets liquid-dom's ResizeObserver measure the container and the canvas
        coordinate system will always match CSS pixels, avoiding the vh-mismatch bug
        where React state and liquid-dom's internal ResizeObserver diverged.
      */}
      <LiquidCanvas
        style={{ position: 'absolute', inset: 0 }}
        canvasStyle={{ display: 'block', width: '100%', height: '100%' }}
        onError={e => setGpuError(String(e))}
      >
        {/* Single ZStack root — liquid-dom proposes the full canvas size to it */}
        <ZStack alignment="topLeading">

          {/* ── Menu Bar — fills full width at top ── */}
          <GlassContainer blur={16} spacing={0} tint={{ r: 0.08, g: 0.08, b: 0.14, a: 0.85 }}
            specularStrength={0.6} bezelWidth={0} zIndex={1000}>
            <Frame maxWidth="infinity" height={28}>
              <Glass cornerRadius={0} pointerEvents>
                <Html sizing="fill"><LiquidMenuBarInner /></Html>
              </Glass>
            </Frame>
          </GlassContainer>

          {/* ── Windows — Transform uses CSS pixel coords from DesktopContext ── */}
          {visibleWindows.map(win => {
            const isFocused = focusedId === win.id;
            return (
              <Transform key={win.id} x={win.x} y={win.y}>
                <GlassContainer
                  blur={24} spacing={6}
                  tint={{ r: 0.12, g: 0.12, b: 0.18, a: 0.5 }}
                  specularStrength={isFocused ? 1.2 : 0.6}
                  specularWidth={30} bezelWidth={0.5}
                  shadowOffsetY={isFocused ? 20 : 8}
                  shadowBlur={isFocused ? 48 : 20}
                  shadowColor={{ r: 0, g: 0, b: 0, a: isFocused ? 0.7 : 0.35 }}
                  zIndex={win.zIndex}
                >
                  <Frame width={win.width} height={win.height}>
                    <Glass cornerRadius={12} cornerSmoothing={0.4} pointerEvents>
                      <Html sizing="fill"><LiquidWindowChrome win={win} /></Html>
                    </Glass>
                  </Frame>
                </GlassContainer>
              </Transform>
            );
          })}

          {/*
            ── Dock — native bottom alignment, no absolute Y needed ──
            Frame maxWidth/maxHeight="infinity" fills the canvas size (from ZStack proposal).
            alignment="bottom" places the GlassContainer at the bottom-center.
            This avoids the vh/ResizeObserver coordinate mismatch entirely.
          */}
          <Frame maxWidth="infinity" maxHeight="infinity" alignment="bottom">
            <GlassContainer
              blur={20} spacing={8}
              tint={{ r: 0.14, g: 0.14, b: 0.22, a: 0.6 }}
              specularStrength={0.9} specularWidth={24} bezelWidth={0.5}
              shadowOffsetY={4} shadowBlur={16}
              shadowColor={{ r: 0, g: 0, b: 0, a: 0.4 }}
              zIndex={999}
            >
              <Frame width={DOCK_W} height={DOCK_H}>
                <Glass cornerRadius={20} cornerSmoothing={0.5} pointerEvents>
                  <Html sizing="fill">
                    <LiquidDockInner wallpaper={wallpaper} onWallpaperChange={setWallpaper} />
                  </Html>
                </Glass>
              </Frame>
            </GlassContainer>
          </Frame>

        </ZStack>
      </LiquidCanvas>
    </div>
  );
}

// ── LiquidDesktop ─────────────────────────────────────────────────────────────
export default function LiquidDesktop() {
  return (
    <DesktopProvider startWithAbout={false}>
      <LiquidDesktopInner />
    </DesktopProvider>
  );
}
