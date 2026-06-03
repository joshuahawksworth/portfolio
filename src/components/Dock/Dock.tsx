import { useId, useState, useRef, useEffect } from 'react';
import { useDesktop, WindowInstance } from '../../context/DesktopContext';
import logoSvg from '../../assets/logo.svg';
import styles from './Dock.module.css';

/* ─── MacIcon ─────────────────────────────────────────────────────────────
   useId() returns strings like ":r0:" — colons are invalid XML ID chars and
   cause SVG gradient url(#…) lookups to silently fail in Firefox.
   Strip them before using as SVG id attributes.
────────────────────────────────────────────────────────────────────────── */
function MacIcon({
  top, bottom, children,
}: { top: string; bottom: string; children: React.ReactNode }) {
  const uid = useId().replace(/:/g, '');
  const g   = `${uid}g`;
  const gl  = `${uid}gl`;
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

/* ─── Icons ───────────────────────────────────────────────────────────── */
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
  github: (
    <svg viewBox="0 0 44 44" width="44" height="44" fill="none">
      <rect width="44" height="44" rx="11" fill="#1b1f24"/>
      <rect width="44" height="20" rx="11" fill="rgba(255,255,255,0.07)"/>
      <g transform="translate(6,6) scale(1.333)">
        <path d="M12 .297c-6.63 0-12 5.373-12 12c0 5.303 3.438 9.8 8.205 11.385c.6.113.82-.258.82-.577c0-.285-.01-1.04-.015-2.04c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729c1.205.084 1.838 1.236 1.838 1.236c1.07 1.835 2.809 1.305 3.495.998c.108-.776.417-1.305.76-1.605c-2.665-.3-5.466-1.332-5.466-5.93c0-1.31.465-2.38 1.235-3.22c-.135-.303-.54-1.523.105-3.176c0 0 1.005-.322 3.3 1.23c.96-.267 1.98-.399 3-.405c1.02.006 2.04.138 3 .405c2.28-1.552 3.285-1.23 3.285-1.23c.645 1.653.24 2.873.12 3.176c.765.84 1.23 1.91 1.23 3.22c0 4.61-2.805 5.625-5.475 5.92c.42.36.81 1.096.81 2.22c0 1.606-.015 2.896-.015 3.286c0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="white" opacity="0.92"/>
      </g>
    </svg>
  ),
  about: (
    <img src={logoSvg} alt="About" width="44" height="44"
      style={{ width: 44, height: 44, borderRadius: 11, display: 'block',
        boxShadow: '0 2px 8px rgba(0,0,0,0.35)', flexShrink: 0 }} />
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
  safari: (
    // Google Chrome icon — junctions at 2 o'clock (330°), 6 o'clock (90°), 10 o'clock (210°)
    // so red is centred at 12 o'clock (top), yellow at 4 o'clock, green at 8 o'clock
    <svg viewBox="0 0 44 44" fill="none" width="44" height="44">
      <rect width="44" height="44" rx="11" fill="white"/>
      {/* Red — 210° → 330° clockwise, centred at top (270°) */}
      <path d="M22 22 L5.55 12.5 A19 19 0 0 1 38.45 12.5 Z" fill="#EA4335"/>
      {/* Yellow — 330° → 90° clockwise, centred at lower-right */}
      <path d="M22 22 L38.45 12.5 A19 19 0 0 1 22 41 Z" fill="#FBBC05"/>
      {/* Green — 90° → 210° clockwise, centred at lower-left */}
      <path d="M22 22 L22 41 A19 19 0 0 1 5.55 12.5 Z" fill="#34A853"/>
      {/* White inner ring covers the pie centres */}
      <circle cx="22" cy="22" r="13" fill="white"/>
      {/* White dividers: from inner edge (r=13) to outer edge (r=19) at each junction */}
      <line x1="10.74" y1="15.5"  x2="5.55"  y2="12.5" stroke="white" strokeWidth="2"/>
      <line x1="33.26" y1="15.5"  x2="38.45" y2="12.5" stroke="white" strokeWidth="2"/>
      <line x1="22"    y1="35"    x2="22"    y2="41"    stroke="white" strokeWidth="2"/>
      {/* Blue centre */}
      <circle cx="22" cy="22" r="10.5" fill="#4285F4"/>
      {/* White separator ring */}
      <circle cx="22" cy="22" r="13" fill="none" stroke="white" strokeWidth="1.5"/>
    </svg>
  ),
  trashEmpty: (
    <MacIcon top="#b0b0b8" bottom="#70707a">
      {/* Lid handle */}
      <path d="M19 10.5H25" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round"/>
      {/* Lid bar */}
      <rect x="10" y="13" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.82)"/>
      {/* Can body — tapers slightly at bottom */}
      <path d="M13.5 16 L15.5 36 Q15.5 37.5 22 37.5 Q28.5 37.5 28.5 36 L30.5 16 Z"
        fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.78)" strokeWidth="1.6" strokeLinejoin="round"/>
      {/* Vertical ribs */}
      <path d="M19.5 18.5 L19 34 M22 18.5 L22 34 M24.5 18.5 L25 34"
        stroke="rgba(255,255,255,0.38)" strokeWidth="1.2" strokeLinecap="round"/>
    </MacIcon>
  ),
  trashFull: (
    <MacIcon top="#b0b0b8" bottom="#70707a">
      {/* Papers sticking out above lid */}
      <rect x="16.5" y="6" width="3.5" height="7.5" rx="1" fill="rgba(255,255,255,0.72)" transform="rotate(-8 16.5 6)"/>
      <rect x="20.5" y="5.5" width="3.5" height="8" rx="1" fill="rgba(255,255,255,0.85)"/>
      <rect x="24" y="6.5" width="3.5" height="7" rx="1" fill="rgba(255,255,255,0.65)" transform="rotate(7 24 6.5)"/>
      {/* Lid handle */}
      <path d="M19 12H25" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round"/>
      {/* Lid bar */}
      <rect x="10" y="14.5" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.82)"/>
      {/* Can body */}
      <path d="M13.5 17.5 L15.5 37.5 Q15.5 39 22 39 Q28.5 39 28.5 37.5 L30.5 17.5 Z"
        fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.78)" strokeWidth="1.6" strokeLinejoin="round"/>
      {/* Vertical ribs */}
      <path d="M19.5 20 L19 35 M22 20 L22 35 M24.5 20 L25 35"
        stroke="rgba(255,255,255,0.38)" strokeWidth="1.2" strokeLinecap="round"/>
    </MacIcon>
  ),
  doom: (
    <img
      src="/doom-icon.png"
      alt="DOOM"
      width="44"
      height="44"
      style={{ width: 44, height: 44, borderRadius: 10, display: 'block', objectFit: 'cover' }}
      onError={(e) => {
        // Fallback SVG if PNG not yet added
        const el = e.target as HTMLImageElement;
        el.style.display = 'none';
        const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
        svg.setAttribute('viewBox','0 0 44 44');
        svg.setAttribute('width','44');
        svg.setAttribute('height','44');
        svg.innerHTML = `<rect width="44" height="44" rx="11" fill="#0a0000"/>
          <text x="22" y="29" text-anchor="middle" fill="#cc2200"
            font-size="15" font-weight="900" font-style="italic"
            font-family="Impact,Arial Black,sans-serif">DOOM</text>`;
        el.parentElement?.appendChild(svg);
      }}
    />
  ),
  snake: (
    <svg viewBox="0 0 44 44" fill="none" width="44" height="44">
      <rect width="44" height="44" rx="11" fill="#0a1f0a"/>
      <rect width="44" height="20" rx="11" fill="rgba(48,209,88,0.06)"/>
      {/* Body — thick sinuous S-curve */}
      <path d="M10 36 Q10 26 18 26 Q26 26 26 18 Q26 10 34 10"
        stroke="#1d5e2e" strokeWidth="7" strokeLinecap="round" fill="none"/>
      {/* Head — triangular/elongated pointing right */}
      <ellipse cx="36" cy="10" rx="5.5" ry="4" fill="#30d158" transform="rotate(-35 36 10)"/>
      {/* Eyes */}
      <circle cx="37.5" cy="7.5" r="1.3" fill="#081408"/>
      {/* Tongue */}
      <path d="M40 11 L43 10 M43 10 L43 8.5 M43 10 L43 11.5"
        stroke="#ff453a" strokeWidth="0.9" strokeLinecap="round"/>
      {/* Apple food — drawn, no emoji */}
      <circle cx="10" cy="37" r="4" fill="#cc2200"/>
      <rect x="9.5" y="32" width="1" height="3" fill="#5a3a10"/>
      <ellipse cx="12" cy="33" rx="2.5" ry="1.2" transform="rotate(-20 12 33)" fill="#2a7a18"/>
    </svg>
  ),
  slotslop: (
    <svg viewBox="0 0 44 44" fill="none" width="44" height="44">
      <rect width="44" height="44" rx="11" fill="#000"/>
      <rect width="44" height="20" rx="11" fill="rgba(255,255,255,0.04)"/>
      <defs>
        <linearGradient id="t3rainbow" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#ff0080"/>
          <stop offset="25%"  stopColor="#ff8c00"/>
          <stop offset="50%"  stopColor="#ffe000"/>
          <stop offset="75%"  stopColor="#00d4ff"/>
          <stop offset="100%" stopColor="#a855f7"/>
        </linearGradient>
      </defs>
      <text x="22" y="32" textAnchor="middle" fill="url(#t3rainbow)"
        fontSize="26" fontWeight="900"
        fontFamily="'Helvetica Neue', Arial, Helvetica, sans-serif">
        T3
      </text>
    </svg>
  ),
  imageviewer: (
    // Preview-inspired icon — teal/blue gradient with landscape
    <svg viewBox="0 0 44 44" fill="none" width="44" height="44">
      <defs>
        <linearGradient id="ivbg" x1="0" y1="0" x2="0" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5ac8fa"/>
          <stop offset="1" stopColor="#007aff"/>
        </linearGradient>
        <linearGradient id="ivgl" x1="0" y1="0" x2="0" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0.22)"/>
          <stop offset="1" stopColor="rgba(255,255,255,0)"/>
        </linearGradient>
      </defs>
      <rect width="44" height="44" rx="11" fill="url(#ivbg)"/>
      <rect width="44" height="22" rx="11" fill="url(#ivgl)"/>
      {/* Sky */}
      <rect x="5" y="10" width="34" height="24" rx="3" fill="rgba(0,40,100,0.35)"/>
      {/* Sun */}
      <circle cx="32" cy="17" r="4" fill="#ffd60a" opacity="0.9"/>
      {/* Mountains */}
      <path d="M5 34 L14 20 L22 30 L30 18 L39 34Z" fill="rgba(255,255,255,0.18)"/>
      <path d="M5 34 L14 20 L22 30 L30 18 L39 34" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinejoin="round" fill="none"/>
      {/* Ground */}
      <rect x="5" y="32" width="34" height="2" rx="1" fill="rgba(255,255,255,0.25)"/>
    </svg>
  ),
  texteditor: (
    // Sublime Text-inspired icon — dark with coloured accent bar
    <svg viewBox="0 0 44 44" fill="none" width="44" height="44">
      <rect width="44" height="44" rx="11" fill="#272822"/>
      <rect width="44" height="20" rx="11" fill="rgba(255,255,255,0.04)"/>
      {/* Sublime accent stripe */}
      <rect x="0" y="0" width="4" height="44" rx="2" fill="#4c96d7"/>
      {/* Code lines */}
      <rect x="9" y="12" width="22" height="2.5" rx="1.25" fill="#f92672" opacity="0.9"/>
      <rect x="9" y="17" width="14" height="2.5" rx="1.25" fill="#a6e22e" opacity="0.85"/>
      <rect x="9" y="22" width="18" height="2.5" rx="1.25" fill="#e6db74" opacity="0.85"/>
      <rect x="9" y="27" width="10" height="2.5" rx="1.25" fill="#66d9e8" opacity="0.85"/>
      <rect x="9" y="32" width="20" height="2.5" rx="1.25" fill="#ae81ff" opacity="0.85"/>
    </svg>
  ),
};

