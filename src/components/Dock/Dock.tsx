import { useId } from 'react';
import { useDesktop, WindowInstance } from '../../context/DesktopContext';
import logoSvg from '../../assets/logo.svg';
import styles from './Dock.module.css';

/* ─────────────────────────────────────────────────────────────────────────
   MacIcon — each render instance gets its own gradient IDs via useId()
   so duplicate icons (dock + minimised thumb) never share an SVG ID.
   Previously used prop-based IDs which caused gradient lookup failures
   in Firefox when the same id appeared in multiple <svg> elements.
───────────────────────────────────────────────────────────────────────── */
function MacIcon({
  top, bottom, children,
}: { top: string; bottom: string; children: React.ReactNode }) {
  const uid = useId();
  const g  = `${uid}g`;
  const gl = `${uid}gl`;
  return (
    <svg viewBox="0 0 44 44" fill="none" width="44" height="44">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor={top} /><stop offset="1" stopColor={bottom} />
        </linearGradient>
        <linearGradient id={gl} x1="0" y1="0" x2="0" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0.22)" /><stop offset="1" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <rect width="44" height="44" rx="11" fill={`url(#${g})`} />
      <rect width="44" height="20" rx="11" fill={`url(#${gl})`} />
      {children}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Individual dock icons — macOS visual language
───────────────────────────────────────────────────────────────────────── */
const I = {
  finder: (
    <MacIcon top="#5ecfff" bottom="#1a7aff">
      <ellipse cx="22" cy="21" rx="11" ry="10" fill="white" opacity="0.95"/>
      <circle cx="17" cy="19" r="2.2" fill="#1a7aff"/>
      <circle cx="27" cy="19" r="2.2" fill="#1a7aff"/>
      <circle cx="17.8" cy="18.3" r="0.8" fill="white"/>
      <circle cx="27.8" cy="18.3" r="0.8" fill="white"/>
      <path d="M16 24 Q22 29 28 24" stroke="#1a7aff" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    </MacIcon>
  ),
  /* Real GitHub invertocat path (original 24×24, scaled to 44×44 canvas) */
  github: (
    <svg viewBox="0 0 44 44" width="44" height="44" fill="none">
      <rect width="44" height="44" rx="11" fill="#1b1f24"/>
      <rect width="44" height="20" rx="11" fill="rgba(255,255,255,0.07)"/>
      <g transform="translate(6,6) scale(1.333)">
        <path d="M12 .297c-6.63 0-12 5.373-12 12c0 5.303 3.438 9.8 8.205 11.385c.6.113.82-.258.82-.577c0-.285-.01-1.04-.015-2.04c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729c1.205.084 1.838 1.236 1.838 1.236c1.07 1.835 2.809 1.305 3.495.998c.108-.776.417-1.305.76-1.605c-2.665-.3-5.466-1.332-5.466-5.93c0-1.31.465-2.38 1.235-3.22c-.135-.303-.54-1.523.105-3.176c0 0 1.005-.322 3.3 1.23c.96-.267 1.98-.399 3-.405c1.02.006 2.04.138 3 .405c2.28-1.552 3.285-1.23 3.285-1.23c.645 1.653.24 2.873.12 3.176c.765.84 1.23 1.91 1.23 3.22c0 4.61-2.805 5.625-5.475 5.92c.42.36.81 1.096.81 2.22c0 1.606-.015 2.896-.015 3.286c0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="white" opacity="0.92"/>
      </g>
    </svg>
  ),
  /* About icon uses the personal logo (yellow #JH mark) */
  about: (
    <img
      src={logoSvg}
      alt="About"
      width="44"
      height="44"
      style={{ borderRadius: 11, display: 'block', boxShadow: '0 2px 8px rgba(0,0,0,0.35)' }}
    />
  ),
  experience: (
    <MacIcon top="#ffa030" bottom="#c25c00">
      <rect x="8" y="17" width="28" height="18" rx="3" fill="rgba(255,255,255,0.92)"/>
      <path d="M16 17v-3a2 2 0 012-2h8a2 2 0 012 2v3" stroke="rgba(255,255,255,0.92)" strokeWidth="2" fill="none"/>
      <rect x="18.5" y="23" width="7" height="4" rx="1.5" fill="#c25c00"/>
      <path d="M8 24h28" stroke="rgba(255,120,0,0.4)" strokeWidth="1.2"/>
    </MacIcon>
  ),
  skills: (
    <MacIcon top="#d070ff" bottom="#7928ca">
      <path d="M16 16L9 22L16 28" stroke="rgba(255,255,255,0.9)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M28 16L35 22L28 28" stroke="rgba(255,255,255,0.9)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M25 14L19 30" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round"/>
    </MacIcon>
  ),
  contact: (
    <MacIcon top="#3a9fff" bottom="#0060df">
      <rect x="7" y="12" width="30" height="21" rx="3.5" fill="rgba(255,255,255,0.92)"/>
      <path d="M7 15L22 24L37 15" stroke="#0060df" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </MacIcon>
  ),
  location: (
    <MacIcon top="#34d870" bottom="#1a8f3f">
      <path d="M22 8 Q31 11 31 18 Q31 27 22 36 Q13 27 13 18 Q13 11 22 8Z" fill="rgba(255,255,255,0.92)"/>
      <circle cx="22" cy="18" r="4" fill="#1a8f3f"/>
      <circle cx="22" cy="18" r="1.8" fill="white"/>
    </MacIcon>
  ),
  terminal: (
    <MacIcon top="#3a3a3c" bottom="#1c1c1e">
      <path d="M10 22L17 16L10 22L17 28" stroke="#30d158" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M20 28H34" stroke="#30d158" strokeWidth="2.2" strokeLinecap="round"/>
    </MacIcon>
  ),
  cv: (
    <MacIcon top="#ff5257" bottom="#c0292e">
      <rect x="10" y="6" width="24" height="32" rx="3" fill="rgba(255,255,255,0.92)"/>
      <path d="M27 6L34 13" stroke="#c0292e" strokeWidth="1.2"/>
      <path d="M27 6L27 13L34 13" fill="rgba(192,41,46,0.2)" stroke="none"/>
      <path d="M14 18H30M14 22H30M14 26H23" stroke="#c0292e" strokeWidth="1.5" strokeLinecap="round"/>
    </MacIcon>
  ),
  trash: (
    <MacIcon top="#aeaeb2" bottom="#6c6c70">
      <path d="M11 14H33M20 10H24M13 14L15 36H29L31 14" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M19 19V31M22 19V31M25 19V31" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3" strokeLinecap="round"/>
    </MacIcon>
  ),
};

interface Item {
  key: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

interface DockProps {
  bouncingKey?: string | null;
  onItemActivate?: (key: string, action: () => void) => void;
}

const THUMB_GRAD: Record<string, [string, string]> = {
  about:      ['#2a1e00', '#3d2e00'],
  experience: ['#1a0e00', '#2d1a00'],
  skills:     ['#1a0a2e', '#2d1050'],
  contact:    ['#0a1428', '#0f2045'],
  location:   ['#001a10', '#002a1a'],
  terminal:   ['#090909', '#141414'],
  finder:     ['#001030', '#001a50'],
  trash:      ['#1a1a1e', '#2a2a2e'],
};

function MinimizedThumb({ appId, icon }: { appId: string; icon: React.ReactNode }) {
  const [c1, c2] = THUMB_GRAD[appId] ?? ['#0d1020', '#151a30'];
  return (
    <div className={styles.thumb}>
      <div className={styles.thumbBar}>
        <div className={styles.thumbDot} style={{ background: '#FF5F57' }} />
        <div className={styles.thumbDot} style={{ background: '#FEBC2E' }} />
        <div className={styles.thumbDot} style={{ background: '#28C840' }} />
      </div>
      <div className={styles.thumbContent}
        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }} />
      <div className={styles.thumbIconBadge}>
        {icon}
      </div>
    </div>
  );
}

