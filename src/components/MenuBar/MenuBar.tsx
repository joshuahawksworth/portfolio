import { Fragment, useEffect, useRef, useState } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { useSystemUI } from '../../context/SystemUIContext';
import { useTime } from '../../hooks/useTime';
import styles from './MenuBar.module.css';

type MenuName = 'File' | 'Edit' | 'View' | 'Go' | 'Window' | 'Help';
type MenuItem = {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  divider?: boolean;
  action: () => void;
};

function Clock() {
  const time = useTime();
  const date = time.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const clock = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return (
    <span className={styles.clock} aria-label={`${date} ${clock}`}>
      <span>{date}</span>
      <span>{clock}</span>
    </span>
  );
}

const JH_PATH =
  'm 64.986601,198.54254 c 17.955449,0 30.263619,-9.55694 30.263619,-30.55323 V 98.773958 H 74.97794 v 68.925752 c 0,10.13614 -4.199258,12.74258 -10.860151,12.74258 -6.950496,0 -9.846536,-4.77847 -13.03218,-10.42575 l -16.507428,9.99134 c 4.778466,10.13614 14.190596,18.53466 30.40842,18.53466 z m 49.811939,-1.30322 h 20.27228 V 167.2653 h 42.13738 v 29.97402 h 20.27228 V 98.773958 H 177.2082 V 149.16505 H 135.07082 V 98.773958 h -20.27228 z';