/* ─── Types ───────────────────────────────────────────────────────────── */
interface Item { key: string; label: string; icon: React.ReactNode; action: () => void }

interface DockProps {
  bouncingKeys?: Set<string>;
  onItemActivate?: (key: string, action: () => void) => void;
  trashHighlighted?: boolean;
}

/* ─── Gradient backgrounds for minimised thumbnails ─────────────────── */
const THUMB_GRAD: Record<string, [string, string]> = {
  about: ['#2a1e00','#3d2e00'], experience: ['#1a0e00','#2d1a00'],
  skills: ['#1a0a2e','#2d1050'], contact: ['#0a1428','#0f2045'],
  location: ['#001a10','#002a1a'], terminal: ['#090909','#141414'],
  finder: ['#001030','#001a50'], trash: ['#1a1a1e','#2a2a2e'],
};

function MinimizedThumb({ appId, icon }: { appId: string; icon: React.ReactNode }) {
  const [c1, c2] = THUMB_GRAD[appId] ?? ['#0d1020','#151a30'];
  return (
    <div className={styles.thumb}>
      <div className={styles.thumbBar}>
        <div className={styles.thumbDot} style={{ background: '#FF5F57' }} />
        <div className={styles.thumbDot} style={{ background: '#FEBC2E' }} />
        <div className={styles.thumbDot} style={{ background: '#28C840' }} />
      </div>
      <div className={styles.thumbContent} style={{ background: `linear-gradient(135deg,${c1},${c2})` }} />
      <div className={styles.thumbIconBadge}>{icon}</div>
    </div>
  );
}

