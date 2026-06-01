import { useTime } from '../../hooks/useTime';
import AboutApp from '../apps/AboutApp';
import ExperienceApp from '../apps/ExperienceApp';
import SkillsApp from '../apps/SkillsApp';
import ContactApp from '../apps/ContactApp';
import LocationApp from '../apps/LocationApp';
import TerminalApp from '../apps/TerminalApp';
import FinderApp from '../apps/FinderApp';
import TrashApp from '../apps/TrashApp';
import { DesktopProvider, useDesktop } from '../../context/DesktopContext';
import styles from './MobileDesktop.module.css';

// ── App icon: CSS div + SVG glyph — no SVG gradient IDs, no collisions ──
const ICON_GRADS: Record<string, [string, string]> = {
  about:      ['#4f8ef7','#1e4fc4'], experience:['#ffa030','#c25c00'],
  skills:     ['#d070ff','#7928ca'], contact:   ['#3a9fff','#0060df'],
  location:   ['#34d870','#1a8f3f'], terminal:  ['#2a2a35','#1c1c1e'],
  finder:     ['#5ecfff','#1a7aff'], trash:     ['#aeaeb2','#6c6c70'],
  cv:         ['#ff5257','#c0292e'],
};

const ICON_GLYPHS: Record<string, React.ReactNode> = {
  about: <><circle cx="14" cy="10" r="4.5" fill="white" opacity="0.92"/><path d="M5 26Q5 18.5 14 18.5Q23 18.5 23 26" fill="white" opacity="0.92"/></>,
  experience: <><rect x="5.5" y="12.5" width="17" height="12" rx="2" stroke="white" strokeWidth="1.8" fill="none" opacity="0.92"/><path d="M9.5 12.5V9.5Q9.5 6.5 14 6.5Q18.5 6.5 18.5 9.5V12.5" stroke="white" strokeWidth="1.8" fill="none" opacity="0.92"/></>,
  skills: <>
    <rect x="5" y="7.5"  width="18" height="3" rx="1.5" fill="white" opacity="0.2"/>
    <rect x="5" y="7.5"  width="14" height="3" rx="1.5" fill="white" opacity="0.92"/>
    <rect x="5" y="12.5" width="18" height="3" rx="1.5" fill="white" opacity="0.2"/>
    <rect x="5" y="12.5" width="10" height="3" rx="1.5" fill="white" opacity="0.92"/>
    <rect x="5" y="17.5" width="18" height="3" rx="1.5" fill="white" opacity="0.2"/>
    <rect x="5" y="17.5" width="16" height="3" rx="1.5" fill="white" opacity="0.92"/>
  </>,
  contact: <><rect x="4" y="8" width="20" height="13" rx="2.5" stroke="white" strokeWidth="1.8" fill="none" opacity="0.92"/><path d="M4 11L14 17.5L24 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.92"/></>,
  location: <><path d="M14 4Q21 7.5 21 12.5Q21 20 14 26Q7 20 7 12.5Q7 7.5 14 4Z" stroke="white" strokeWidth="1.8" fill="none" opacity="0.92"/><circle cx="14" cy="12.5" r="3" stroke="white" strokeWidth="1.5" fill="none" opacity="0.92"/></>,
  terminal: <><path d="M6 18.5L13 12.5L6 18.5L13 24.5" stroke="#30d158" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M15 24.5H22" stroke="#30d158" strokeWidth="2.2" strokeLinecap="round"/></>,
  finder: <><ellipse cx="14" cy="12" rx="8.5" ry="7.5" fill="white" opacity="0.92"/><circle cx="11" cy="11" r="2.2" fill="#1a7aff"/><circle cx="17" cy="11" r="2.2" fill="#1a7aff"/><circle cx="11.8" cy="10.2" r="0.8" fill="white"/><circle cx="17.8" cy="10.2" r="0.8" fill="white"/><path d="M10.5 15Q14 17.5 17.5 15" stroke="#1a7aff" strokeWidth="1.5" strokeLinecap="round" fill="none"/></>,
  trash: <><path d="M7.5 11H20.5M11 11V8.5Q11 7.5 12 7.5H16Q17 7.5 17 8.5V11" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.92"/><rect x="9" y="12" width="10" height="12" rx="1.5" stroke="white" strokeWidth="1.6" fill="none" opacity="0.92"/><path d="M13 15V21M15 15V21" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/></>,
  cv: <><rect x="7.5" y="3.5" width="13" height="21" rx="2.5" stroke="white" strokeWidth="1.7" fill="none" opacity="0.92"/><path d="M10.5 10H17.5M10.5 14H17.5M10.5 18H14" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.92"/></>,
};

// Vertical nudge (in 28-unit viewBox coords) to visually centre each glyph
const ICON_OFFSETS: Record<string, number> = {
  terminal:   -4.5,
  finder:      2,
  about:      -1.75,
  trash:      -1.75,
  experience: -1.5,
  location:   -1,
  contact:    -0.5,
};