function MinimizedSlot({ win }: { win: WindowInstance }) {
  const { focusWindow } = useDesktop();
  const iconMap: Record<string, React.ReactNode> = {
    about: I.about, experience: I.experience, skills: I.skills,
    contact: I.contact, location: I.location, terminal: I.terminal,
    finder: I.finder, trash: I.trash, cv: I.cv, github: I.github,
  };
  const icon = iconMap[win.appId] ?? I.about;

  return (
    <div className={styles.item}>
      <button
        className={styles.minimizedBtn}
        onClick={() => focusWindow(win.id)}
        aria-label={`Restore ${win.title}`}
        title={`Restore "${win.title}"`}
      >
        <MinimizedThumb appId={win.appId} icon={icon} />
      </button>
      <span className={styles.label}>{win.title}</span>
    </div>
  );
}

export default function Dock({ bouncingKey, onItemActivate }: DockProps = {}) {
  const { openApp, windows } = useDesktop();

  const LEFT: Item[] = [
    { key: 'finder', label: 'Finder', icon: I.finder, action: () => openApp('finder') },
    { key: 'github', label: 'GitHub', icon: I.github, action: () => window.open('https://github.com/joshuahawksworth', '_blank') },
  ];
  const MIDDLE: Item[] = [
    { key: 'about',      label: 'About',      icon: I.about,      action: () => openApp('about') },
    { key: 'experience', label: 'Experience', icon: I.experience, action: () => openApp('experience') },
    { key: 'skills',     label: 'Skills',     icon: I.skills,     action: () => openApp('skills') },
    { key: 'contact',    label: 'Contact',    icon: I.contact,    action: () => openApp('contact') },
    { key: 'location',   label: 'Location',   icon: I.location,   action: () => openApp('location') },
    { key: 'terminal',   label: 'Terminal',   icon: I.terminal,   action: () => openApp('terminal') },
    { key: 'cv',         label: 'CV',         icon: I.cv,         action: () => window.open('/JoshuaHawksworthCV.pdf', '_blank') },
  ];
  const RIGHT: Item[] = [
    { key: 'trash', label: 'Trash', icon: I.trash, action: () => openApp('trash') },
  ];

  const minimizedWindows = windows.filter(w => w.minimized);

  function hasOpen(key: string) {
    return windows.some(w => w.appId === key && !w.minimized);
  }

  function renderItem(item: Item) {
    const isBouncing = bouncingKey === item.key;
    function handleClick() {
      if (onItemActivate) onItemActivate(item.key, item.action);
      else item.action();
    }
    return (
      <div key={item.key} className={styles.item}>
        <button
          className={`${styles.iconBtn} ${isBouncing ? styles.bouncing : ''}`}
          onClick={handleClick}
          aria-label={item.label}
        >
          {item.icon}
        </button>
        <span className={styles.label}>{item.label}</span>
        {hasOpen(item.key) && <span className={styles.dot} />}
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.panel}>
        {LEFT.map(renderItem)}
        <div className={styles.sep} />
        {MIDDLE.map(renderItem)}
        <div className={styles.sep} />
        {RIGHT.map(renderItem)}

        {minimizedWindows.length > 0 && (
          <>
            <div className={styles.sep} />
            {minimizedWindows.map(win => (
              <MinimizedSlot key={win.id} win={win} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
