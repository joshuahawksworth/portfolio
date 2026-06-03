import { useState, useId, useRef } from 'react';
import { useDesktop, DesktopFolderItem } from '../../context/DesktopContext';
import { useLiquidMode } from '../../context/LiquidModeContext';
import { jobsData } from '../../data/experienceData';
import { FINDER_FILE_CONTENTS } from './TextEditorApp';
import styles from './FinderApp.module.css';

type Section = 'desktop' | 'documents' | 'downloads' | 'applications';

interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'app' | 'image';
  action?: () => void;
  deletable?: boolean;
  logo?: string;  // company logo URL for job items
  appId?: string; // for special per-app icon rendering (doom, snake…)
  dataUrl?: string; // for image thumbnails
}

// ── Uploaded file store (module-level so it survives re-mounts) ────────────
interface UploadedFile { id: string; name: string; content: string; dataUrl?: string }
const uploadedFiles: UploadedFile[] = [];

export default function FinderApp({ props }: { props?: Record<string, unknown> }) {
  const [section, setSection] = useState<Section>('desktop');
  const [folderStack, setFolderStack] = useState<Array<{ id: string; name: string }>>(() => {
    if (props?.folderId && props?.folderName) {
      return [{ id: props.folderId as string, name: props.folderName as string }];
    }
    return [];
  });
  const { openApp, desktopFolders, desktopFiles, customFolderItems, moveFromFolderToDesktop, queueUploadedFile } = useDesktop();
  const liquid = useLiquidMode();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; itemId?: string } | null>(null);
  const [docFolders, setDocFolders] = useState<Array<{ id: string; name: string }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploads, setUploads] = useState<UploadedFile[]>(uploadedFiles);
  const uploadRef = useRef<HTMLInputElement>(null);

  function enterFolder(id: string, name: string) {
    setFolderStack((prev) => [...prev, { id, name }]);
    setSelected(new Set());
    setCtxMenu(null);
    setSearchQuery('');
  }

  function handleSectionChange(s: Section) {
    setSection(s); setFolderStack([]); setSelected(new Set()); setCtxMenu(null); setSearchQuery('');
  }

  const inFolder = folderStack.length > 0;
  const currentFolder = inFolder ? folderStack[folderStack.length - 1] : null;

  // Open a file in the appropriate viewer
  function openFile(id: string, name: string) {
    // Check uploaded files first — may be image or text
    const up = uploads.find((u) => u.id === id || `upload-${u.id}` === id || u.id === `upload-${id}`);
    if (up) {
      if (up.dataUrl) {
        openApp('imageviewer', { filename: up.name, dataUrl: up.dataUrl });
      } else {
        openApp('texteditor', { fileId: up.id, filename: up.name, content: up.content });
      }
      return;
    }
    // Known static Finder files
    const known = FINDER_FILE_CONTENTS[id];
    if (known) {
      openApp('texteditor', { fileId: id, filename: known.filename, content: known.content });
      return;
    }
    openApp('texteditor', { fileId: id, filename: name, content: `// ${name}\n` });
  }

  // Contents of built-in navigable folders
  const FOLDER_CONTENTS: Record<string, FileItem[]> = {
    'doc-proj': [
      { id: 'proj-cmap',     name: 'cmap-mail',   type: 'folder', action: () => enterFolder('proj-cmap', 'cmap-mail') },
      { id: 'proj-kwando',   name: 'kwando',      type: 'folder', action: () => enterFolder('proj-kwando', 'kwando') },
      { id: 'proj-orderbee', name: 'orderbee',    type: 'folder', action: () => enterFolder('proj-orderbee', 'orderbee') },
      { id: 'proj-tofs',     name: 'tofs-app',    type: 'folder', action: () => enterFolder('proj-tofs', 'tofs-app') },
      { id: 'proj-ciclo',    name: 'ciclozone',   type: 'folder', action: () => enterFolder('proj-ciclo', 'ciclozone') },
      { id: 'proj-web',      name: 'webmaster',   type: 'folder', action: () => enterFolder('proj-web', 'webmaster') },
    ],
    'proj-cmap':     [{ id: 'cmap-readme', name: 'README.md', type: 'file', action: () => openFile('cmap-readme','README.md') }, { id: 'cmap-pkg', name: 'package.json', type: 'file', action: () => openFile('cmap-pkg','package.json') }, { id: 'cmap-src', name: 'src', type: 'folder', action: () => enterFolder('cmap-src', 'src') }],
    'cmap-src':      [{ id: 'cmap-src-dir', name: 'src/', type: 'file', action: () => openFile('cmap-src','src/') }],
    'proj-kwando':   [{ id: 'kwa-readme', name: 'README.md', type: 'file', action: () => openFile('kwa-readme','README.md') }, { id: 'kwa-app', name: 'App.tsx', type: 'file', action: () => openFile('kwa-app','App.tsx') }],
    'proj-orderbee': [{ id: 'ord-readme', name: 'README.md', type: 'file', action: () => openFile('ord-readme','README.md') }, { id: 'ord-index', name: 'index.js', type: 'file', action: () => openFile('ord-index','index.js') }],
    'proj-tofs':     [{ id: 'tofs-readme', name: 'README.md', type: 'file', action: () => openFile('tofs-readme','README.md') }, { id: 'tofs-src', name: 'src', type: 'folder', action: () => enterFolder('tofs-src', 'src') }],
    'tofs-src':      [{ id: 'tofs-src-dir', name: 'src/', type: 'file', action: () => openFile('tofs-src','src/') }],
    'proj-ciclo':    [{ id: 'ciclo-readme', name: 'README.md', type: 'file', action: () => openFile('ciclo-readme','README.md') }],
    'proj-web':      [{ id: 'web-readme', name: 'README.md', type: 'file', action: () => openFile('web-readme','README.md') }, { id: 'web-index', name: 'index.html', type: 'file', action: () => openFile('web-index','index.html') }],
  };

  // Build items for custom desktop folders (drag-and-dropped icons)
  function buildCustomFolderItems(folderId: string): FileItem[] {
    const items: DesktopFolderItem[] = customFolderItems[folderId] ?? [];
    return items.map((item): FileItem => {
      const job = item.jobId ? jobsData.find((j) => j.id === item.jobId) : undefined;
      return {
        id: item.id,
        name: item.label,
        type: item.type === 'job' ? 'app' : item.type === 'app' ? 'app' : item.type,
        logo: job?.logo,
        appId: item.appId,
        action: item.type === 'job' && item.jobId
          ? () => openApp('experience', { jobId: item.jobId, title: item.label })
          : item.type === 'app' && item.appId
            ? () => openApp(item.appId!)
            : item.type === 'file'
              ? () => openApp('texteditor', { fileId: item.id, filename: item.label, content: item.content ?? '' })
              : item.type === 'image'
                ? () => openApp('imageviewer', { filename: item.label, dataUrl: item.dataUrl ?? '' })
                : undefined,
      };
    });
  }

  const SECTIONS: Record<Section, FileItem[]> = {
    desktop: [
      ...jobsData.map((j) => ({
        id: `job-${j.id}`,
        name: j.company,
        type: 'app' as const,
        logo: j.logo,
        appId: undefined as string | undefined,
        action: () => openApp('experience', { jobId: j.id, title: j.company }),
      })),
      ...desktopFolders.map((f) => ({
        id: `folder-${f.id}`,
        name: f.label,
        type: 'folder' as const,
        action: () => enterFolder(f.id, f.label),
      })),
      ...desktopFiles.map((f) => ({
        id: f.id,
        name: f.label,
        type: f.type as 'file' | 'image',
        dataUrl: f.dataUrl,
        action: f.type === 'image'
          ? () => openApp('imageviewer', { filename: f.label, dataUrl: f.dataUrl ?? '' })
          : () => openApp('texteditor', { fileId: f.id, filename: f.label, content: f.content ?? '' }),
      })),
    ],
    documents: [
      { id: 'doc-readme', name: 'README.md', type: 'file' as const, action: () => openFile('doc-readme','README.md') },
      { id: 'doc-cv', name: 'CV.pdf', type: 'file' as const, action: () => window.open('/JoshuaHawksworthCV.pdf', '_blank') },
      { id: 'doc-proj', name: 'Projects', type: 'folder' as const, action: () => enterFolder('doc-proj', 'Projects') },
      { id: 'doc-notes', name: 'Notes.txt', type: 'file' as const, action: () => openFile('doc-notes','Notes.txt') },
      ...docFolders.map(f => ({ id: `userfolder-${f.id}`, name: f.name, type: 'folder' as const, action: () => enterFolder(`userfolder-${f.id}`, f.name) })),
      ...uploads.map(u => ({
        id: u.id,
        name: u.name,
        type: (u.dataUrl ? 'image' : 'file') as 'image' | 'file',
        dataUrl: u.dataUrl,
        action: () => openFile(u.id, u.name),
      })),
    ],
    downloads: [
      { id: 'dl-blazor', name: 'dotnet-blazor.pdf', type: 'file' as const, action: () => openFile('dl-blazor','dotnet-blazor.pdf') },
      { id: 'dl-react',  name: 'react-19-guide.pdf', type: 'file' as const, action: () => openFile('dl-react','react-19-guide.pdf') },
    ],
    applications: [
      { id: 'app-about',  name: 'About.app',      type: 'app' as const, action: () => openApp('about') },
      { id: 'app-exp',    name: 'Experience.app', type: 'app' as const, action: () => openApp('experience') },
      { id: 'app-skills', name: 'Skills.app',     type: 'app' as const, action: () => openApp('skills') },
      { id: 'app-contact',name: 'Contact.app',    type: 'app' as const, action: () => openApp('contact') },
      { id: 'app-loc',    name: 'Location.app',   type: 'app' as const, action: () => openApp('location') },
      { id: 'app-term',   name: 'Terminal.app',   type: 'app' as const, action: () => openApp('terminal') },
      { id: 'app-editor', name: 'TextEditor.app', type: 'app' as const, action: () => openApp('texteditor') },
      { id: 'app-safari', name: 'Safari.app',     type: 'app' as const, action: () => openApp('safari') },
      { id: 'app-finder', name: 'Finder.app',     type: 'app' as const },
      { id: 'app-trash',  name: 'Trash.app',      type: 'app' as const, action: () => openApp('trash') },
    ],
  };

  function createNewFolder() {
    const id = `${Date.now()}`;
    setDocFolders(prev => [...prev, { id, name: 'New Folder' }]);
    setCtxMenu(null);
  }

  // File upload handler — adds icon to desktop AND to local Finder list
  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach(file => {
      const id = `upload-${file.name}-${Date.now()}`;
      const isText  = /\.(txt|md|js|ts|tsx|jsx|json|html|css|csv|xml|yaml|yml|sh|py|rb|go|rs|php|java|c|cpp|h|swift)$/i.test(file.name);
      const isImage = file.type.startsWith('image/');
      const reader  = new FileReader();

      if (isText) {
        reader.onload = (ev) => {
          const content = ev.target?.result as string ?? '';
          const entry: UploadedFile = { id, name: file.name, content };
          uploadedFiles.push(entry);
          setUploads([...uploadedFiles]);
          queueUploadedFile({ id, name: file.name, content, isImage: false });
        };
        reader.readAsText(file);
      } else if (isImage) {
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string ?? '';
          const entry: UploadedFile = { id, name: file.name, content: '', dataUrl };
          uploadedFiles.push(entry);
          setUploads([...uploadedFiles]);
          queueUploadedFile({ id, name: file.name, content: '', dataUrl, isImage: true });
        };
        reader.readAsDataURL(file);
      } else {
        const content = `[Binary file: ${file.name}]\nSize: ${(file.size / 1024).toFixed(1)} KB\nType: ${file.type || 'unknown'}`;
        const entry: UploadedFile = { id, name: file.name, content };
        uploadedFiles.push(entry);
        setUploads([...uploadedFiles]);
        queueUploadedFile({ id, name: file.name, content, isImage: false });
      }
    });
    if (uploadRef.current) uploadRef.current.value = '';
  }

  const SIDEBAR: { label: string; key: Section; icon: React.ReactNode }[] = [
    { label: 'Desktop',      key: 'desktop',      icon: <MonitorIcon /> },
    { label: 'Documents',    key: 'documents',    icon: <DocIcon /> },
    { label: 'Downloads',    key: 'downloads',    icon: <DownloadIcon /> },
    { label: 'Applications', key: 'applications', icon: <AppsIcon /> },
  ];

  const sectionRoot = section === 'desktop' ? '~/Desktop' : section === 'documents' ? '~/Documents' : section === 'downloads' ? '~/Downloads' : '/Applications';
  const pathLabel = inFolder ? sectionRoot + '/' + folderStack.map(f => f.name).join('/') : sectionRoot;

  // Determine items for the current view
  let baseItems: FileItem[];
  if (inFolder) {
    const cid = currentFolder?.id ?? '';
    // Check custom desktop folder items first (drag-and-dropped)
    const customItems = buildCustomFolderItems(cid);
    if (customItems.length > 0) {
      baseItems = customItems;
    } else if (FOLDER_CONTENTS[cid]) {
      baseItems = FOLDER_CONTENTS[cid];
    } else {
      baseItems = [];
    }
  } else {
    baseItems = SECTIONS[section];
  }

  // Apply search filter
  const displayItems = searchQuery.trim()
    ? baseItems.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : baseItems;

  return (
    <div className={`${styles.root} ${liquid ? styles.liquidRoot : ''}`}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <p className={styles.sidebarSection}>Favourites</p>
        {SIDEBAR.map((s) => (
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
            onClick={() => { setFolderStack((prev) => prev.slice(0, -1)); setSearchQuery(''); }}
            title="Back"
          >
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M8 2L4 6l4 4" />
            </svg>
          </button>
          <button className={styles.toolBtn} disabled>
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 2l4 4-4 4" />
            </svg>
          </button>
          <span className={styles.toolbarPath}>{pathLabel}</span>

          {/* Search */}
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <circle cx="5" cy="5" r="3.5"/>
              <path d="M7.5 7.5L10 10"/>
            </svg>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className={styles.searchClear} onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>

          {/* Upload button */}
          <button
            className={`${styles.toolBtn} ${styles.uploadBtn}`}
            title="Upload file"
            onClick={() => uploadRef.current?.click()}
          >
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2v6M3.5 4.5L6 2l2.5 2.5"/>
              <path d="M2 9h8"/>
            </svg>
          </button>
          <input
            ref={uploadRef}
            type="file"
            multiple
            className={styles.hiddenInput}
            onChange={handleUpload}
            accept=".txt,.md,.js,.ts,.tsx,.jsx,.json,.html,.css,.csv,.xml,.yaml,.yml,.sh,.py,.rb,.go,.rs,.php,.java,.c,.cpp,.h,.swift,.pdf,.png,.jpg,.jpeg,.gif,.webp"
          />

          <div className={styles.viewToggle}>
            <button className={`${styles.viewBtn} ${styles.viewActive}`}>
              <svg viewBox="0 0 12 12" fill="currentColor">
                <rect x="0" y="0" width="5" height="5" rx="1" />
                <rect x="7" y="0" width="5" height="5" rx="1" />
                <rect x="0" y="7" width="5" height="5" rx="1" />
                <rect x="7" y="7" width="5" height="5" rx="1" />
              </svg>
            </button>
            <button className={styles.viewBtn}>
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M0 3h12M0 6h12M0 9h12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Files grid — or empty state */}
        {inFolder && displayItems.length === 0 ? (
          <div className={styles.emptyFolder}>
            <svg viewBox="0 0 52 44" fill="none" width="52" height="44" style={{ opacity: 0.3 }}>
              <path d="M2 9Q2 5 6 5L20 5L24 9L47 9Q49 9 49 11L49 38Q49 40 47 40L5 40Q3 40 3 38Z" fill="#4a9eff"/>
              <path d="M2 9Q2 5 6 5L20 5L24 9L47 9Q49 9 49 11L49 14L2 14Z" fill="#5aabff" opacity="0.5"/>
            </svg>
            <span className={styles.emptyFolderLabel}>
              {searchQuery ? `No results for "${searchQuery}"` : (currentFolder?.name ?? 'Folder') + ' is empty'}
            </span>
          </div>
        ) : !inFolder && displayItems.length === 0 && searchQuery ? (
          <div className={styles.emptyFolder}>
            <span className={styles.emptyFolderLabel}>No results for "{searchQuery}"</span>
          </div>
        ) : (
          <div
            className={styles.grid}
            onClick={() => { setSelected(new Set()); setCtxMenu(null); }}
            onContextMenu={(e) => {
              e.stopPropagation();
              if (e.target === e.currentTarget) {
                e.preventDefault();
                setCtxMenu({ x: e.clientX, y: e.clientY });
              }
            }}
          >
            {displayItems.map((item) => {
              const isSelected = selected.has(item.id);
              // Items inside a custom desktop folder can be dragged back to the desktop
              const isDraggableToDesktop = section === 'desktop' && inFolder && !!currentFolder;
              return (
                <div
                  key={item.id}
                  className={[
                    styles.item,
                    item.action ? styles.itemClickable : '',
                    isSelected ? styles.itemSelected : '',
                  ].join(' ')}
                  draggable={isDraggableToDesktop}
                  onDragStart={isDraggableToDesktop ? (e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData(
                      'application/finder-item',
                      JSON.stringify({ folderId: currentFolder!.id, itemId: item.id })
                    );
                    setSelected(new Set([item.id]));
                  } : undefined}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (e.shiftKey || e.metaKey || e.ctrlKey) {
                      setSelected((prev) => {
                        const n = new Set(prev);
                        n.has(item.id) ? n.delete(item.id) : n.add(item.id);
                        return n;
                      });
                    } else {
                      setSelected(new Set([item.id]));
                      if (item.type === 'folder') item.action?.();
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (item.type !== 'folder') item.action?.();
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!selected.has(item.id)) setSelected(new Set([item.id]));
                    setCtxMenu({ x: e.clientX, y: e.clientY, itemId: item.id });
                  }}
                  title={item.name}
                >
                  <div className={styles.itemIcon}>
                    {item.type === 'folder' ? (
                      <FolderIcon />
                    ) : item.type === 'app' && item.logo ? (
                      <img src={item.logo} alt={item.name} width="44" height="44"
                        style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'contain', background: 'rgba(255,255,255,0.08)', padding: 3, boxSizing: 'border-box' }} />
                    ) : item.type === 'app' && item.appId === 'doom' ? (
                      <img src="/doom-icon.png" alt="DOOM" width="44" height="44"
                        style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />
                    ) : item.type === 'app' && item.appId === 'snake' ? (
                      <NokiaFinderIcon />
                    ) : item.type === 'image' && item.dataUrl ? (
                      <img src={item.dataUrl} alt={item.name}
                        style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', display: 'block' }} />
                    ) : item.type === 'image' ? (
                      <FileIcon name={item.name} />
                    ) : item.type === 'app' ? (
                      <AppIcon name={item.name} />
                    ) : (
                      <FileIcon name={item.name} />
                    )}
                  </div>
                  <span className={styles.itemName}>{item.name}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Finder context menu */}
        {ctxMenu &&
          (() => {
            const targetItem = ctxMenu.itemId
              ? displayItems.find((i) => i.id === ctxMenu.itemId)
              : null;
            return (
              <div
                className={styles.ctxMenu}
                style={{
                  left: Math.min(ctxMenu.x, window.innerWidth - 180),
                  top: Math.min(ctxMenu.y, window.innerHeight - 150),
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onContextMenu={(e) => e.preventDefault()}
              >
                {targetItem ? (
                  <>
                    {targetItem.action && (
                      <>
                        <button className={styles.ctxItem} onClick={() => { targetItem.action?.(); setCtxMenu(null); }}>
                          Open
                        </button>
                        <div className={styles.ctxSep} />
                      </>
                    )}
                    {/* Move back to desktop when inside a custom desktop folder */}
                    {section === 'desktop' && inFolder && currentFolder && (
                      <>
                        <button className={styles.ctxItem} onClick={() => {
                          moveFromFolderToDesktop(currentFolder.id, targetItem.id);
                          setCtxMenu(null);
                        }}>
                          Move to Desktop
                        </button>
                        <div className={styles.ctxSep} />
                      </>
                    )}
                    <button className={styles.ctxItem} onClick={() => {
                      setSelected(new Set(Array.from(selected).filter(id => displayItems.some(i => i.id === id))));
                      setCtxMenu(null);
                    }}>
                      {selected.size > 1 ? `Select All (${selected.size})` : 'Select'}
                    </button>
                  </>
                ) : (
                  <>
                    {section === 'documents' && !inFolder && (
                      <>
                        <button className={styles.ctxItem} onClick={createNewFolder}>
                          New Folder
                        </button>
                        <button className={styles.ctxItem} onClick={() => uploadRef.current?.click()}>
                          Upload File…
                        </button>
                        <div className={styles.ctxSep} />
                      </>
                    )}
                    <button className={styles.ctxItem} onClick={() => {
                      setSelected(new Set(displayItems.map(i => i.id)));
                      setCtxMenu(null);
                    }}>
                      Select All
                    </button>
                  </>
                )}
              </div>
            );
          })()}
      </main>
    </div>
  );
}

/* ── Sidebar icons ─────────────────────────────────────────────────── */
function MonitorIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="2" width="12" height="9" rx="1.5" />
      <path d="M5 13h4M7 11v2" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="1" width="10" height="12" rx="1.5" />
      <path d="M5 5h4M5 8h4M5 11h2" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 2v7M4 6l3 3 3-3" />
      <path d="M2 11h10" />
    </svg>
  );
}
function AppsIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1" y="1" width="5" height="5" rx="1" />
      <rect x="8" y="1" width="5" height="5" rx="1" />
      <rect x="1" y="8" width="5" height="5" rx="1" />
      <rect x="8" y="8" width="5" height="5" rx="1" />
    </svg>
  );
}

