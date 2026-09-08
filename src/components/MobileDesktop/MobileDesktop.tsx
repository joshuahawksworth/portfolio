import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useTime } from '../../hooks/useTime';
import AboutApp from '../apps/AboutApp';
import ExperienceApp from '../apps/ExperienceApp';
import SkillsApp from '../apps/SkillsApp';
import ContactApp from '../apps/ContactApp';
import LocationApp from '../apps/LocationApp';
import TerminalApp from '../apps/TerminalApp';
import FinderApp from '../apps/FinderApp';
import SafariApp from '../apps/SafariApp';
import MobileSnakeApp from '../apps/MobileSnakeApp';
import RubberDuckApp from '../apps/RubberDuckApp';
import KeyboardShortcutsApp from '../apps/KeyboardShortcutsApp';
import CalculatorApp from '../apps/CalculatorApp';
import AskJoshApp from '../apps/AskJoshApp';
import TextEditorApp from '../apps/TextEditorApp';
import ImageViewerApp from '../apps/ImageViewerApp';
import TrashApp from '../apps/TrashApp';
import SettingsApp from '../apps/SettingsApp';
import { CalculatorLogoIcon } from '../icons/CalculatorLogoIcon';
import { AboutLogoIcon } from '../icons/AboutLogoIcon';
import { ChromeLogoIcon } from '../icons/ChromeLogoIcon';
import { DesktopProvider, useDesktop } from '../../context/DesktopContext';
import { useSettings } from '../../context/SettingsContext';
import { appIconFor } from '../../theme/platformIcons';
import { appLabelFor, appTitleFor } from '../../theme/platform';
import { formatShortDate } from '../../lib/clock';
import { describeWeather, useWeather } from '../Desktop/DesktopWidgets';
import { DisplayOverlays } from '../SystemUI/SystemPanels';
import StatusBar from './StatusBar';
import styles from './MobileDesktop.module.css';
import { DARK_WALLPAPERS, WALLPAPERS } from '../../data/wallpapers';

// ── App icon gradients (iOS-style flat two-stop, light top → deep bottom) ──
const ICON_GRADS: Record<string, [string, string]> = {
  about: ['#5aa0ff', '#1f5fd6'],
  experience: ['#ffb340', '#f26f0c'],
  skills: ['#c46bff', '#6b2fd6'],
  contact: ['#46a8ff', '#0a6ee6'],
  location: ['#4ee07f', '#1fa04a'],
  terminal: ['#3a3a42', '#1c1c1e'],
  finder: ['#6ad6ff', '#1a7cff'],
  cv: ['#ff6b6b', '#d92b31'],
  github: ['#2c3138', '#181b20'],
  snake: ['#1f6a34', '#0e3a1a'],
  trickster: ['#ffb23f', '#d97706'],
  calculator: ['#ffab2e', '#e0470d'],
  askjosh: ['#ffd39a', '#e0862c'],
};

