import { useState, useRef, useEffect } from 'react';
import {
  LiquidCanvas, GlassContainer, Glass, Html, Frame, ZStack, Transform, Padding,
  useInvalidateLayout,
} from '@liquid-dom/react';
import { DesktopProvider, useDesktop, WindowInstance } from '../../context/DesktopContext';
import { LiquidModeContext } from '../../context/LiquidModeContext';
import { useTime } from '../../hooks/useTime';
import { useLiquidDomSupport } from '../../hooks/useLiquidDomSupport';
import {
  DOCK_DEFAULT_ORDER,
  DOCK_DESKTOP_ONLY,
  DOCK_LABELS,
  dockAppId,
  getDockAction,
} from '../Dock/dockConfig';
import { DOCK_ICONS } from '../Dock/dockIcons';
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
import RubberDuckApp from '../apps/RubberDuckApp';
import KeyboardShortcutsApp from '../apps/KeyboardShortcutsApp';
import TextEditorApp from '../apps/TextEditorApp';
import ImageViewerApp from '../apps/ImageViewerApp';
import SlotslopApp from '../apps/SlotslopApp';
import CalculatorApp from '../apps/CalculatorApp';
import LiquidDesktopIcons from './LiquidDesktopIcons';
import LiquidWallpaper from './LiquidWallpaper';
import LiquidUnsupported from './LiquidUnsupported';
import ChromeFlagLink from '../ChromeFlagLink';
import {
  GLASS_BACKDROP_Z,
  GLASS_ICONS_Z,
  glassDock,
  glassMenuBar,
  glassWindow,
} from './liquidGlassPresets';
import styles from './LiquidDesktop.module.css';

const APP_COMPONENTS: Record<string, React.ComponentType<{ props?: Record<string, unknown> }>> = {
  about: AboutApp,
  experience: ExperienceApp,
  skills: SkillsApp,
  contact: ContactApp,
  location: LocationApp,
  terminal: TerminalApp,
  finder: FinderApp,
  trash: TrashApp,
  safari: SafariApp,
  githubapp: SafariApp,
  doom: DoomApp,
  snake: SnakeApp,
  rubberduck: RubberDuckApp,
  shortcuts: KeyboardShortcutsApp,
  texteditor: TextEditorApp,
  imageviewer: ImageViewerApp,
  slotslop: SlotslopApp,
  calculator: CalculatorApp,
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
  space: '#0d1628',
  sunset: '#32100a',
  ocean: '#082030',
  aurora: '#040c14',
  midnight: '#0a0015',
};

function dockIcon(key: string) {
  return DOCK_ICONS[key as keyof typeof DOCK_ICONS];
}

interface DockItemProps {
  dkey: string;
  label: string;
  icon: React.ReactNode;
  hoveredKey: string | null;
  hasOpen: (k: string) => boolean;
  onHover: (k: string | null) => void;
  onAction: (k: string) => void;
}

function LiquidDockItem({ dkey, label, icon, hoveredKey, hasOpen, onHover, onAction }: DockItemProps) {
  const isHovered = hoveredKey === dkey;
  return (
    <div
      className={styles.dockItem}
      onMouseEnter={() => onHover(dkey)}
      onMouseLeave={() => onHover(null)}
    >
      <div className={`${styles.dockTooltip} ${isHovered ? styles.dockTooltipVisible : ''}`}>
        {label}
      </div>
      <button
        type="button"
        className={styles.dockBtn}
        onClick={() => onAction(dkey)}
        style={{ transform: isHovered ? 'translateY(-4px)' : 'translateY(0)' }}
        aria-label={label}
      >
        {icon}
      </button>
      {hasOpen(dkey) && <span className={styles.dockDot} />}
    </div>
  );
}