function AppIcon({ appId, size = 60 }: { appId: string; size?: number }) {
  const [c1, c2] = ICON_GRADS[appId] ?? ['#3b82f6','#1d4ed8'];
  const radius = Math.round(size * 0.23);
  const glyphSize = Math.round(size * 0.72);
  const offset = ICON_OFFSETS[appId] ?? 0;

  return (
    <div style={{
      width: size, height: size,
      borderRadius: radius,
      background: `linear-gradient(155deg, ${c1} 0%, ${c2} 100%)`,
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0,
      boxShadow: '0 4px 12px rgba(0,0,0,0.45)',
    }}>
      {/* Top gloss sheen */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.22), rgba(255,255,255,0))',
        borderRadius: `${radius}px ${radius}px 0 0`,
        pointerEvents: 'none',
      }} />
      {/* Glyph */}
      <svg
        viewBox="0 0 28 28" fill="none"
        width={glyphSize} height={glyphSize}
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <g transform={`translate(0, ${offset})`}>
          {ICON_GLYPHS[appId]}
        </g>
      </svg>
    </div>
  );
}

// ── App registry ────────────────────────────────────────────────────────
const APP_COMPONENTS: Record<string, React.ComponentType<{ props?: Record<string, unknown> }>> = {
  about: AboutApp, experience: ExperienceApp, skills: SkillsApp,
  contact: ContactApp, location: LocationApp, terminal: TerminalApp,
  finder: FinderApp, trash: TrashApp,
};

const APP_LABELS: Record<string, string> = {
  about: 'About', experience: 'Experience', skills: 'Skills',
  contact: 'Contact', location: 'Location', terminal: 'Terminal',
  finder: 'Finder', trash: 'Trash', cv: 'CV',
};

// ── Clock for status bar ─────────────────────────────────────────────────
function StatusClock() {
  const now = useTime();
  return <span>{now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>;
}

// ── Inner component (needs DesktopProvider wrapper) ─────────────────────
function MobileInner() {
  const { windows, openApp, closeWindow } = useDesktop();
  const activeWindow = windows.length > 0 ? windows[windows.length - 1] : null;

  const HOME_APPS = [
    'finder','about','experience','skills',
    'contact','location','terminal','trash',
  ];

  const DOCK_APPS = ['about','experience','contact','skills'];

  function handleCVTap() {
    window.open('/JoshuaHawksworthCV.pdf', '_blank');
  }

  return (
    <div className={styles.screen}>
      {/* Status bar */}
      <div className={styles.statusBar}>
        <StatusClock />
        <div className={styles.statusIcons}>
          <svg viewBox="0 0 16 12" width="16" height="12" fill="white" opacity="0.8">
            <path d="M8 2a9 9 0 019 0l-1.5 1.5a7 7 0 00-15 0L0 2a9 9 0 018 0z"/>
            <path d="M8 5a5.5 5.5 0 015.5 0L12 6.5a3.5 3.5 0 00-8 0L2.5 5A5.5 5.5 0 018 5z"/>
            <circle cx="8" cy="10" r="1.5"/>
          </svg>
          <svg viewBox="0 0 22 12" width="22" height="12" fill="none" stroke="white" strokeWidth="1.2" opacity="0.8">
            <rect x="0.5" y="0.5" width="18" height="11" rx="2.5"/>
            <rect x="2" y="2" width="13" height="8" rx="1.5" fill="white" stroke="none"/>
            <path d="M19.5 4v4" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Home screen icon grid */}
      <div className={styles.homeScreen}>
        <div className={styles.iconGrid}>
          {HOME_APPS.map(id => (
            <button key={id} className={styles.iconItem}
              onClick={() => openApp(id)}>
              <AppIcon appId={id} size={62} />
              <span className={styles.iconLabel}>{APP_LABELS[id]}</span>
            </button>
          ))}
          {/* CV is a direct link, not an app window */}
          <button className={styles.iconItem} onClick={handleCVTap}>
            <AppIcon appId="cv" size={62} />
            <span className={styles.iconLabel}>CV</span>
          </button>
        </div>
      </div>

      {/* Dock */}
      <div className={styles.dock}>
        {DOCK_APPS.map(id => (
          <button key={id} className={styles.dockItem} onClick={() => openApp(id)}>
            <AppIcon appId={id} size={52} />
          </button>
        ))}
      </div>

      {/* Full-screen app panel — slides up when an app is open */}
      <div className={`${styles.panel} ${activeWindow ? styles.panelOpen : ''}`}>
        {activeWindow && (
          <>
            <div className={styles.panelHandle}>
              <div className={styles.panelHandlePill} />
            </div>
            <div className={styles.panelHeader}>
              <button
                className={styles.closeBtn}
                onClick={() => closeWindow(activeWindow.id)}
                aria-label="Close"
              >
                <svg viewBox="0 0 10 10" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1l8 8M9 1L1 9"/>
                </svg>
              </button>
              <span className={styles.panelTitle}>{activeWindow.title}</span>
              <div className={styles.headerSpacer} />
            </div>
            <div className={styles.panelBody}>
              {(() => {
                const Comp = APP_COMPONENTS[activeWindow.appId];
                return Comp ? <Comp props={activeWindow.props} /> : null;
              })()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function MobileDesktop() {
  return (
    <DesktopProvider startWithAbout={false}>
      <MobileInner />
    </DesktopProvider>
  );
}