// ── App icon glyphs (28×28 viewBox) ────────────────────────────────────────
const ICON_GLYPHS: Record<string, React.ReactNode> = {
  about: (
    <>
      <circle cx="14" cy="10" r="4.5" fill="white" opacity="0.92" />
      <path d="M5 26Q5 18.5 14 18.5Q23 18.5 23 26" fill="white" opacity="0.92" />
    </>
  ),
  experience: (
    <>
      <rect
        x="5.5"
        y="12.5"
        width="17"
        height="12"
        rx="2"
        stroke="white"
        strokeWidth="1.8"
        fill="none"
        opacity="0.92"
      />
      <path
        d="M9.5 12.5V9.5Q9.5 6.5 14 6.5Q18.5 6.5 18.5 9.5V12.5"
        stroke="white"
        strokeWidth="1.8"
        fill="none"
        opacity="0.92"
      />
    </>
  ),
  skills: (
    <>
      <path
        d="M9.5 8.5L4 14L9.5 19.5"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.95"
      />
      <path
        d="M18.5 8.5L24 14L18.5 19.5"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.95"
      />
      <path
        d="M16 6.5L12 21.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </>
  ),
  contact: (
    <>
      <rect
        x="4"
        y="8"
        width="20"
        height="13"
        rx="2.5"
        stroke="white"
        strokeWidth="1.8"
        fill="none"
        opacity="0.92"
      />
      <path
        d="M4 11L14 17.5L24 11"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.92"
      />
    </>
  ),
  location: (
    <>
      <path
        d="M14 4Q21 7.5 21 12.5Q21 20 14 26Q7 20 7 12.5Q7 7.5 14 4Z"
        stroke="white"
        strokeWidth="1.8"
        fill="none"
        opacity="0.92"
      />
      <circle cx="14" cy="12.5" r="3" stroke="white" strokeWidth="1.5" fill="none" opacity="0.92" />
    </>
  ),
  terminal: (
    <>
      <path
        d="M6 18.5L13 12.5L6 18.5L13 24.5"
        stroke="#30d158"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M15 24.5H22" stroke="#30d158" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  finder: (
    <>
      <ellipse cx="14" cy="12" rx="8.5" ry="7.5" fill="white" opacity="0.92" />
      <circle cx="11" cy="11" r="2.2" fill="#1a7aff" />
      <circle cx="17" cy="11" r="2.2" fill="#1a7aff" />
      <circle cx="11.8" cy="10.2" r="0.8" fill="white" />
      <circle cx="17.8" cy="10.2" r="0.8" fill="white" />
      <path
        d="M10.5 15Q14 17.5 17.5 15"
        stroke="#1a7aff"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  cv: (
    <>
      <rect
        x="7.5"
        y="3.5"
        width="13"
        height="21"
        rx="2.5"
        stroke="white"
        strokeWidth="1.7"
        fill="none"
        opacity="0.92"
      />
      <path
        d="M10.5 10H17.5M10.5 14H17.5M10.5 18H14"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.92"
      />
    </>
  ),
  github: (
    <path
      d="M14 4.429c-5.523 0-10 4.59-10 10.253 0 4.529 2.862 8.371 6.838 9.728.5.092.687-.218.687-.485 0-.237-.009-.866-.013-1.7-2.782.621-3.369-1.379-3.369-1.379-.454-1.185-1.108-1.501-1.108-1.501-.908-.637.069-.625.069-.625 1.003.073 1.531 1.057 1.531 1.057.891 1.567 2.338 1.114 2.907.852.091-.662.35-1.114.636-1.371-2.219-.259-4.553-1.141-4.553-5.078 0-1.122.39-2.04 1.03-2.759-.103-.26-.447-1.307.097-2.723 0 0 .84-.277 2.75 1.053A9.31 9.31 0 0114 8.417a9.35 9.35 0 012.505.346c1.909-1.33 2.747-1.053 2.747-1.053.545 1.416.202 2.463.1 2.723.641.719 1.029 1.637 1.029 2.759 0 3.946-2.337 4.816-4.563 5.069.359.317.679.943.679 1.9 0 1.372-.013 2.479-.013 2.814 0 .27.184.582.694.484C21.14 23.094 24 19.258 24 14.682 24 9.019 19.522 4.429 14 4.429z"
      fill="white"
      opacity="0.92"
    />
  ),

  // Snake — sinuous S-curve body + triangular head + tongue + apple (SVG circle, no emoji)
  snake: (
    <>
      {/* Body — thick S-curve */}
      <path
        d="M5 23 Q5 17 11 17 Q17 17 17 11 Q17 5 23 5"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Head */}
      <ellipse
        cx="24.5"
        cy="4.5"
        rx="4"
        ry="2.8"
        fill="white"
        opacity="0.95"
        transform="rotate(-40 24.5 4.5)"
      />
      {/* Eye */}
      <circle cx="26" cy="3" r="1" fill="#0a2410" />
      {/* Tongue */}
      <path
        d="M27.5 6 L30 7.5 M30 7.5 L30 6 M30 7.5 L30 9"
        stroke="#ff453a"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      {/* Food — red circle with a small leaf, no emoji */}
      <circle cx="5" cy="24" r="3" fill="#ff453a" opacity="0.9" />
      <path
        d="M5 21 Q6.5 19.5 8 21"
        stroke="#30a030"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),

  // Trickster — folder outline with a question mark
  trickster: (
    <>
      <path
        d="M2 7Q2 4 5 4L14 4L17 7L26 7Q28 7 28 9L28 24Q28 26 26 26L4 26Q2 26 2 24Z"
        fill="rgba(255,255,255,0.22)"
        stroke="rgba(255,255,255,0.9)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <text
        x="15"
        y="21"
        textAnchor="middle"
        fontSize="11"
        fontWeight="900"
        fill="white"
        fontFamily="Arial, sans-serif"
      >
        ?
      </text>
    </>
  ),
  askjosh: (
    <g fill="white" opacity="0.95">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <path
          key={angle}
          d="M14 3.5 L15.5 12.5 L14 14 L12.5 12.5 Z"
          transform={`rotate(${angle} 14 14)`}
        />
      ))}
      <circle cx="14" cy="14" r="1.8" />
    </g>
  ),
};