function MinimizedSlot({ win }: { win: WindowInstance }) {
  const { focusWindow } = useDesktop();
  const iconMap: Record<string, React.ReactNode> = {
    about: I.about, experience: I.experience, skills: I.skills,
    contact: I.contact, location: I.location, terminal: I.terminal,
    finder: I.finder, trash: I.trashEmpty, cv: I.cv,
    github: I.github, githubapp: I.github, safari: I.safari,
    imageviewer: I.imageviewer,
  };
  return (
    <div className={styles.item}>
      <button className={styles.minimizedBtn} onClick={() => focusWindow(win.id)}
        aria-label={`Restore ${win.title}`} title={`Restore "${win.title}"`}>
        <MinimizedThumb appId={win.appId} icon={iconMap[win.appId] ?? I.about} />
      </button>
      <span className={styles.label}>{win.title}</span>
    </div>
  );
}

/* ─── Default reorderable key order (Finder & Trash excluded) ────────── */
const DEFAULT_ORDER = ['github','safari','about','experience','skills','contact','location','terminal','texteditor','imageviewer','cv','slotslop'];

const ALL_ITEMS_STATIC: Omit<Item, 'action'>[] = [
  { key: 'github',     label: 'GitHub',       icon: I.github },
  { key: 'safari',     label: 'Google Chrome',icon: I.safari },
  { key: 'about',      label: 'About',        icon: I.about },
  { key: 'experience', label: 'Experience',   icon: I.experience },
  { key: 'skills',     label: 'Skills',       icon: I.skills },
  { key: 'contact',    label: 'Contact',      icon: I.contact },
  { key: 'location',   label: 'Location',     icon: I.location },
  { key: 'terminal',   label: 'Terminal',     icon: I.terminal },
  { key: 'texteditor',  label: 'Text Editor',   icon: I.texteditor },
  { key: 'imageviewer', label: 'Image Viewer',  icon: I.imageviewer },
  { key: 'cv',         label: 'CV',           icon: I.cv },
  { key: 'slotslop',   label: 'Slotslop',     icon: I.slotslop },
  { key: 'doom',       label: 'DOOM',         icon: I.doom },
  { key: 'snake',      label: 'Snake',        icon: I.snake },
];

