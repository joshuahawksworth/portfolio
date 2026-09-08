import { useEffect, useMemo, useRef, useState } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { useSystemUI } from '../../context/SystemUIContext';
import { launchSystemApp, searchSystemApps, useSystemApps, type SystemApp } from './systemApps';
import styles from './SystemUI.module.css';

export default function Launchpad() {
  const { openApp } = useDesktop();
  const { close } = useSystemUI();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const catalogue = useSystemApps();
  const apps = useMemo(() => searchSystemApps(query, catalogue), [query, catalogue]);

  function open(app: SystemApp) {
    launchSystemApp(app, openApp);
    close();
  }

  return (
    <div
      className={styles.launchpad}
      role="dialog"
      aria-label="Launchpad"
      onMouseDown={(e) => {
        // Backdrop click: only when the press lands on the overlay itself, not a child.
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className={styles.launchpadSearch}>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="6.8" cy="6.8" r="4.6" />
          <path d="M10.4 10.4L14 14" />
        </svg>
        <input
          ref={inputRef}
          className={styles.launchpadInput}
          type="text"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && apps[0]) {
              e.preventDefault();
              open(apps[0]);
            }
          }}
          autoComplete="off"
          spellCheck={false}
          aria-label="Search applications"
        />
      </div>

      {apps.length === 0 ? (
        <div className={styles.launchpadEmpty}>No results for “{query.trim()}”</div>
      ) : (
        <div
          className={styles.launchpadGrid}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          {apps.map((app) => (
            <button
              key={app.id}
              type="button"
              className={styles.launchpadApp}
              onClick={() => open(app)}
              aria-label={`Open ${app.label}`}
            >
              <span className={styles.launchpadIcon} aria-hidden="true">
                {app.icon}
              </span>
              <span className={styles.launchpadLabel}>{app.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