const ICON_OFFSETS: Record<string, number> = {
  terminal: -4.5,
  finder: 2,
  about: -1.75,
  experience: -1.5,
  location: -1,
  contact: -0.5,
};

/**
 * iOS squircle icon frame: two-stop gradient, top-light gloss and a warm drop shadow.
 * The frame clips its children so branded logos (About / Chrome) share the same corners.
 */
function IconFrame({
  appId,
  size,
  children,
}: {
  appId: string;
  size: number;
  children: React.ReactNode;
}) {
  const [c1, c2] = ICON_GRADS[appId] ?? ['#3b82f6', '#1d4ed8'];
  const style = {
    '--icon-size': `${size}px`,
    '--icon-c1': c1,
    '--icon-c2': c2,
  } as CSSProperties;

  return (
    <div className={styles.appIcon} style={style}>
      {children}
      <span className={styles.appIconGloss} aria-hidden="true" />
    </div>
  );
}

// Real app artwork (see public/icons). macOS-style icons carry their own margin,
// so they're scaled up to fill the iOS squircle; iOS-style ones fit as-is.
const ICON_IMAGES: Record<string, { src: string; scale?: number; bg?: string }> = {
  finder: { src: '/icons/finder.png', scale: 1.28 },
  terminal: { src: '/icons/terminal.png', scale: 1.28 },
  texteditor: { src: '/icons/textedit.png', scale: 1.28 },
  imageviewer: { src: '/icons/preview.png', scale: 1.28 },
  contact: { src: '/icons/mail.png' },
  location: { src: '/icons/maps.png' },
  calculator: { src: '/icons/calculator.png' },
  cv: { src: '/icons/pages.png' },
  askjosh: { src: '/icons/claude.png' },
  experience: { src: '/icons/reminders.png' },
  shortcuts: { src: '/icons/shortcuts.png' },
  settings: { src: '/icons/settings.png', scale: 1.28 },
  safari: { src: '/icons/chrome.png', scale: 0.72, bg: '#ffffff' },
  github: { src: '/icons/github-mark-white.png', scale: 0.62, bg: '#0d1117' },
};