// Apps that live on the desktop as shortcuts — only appear in dock when running
const DESKTOP_ONLY = new Set(['doom', 'snake']);

/* ─── Dock ────────────────────────────────────────────────────────────── */
export default function Dock({ bouncingKeys, onItemActivate, trashHighlighted }: DockProps = {}) {
  const { openApp, windows, trashedItems, trashEmptied } = useDesktop();
  const trashHasItems = !trashEmptied && trashedItems.length > 0;

  const [order,       setOrder]       = useState<string[]>(DEFAULT_ORDER);
  const [dragKey,     setDragKey]     = useState<string | null>(null);
  const [hoverKey,    setHoverKey]    = useState<string | null>(null);
  const [insertBefore, setInsertBefore] = useState(true);

  const minimizedWindows = windows.filter(w => w.minimized);

  // Running desktop-only apps (doom/snake) — shown in dock only while open
  const runningDesktopKeys = [...new Set(
    windows
      .filter(w => !w.minimized && DESKTOP_ONLY.has(w.appId))
      .map(w => w.appId)
  )];

  // Track which keys are newly appeared so we can play the spring animation
  const prevRunningRef = useRef<Set<string>>(new Set());
  const [newKeys, setNewKeys] = useState<Set<string>>(new Set());
  // Use a stable string so the effect only re-runs when the set actually changes
  const runningKey = runningDesktopKeys.join(',');
  useEffect(() => {
    const current = new Set(runningDesktopKeys);
    const prev    = prevRunningRef.current;
    const added   = new Set([...current].filter(k => !prev.has(k)));
    prevRunningRef.current = current; // always update — prevents the infinite-loop bug
    if (added.size > 0) {
      setNewKeys(added);
      const t = setTimeout(() => setNewKeys(new Set()), 500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runningKey]);

  const KEY_TO_APPID: Record<string, string> = { github: 'githubapp' };
  function hasOpen(key: string) {
    const appId = KEY_TO_APPID[key] ?? key;
    return windows.some(w => w.appId === appId && !w.minimized);
  }

  // Build Item with action for each key
  function makeAction(key: string): () => void {
    switch (key) {
      case 'github':     return () => openApp('githubapp', { url: 'https://github.com/joshuahawksworth' });
      case 'safari':     return () => openApp('safari');
      case 'cv':         return () => window.open('/JoshuaHawksworthCV.pdf', '_blank');
      case 'slotslop':   return () => openApp('terminal', { autoRun: 'slotslop' });
      case 'texteditor':  return () => openApp('texteditor');
      case 'imageviewer': return () => openApp('imageviewer');
      default:           return () => openApp(key);
    }
  }

  function handleClick(key: string) {
    const action = makeAction(key);
    if (onItemActivate) onItemActivate(key, action);
    else action();
  }

  /* ── Drag-to-reorder handlers ─────────────────────────────────────── */
  function onDragStart(e: React.DragEvent, key: string) {
    e.dataTransfer.effectAllowed = 'move';
    setDragKey(key);
  }

  function onDragOver(e: React.DragEvent, key: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHoverKey(key);
    setInsertBefore(e.clientX < rect.left + rect.width / 2);
  }

  function onDragLeave(e: React.DragEvent) {
    // Only clear if leaving the entire dock
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setHoverKey(null);
    }
  }

  function onDrop(e: React.DragEvent, targetKey: string) {
    e.preventDefault();
    if (!dragKey || dragKey === targetKey) { resetDrag(); return; }
    setOrder(prev => {
      const from = prev.indexOf(dragKey);
      const to   = prev.indexOf(targetKey);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      next.splice(from, 1);
      // Recalculate target index after removal
      const newTo = next.indexOf(targetKey);
      next.splice(insertBefore ? newTo : newTo + 1, 0, dragKey);
      return next;
    });
    resetDrag();
  }

  function resetDrag() { setDragKey(null); setHoverKey(null); }

  /* ── Render a single dock item ────────────────────────────────────── */
  function renderItem(
    key: string,
    label: string,
    icon: React.ReactNode,
    draggable = false,
    highlighted = false,
    springing = false,
  ) {
    const isBouncing  = bouncingKeys?.has(key) ?? false;
    const isDragging  = dragKey === key;
    const isHovered   = hoverKey === key && dragKey !== null && dragKey !== key;
    const dropClass   = isHovered ? (insertBefore ? styles.dropBefore : styles.dropAfter) : '';

    return (
      <div
        key={key}
        className={[
          styles.item,
          isDragging   ? styles.itemDragging : '',
          springing    ? styles.itemSpring   : '',
          dropClass,
        ].join(' ')}
        draggable={draggable}
        onDragStart={draggable ? e => onDragStart(e, key) : undefined}
        onDragOver={draggable ? e => onDragOver(e, key) : undefined}
        onDragLeave={draggable ? onDragLeave : undefined}
        onDrop={draggable ? e => onDrop(e, key) : undefined}
        onDragEnd={draggable ? resetDrag : undefined}
      >
        <button
          className={`${styles.iconBtn} ${isBouncing ? styles.bouncing : ''} ${highlighted ? styles.trashHighlight : ''}`}
          onClick={() => handleClick(key)}
          aria-label={label}
          style={draggable ? { cursor: isDragging ? 'grabbing' : 'grab' } : undefined}
        >
          {icon}
        </button>
        <span className={styles.label}>{label}</span>
        {hasOpen(key) && <span className={styles.dot} />}
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.panel}>
        {/* Fixed — Finder */}
        {renderItem('finder', 'Finder', I.finder, false)}

        <div className={styles.sep} />

        {/* Reorderable middle items */}
        {order.map(key => {
          const meta = ALL_ITEMS_STATIC.find(i => i.key === key)!;
          return renderItem(key, meta.label, meta.icon, true);
        })}

        {/* Running desktop-only apps (doom/snake) — spring in when launched */}
        {runningDesktopKeys.length > 0 && <div className={styles.sep} />}
        {runningDesktopKeys.map(key => {
          const meta = ALL_ITEMS_STATIC.find(i => i.key === key)!;
          return renderItem(key, meta.label, meta.icon, false, false, newKeys.has(key));
        })}

        <div className={styles.sep} />

        {/* Fixed — Trash (icon changes when items present) */}
        {renderItem('trash', 'Trash', trashHasItems ? I.trashFull : I.trashEmpty, false, !!trashHighlighted)}

        {minimizedWindows.length > 0 && (
          <>
            <div className={styles.sep} />
            {minimizedWindows.map(win => <MinimizedSlot key={win.id} win={win} />)}
          </>
        )}
      </div>
    </div>
  );
}
