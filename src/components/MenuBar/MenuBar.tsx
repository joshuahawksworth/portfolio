import { useEffect, useRef, useState } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { useTime } from '../../hooks/useTime';
import styles from './MenuBar.module.css';

type MenuName = 'File' | 'View' | 'Window' | 'Help';
type MenuItem = {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  action: () => void;
};

function Clock() {
  const time = useTime();
  return (
    <span className={styles.clock}>
      {time.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}{' '}
      {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

export default function MenuBar() {
  const { windows, focusedId, openApp, closeWindow, minimizeWindow, toggleMaximize } = useDesktop();
  const focusedWindow = windows.find((w) => w.id === focusedId);
  const appName = focusedWindow?.title ?? 'Finder';
  const [activeMenu, setActiveMenu] = useState<MenuName | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeMenus(e: PointerEvent) {
      if (barRef.current?.contains(e.target as Node)) return;
      setActiveMenu(null);
    }
    document.addEventListener('pointerdown', closeMenus);
    return () => document.removeEventListener('pointerdown', closeMenus);
  }, []);

  function runAction(item: MenuItem) {
    if (item.disabled) return;
    item.action();
    setActiveMenu(null);
  }

  const hasFocusedWindow = Boolean(focusedWindow && focusedId);
  const menus: Record<MenuName, MenuItem[]> = {
    File: [
      {
        label: 'New Finder Window',
        shortcut: 'Cmd+N',
        action: () => {
          openApp('finder', { menuOpenedAt: Date.now() });
        },
      },
      {
        label: 'Open Google Chrome',
        action: () => {
          openApp('safari');
        },
      },
      {
        label: 'Play Snake',
        action: () => {
          openApp('snake');
        },
      },
    ],
    View: [
      {
        label: 'Zoom Current Window',
        shortcut: 'Ctrl+Cmd+F',
        disabled: !hasFocusedWindow,
        action: () => {
          if (!focusedId) return;
          toggleMaximize(focusedId);
        },
      },
      {
        label: 'Show Skills',
        action: () => {
          openApp('skills');
        },
      },
      {
        label: 'Enable Retina Pixel Mode',
        action: () => undefined,
      },
    ],
    Window: [
      {
        label: 'Minimize Current',
        shortcut: 'Cmd+M',
        disabled: !hasFocusedWindow,
        action: () => {
          if (!focusedId) return;
          minimizeWindow(focusedId);
        },
      },
      {
        label: 'Close Current',
        shortcut: 'Cmd+W',
        disabled: !hasFocusedWindow,
        action: () => {
          if (!focusedId) return;
          closeWindow(focusedId);
        },
      },
      {
        label: 'Bring About Josh Forward',
        action: () => {
          openApp('about');
        },
      },
    ],
    Help: [
      {
        label: 'Keyboard Shortcuts',
        action: () => {
          openApp('shortcuts');
        },
      },
      {
        label: 'Ask The Rubber Duck',
        action: () => {
          openApp('rubberduck');
        },
      },
      {
        label: 'About This Portfolio',
        action: () => {
          openApp('about');
        },
      },
    ],
  };

  return (
    <div ref={barRef} className={styles.bar}>
      <title>{appName} — Josh Hawksworth</title>
      <div className={styles.left}>
        {/* JH logo — white square background, dark letters (yellow→white, dark→dark) */}
        <svg
          viewBox="0 0 212 212"
          width="16"
          height="16"
          className={styles.apple}
          aria-label="JH"
          style={{ borderRadius: 3 }}
        >
          {/* White square replacing the original yellow */}
          <rect width="212" height="212" fill="rgba(255,255,255,0.90)" rx="16" />
          {/* JH letters in dark — same as original logo but on white bg */}
          <path
            d="m 64.986601,198.54254 c 17.955449,0 30.263619,-9.55694 30.263619,-30.55323 V 98.773958 H 74.97794 v 68.925752 c 0,10.13614 -4.199258,12.74258 -10.860151,12.74258 -6.950496,0 -9.846536,-4.77847 -13.03218,-10.42575 l -16.507428,9.99134 c 4.778466,10.13614 14.190596,18.53466 30.40842,18.53466 z m 49.811939,-1.30322 h 20.27228 V 167.2653 h 42.13738 v 29.97402 h 20.27228 V 98.773958 H 177.2082 V 149.16505 H 135.07082 V 98.773958 h -20.27228 z"
            fill="#1a1a1a"
          />
        </svg>
        <span className={styles.appName}>{appName}</span>
        {(Object.keys(menus) as MenuName[]).map((m) => (
          <div key={m} className={styles.menuWrap}>
            <button
              type="button"
              className={`${styles.menu} ${activeMenu === m ? styles.menuActive : ''}`}
              onClick={() => setActiveMenu(activeMenu === m ? null : m)}
              aria-haspopup="menu"
              aria-expanded={activeMenu === m}
            >
              {m}
            </button>
            {activeMenu === m && (
              <div className={styles.dropdown} role="menu">
                {menus[m].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={styles.menuItem}
                    disabled={item.disabled}
                    onClick={() => runAction(item)}
                    role="menuitem"
                  >
                    <span>{item.label}</span>
                    {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={styles.right}>
        <svg className={styles.statusIcon} viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 12a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
          <path d="M4.5 9.5a4.9 4.9 0 017 0l-1.1 1.1a3.4 3.4 0 00-4.8 0L4.5 9.5z" />
          <path d="M1.5 6.5a8.5 8.5 0 0113 0L13.4 7.6a7 7 0 00-10.8 0L1.5 6.5z" />
        </svg>
        <svg
          className={styles.statusIcon}
          viewBox="0 0 22 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <rect x="0.5" y="0.5" width="18" height="11" rx="2.5" />
          <rect x="2" y="2" width="14" height="8" rx="1.5" fill="currentColor" stroke="none" />
          <path d="M19.5 4v4" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <Clock />
      </div>
    </div>
  );
}
