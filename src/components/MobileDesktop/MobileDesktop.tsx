import { useEffect, useState } from 'react';
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
import { CalculatorLogoIcon } from '../icons/CalculatorLogoIcon';
import { AboutLogoIcon } from '../icons/AboutLogoIcon';
import { ChromeLogoIcon } from '../icons/ChromeLogoIcon';
import { DesktopProvider, useDesktop } from '../../context/DesktopContext';
import StatusBar from './StatusBar';
import styles from './MobileDesktop.module.css';

// ── App icon gradients (iOS-style flat two-stop, light top → deep bottom) ──
const ICON_GRADS: Record<string, [string, string]> = {
  about: ['#5aa0ff', '#1f5fd6'],
  experience: ['#ffb340', '#f26f0c'],
  skills: ['#d581ff', '#8a2fd8'],
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
      <rect x="5" y="7.5" width="18" height="3" rx="1.5" fill="white" opacity="0.2" />
      <rect x="5" y="7.5" width="14" height="3" rx="1.5" fill="white" opacity="0.92" />
      <rect x="5" y="12.5" width="18" height="3" rx="1.5" fill="white" opacity="0.2" />
      <rect x="5" y="12.5" width="10" height="3" rx="1.5" fill="white" opacity="0.92" />
      <rect x="5" y="17.5" width="18" height="3" rx="1.5" fill="white" opacity="0.2" />
      <rect x="5" y="17.5" width="16" height="3" rx="1.5" fill="white" opacity="0.92" />
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

function AppIcon({ appId, size = 60 }: { appId: string; size?: number }) {
  const glyphSize = Math.round(size * 0.72);
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
  askjosh: 'Ask Josh',
};

const TRICKSTER_LABEL = 'My Flaws';

// ── "Now" widget (2×2 glass card, top-left of the home screen) ──────────────
function NowWidget() {
  const now = useTime();
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className={styles.widgetItem}>
      <div className={styles.widget}>
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
      </div>
      <span className={styles.iconLabel}>Now</span>
    </div>
  );
}

// Fixed base items — these never move (slots 0–11 in the 4-column grid)
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
  'snake',
  'cv',
] as const;

// Trailing zone: slots 12–15 (last row). Trickster lives here; the other 3 stay empty.
const TRAILING_SLOTS = 4;

const DOCK_APPS = ['about', 'experience', 'contact', 'github'];

function MobileInner() {
  const { windows, openApp, closeWindow } = useDesktop();
  const activeWindow = windows.length > 0 ? windows[windows.length - 1] : null;

  // Which trailing slot (0–3) the trickster occupies. Others are genuinely empty.
  const [tricksterSlot, setTricksterSlot] = useState(0);

  // Search pill: non-empty query dims every icon whose label doesn't match.
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const matches = (label: string) => q === '' || label.toLowerCase().includes(q);

  function handleOpen(id: string) {
    if (id === 'github') {
      openApp('safari', { url: 'https://github.com/joshuahawksworth' });
    } else if (id !== 'cv') {
      openApp(id);
    }
  }

  function moveTrickster() {
    // Only pick from the other 3 empty trailing slots — never touches base items
    const empties = [0, 1, 2, 3].filter((i) => i !== tricksterSlot);
    setTricksterSlot(empties[Math.floor(Math.random() * empties.length)]);
  }

  function iconClass(label: string, extra?: string) {
    return [styles.iconItem, extra, matches(label) ? '' : styles.iconItemDimmed]
      .filter(Boolean)
      .join(' ');
  }

  return (
    <div className={styles.screen}>
      <StatusBar />

      <div className={styles.homeScreen}>
        <div className={styles.iconGrid}>
          <NowWidget />

          {/* Fixed base items — positions never change */}
          {BASE_ITEMS.map((id) => {
            const label = APP_LABELS[id] ?? id;
            return (
              <button
                key={id}
                className={iconClass(label)}
                onClick={() =>
                  id === 'cv' ? window.open('/JoshuaHawksworthCV.pdf', '_blank') : handleOpen(id)
                }
              >
                <AppIcon appId={id} size={60} />
                <span className={styles.iconLabel}>{label}</span>
              </button>
            );
          })}

          {/* Trailing zone: 4 cells, only tricksterSlot is filled */}
          {Array.from({ length: TRAILING_SLOTS }, (_, i) =>
            i === tricksterSlot ? (
              <button
                key={`trickster-${tricksterSlot}`}
                className={iconClass(TRICKSTER_LABEL, styles.tricksterItem)}
                onPointerEnter={moveTrickster}
                onClick={(e) => e.preventDefault()}
              >
                <AppIcon appId="trickster" size={60} />
                <span className={styles.iconLabel}>{TRICKSTER_LABEL}</span>
              </button>
            ) : (
              <div
                key={`empty-${i}`}
                aria-hidden="true"
                style={{ visibility: 'hidden', pointerEvents: 'none' }}
                className={styles.iconItem}
              />
            )
          )}
        </div>
      </div>

      <div className={styles.searchRow}>
        <label className={styles.searchPill}>
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <circle cx="6.8" cy="6.8" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M10.4 10.4L14 14"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
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
        </label>
      </div>

      <div className={styles.dockWrap}>
        <div className={styles.dock}>
          {DOCK_APPS.map((id) => (
            <button
              key={id}
              className={styles.dockItem}
              onClick={() => handleOpen(id)}
              aria-label={APP_LABELS[id] ?? id}
            >
              <AppIcon appId={id} size={58} />
            </button>
          ))}
        </div>
      </div>

      <div className={`${styles.panel} ${activeWindow ? styles.panelOpen : ''}`}>
        {activeWindow && (
          <>
            <div className={styles.panelHeader}>
              <button className={styles.backBtn} onClick={() => closeWindow(activeWindow.id)}>
                <svg
                  viewBox="0 0 12 20"
                  width="12"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10.5 1.5L2 10l8.5 8.5" />
                </svg>
                <span>Back</span>
              </button>
              <span className={styles.panelTitle}>{activeWindow.title}</span>
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
