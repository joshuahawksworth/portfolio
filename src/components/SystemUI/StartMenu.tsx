import { useEffect, useMemo, useRef, useState } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { useSystemUI } from '../../context/SystemUIContext';
import { useSettings } from '../../context/SettingsContext';
import { useSession } from '../../context/SessionContext';
import { ROOT_IDS } from '../../data/fileSystemSeed';
import { openTargetFor } from '../../lib/openNode';
import { initialsOf } from '../../lib/settingsStore';
import { NodeIcon } from '../icons/NodeIcon';
import { launchSystemApp, searchSystemApps, useSystemApps, type SystemApp } from './systemApps';
import styles from './SystemUI.module.css';

/** Windows 11 Start menu: search, pinned apps, recommended files and the power menu. */
export default function StartMenu() {
  const { openApp, childrenOf, fs } = useDesktop();
  const { close } = useSystemUI();
  const { settings } = useSettings();
  const session = useSession();
  const [query, setQuery] = useState('');
  const [powerOpen, setPowerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const catalogue = useSystemApps();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const apps = useMemo(() => searchSystemApps(query, catalogue), [query, catalogue]);
  const recommended = useMemo(
    () =>
      [...childrenOf(ROOT_IDS.documents), ...childrenOf(ROOT_IDS.desktop)]
        .filter((n) => n.type === 'file' || n.type === 'image')
        .sort((a, b) => b.modifiedAt - a.modifiedAt)
        .slice(0, 6),
    [childrenOf]
  );

  function open(app: SystemApp) {
    launchSystemApp(app, openApp);
    close();
  }

  function openNode(id: string) {
    const target = openTargetFor(fs[id]);
    if (target.kind === 'url') window.open(target.url, '_blank');
    else if (target.kind === 'app') openApp(target.appId, target.props);
    close();
  }

  return (
    <div className={styles.popoverLayer}>
      <div
        className={`${styles.backdrop} ${styles.backdropAboveTaskbar}`}
        onMouseDown={close}
        aria-hidden="true"
      />
      <div className={`${styles.glass} ${styles.startMenu}`} role="dialog" aria-label="Start">
        <div className={styles.startSearch}>
          <svg
            viewBox="0 0 16 16"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="6.8" cy="6.8" r="4.6" />
            <path d="M10.4 10.4L14 14" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for apps, settings, and documents"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && apps[0]) open(apps[0]);
            }}
            aria-label="Search apps"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className={styles.startSectionHead}>
          <span>Pinned</span>
          <button type="button" className={styles.startAllBtn} onClick={() => setQuery('')}>
            All apps ›
          </button>
        </div>
        {apps.length === 0 ? (
          <div className={styles.empty}>No results for “{query.trim()}”</div>
        ) : (
          <div className={styles.startGrid}>
            {apps.map((app) => (
              <button
                key={app.id}
                type="button"
                className={styles.startApp}
                onClick={() => open(app)}
              >
                <span className={styles.startAppIcon} aria-hidden="true">
                  {app.icon}
                </span>
                <span className={styles.startAppLabel}>{app.label}</span>
              </button>
            ))}
          </div>
        )}

        {!query.trim() && (
          <>
            <div className={styles.startSectionHead}>
              <span>Recommended</span>
            </div>
            <div className={styles.startRecommended}>
              {recommended.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  className={styles.startRec}
                  onClick={() => openNode(node.id)}
                >
                  <span className={styles.startRecIcon} aria-hidden="true">
                    <NodeIcon node={node} size={28} />
                  </span>
                  <span className={styles.startRecText}>
                    <span className={styles.startRecName}>{node.name}</span>
                    <span className={styles.startRecHint}>
                      {new Date(node.modifiedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className={styles.startFooter}>
          <button
            type="button"
            className={styles.startUser}
            onClick={() => {
              openApp('settings', { pane: 'accounts' });
              close();
            }}
          >
            <span className={styles.startAvatar}>{initialsOf(settings.userName)}</span>
            <span>{settings.userName}</span>
          </button>
          <span className={styles.startPower}>
            <button
              type="button"
              className={styles.startPowerBtn}
              onClick={() => setPowerOpen((o) => !o)}
              aria-label="Power"
              aria-expanded={powerOpen}
            >
              <svg
                viewBox="0 0 16 16"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <path d="M8 2v6" />
                <path d="M4.5 4.6a5 5 0 1 0 7 0" />
              </svg>
            </button>
            {powerOpen && (
              <div className={styles.startPowerMenu}>
                <button type="button" onClick={session.lock}>
                  Lock
                </button>
                <button type="button" onClick={session.lock}>
                  Sleep
                </button>
                <button type="button" onClick={session.shutDown}>
                  Shut down
                </button>
                <button type="button" onClick={session.restart}>
                  Restart
                </button>
              </div>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