function AppIcon({ appId, size = 60 }: { appId: string; size?: number }) {
  const { os } = useSettings();
  const glyphSize = Math.round(size * 0.72);
  if (os === 'android') {
    const art =
      appId === 'trickster' ? (
        <svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">
          <circle cx="22" cy="22" r="22" fill="#fbbc04" />
          <path
            d="M11 15q0-2 2-2h7l2.5 2.5H31q2 0 2 2V30q0 2-2 2H13q-2 0-2-2z"
            fill="#fff"
            opacity="0.9"
          />
          <text
            x="22"
            y="29"
            textAnchor="middle"
            fontSize="11"
            fontWeight="800"
            fill="#b06000"
            fontFamily="Roboto, Arial, sans-serif"
          >
            ?
          </text>
        </svg>
      ) : (
        appIconFor(appId, 'android')
      );
    if (art) {
      return (
        <div
          className={`${styles.appIcon} ${styles.appIconDroid}`}
          style={{ '--icon-size': `${size}px` } as CSSProperties}
        >
          {art}
        </div>
      );
    }
  }
  const real = ICON_IMAGES[appId];
  if (real) {
    return (
      <div
        className={styles.appIcon}
        style={
          {
            '--icon-size': `${size}px`,
            background: real.bg ?? 'transparent',
          } as CSSProperties
        }
      >
        <img
          src={real.src}
          alt=""
          draggable={false}
          className={styles.appIconImg}
          style={real.scale ? { transform: `scale(${real.scale})` } : undefined}
        />
      </div>
    );
  }
  const flatLogo: CSSProperties = { borderRadius: 0, boxShadow: 'none' };

  if (appId === 'about') {
    return (
      <IconFrame appId={appId} size={size}>
        <AboutLogoIcon size={size} style={flatLogo} />
      </IconFrame>
    );
  }

  if (appId === 'safari') {
    return (
      <IconFrame appId={appId} size={size}>
        <ChromeLogoIcon size={size} style={flatLogo} />
      </IconFrame>
    );
  }

  if (appId === 'calculator') {
    return (
      <IconFrame appId={appId} size={size}>
        <div className={styles.appIconGlyph}>
          <CalculatorLogoIcon size={glyphSize} />
        </div>
      </IconFrame>
    );
  }

  const offset = ICON_OFFSETS[appId] ?? 0;

  return (
    <IconFrame appId={appId} size={size}>
      <svg
        viewBox="0 0 28 28"
        fill="none"
        width={glyphSize}
        height={glyphSize}
        className={styles.appIconGlyph}
      >
        <g transform={`translate(0, ${offset})`}>{ICON_GLYPHS[appId]}</g>
      </svg>
    </IconFrame>
  );
}

// ── App registry ─────────────────────────────────────────────────────────────
const APP_COMPONENTS: Record<string, React.ComponentType<{ props?: Record<string, unknown> }>> = {
  about: AboutApp,
  experience: ExperienceApp,
  skills: SkillsApp,
  contact: ContactApp,
  location: LocationApp,
  terminal: TerminalApp,
  finder: FinderApp,
  safari: SafariApp,
  snake: MobileSnakeApp,
  rubberduck: RubberDuckApp,
  shortcuts: KeyboardShortcutsApp,
  calculator: CalculatorApp,
  askjosh: AskJoshApp,
  texteditor: TextEditorApp,
  imageviewer: ImageViewerApp,
  trash: TrashApp,
  settings: SettingsApp,
};

const APP_LABELS: Record<string, string> = {
  about: 'About',
  experience: 'Experience',
  skills: 'Skills',
  contact: 'Contact',
  location: 'Location',
  terminal: 'Terminal',
  finder: 'Finder',
  cv: 'CV',
  github: 'GitHub',
  safari: 'Chrome',
  snake: 'Snake',
  calculator: 'Calculator',
  askjosh: 'Ask Claude',
  settings: 'Settings',
};

const TRICKSTER_LABEL = 'My Flaws';

