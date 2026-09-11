/**
 * The App Store (Microsoft Store on Windows): every app installed on this machine, with
 * an Open button that launches it. Ratings and blurbs are portfolio colour, not reviews.
 */
import { useMemo, useState } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { useOs } from '../../context/SettingsContext';
import { launchSystemApp, useSystemApps, type SystemApp } from '../SystemUI/systemApps';
import styles from './AppStoreApp.module.css';

const BLURB: Record<string, string> = {
  experience: 'Every role, one screen. Download the CV from anywhere.',
  skills: 'The stack, with the places each part was used.',
  about: 'Who Josh is and how to reach him.',
  askjosh: 'Ask anything about Josh’s work.',
  githubdesktop: 'Real repositories and commit history.',
  texteditor: 'Editing evolved, browser edition.',
  postman: 'Send real requests to the APIs behind this site.',
  outlook: 'Mail with the CMap Mail add-in side-loaded.',
  xcode: 'Build and run Arcus Engineer on the iOS Simulator.',
  androidstudio: 'The same app on the Android Emulator.',
  terminal: 'Type help. Then type spaceinvaders.',
  doom: 'It runs DOOM.',
  snake: 'A Nokia 3310, in your browser.',
  spotify: 'Looks the part. Plays nothing.',
  word: 'Write Markdown, print a document.',
  contact: 'Send Josh a message.',
  location: 'Manchester, on a map.',
  calculator: 'Scientific pad on wide windows.',
  imageviewer: 'Open any image from Finder.',
  finder: 'The file system behind the desktop.',
  settings: 'Every control does something.',
  safari: 'Real Google results, server-side proxy.',
  rubberduck: 'Explain your bug to it.',
  shortcuts: 'Keyboard shortcuts for this desktop.',
  trash: 'It remembers where things came from.',
  appstore: 'You are here.',
};

const CATEGORIES: { id: string; label: string; ids: string[] }[] = [
  { id: 'discover', label: 'Discover', ids: [] },
  {
    id: 'work',
    label: 'Work',
    ids: ['experience', 'skills', 'about', 'contact', 'outlook', 'word', 'location'],
  },
  {
    id: 'develop',
    label: 'Develop',
    ids: [
      'texteditor',
      'githubdesktop',
      'postman',
      'xcode',
      'androidstudio',
      'terminal',
      'askjosh',
    ],
  },
  { id: 'play', label: 'Play', ids: ['doom', 'snake', 'spotify', 'rubberduck'] },
  {
    id: 'utilities',
    label: 'Utilities',
    ids: ['finder', 'calculator', 'imageviewer', 'safari', 'settings', 'shortcuts'],
  },
];

function rating(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 1000;
  return 4 + (h % 10) / 10;
}

export default function AppStoreApp() {
  const { openApp } = useDesktop();
  const os = useOs();
  const apps = useSystemApps();
  const [category, setCategory] = useState('discover');
  const [query, setQuery] = useState('');
  const win = os === 'windows';

  const byId = useMemo(() => new Map(apps.map((a) => [a.id as string, a])), [apps]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q)
      return apps.filter((a) =>
        `${a.title} ${a.label} ${BLURB[a.id] ?? ''}`.toLowerCase().includes(q)
      );
    const cat = CATEGORIES.find((c) => c.id === category);
    if (!cat || cat.ids.length === 0) return apps;
    return cat.ids.map((id) => byId.get(id)).filter((a): a is SystemApp => !!a);
  }, [apps, byId, category, query]);

  const featured = ['experience', win ? 'androidstudio' : 'xcode', 'githubdesktop']
    .map((id) => byId.get(id))
    .filter((a): a is SystemApp => !!a);

  return (
    <div className={`${styles.root} ${win ? styles.win : ''}`}>
      <aside className={styles.sidebar}>
        <input
          className={styles.search}
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`${styles.navBtn} ${category === c.id && !query ? styles.navActive : ''}`}
            onClick={() => {
              setCategory(c.id);
              setQuery('');
            }}
          >
            {c.label}
          </button>
        ))}
        <div className={styles.sideFoot}>
          <span className={styles.avatar}>JH</span>
          <span>Joshua Hawksworth</span>
        </div>
      </aside>
      <main className={styles.main}>
        {category === 'discover' && !query && (
          <>
            <div className={styles.kicker}>Installed on this {win ? 'PC' : 'Mac'}</div>
            <div className={styles.featured}>
              {featured.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={styles.card}
                  onClick={() => launchSystemApp(a, openApp)}
                >
                  <span className={styles.cardIcon}>{a.icon}</span>
                  <span className={styles.cardText}>
                    <span className={styles.cardKicker}>Josh’s daily toolkit</span>
                    <span className={styles.cardTitle}>{a.title}</span>
                    <span className={styles.cardBlurb}>{BLURB[a.id]}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
        <div className={styles.kicker}>
          {query
            ? `Results for “${query.trim()}”`
            : CATEGORIES.find((c) => c.id === category)?.label}
        </div>
        <div className={styles.grid}>
          {shown.map((a) => (
            <div key={a.id} className={styles.row}>
              <span className={styles.rowIcon}>{a.icon}</span>
              <span className={styles.rowText}>
                <span className={styles.rowTitle}>{a.title}</span>
                <span className={styles.rowBlurb}>{BLURB[a.id] ?? 'Installed'}</span>
                <span className={styles.rowMeta}>★ {rating(a.id).toFixed(1)} · Free</span>
              </span>
              <button
                type="button"
                className={styles.openBtn}
                onClick={() => launchSystemApp(a, openApp)}
              >
                Open
              </button>
            </div>
          ))}
          {shown.length === 0 && <div className={styles.empty}>No apps match.</div>}
        </div>
        <div className={styles.foot}>
          Everything here is already installed — this store is a browser replica. The real{' '}
          {win ? 'Microsoft Store' : 'App Store'} lives on your own machine.
        </div>
      </main>
    </div>
  );
}