/* ── File icons ──────────────────────────────────────────────────────── */
function FolderIcon() {
  return (
    <svg viewBox="0 0 52 44" fill="none" width="44" height="44">
      <path d="M2 9Q2 5 6 5L20 5L24 9L47 9Q49 9 49 11L49 38Q49 40 47 40L5 40Q3 40 3 38Z" fill="#4a9eff" opacity="0.9"/>
      <path d="M2 9Q2 5 6 5L20 5L24 9L47 9Q49 9 49 11L49 14L2 14Z" fill="#5aabff" opacity="0.5"/>
    </svg>
  );
}

const EXT_COLORS: Record<string, string> = {
  PDF: '#ef4444',
  MD: '#10b981',
  TXT: '#6b7280',
  JS: '#f59e0b',
  TS: '#3b82f6',
  TSX: '#3b82f6',
  JSX: '#f59e0b',
  JSON: '#8b5cf6',
  HTML: '#e44d26',
  CSS: '#2563eb',
  PNG: '#06b6d4',
  JPG: '#06b6d4',
  JPEG: '#06b6d4',
  GIF: '#06b6d4',
  WEBP: '#06b6d4',
};

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toUpperCase() ?? 'TXT';
  const color = EXT_COLORS[ext] ?? '#6b7280';
  return (
    <svg viewBox="0 0 44 52" fill="none" width="44" height="44">
      <rect x="2" y="2" width="40" height="48" rx="4" fill="#1e2030" stroke={color} strokeWidth="1.5"/>
      <path d="M28 2L42 16" stroke={color} strokeWidth="1.5"/>
      <path d="M28 2L28 16L42 16" fill={color} opacity="0.25"/>
      <text x="22" y="36" textAnchor="middle" fill={color} fontSize="9" fontWeight="700" fontFamily="-apple-system, 'SF Mono', monospace">
        {ext.slice(0, 4)}
      </text>
    </svg>
  );
}