function LiquidMenuBarInner() {
  const { windows, focusedId } = useDesktop();
  const time = useTime();
  const appName = windows.find(w => w.id === focusedId)?.title ?? 'Finder';
  return (
    <div className={styles.menuBarInner}>
      <div className={styles.menuBarLeft}>
        <span className={styles.menuBarApple}>&#63743;</span>
        <span className={styles.menuBarApp}>{appName}</span>
        {['File', 'View', 'Window', 'Help'].map(m => (
          <span key={m} className={styles.menuBarItem}>{m}</span>
        ))}
      </div>
      <div className={styles.menuBarRight}>
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
        <span className={styles.menuBarClock}>
          {time.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}{' '}
          {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

function LiquidDockInner({
  wallpaper,
  onWallpaperChange,
}: {
  wallpaper: string;
  onWallpaperChange: (w: string) => void;
}) {
  const { openApp, windows, trashedItems, trashEmptied } = useDesktop();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const trashHasItems = !trashEmptied && trashedItems.length > 0;

  const runningDesktopKeys = [
    ...new Set(
      windows.filter(w => !w.minimized && DOCK_DESKTOP_ONLY.has(w.appId)).map(w => w.appId)
    ),
  ];

  function hasOpen(key: string) {
    return windows.some(w => w.appId === dockAppId(key) && !w.minimized);
  }

  function handleAction(key: string) {
    getDockAction(key, openApp)();
  }

  return (
    <div className={styles.dockRoot}>
      {showPicker && (
        <div className={styles.wallpaperPicker}>
          {Object.entries(WALLPAPER_SWATCH).map(([key, color]) => (
            <button
              key={key}
              type="button"
              className={styles.wallpaperSwatch}
              style={{
                background: color,
                border: wallpaper === key ? '2px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.2)',
              }}
              onClick={() => { onWallpaperChange(key); setShowPicker(false); }}
              aria-label={key}
            />
          ))}
        </div>
      )}
      <div className={styles.dockRow}>
        <LiquidDockItem dkey="finder" label={DOCK_LABELS.finder} icon={dockIcon('finder')}
          hoveredKey={hoveredKey} hasOpen={hasOpen} onHover={setHoveredKey} onAction={handleAction} />
        <div className={styles.dockSep} />
        {DOCK_DEFAULT_ORDER.map(key => (
          <LiquidDockItem key={key} dkey={key} label={DOCK_LABELS[key]} icon={dockIcon(key)}
            hoveredKey={hoveredKey} hasOpen={hasOpen} onHover={setHoveredKey} onAction={handleAction} />
        ))}
        {runningDesktopKeys.map(key => (
          <LiquidDockItem key={key} dkey={key} label={DOCK_LABELS[key]} icon={dockIcon(key)}
            hoveredKey={hoveredKey} hasOpen={hasOpen} onHover={setHoveredKey} onAction={handleAction} />
        ))}
        <div className={styles.dockSep} />
        <LiquidDockItem dkey="trash" label={DOCK_LABELS.trash}
          icon={trashHasItems ? dockIcon('trashFull') : dockIcon('trashEmpty')}
          hoveredKey={hoveredKey} hasOpen={hasOpen} onHover={setHoveredKey} onAction={handleAction} />
        <div className={styles.dockSep} />
        <LiquidDockItem
          dkey="wallpaper"
          label={DOCK_LABELS.wallpaper}
          icon={(
            <svg viewBox="0 0 44 44" width="44" height="44" fill="none">
              <rect width="44" height="44" rx="11" fill={WALLPAPER_SWATCH[wallpaper] ?? '#0d1628'}/>
              <rect width="44" height="20" rx="11" fill="rgba(255,255,255,0.12)"/>
              <circle cx="22" cy="22" r="9" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none"/>
              <path d="M22 13v18M13 22h18" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          )}
          hoveredKey={hoveredKey}
          hasOpen={() => false}
          onHover={setHoveredKey}
          onAction={() => setShowPicker(v => !v)}
        />
      </div>
    </div>
  );
}

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
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  return (
    <div className={styles.windowRoot} onMouseDown={() => focusWindow(win.id)}>
      <div className={styles.titleBar} onMouseDown={handleTitleMouseDown}>
        <div className={styles.trafficLights}>
          {[
            { color: '#FF5F57', label: 'Close', action: () => closeWindow(win.id) },
            { color: '#FEBC2E', label: 'Minimize', action: () => minimizeWindow(win.id) },
            { color: '#28C840', label: 'Zoom', action: () => toggleMaximize(win.id) },
          ].map(({ color, label, action }) => (
            <button
              key={label}
              type="button"
              className={styles.trafficLight}
              style={{ background: color }}
              onMouseDown={e => e.stopPropagation()}
              onClick={action}
              aria-label={label}
            />
          ))}
        </div>
        <span className={styles.windowTitle}>{win.title}</span>
        <div className={styles.titleBarSpacer} />
      </div>
      <div className={styles.windowBody}>
        {AppComponent ? (
          win.appId === 'snake' ? (
            <SnakeApp hideDpad={false} />
          ) : win.appId === 'rubberduck' ? (
            <RubberDuckApp frameless onClose={() => closeWindow(win.id)} />
          ) : (
            <AppComponent props={win.props} />
          )
        ) : (
          <div className={styles.windowMissing}>App not found</div>
        )}
      </div>
    </div>
  );
}

function LiquidDesktopScene({
  wallpaper,
  onWallpaperChange,
}: {
  wallpaper: string;
  onWallpaperChange: (w: string) => void;
}) {
  const { windows, focusedId, openApp } = useDesktop();
  const invalidateLayout = useInvalidateLayout();
  const openedFinder = useRef(false);
  const visibleWindows = windows.filter(w => !w.minimized).sort((a, b) => a.zIndex - b.zIndex);

  useEffect(() => {
    if (!openedFinder.current) {
      openedFinder.current = true;
      openApp('finder');
    }
  }, [openApp]);

  useEffect(() => {
    invalidateLayout();
  }, [wallpaper, invalidateLayout]);

  return (
    <LiquidModeContext.Provider value={true}>
      <ZStack alignment="topLeading">
        <Html zIndex={GLASS_BACKDROP_Z} sizing="fill">
          <LiquidWallpaper wallpaper={wallpaper} />
        </Html>

        <Html zIndex={GLASS_ICONS_Z} sizing="fill">
          <LiquidDesktopIcons />
        </Html>

        <Frame maxWidth="infinity" height={28}>
          <GlassContainer {...glassMenuBar} zIndex={1000}>
            <Glass cornerRadius={0} pointerEvents>
              <Html sizing="fill">
                <LiquidMenuBarInner />
              </Html>
            </Glass>
          </GlassContainer>
        </Frame>

        {visibleWindows.map(win => (
          <Transform key={win.id} x={win.x} y={win.y}>
            <Frame width={win.width} height={win.height}>
              <GlassContainer
                {...glassWindow}
                zIndex={win.zIndex}
                specularStrength={focusedId === win.id ? 1.1 : 0.7}
              >
                <Glass cornerRadius={12} cornerSmoothing={0.6} pointerEvents>
                  <Html sizing="fill">
                    <LiquidWindowChrome win={win} />
                  </Html>
                </Glass>
              </GlassContainer>
            </Frame>
          </Transform>
        ))}

        <Frame maxWidth="infinity" maxHeight="infinity" alignment="bottom">
          <Padding insets={{ bottom: 10 }}>
            <GlassContainer {...glassDock} zIndex={999}>
              <Glass cornerRadius={20} cornerSmoothing={0.6} pointerEvents>
                <Html sizing="intrinsic">
                  <LiquidDockInner wallpaper={wallpaper} onWallpaperChange={onWallpaperChange} />
                </Html>
              </Glass>
            </GlassContainer>
          </Padding>
        </Frame>
      </ZStack>
    </LiquidModeContext.Provider>
  );
}

function LiquidDesktopInner({ onUseStandard }: { onUseStandard: () => void }) {
  const [wallpaper, setWallpaper] = useState('space');
  const [gpuError, setGpuError] = useState<string | null>(null);
  const support = useLiquidDomSupport();

  const wallpaperBg = WALLPAPERS[wallpaper];

  if (support === 'checking') {
    return <div className={styles.desktop} style={{ background: wallpaperBg }} />;
  }

  if (support === 'unsupported') {
    return <LiquidUnsupported onUseStandard={onUseStandard} />;
  }

  return (
    <div className={styles.desktop}>
      {gpuError && (
        <div className={styles.flagNotice}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0 }}>
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 110 1.5A.75.75 0 018 4zm1 8H7v-5h2v5z"/>
          </svg>
          <span>
            Liquid glass error — try enabling <ChromeFlagLink />
            <em> · {gpuError}</em>
          </span>
        </div>
      )}

      <LiquidCanvas
        className={styles.canvasShell}
        canvasClassName={styles.canvas}
        onError={e => setGpuError(String(e))}
      >
        <LiquidDesktopScene wallpaper={wallpaper} onWallpaperChange={setWallpaper} />
      </LiquidCanvas>
    </div>
  );
}

export default function LiquidDesktop({ onUseStandard }: { onUseStandard: () => void }) {
  return (
    <DesktopProvider startWithAbout={false}>
      <LiquidDesktopInner onUseStandard={onUseStandard} />
    </DesktopProvider>
  );
}
