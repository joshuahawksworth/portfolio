import { useState, useId } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { jobsData } from '../../data/experienceData';
import styles from './FinderApp.module.css';

type Section = 'desktop' | 'documents' | 'downloads' | 'applications';

interface FileItem { name: string; type: 'folder' | 'file' | 'app'; action?: () => void }

export default function FinderApp({ props }: { props?: Record<string, unknown> }) {
  const [section, setSection] = useState<Section>('desktop');
  const [folderStack, setFolderStack] = useState<Array<{ id: string; name: string }>>(() => {
    // If launched from a desktop folder double-click, start inside that folder
    if (props?.folderId && props?.folderName) {
      return [{ id: props.folderId as string, name: props.folderName as string }];
    }
    return [];
  });
  const { openApp, desktopFolders } = useDesktop();

  function enterFolder(id: string, name: string) {
    setFolderStack(prev => [...prev, { id, name }]);
  }

  function handleSectionChange(s: Section) {
    setSection(s);
    setFolderStack([]);
  }

  const inFolder      = folderStack.length > 0;
  const currentFolder = inFolder ? folderStack[folderStack.length - 1] : null;

  const SECTIONS: Record<Section, FileItem[]> = {
    desktop: [
      ...jobsData.map(j => ({
        name: j.company,
        type: 'app' as const,
        action: () => openApp('experience', { jobId: j.id, title: j.company }),
      })),
      ...desktopFolders.map(f => ({
        name: f.label,
        type: 'folder' as const,
        action: () => enterFolder(f.id, f.label),
      })),
    ],
    documents: [
      { name: 'README.md',    type: 'file' },
      { name: 'CV.pdf',       type: 'file', action: () => window.open('/JoshuaHawksworthCV.pdf', '_blank') },
      { name: 'Projects',     type: 'folder' },
      { name: 'Notes.txt',    type: 'file' },
    ],
    downloads: [
      { name: 'dotnet-blazor.pdf',  type: 'file' },
      { name: 'react-19-guide.pdf', type: 'file' },
    ],
    applications: [
      { name: 'About',      type: 'app', action: () => openApp('about') },
      { name: 'Experience', type: 'app', action: () => openApp('experience') },
      { name: 'Skills',     type: 'app', action: () => openApp('skills') },
      { name: 'Contact',    type: 'app', action: () => openApp('contact') },
      { name: 'Location',   type: 'app', action: () => openApp('location') },
      { name: 'Terminal',   type: 'app', action: () => openApp('terminal') },
      { name: 'Finder',     type: 'app' },
      { name: 'Trash',      type: 'app', action: () => openApp('trash') },
    ],
  };

  const SIDEBAR: { label: string; key: Section; icon: React.ReactNode }[] = [
    { label: 'Desktop',      key: 'desktop',      icon: <MonitorIcon /> },
    { label: 'Documents',    key: 'documents',    icon: <DocIcon /> },
    { label: 'Downloads',    key: 'downloads',    icon: <DownloadIcon /> },
    { label: 'Applications', key: 'applications', icon: <AppsIcon /> },
  ];

  const pathLabel = inFolder
    ? '~/Desktop/' + folderStack.map(f => f.name).join('/')
    : section === 'desktop'      ? '~/Desktop'
    : section === 'documents'    ? '~/Documents'
    : section === 'downloads'    ? '~/Downloads'
    : '/Applications';

  const displayItems = inFolder ? [] : SECTIONS[section];

  return (
    <div className={styles.root}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <p className={styles.sidebarSection}>Favourites</p>
        {SIDEBAR.map(s => (
          <button
            key={s.key}
            className={`${styles.sidebarBtn} ${section === s.key ? styles.active : ''}`}
            onClick={() => handleSectionChange(s.key)}
          >
            <span className={styles.sidebarIcon}>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </aside>

      {/* Main */}
      <main className={styles.main}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <button
            className={styles.toolBtn}
            disabled={!inFolder}
            onClick={() => setFolderStack(prev => prev.slice(0, -1))}
            title="Back"
          >
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8 2L4 6l4 4"/></svg>
          </button>
          <button className={styles.toolBtn} disabled>
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 2l4 4-4 4"/></svg>
          </button>
          <span className={styles.toolbarPath}>{pathLabel}</span>
          <div className={styles.viewToggle}>
            <button className={`${styles.viewBtn} ${styles.viewActive}`}>
              <svg viewBox="0 0 12 12" fill="currentColor"><rect x="0" y="0" width="5" height="5" rx="1"/><rect x="7" y="0" width="5" height="5" rx="1"/><rect x="0" y="7" width="5" height="5" rx="1"/><rect x="7" y="7" width="5" height="5" rx="1"/></svg>
            </button>
            <button className={styles.viewBtn}>
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M0 3h12M0 6h12M0 9h12"/></svg>
            </button>
          </div>
        </div>

        {/* Files grid — or empty folder message */}
        {inFolder ? (
          <div className={styles.emptyFolder}>
            <svg viewBox="0 0 52 44" fill="none" width="52" height="44" style={{ opacity: 0.3 }}>
              <path d="M2 9Q2 5 6 5L20 5L24 9L47 9Q49 9 49 11L49 38Q49 40 47 40L5 40Q3 40 3 38Z" fill="#4a9eff"/>
              <path d="M2 9Q2 5 6 5L20 5L24 9L47 9Q49 9 49 11L49 14L2 14Z" fill="#5aabff" opacity="0.5"/>
            </svg>
            <span className={styles.emptyFolderLabel}>
              {currentFolder?.name ?? 'Folder'} is empty
            </span>
          </div>
        ) : (
          <div className={styles.grid}>
            {displayItems.map((item, i) => (
              <div
                key={i}
                className={`${styles.item} ${item.action ? styles.itemClickable : ''}`}
                onClick={item.action}
                title={item.name}
              >
                <div className={styles.itemIcon}>
                  {item.type === 'folder' ? <FolderIcon /> :
                   item.type === 'app'    ? <AppIcon name={item.name} /> :
                   <FileIcon name={item.name} />}
                </div>
                <span className={styles.itemName}>{item.name}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/* ── Sidebar icons ─────────────────────────── */
function MonitorIcon() {
  return <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="2" width="12" height="9" rx="1.5"/><path d="M5 13h4M7 11v2"/></svg>;
}
function DocIcon() {
  return <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="1" width="10" height="12" rx="1.5"/><path d="M5 5h4M5 8h4M5 11h2"/></svg>;
}
function DownloadIcon() {
  return <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 2v7M4 6l3 3 3-3"/><path d="M2 11h10"/></svg>;
}
function AppsIcon() {
  return <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="8" y="1" width="5" height="5" rx="1"/><rect x="1" y="8" width="5" height="5" rx="1"/><rect x="8" y="8" width="5" height="5" rx="1"/></svg>;
}

/* ── File icons ────────────────────────────── */
function FolderIcon() {
  return (
    <svg viewBox="0 0 52 44" fill="none" width="44" height="44">
      <path d="M2 9Q2 5 6 5L20 5L24 9L47 9Q49 9 49 11L49 38Q49 40 47 40L5 40Q3 40 3 38Z" fill="#4a9eff" opacity="0.9"/>
      <path d="M2 9Q2 5 6 5L20 5L24 9L47 9Q49 9 49 11L49 14L2 14Z" fill="#5aabff" opacity="0.5"/>
    </svg>
  );
}

const EXT_COLORS: Record<string, string> = {
  PDF: '#ef4444', MD: '#10b981', TXT: '#6b7280', JS: '#f59e0b', TS: '#3b82f6',
};

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toUpperCase() ?? 'TXT';
  const color = EXT_COLORS[ext] ?? '#6b7280';
  return (
    <svg viewBox="0 0 44 52" fill="none" width="44" height="44">
      <rect x="2" y="2" width="40" height="48" rx="4" fill="#1e2030" stroke={color} strokeWidth="1.5"/>
      <path d="M28 2L42 16" stroke={color} strokeWidth="1.5"/>
      <path d="M28 2L28 16L42 16" fill={color} opacity="0.25"/>
      <text x="22" y="36" textAnchor="middle" fill={color} fontSize="9" fontWeight="700"
        fontFamily="-apple-system, 'SF Mono', monospace">{ext}</text>
    </svg>
  );
}

const APP_GRADS: Record<string, [string, string]> = {
  About:['#4f8ef7','#1e4fc4'], Experience:['#f59e0b','#b45309'],
  Skills:['#a855f7','#6d28d9'], Contact:['#3b82f6','#1d4ed8'],
  Location:['#10b981','#047857'], Terminal:['#1c1c22','#2a2a35'],
  Finder:['#5ac8fa','#007aff'], Trash:['#6b7280','#374151'],
  'CMap Software':['#2563eb','#1e40af'], '17 Oranges':['#ea580c','#c2410c'],
  'The Access Group':['#7c3aed','#5b21b6'], 'The Drawing Room Creative':['#0d9488','#0f766e'],
  'Langley Foxall':['#0ea5e9','#0284c7'], 'eDynamix':['#dc2626','#b91c1c'],
};

function AppIcon({ name }: { name: string }) {
  // Strip colons from useId() output — colons are invalid XML ID characters
  // and cause SVG gradient url(#...) lookups to fail in Firefox.
  const uid  = useId().replace(/:/g, '');
  const [c1, c2] = APP_GRADS[name] ?? ['#3b82f6','#1d4ed8'];
  const initials = name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const gId  = `${uid}g`;
  const ggId = `${uid}gg`;
  return (
    <svg viewBox="0 0 44 44" fill="none" width="44" height="44">
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="44" y2="44">
          <stop stopColor={c1}/><stop offset="1" stopColor={c2}/>
        </linearGradient>
        <linearGradient id={ggId} x1="0" y1="0" x2="0" y2="22">
          <stop stopColor="rgba(255,255,255,0.18)"/><stop offset="1" stopColor="transparent"/>
        </linearGradient>
      </defs>
      <rect width="44" height="44" rx="11" fill={`url(#${gId})`}/>
      <rect width="44" height="22" rx="11" fill={`url(#${ggId})`}/>
      {/* cross-browser safe font stack — no -apple-system in Firefox */}
      <text x="22" y="29" textAnchor="middle" fill="white" fontSize="16" fontWeight="700"
        fontFamily="'Helvetica Neue', Arial, Helvetica, sans-serif" opacity="0.92">{initials}</text>
    </svg>
  );
}