const APP_GRADS: Record<string, [string, string]> = {
  About: ['#4f8ef7', '#1e4fc4'],
  Experience: ['#f59e0b', '#b45309'],
  Skills: ['#a855f7', '#6d28d9'],
  Contact: ['#3b82f6', '#1d4ed8'],
  Location: ['#10b981', '#047857'],
  Terminal: ['#1c1c22', '#2a2a35'],
  'TextEditor': ['#272822', '#4c96d7'],
  Finder: ['#5ac8fa', '#007aff'],
  Trash: ['#6b7280', '#374151'],
  'CMap Software': ['#2563eb', '#1e40af'],
  '17 Oranges': ['#ea580c', '#c2410c'],
  'The Access Group': ['#7c3aed', '#5b21b6'],
  'The Drawing Room Creative': ['#0d9488', '#0f766e'],
  'Langley Foxall': ['#0ea5e9', '#0284c7'],
  eDynamix: ['#dc2626', '#b91c1c'],
};

function AppIcon({ name }: { name: string }) {
  const uid = useId().replace(/:/g, '');
  const cleanName = name.replace('.app', '');
  const [c1, c2] = APP_GRADS[cleanName] ?? ['#3b82f6', '#1d4ed8'];
  const initials = cleanName.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const gId = `${uid}g`;
  const ggId = `${uid}gg`;
  return (
    <svg viewBox="0 0 44 44" fill="none" width="44" height="44">
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="44" y2="44">
          <stop stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
        <linearGradient id={ggId} x1="0" y1="0" x2="0" y2="22">
          <stop stopColor="rgba(255,255,255,0.18)" />
          <stop offset="1" stopColor="transparent" />
        </linearGradient>
      </defs>
      <rect width="44" height="44" rx="11" fill={`url(#${gId})`} />
      <rect width="44" height="22" rx="11" fill={`url(#${ggId})`} />
      <text x="22" y="29" textAnchor="middle" fill="white" fontSize="16" fontWeight="700" fontFamily="'Helvetica Neue', Arial, Helvetica, sans-serif" opacity="0.92">
        {initials}
      </text>
    </svg>
  );
}