// ── "Now" widget (2×2 glass card, top-left of the first page) ───────────────
function NowWidget({ onOpen }: { onOpen: () => void }) {
  const now = useTime();
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className={styles.widgetItem} style={{ gridColumn: '1 / 3', gridRow: '1 / 3' }}>
      <button
        type="button"
        className={styles.widget}
        onClick={onOpen}
        aria-label="About Joshua Hawksworth"
      >
        <div className={styles.widgetPlace}>
          <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">
            <path
              d="M6 1C3.8 1 2.2 2.7 2.2 4.8 2.2 7.6 6 11 6 11s3.8-3.4 3.8-6.2C9.8 2.7 8.2 1 6 1Z"
              fill="currentColor"
            />
            <circle cx="6" cy="4.8" r="1.5" fill="#fff" />
          </svg>
          Manchester, UK
        </div>
        <div className={styles.widgetTime}>{time}</div>
        <div className={styles.widgetDate}>{date}</div>
        <div className={styles.widgetRule} />
        <div className={styles.widgetName}>Joshua Hawksworth</div>
        <div className={styles.widgetRole}>Senior Full Stack Developer</div>
      </button>
    </div>
  );
}

// ── "At a Glance" (Pixel launcher: date, weather and a line of context) ─────
function AtAGlance({ onOpen }: { onOpen: () => void }) {
  const now = useTime();
  const weather = useWeather();
  const { label, glyph } = describeWeather(weather?.code ?? 3);
  return (
    <div className={styles.glanceItem} style={{ gridColumn: '1 / 5', gridRow: '1 / 2' }}>
      <button type="button" className={styles.glance} onClick={onOpen} aria-label="At a glance">
        <span className={styles.glanceDate}>{formatShortDate(now)}</span>
        <span className={styles.glanceSub}>
          <span aria-hidden="true">{glyph}</span> {weather ? `${weather.temp}°` : '—'} {label} ·
          Manchester
        </span>
      </button>
    </div>
  );
}

// ── Home-screen layout: 4 columns × 4 rows per page, like iOS ───────────────
const COLS = 4;
const ROWS = 4;
const PAGE_SLOTS = COLS * ROWS;
/** Cells the 2×2 "Now" widget covers on the first iOS page. */
const IOS_WIDGET_SLOTS = new Set([0, 1, 4, 5]);
/** Cells the "At a Glance" row covers on the first Android page. */
const ANDROID_WIDGET_SLOTS = new Set([0, 1, 2, 3]);
const NO_WIDGET_SLOTS = new Set<number>();

// App order. Anything that doesn't fit on a page spills onto the next one.
const BASE_ITEMS = [
  'finder',
  'about',
  'askjosh',
  'experience',
  'skills',
  'contact',
  'location',
  'terminal',
  'calculator',
  'github',
  'safari',
  'cv',
  'settings',
  'snake',
] as const;

const DOCK_APPS_IOS = ['about', 'experience', 'contact', 'settings'];
const DOCK_APPS_ANDROID = ['about', 'experience', 'contact', 'github', 'settings'];

/** Apps with a dark canvas get a dark sheet header so the bar doesn't glare. */
const DARK_APPS = new Set(['calculator', 'terminal']);

type Page = Array<string | null>;

/** Lay the icons out page by page; returns pages of 16 slots (null = empty). */
function buildPages(ids: readonly string[], widgetSlots: Set<number>): Page[] {
  const pages: Page[] = [];
  let page: Page = Array(PAGE_SLOTS).fill(null);
  let slot = 0;
  for (const id of ids) {
    while (pages.length === 0 && widgetSlots.has(slot)) slot += 1;
    if (slot >= PAGE_SLOTS) {
      pages.push(page);
      page = Array(PAGE_SLOTS).fill(null);
      slot = 0;
    }
    page[slot] = id;
    slot += 1;
  }
  pages.push(page);
  return pages;
}

function slotStyle(slot: number): CSSProperties {
  return { gridColumn: (slot % COLS) + 1, gridRow: Math.floor(slot / COLS) + 1 };
}

