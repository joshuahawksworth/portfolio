import { useDesktop, WindowInstance } from '../../context/DesktopContext';
import styles from './Dock.module.css';

/* ─────────────────────────────────────────────
   Reusable Mac-style icon shell
   Each icon gets a gradient bg + top gloss
───────────────────────────────────────────── */
function MacIcon({
  id, top, bottom, children,
}: { id: string; top: string; bottom: string; children: React.ReactNode }) {
  const g = `g-${id}`;
  const gl = `gl-${id}`;
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

/* ─────────────────────────────────────────────
   Individual icons — macOS visual language
───────────────────────────────────────────── */
const I = {
  finder: (
    <MacIcon id="finder" top="#5ecfff" bottom="#1a7aff">
      {/* Finder: two-tone happy face */}
      <ellipse cx="22" cy="21" rx="11" ry="10" fill="white" opacity="0.95"/>
      <circle cx="17" cy="19" r="2.2" fill="#1a7aff"/>
      <circle cx="27" cy="19" r="2.2" fill="#1a7aff"/>
      {/* left eye white */}
      <circle cx="17.8" cy="18.3" r="0.8" fill="white"/>
      <circle cx="27.8" cy="18.3" r="0.8" fill="white"/>
      {/* smile */}
      <path d="M16 24 Q22 29 28 24" stroke="#1a7aff" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    </MacIcon>
  ),
  safari: (
    <MacIcon id="safari" top="#48c8ff" bottom="#007aff">
      {/* Safari: compass */}
      <circle cx="22" cy="22" r="11" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" fill="none"/>
      {/* compass needle — red/white */}
      <polygon points="22,12 24.5,22 22,20 19.5,22" fill="#ff3b30" opacity="0.9"/>
      <polygon points="22,32 19.5,22 22,24 24.5,22" fill="rgba(255,255,255,0.9)"/>
      {/* N S ticks */}
      <path d="M22 13v2M22 29v2M13 22h2M29 22h2" stroke="rgba(255,255,255,0.55)" strokeWidth="1" strokeLinecap="round"/>
    </MacIcon>
  ),
  about: (
    <MacIcon id="about" top="#4fa3f7" bottom="#1a5fd4">
      {/* Person */}
      <circle cx="22" cy="17" r="5.5" fill="rgba(255,255,255,0.92)"/>
      <path d="M10 36 Q10 26 22 26 Q34 26 34 36" fill="rgba(255,255,255,0.92)"/>
    </MacIcon>
  ),
  experience: (
    <MacIcon id="experience" top="#ffa030" bottom="#c25c00">
      {/* Briefcase */}
      <rect x="8" y="17" width="28" height="18" rx="3" fill="rgba(255,255,255,0.92)"/>
      <path d="M16 17v-3a2 2 0 012-2h8a2 2 0 012 2v3" stroke="rgba(255,255,255,0.92)" strokeWidth="2" fill="none"/>
      {/* clasp */}
      <rect x="18.5" y="23" width="7" height="4" rx="1.5" fill="#c25c00"/>
      <path d="M8 24h28" stroke="rgba(255,120,0,0.4)" strokeWidth="1.2"/>
    </MacIcon>
  ),
  skills: (
    <MacIcon id="skills" top="#d070ff" bottom="#7928ca">
      {/* </> code brackets */}
      <path d="M16 16L9 22L16 28" stroke="rgba(255,255,255,0.9)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M28 16L35 22L28 28" stroke="rgba(255,255,255,0.9)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M25 14L19 30" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round"/>
    </MacIcon>
  ),
  contact: (
    <MacIcon id="contact" top="#3a9fff" bottom="#0060df">
      {/* Envelope — macOS Mail style */}
      <rect x="7" y="12" width="30" height="21" rx="3.5" fill="rgba(255,255,255,0.92)"/>
      {/* flap */}
      <path d="M7 15L22 24L37 15" stroke="#0060df" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </MacIcon>
  ),
  location: (
    <MacIcon id="location" top="#34d870" bottom="#1a8f3f">
      {/* Map pin */}
      <path d="M22 8 Q31 11 31 18 Q31 27 22 36 Q13 27 13 18 Q13 11 22 8Z" fill="rgba(255,255,255,0.92)"/>
      <circle cx="22" cy="18" r="4" fill="#1a8f3f"/>
      <circle cx="22" cy="18" r="1.8" fill="white"/>
    </MacIcon>
  ),
  terminal: (
    <MacIcon id="terminal" top="#3a3a3c" bottom="#1c1c1e">
      {/* Terminal prompt */}
      <path d="M10 22L17 16L10 22L17 28" stroke="#30d158" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M20 28H34" stroke="#30d158" strokeWidth="2.2" strokeLinecap="round"/>
    </MacIcon>
  ),
  cv: (
    <MacIcon id="cv" top="#ff5257" bottom="#c0292e">
      {/* Document */}
      <rect x="10" y="6" width="24" height="32" rx="3" fill="rgba(255,255,255,0.92)"/>
      {/* dog ear */}
      <path d="M27 6L34 13" stroke="#c0292e" strokeWidth="1.2"/>
      <path d="M27 6L27 13L34 13" fill="rgba(192,41,46,0.2)" stroke="none"/>
      {/* lines */}
      <path d="M14 18H30M14 22H30M14 26H23" stroke="#c0292e" strokeWidth="1.5" strokeLinecap="round"/>
    </MacIcon>
  ),
  trash: (
    <MacIcon id="trash" top="#aeaeb2" bottom="#6c6c70">
      {/* Trash can */}
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

// Gradient backgrounds per app — used in the thumbnail
const THUMB_GRAD: Record<string, [string, string]> = {
  about:      ['#0f1e40', '#1a3060'],
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
      {/* Mini title bar chrome */}
      <div className={styles.thumbBar}>
        <div className={styles.thumbDot} style={{ background: '#FF5F57' }} />
        <div className={styles.thumbDot} style={{ background: '#FEBC2E' }} />
        <div className={styles.thumbDot} style={{ background: '#28C840' }} />
      </div>
      {/* Window content area — gradient representing the app */}
      <div className={styles.thumbContent}
        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }} />
      {/* App icon in the bottom-right corner, like macOS */}
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
    finder: I.finder, trash: I.trash, cv: I.cv, safari: I.safari,
  };
  const icon = iconMap[win.appId] ?? I.about;

  return (
    <div className={styles.item}>
      <button
        className={`${styles.minimizedBtn}`}
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

export default function Dock() {
  const { openApp, windows } = useDesktop();

  const LEFT: Item[] = [
    { key: 'finder',  label: 'Finder',  icon: I.finder,  action: () => openApp('finder') },
    { key: 'safari',  label: 'Safari',  icon: I.safari,  action: () => window.open('https://github.com/joshhawksworth', '_blank') },
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
    return (
      <div key={item.key} className={styles.item}>
        <button className={styles.iconBtn} onClick={item.action} aria-label={item.label}>
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

        {/* Minimized window slots — shown after trash with a separator */}
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