function NokiaFinderIcon() {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="9" y="1" width="30" height="46" rx="7" fill="#1c2233"/>
      <rect x="10" y="2" width="28" height="44" rx="6" fill="#243044"/>
      <rect x="18" y="5" width="12" height="2" rx="1" fill="#161f2e"/>
      <rect x="12" y="9" width="24" height="18" rx="2.5" fill="#0d0f0d"/>
      <rect x="13" y="10" width="22" height="16" rx="1.5" fill="#1c2c10"/>
      <rect x="22" y="12" width="3" height="3" fill="#4ddd4d"/>
      <rect x="19" y="12" width="3" height="3" fill="#35bb35"/>
      <rect x="16" y="12" width="3" height="3" fill="#2aaa2a"/>
      <rect x="16" y="15" width="3" height="3" fill="#2aaa2a"/>
      <rect x="16" y="18" width="3" height="3" fill="#2aaa2a"/>
      <rect x="19" y="18" width="3" height="3" fill="#2aaa2a"/>
      <rect x="22" y="18" width="3" height="3" fill="#2aaa2a"/>
      <rect x="30" y="13" width="2" height="2" fill="#88ff44"/>
      <text x="24" y="32" textAnchor="middle" fontFamily="Arial,Helvetica,sans-serif" fontSize="4.5" fontWeight="700" letterSpacing="1.2" fill="#5a78a0">NOKIA</text>
      <ellipse cx="24" cy="37.5" rx="5.5" ry="3.5" fill="#1a2535"/>
      <circle cx="24" cy="37.5" r="2.5" fill="#141d28"/>
      <rect x="12" y="34" width="7" height="4" rx="2" fill="#1a2535"/>
      <rect x="29" y="34" width="7" height="4" rx="2" fill="#1a2535"/>
      <rect x="12" y="40" width="6" height="3" rx="1.5" fill="#1a2535"/>
      <rect x="21" y="40" width="6" height="3" rx="1.5" fill="#1a2535"/>
      <rect x="30" y="40" width="6" height="3" rx="1.5" fill="#1a2535"/>
    </svg>
  );
}