function MobileInner() {
  const { windows, openApp, closeWindow } = useDesktop();
  const { settings, os, wallpaper } = useSettings();
  const android = os === 'android';
  const activeWindow = windows.length > 0 ? windows[windows.length - 1] : null;
  const WIDGET_SLOTS = android
    ? settings.showAtAGlance
      ? ANDROID_WIDGET_SLOTS
      : NO_WIDGET_SLOTS
    : IOS_WIDGET_SLOTS;
  const dockApps = android ? DOCK_APPS_ANDROID : DOCK_APPS_IOS;

  // Pages of icons. The trickster lives in one of the empty slots of the last page
  // (or on a fresh page if the last one is full) and hops whenever it's touched.
  const basePages = useMemo(() => buildPages(BASE_ITEMS, WIDGET_SLOTS), [WIDGET_SLOTS]);
  const pages = useMemo(() => {
    const last = basePages[basePages.length - 1];
    const hasRoom = last.some(
      (id, s) => id === null && !(basePages.length === 1 && WIDGET_SLOTS.has(s))
    );
    return hasRoom ? basePages : [...basePages, Array<string | null>(PAGE_SLOTS).fill(null)];
  }, [basePages, WIDGET_SLOTS]);
  const lastPage = pages.length - 1;
  const emptySlots = useMemo(
    () =>
      pages[lastPage]
        .map((id, s) => (id === null && !(lastPage === 0 && WIDGET_SLOTS.has(s)) ? s : -1))
        .filter((s) => s >= 0),
    [pages, lastPage, WIDGET_SLOTS]
  );
  const [tricksterSlot, setTricksterSlot] = useState(() => emptySlots[0] ?? 0);

  function moveTrickster() {
    const options = emptySlots.filter((s) => s !== tricksterSlot);
    if (options.length === 0) return;
    setTricksterSlot(options[Math.floor(Math.random() * options.length)]);
  }

  // ── Paging (native scroll-snap so it feels like the real thing) ────────
  const pagerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const swipeTimer = useRef<number | undefined>(undefined);

  function onPagerScroll() {
    const el = pagerRef.current;
    if (!el) return;
    const next = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    if (next !== page) setPage(next);
    setSwiping(true);
    window.clearTimeout(swipeTimer.current);
    swipeTimer.current = window.setTimeout(() => setSwiping(false), 650);
  }

  function goToPage(p: number) {
    const el = pagerRef.current;
    if (!el) return;
    el.scrollTo({ left: p * el.clientWidth, behavior: 'smooth' });
  }

  // Mouse drag swipes the pages too, so the home screen works in a narrow desktop window
  // (touch already scrolls natively). Snapping is paused while dragging, then restored.
  const drag = useRef<{ startX: number; startScroll: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const suppressClick = useRef(false);

  function onPagerPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = pagerRef.current;
    if (!el) return;
    drag.current = { startX: e.clientX, startScroll: el.scrollLeft, moved: false };
    el.setPointerCapture(e.pointerId);
  }

  function onPagerPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    const el = pagerRef.current;
    if (!d || !el) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      setDragging(true);
    }
    if (d.moved) el.scrollLeft = d.startScroll - dx;
  }

  function onPagerPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    const el = pagerRef.current;
    drag.current = null;
    if (!d || !el) return;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    if (!d.moved) return;
    setDragging(false);
    // Snap to the page the drag was heading for: a short flick still turns the page.
    const dx = e.clientX - d.startX;
    const from = Math.round(d.startScroll / Math.max(1, el.clientWidth));
    const target =
      Math.abs(dx) > el.clientWidth * 0.2
        ? from - Math.sign(dx)
        : Math.round(el.scrollLeft / el.clientWidth);
    goToPage(Math.max(0, Math.min(pages.length - 1, target)));
    // The icon under the pointer would otherwise open on the click that ends the drag.
    suppressClick.current = true;
    window.setTimeout(() => (suppressClick.current = false), 0);
  }

  function onPagerClickCapture(e: React.MouseEvent) {
    if (suppressClick.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  useEffect(() => () => window.clearTimeout(swipeTimer.current), []);

  // Search pill: non-empty query dims every icon whose label doesn't match.
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const matches = (label: string) => q === '' || label.toLowerCase().includes(q);

  function handleOpen(id: string) {
    if (id === 'github') {
      openApp('safari', { url: 'https://github.com/joshuahawksworth' });
    } else if (id === 'cv') {
      window.open('/JoshuaHawksworthCV.pdf', '_blank');
    } else {
      openApp(id);
    }
  }

  function iconClass(label: string, extra?: string) {
    return [styles.iconItem, extra, matches(label) ? '' : styles.iconItemDimmed]
      .filter(Boolean)
      .join(' ');
  }

  const ActiveComp = activeWindow ? APP_COMPONENTS[activeWindow.appId] : null;
  const activeTitle = activeWindow ? appTitleFor(activeWindow.appId, activeWindow.title, os) : '';
  const label = (id: string) => appLabelFor(id, APP_LABELS[id] ?? id, os);

  const searchBar = (
    <label className={`${styles.searchPill} ${android ? styles.googleBar : ''}`}>
      {android ? (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4z"
            fill="#4285f4"
          />
          <path
            d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"
            fill="#34a853"
          />
          <path d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9z" fill="#fbbc04" />
          <path
            d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6z"
            fill="#ea4335"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <circle cx="6.8" cy="6.8" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M10.4 10.4L14 14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )}
      <input
        type="search"
        className={styles.searchInput}
        placeholder="Search"
        aria-label="Search apps"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="search"
      />
      {android && (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          className={styles.googleMic}
          aria-hidden="true"
        >
          <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" fill="#4285f4" />
          <path
            d="M17 11a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11z"
            fill="#ea4335"
          />
        </svg>
      )}
    </label>
  );

  return (
    <div
      className={`${styles.screen} ${android ? styles.android : ''} ${DARK_WALLPAPERS.has(wallpaper) ? styles.darkWall : ''}`}
      data-os={os}
    >
      {/* Wallpaper sits in its own layer so it can be blurred without blurring the UI */}
      <div
        className={styles.wallpaper}
        style={{ backgroundImage: `url(${WALLPAPERS[wallpaper]})` }}
        aria-hidden="true"
      />
      <DisplayOverlays />
      <StatusBar />

      <div
        className={`${styles.pager} ${dragging ? styles.pagerDragging : ''}`}
        ref={pagerRef}
        onScroll={onPagerScroll}
        onPointerDown={onPagerPointerDown}
        onPointerMove={onPagerPointerMove}
        onPointerUp={onPagerPointerUp}
        onPointerCancel={onPagerPointerUp}
        onClickCapture={onPagerClickCapture}
      >
        {pages.map((slots, p) => (
          <div className={styles.page} key={p} aria-label={`Page ${p + 1} of ${pages.length}`}>
            <div className={styles.iconGrid}>
              {p === 0 && !android && <NowWidget onOpen={() => openApp('about')} />}
              {p === 0 && android && settings.showAtAGlance && (
                <AtAGlance onOpen={() => openApp('location')} />
              )}
              {slots.map((id, s) => {
                if (p === 0 && WIDGET_SLOTS.has(s)) return null;
                if (id) {
                  const text = label(id);
                  return (
                    <button
                      key={id}
                      className={iconClass(text)}
                      style={slotStyle(s)}
                      onClick={() => handleOpen(id)}
                    >
                      <AppIcon appId={id} size={60} />
                      <span className={styles.iconLabel}>{text}</span>
                    </button>
                  );
                }
                if (p === lastPage && s === tricksterSlot) {
                  return (
                    <button
                      key={`trickster-${s}`}
                      className={iconClass(TRICKSTER_LABEL, styles.tricksterItem)}
                      style={slotStyle(s)}
                      onPointerEnter={moveTrickster}
                      onTouchStart={moveTrickster}
                      onClick={(e) => e.preventDefault()}
                    >
                      <AppIcon appId="trickster" size={60} />
                      <span className={styles.iconLabel}>{TRICKSTER_LABEL}</span>
                    </button>
                  );
                }
                // Empty cell: keeps every row the same height across pages
                return (
                  <div
                    key={`empty-${p}-${s}`}
                    aria-hidden="true"
                    className={styles.iconItem}
                    style={{ ...slotStyle(s), visibility: 'hidden', pointerEvents: 'none' }}
                  >
                    <span className={styles.appIcon} />
                    <span className={styles.iconLabel}>&nbsp;</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* iOS: search pill that turns into the page dots while you swipe (iOS 18).
          Android: the page dots always sit here; the Google bar lives under the dock. */}
      <div
        className={`${styles.searchRow} ${swiping && pages.length > 1 ? styles.searchRowSwiping : ''} ${android || !settings.showHomeSearch ? styles.searchRowDots : ''}`}
      >
        {!android && settings.showHomeSearch && searchBar}
        {pages.length > 1 && (
          <div className={styles.pageDots} role="tablist" aria-label="Home screen pages">
            {pages.map((_, p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={p === page}
                aria-label={`Page ${p + 1}`}
                className={`${styles.pageDot} ${p === page ? styles.pageDotActive : ''}`}
                onClick={() => goToPage(p)}
              />
            ))}
          </div>
        )}
      </div>

      <div className={styles.dockWrap}>
        <div className={styles.dock}>
          {dockApps.map((id) => (
            <button
              key={id}
              className={styles.dockItem}
              onClick={() => handleOpen(id)}
              aria-label={label(id)}
            >
              <AppIcon appId={id} size={android ? 56 : 60} />
            </button>
          ))}
        </div>
        {android && <div className={styles.googleRow}>{searchBar}</div>}
      </div>
      <div
        className={`${styles.homeIndicator} ${DARK_WALLPAPERS.has(wallpaper) || android ? styles.homeIndicatorLight : ''}`}
        aria-hidden="true"
      />

      <div className={`${styles.panel} ${activeWindow ? styles.panelOpen : ''}`}>
        {activeWindow && (
          <>
            <div
              className={`${styles.panelHeader} ${DARK_APPS.has(activeWindow.appId) && !(android && activeWindow.appId === 'calculator') ? styles.panelHeaderDark : ''}`}
            >
              <button
                className={styles.closeBtn}
                onClick={() => closeWindow(activeWindow.id)}
                aria-label={android ? 'Back' : 'Close'}
              >
                {android ? (
                  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                    <path
                      d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z"
                      fill="currentColor"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 8 8" width="8" height="8" aria-hidden="true">
                    <path
                      d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5"
                      stroke="rgba(0,0,0,0.6)"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </button>
              <span className={styles.panelTitle}>{activeTitle}</span>
              <div className={styles.headerSpacer} />
            </div>
            <div
              className={[
                styles.panelBody,
                activeWindow.appId === 'snake' ? styles.panelBodySnake : '',
                activeWindow.appId === 'calculator' ? styles.panelBodyCalculator : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {ActiveComp ? (
                <ActiveComp props={activeWindow.props} />
              ) : (
                <div className={styles.unavailable}>
                  <strong>{activeWindow.title}</strong>
                  <span>This app isn’t available on mobile yet. Try it on a desktop browser.</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const DEFAULT_VIEWPORT = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
const MOBILE_VIEWPORT =
  'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';

export default function MobileDesktop() {
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;
    const previous = meta.getAttribute('content') ?? DEFAULT_VIEWPORT;
    meta.setAttribute('content', MOBILE_VIEWPORT);
    return () => meta.setAttribute('content', previous);
  }, []);

  return (
    <DesktopProvider startWithAbout={false}>
      <MobileInner />
    </DesktopProvider>
  );
}