export default function MenuBar() {
  const { windows, focusedId, openApp, closeWindow, minimizeWindow, toggleMaximize } = useDesktop();
  const systemUI = useSystemUI();
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
        shortcut: '⌘N',
        action: () => openApp('finder', { menuOpenedAt: Date.now() }),
      },
      { label: 'New Text Document', shortcut: '⇧⌘N', action: () => openApp('texteditor') },
      { label: 'Open Google Chrome', action: () => openApp('safari'), divider: true },
      { label: 'Open CV', action: () => window.open('/JoshuaHawksworthCV.pdf', '_blank') },
      {
        label: 'Close Window',
        shortcut: '⌘W',
        disabled: !hasFocusedWindow,
        divider: true,
        action: () => focusedId && closeWindow(focusedId),
      },
    ],
    Edit: [
      { label: 'Undo', shortcut: '⌘Z', disabled: true, action: () => {} },
      { label: 'Redo', shortcut: '⇧⌘Z', disabled: true, action: () => {} },
      { label: 'Cut', shortcut: '⌘X', disabled: true, divider: true, action: () => {} },
      { label: 'Copy', shortcut: '⌘C', disabled: true, action: () => {} },
      { label: 'Paste', shortcut: '⌘V', disabled: true, action: () => {} },
      { label: 'Select All', shortcut: '⌘A', disabled: true, action: () => {} },
    ],
    View: [
      {
        label: 'Zoom Current Window',
        shortcut: '⌃⌘F',
        disabled: !hasFocusedWindow,
        action: () => focusedId && toggleMaximize(focusedId),
      },
      { label: 'Show Launchpad', divider: true, action: () => systemUI.open('launchpad') },
      { label: 'Show Skills', action: () => openApp('skills') },
    ],
    Go: [
      { label: 'About Josh', action: () => openApp('about') },
      { label: 'Work Experience', action: () => openApp('experience') },
      { label: 'Skills & Tech', action: () => openApp('skills') },
      { label: 'Location', action: () => openApp('location') },
      { label: 'Contact', divider: true, action: () => openApp('contact') },
      {
        label: 'GitHub',
        action: () => openApp('githubapp', { url: 'https://github.com/joshuahawksworth' }),
      },
      { label: 'Terminal', shortcut: '⌥⌘T', divider: true, action: () => openApp('terminal') },
      { label: 'Play Snake', action: () => openApp('snake') },
      { label: 'Play DOOM', action: () => openApp('doom') },
    ],
    Window: [
      {
        label: 'Minimize',
        shortcut: '⌘M',
        disabled: !hasFocusedWindow,
        action: () => focusedId && minimizeWindow(focusedId),
      },
      {
        label: 'Zoom',
        disabled: !hasFocusedWindow,
        action: () => focusedId && toggleMaximize(focusedId),
      },
      { label: 'Bring All to Front', disabled: true, divider: true, action: () => {} },
      { label: 'Calculator', action: () => openApp('calculator') },
      { label: 'Text Editor', action: () => openApp('texteditor') },
    ],
    Help: [
      { label: 'Keyboard Shortcuts', action: () => openApp('shortcuts') },
      { label: 'Ask The Rubber Duck', action: () => openApp('rubberduck') },
      { label: 'About This Portfolio', divider: true, action: () => openApp('about') },
    ],
  };

  const menuNames = Object.keys(menus) as MenuName[];

  return (
    <div ref={barRef} className={styles.bar}>
      <title>{appName} — Josh Hawksworth</title>
      <div className={styles.left}>
        {/* JH logo stands in for the Apple menu */}
        <svg viewBox="0 0 212 212" className={styles.apple} aria-label="JH">
          <rect width="212" height="212" fill="#1c1a18" rx="40" />
          <path d={JH_PATH} fill="#fff" />
        </svg>
        <span className={styles.appName}>{appName}</span>
        {menuNames.map((m) => (
          <div key={m} className={styles.menuWrap}>
            <button
              type="button"
              className={`${styles.menu} ${activeMenu === m ? styles.menuActive : ''}`}
              onClick={() => setActiveMenu(activeMenu === m ? null : m)}
              onMouseEnter={() => activeMenu && activeMenu !== m && setActiveMenu(m)}
              aria-haspopup="menu"
              aria-expanded={activeMenu === m}
            >
              {m}
            </button>
            {activeMenu === m && (
              <div className={styles.dropdown} role="menu">
                {menus[m].map((item) => (
                  <Fragment key={item.label}>
                    {item.divider && <div className={styles.menuDivider} />}
                    <button
                      type="button"
                      className={styles.menuItem}
                      disabled={item.disabled}
                      onClick={() => runAction(item)}
                      role="menuitem"
                    >
                      <span>{item.label}</span>
                      {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
                    </button>
                  </Fragment>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={styles.right}>
        {/* Wi-Fi */}
        <button type="button" className={styles.statusBtn} aria-label="Wi-Fi" title="Wi-Fi">
          <svg className={styles.statusIcon} viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 12.2a1.4 1.4 0 110 2.8 1.4 1.4 0 010-2.8z" />
            <path d="M4.6 9.9a4.8 4.8 0 016.8 0l-1.05 1.05a3.3 3.3 0 00-4.7 0L4.6 9.9z" />
            <path d="M1.6 6.9a9 9 0 0112.8 0l-1.05 1.05a7.5 7.5 0 00-10.7 0L1.6 6.9z" />
          </svg>
        </button>
        {/* Battery */}
        <button type="button" className={styles.statusBtn} aria-label="Battery" title="Battery">
          <svg
            className={styles.statusIcon}
            viewBox="0 0 24 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
            style={{ width: 24 }}
          >
            <rect x="0.6" y="0.6" width="19" height="10.8" rx="3" opacity="0.5" />
            <rect
              x="2.2"
              y="2.2"
              width="15.8"
              height="7.6"
              rx="1.8"
              fill="currentColor"
              stroke="none"
            />
            <path d="M21.4 4.2v3.6" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
          </svg>
        </button>
        {/* Spotlight */}
        <button
          type="button"
          className={`${styles.statusBtn} ${systemUI.panel === 'spotlight' ? styles.statusActive : ''}`}
          aria-label="Spotlight Search"
          title="Spotlight Search"
          onClick={() => systemUI.toggle('spotlight')}
        >
          <svg
            className={styles.statusIcon}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          >
            <circle cx="6.8" cy="6.8" r="4.6" />
            <path d="M10.4 10.4L14 14" />
          </svg>
        </button>
        {/* Control Center */}
        <button
          type="button"
          className={`${styles.statusBtn} ${systemUI.panel === 'controlCenter' ? styles.statusActive : ''}`}
          aria-label="Control Center"
          title="Control Center"
          onClick={() => systemUI.toggle('controlCenter')}
        >
          <svg className={styles.statusIcon} viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="2.5" width="14" height="4.6" rx="2.3" opacity="0.9" />
            <circle cx="4.3" cy="4.8" r="1.5" fill="#fff" />
            <rect x="1" y="8.9" width="14" height="4.6" rx="2.3" opacity="0.9" />
            <circle cx="11.7" cy="11.2" r="1.5" fill="#fff" />
          </svg>
        </button>
        {/* Clock opens Notification Center like macOS */}
        <button
          type="button"
          className={`${styles.statusBtn} ${systemUI.panel === 'notificationCenter' ? styles.statusActive : ''}`}
          aria-label="Open Notification Center"
          onClick={() => systemUI.toggle('notificationCenter')}
          style={{ padding: 0, margin: 0 }}
        >
          <Clock />
        </button>
      </div>
    </div>
  );
}
