/**
 * Visual Studio Code, the browser edition. The Explorer shows the portfolio's own file
 * system (Documents, Projects, the desktop), files open in tabs with syntax colouring,
 * and ⌘S / Ctrl+S writes back into Finder. It is a replica, not the real editor: no
 * extensions, no terminal, no IntelliSense — the status bar says as much.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDesktop, type FsNode } from '../../context/DesktopContext';
import { ROOT_IDS } from '../../data/fileSystemSeed';
import { currentOs } from '../../theme/platform';
import { highlight } from './TextEditorApp';
import styles from './VSCodeApp.module.css';

type Activity = 'explorer' | 'search' | 'scm' | 'run' | 'extensions';

interface Tab {
  id: string;
  name: string;
  content: string;
  dirty: boolean;
  /** File-system node the tab is saved in (missing until Save As). */
  nodeId?: string;
}

const LANG: Record<string, string> = {
  ts: 'TypeScript',
  tsx: 'TypeScript JSX',
  js: 'JavaScript',
  jsx: 'JavaScript JSX',
  json: 'JSON',
  md: 'Markdown',
  html: 'HTML',
  css: 'CSS',
  txt: 'Plain Text',
  sh: 'Shell Script',
  py: 'Python',
};

function extOf(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

function FileGlyph({ name, folder, open }: { name: string; folder?: boolean; open?: boolean }) {
  if (folder) {
    return (
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path
          d={open ? 'M1.5 4.5h4l1.5 1.5h7.5v7h-13z' : 'M1.5 3.5h4l1.5 1.5h7.5v8h-13z'}
          fill={open ? '#dcb67a' : '#c09553'}
        />
      </svg>
    );
  }
  const ext = extOf(name);
  const colour: Record<string, string> = {
    ts: '#3178c6',
    tsx: '#3178c6',
    js: '#e5c92e',
    jsx: '#e5c92e',
    json: '#e5c92e',
    md: '#519aba',
    html: '#e34c26',
    css: '#42a5f5',
    txt: '#9da5b4',
    sh: '#89e051',
    py: '#3572a5',
  };
  const label = ext === 'md' ? 'M↓' : ext === 'json' ? '{}' : ext.slice(0, 2).toUpperCase() || 'TX';
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <text
        x="8"
        y="12"
        textAnchor="middle"
        fontSize={ext === 'json' ? 11 : 8}
        fontWeight="700"
        fontFamily="var(--font-mono)"
        fill={colour[ext] ?? '#9da5b4'}
      >
        {label}
      </text>
    </svg>
  );
}

export default function VSCodeApp({ props }: { props?: Record<string, unknown> }) {
  const { fs, childrenOf, writeFile, createFile } = useDesktop();
  const win = currentOs() === 'windows';
  const mod = win ? 'Ctrl' : '⌘';

  const [activity, setActivity] = useState<Activity>('explorer');
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([ROOT_IDS.documents, 'doc-proj', ROOT_IDS.desktop])
  );
  const [tabs, setTabs] = useState<Tab[]>(() => {
    const id = typeof props?.fileId === 'string' ? props.fileId : undefined;
    if (id && typeof props?.filename === 'string') {
      return [
        {
          id,
          name: props.filename,
          content: typeof props.content === 'string' ? props.content : '',
          dirty: false,
          nodeId: fs[id] ? id : undefined,
        },
      ];
    }
    return [];
  });
  const [activeId, setActiveId] = useState<string | null>(tabs[0]?.id ?? null);
  const [flash, setFlash] = useState<string | null>(null);
  const [saveAs, setSaveAs] = useState<{ name: string } | null>(null);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState({ ln: 1, col: 1 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hlRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const active = tabs.find((t) => t.id === activeId) ?? null;
  const ext = active ? extOf(active.name) : '';
  const highlighted = useMemo(() => (active ? highlight(active.content, ext) : ''), [active, ext]);
  const lineCount = active ? active.content.split('\n').length : 0;

  // Files a dropped-in window asks for (Finder → Open With VS Code) join the tab strip.
  useEffect(() => {
    const id = typeof props?.fileId === 'string' ? props.fileId : undefined;
    if (!id) return;
    setTabs((prev) => {
      if (prev.some((t) => t.id === id)) return prev;
      return [
        ...prev,
        {
          id,
          name: String(props?.filename ?? 'untitled.txt'),
          content: typeof props?.content === 'string' ? props.content : '',
          dirty: false,
          nodeId: fs[id] ? id : undefined,
        },
      ];
    });
    setActiveId(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props?.fileId]);

  function openNode(node: FsNode) {
    if (node.type !== 'file') return;
    setTabs((prev) =>
      prev.some((t) => t.id === node.id)
        ? prev
        : [
            ...prev,
            {
              id: node.id,
              name: node.name,
              content: node.content ?? '',
              dirty: false,
              nodeId: node.id,
            },
          ]
    );
    setActiveId(node.id);
  }

  function closeTab(id: string) {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (activeId === id) setActiveId(next[next.length - 1]?.id ?? null);
      return next;
    });
  }

  function newFile() {
    const id = `untitled-${Date.now().toString(36)}`;
    const n = tabs.filter((t) => t.name.startsWith('Untitled')).length + 1;
    setTabs((prev) => [...prev, { id, name: `Untitled-${n}`, content: '', dirty: true }]);
    setActiveId(id);
  }

  function say(text: string) {
    setFlash(text);
    window.setTimeout(() => setFlash(null), 1600);
  }

  const save = useCallback(() => {
    if (!active) return;
    if (active.nodeId && fs[active.nodeId]) {
      writeFile(active.nodeId, active.content);
      setTabs((prev) => prev.map((t) => (t.id === active.id ? { ...t, dirty: false } : t)));
      say(`Saved ${active.name}`);
      return;
    }
    setSaveAs({ name: active.name.startsWith('Untitled') ? 'untitled.md' : active.name });
  }, [active, fs, writeFile]);

  function confirmSaveAs() {
    if (!active || !saveAs) return;
    const name = saveAs.name.trim() || 'untitled.txt';
    const nodeId = createFile(ROOT_IDS.documents, name, active.content);
    const savedName = fs[nodeId]?.name ?? name;
    setTabs((prev) =>
      prev.map((t) => (t.id === active.id ? { ...t, name: savedName, nodeId, dirty: false } : t))
    );
    setSaveAs(null);
    say(`Saved to Documents/${savedName}`);
  }

  function onChange(value: string) {
    if (!active) return;
    setTabs((prev) =>
      prev.map((t) => (t.id === active.id ? { ...t, content: value, dirty: true } : t))
    );
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      save();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      onChange(ta.value.slice(0, start) + '  ' + ta.value.slice(end));
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  }

  function trackCursor() {
    const ta = textareaRef.current;
    if (!ta) return;
    const before = ta.value.slice(0, ta.selectionStart);
    const lines = before.split('\n');
    setCursor({ ln: lines.length, col: lines[lines.length - 1].length + 1 });
  }

  function syncScroll() {
    const ta = textareaRef.current;
    if (!ta) return;
    if (hlRef.current) {
      hlRef.current.scrollTop = ta.scrollTop;
      hlRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) gutterRef.current.scrollTop = ta.scrollTop;
  }

  // ── Explorer tree ──────────────────────────────────────────────────────
  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderTree(parentId: string, depth: number): React.ReactNode {
    return childrenOf(parentId)
      .filter((n) => n.type === 'folder' || n.type === 'file')
      .map((n) => {
        const isFolder = n.type === 'folder';
        const open = expanded.has(n.id);
        return (
          <div key={n.id}>
            <button
              type="button"
              className={`${styles.treeRow} ${!isFolder && activeId === n.id ? styles.treeRowActive : ''}`}
              style={{ paddingLeft: 8 + depth * 12 }}
              onClick={() => (isFolder ? toggle(n.id) : openNode(n))}
            >
              <span className={styles.treeChevron} aria-hidden="true">
                {isFolder ? (open ? '⌄' : '›') : ''}
              </span>
              <FileGlyph name={n.name} folder={isFolder} open={open} />
              <span className={styles.treeName}>{n.name}</span>
            </button>
            {isFolder && open && renderTree(n.id, depth + 1)}
          </div>
        );
      });
  }

  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return Object.values(fs)
      .filter((n) => n.type === 'file' && (n.content ?? '').toLowerCase().includes(q))
      .flatMap((n) =>
        (n.content ?? '')
          .split('\n')
          .map((line, i) => ({ node: n, line: i + 1, text: line }))
          .filter((h) => h.text.toLowerCase().includes(q))
          .slice(0, 5)
      )
      .slice(0, 40);
  }, [fs, query]);

  const ACTIVITIES: { id: Activity; label: string; glyph: React.ReactNode }[] = [
    {
      id: 'explorer',
      label: 'Explorer',
      glyph: (
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <path d="M13.5 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8.5L13.5 3z" />
          <path d="M13.5 3v5.5H19" />
          <path d="M9 3v4H5" />
        </svg>
      ),
    },
    {
      id: 'search',
      label: 'Search',
      glyph: (
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <circle cx="10" cy="10" r="6" />
          <path d="M14.5 14.5 20 20" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'scm',
      label: 'Source Control',
      glyph: (
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="7" cy="5" r="2" />
          <circle cx="7" cy="19" r="2" />
          <circle cx="17" cy="9" r="2" />
          <path d="M7 7v10M17 11c0 3-3 4-7 4" />
        </svg>
      ),
    },
    {
      id: 'run',
      label: 'Run and Debug',
      glyph: (
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M7 4.5v15l12-7.5z" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: 'extensions',
      label: 'Extensions',
      glyph: (
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="4" y="4" width="7" height="7" rx="1" />
          <rect x="13" y="4" width="7" height="7" rx="1" />
          <rect x="4" y="13" width="7" height="7" rx="1" />
          <rect x="13.5" y="13.5" width="6" height="6" rx="1" transform="rotate(45 16.5 16.5)" />
        </svg>
      ),
    },
  ];

  const crumbs = active?.nodeId ? pathOf(fs, active.nodeId) : active ? [active.name] : [];

  return (
    <div className={styles.root}>
      <div className={styles.workbench}>
        {/* Activity bar */}
        <div className={styles.activityBar}>
          {ACTIVITIES.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`${styles.activityBtn} ${activity === a.id ? styles.activityActive : ''}`}
              onClick={() => setActivity(a.id)}
              aria-label={a.label}
              title={a.label}
            >
              {a.glyph}
            </button>
          ))}
          <span className={styles.activitySpacer} />
          <span className={styles.activityAvatar} title="Signed in as joshuahawksworth">
            JH
          </span>
        </div>

        {/* Side bar */}
        <div className={styles.sideBar}>
          {activity === 'explorer' && (
            <>
              <div className={styles.sideHead}>
                <span>Explorer</span>
                <button
                  type="button"
                  className={styles.sideAction}
                  onClick={newFile}
                  title="New File"
                >
                  +
                </button>
              </div>
              <div className={styles.sectionHead}>
                <span>⌄ Portfolio</span>
              </div>
              <div className={styles.tree}>
                {renderTree(ROOT_IDS.documents, 0)}
                {renderTree(ROOT_IDS.desktop, 0)}
                {renderTree(ROOT_IDS.downloads, 0)}
              </div>
              <div className={styles.sectionHead}>
                <span>› Open editors</span>
                <span className={styles.badge}>{tabs.length}</span>
              </div>
            </>
          )}
          {activity === 'search' && (
            <>
              <div className={styles.sideHead}>
                <span>Search</span>
              </div>
              <input
                className={styles.searchInput}
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                spellCheck={false}
              />
              <div className={styles.searchResults}>
                {query.trim() === '' ? (
                  <p className={styles.sideHint}>Search across every file on this Mac.</p>
                ) : searchHits.length === 0 ? (
                  <p className={styles.sideHint}>No results found.</p>
                ) : (
                  searchHits.map((h, i) => (
                    <button
                      key={`${h.node.id}-${h.line}-${i}`}
                      type="button"
                      className={styles.treeRow}
                      onClick={() => openNode(h.node)}
                    >
                      <span className={styles.searchFile}>{h.node.name}</span>
                      <span className={styles.searchLine}>
                        {h.line}: {h.text.trim().slice(0, 60)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
          {activity === 'scm' && (
            <>
              <div className={styles.sideHead}>
                <span>Source Control</span>
              </div>
              <p className={styles.sideHint}>
                <strong>portfolio</strong> · main
              </p>
              <p className={styles.sideHint}>
                {tabs.filter((t) => t.dirty).length} changed file(s). Commits, pushes and pull
                requests need the real VS Code with Git installed — GitHub Desktop on this Mac shows
                the actual history.
              </p>
            </>
          )}
          {activity === 'run' && (
            <>
              <div className={styles.sideHead}>
                <span>Run and Debug</span>
              </div>
              <p className={styles.sideHint}>
                Nothing to run in the browser edition. Open Xcode or Android Studio on the desktop
                to boot the simulators.
              </p>
            </>
          )}
          {activity === 'extensions' && (
            <>
              <div className={styles.sideHead}>
                <span>Extensions</span>
              </div>
              <ul className={styles.extList}>
                {['ESLint', 'Prettier', 'GitLens', 'React Native Tools', 'Claude Code'].map((x) => (
                  <li key={x}>
                    <span className={styles.extName}>{x}</span>
                    <span className={styles.extMeta}>Installed</span>
                  </li>
                ))}
              </ul>
              <p className={styles.sideHint}>The marketplace is only in the real VS Code.</p>
            </>
          )}
        </div>

        {/* Editor group */}
        <div className={styles.editorGroup}>
          <div className={styles.tabStrip}>
            {tabs.map((t) => (
              <div
                key={t.id}
                className={`${styles.tab} ${t.id === activeId ? styles.tabActive : ''}`}
                onClick={() => setActiveId(t.id)}
                role="tab"
                aria-selected={t.id === activeId}
              >
                <FileGlyph name={t.name} />
                <span className={`${styles.tabName} ${t.dirty ? styles.tabDirty : ''}`}>
                  {t.name}
                </span>
                <button
                  type="button"
                  className={styles.tabClose}
                  aria-label={`Close ${t.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(t.id);
                  }}
                >
                  {t.dirty ? '●' : '×'}
                </button>
              </div>
            ))}
            <span className={styles.tabFill} />
            {flash && <span className={styles.flash}>{flash}</span>}
          </div>

          {active ? (
            <>
              <div className={styles.breadcrumbs}>
                {crumbs.map((c, i) => (
                  <span key={i}>
                    {i > 0 && <span className={styles.crumbSep}>›</span>}
                    {c}
                  </span>
                ))}
              </div>
              <div className={styles.editor}>
                <div ref={gutterRef} className={styles.gutter} aria-hidden="true">
                  {Array.from({ length: lineCount }, (_, i) => (
                    <div key={i} className={i + 1 === cursor.ln ? styles.gutterActive : undefined}>
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className={styles.codeWrap}>
                  <div
                    ref={hlRef}
                    className={styles.highlight}
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
                  />
                  <textarea
                    ref={textareaRef}
                    className={styles.textarea}
                    value={active.content}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    onKeyUp={trackCursor}
                    onClick={trackCursor}
                    onScroll={syncScroll}
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className={styles.welcome}>
              <div className={styles.welcomeLogo} aria-hidden="true" />
              <h2>Visual Studio Code</h2>
              <p>Editing evolved — browser edition</p>
              <div className={styles.welcomeLinks}>
                <button type="button" onClick={newFile}>
                  New File…
                </button>
                <button type="button" onClick={() => setActivity('explorer')}>
                  Open Folder…
                </button>
              </div>
              <p className={styles.welcomeHint}>
                Pick a file from the Explorer. {mod}+S saves it back to Finder.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className={styles.statusBar}>
        <span className={styles.statusRemote} title="Browser edition">
          ⌥ browser
        </span>
        <span>⑂ main</span>
        <span>⊗ 0 ⚠ 0</span>
        <span className={styles.statusFill} />
        {active && (
          <>
            <span>
              Ln {cursor.ln}, Col {cursor.col}
            </span>
            <span>Spaces: 2</span>
            <span>UTF-8</span>
            <span>{LANG[ext] ?? 'Plain Text'}</span>
          </>
        )}
        <span>Prettier ✓</span>
      </div>

      {saveAs && (
        <div className={styles.quickInputLayer} onClick={() => setSaveAs(null)}>
          <div className={styles.quickInput} onClick={(e) => e.stopPropagation()}>
            <label className={styles.quickLabel} htmlFor="vscode-save-as">
              Save As — Documents
            </label>
            <input
              id="vscode-save-as"
              className={styles.quickField}
              value={saveAs.name}
              autoFocus
              onChange={(e) => setSaveAs({ name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmSaveAs();
                if (e.key === 'Escape') setSaveAs(null);
              }}
              spellCheck={false}
            />
            <div className={styles.quickHint}>Enter to save · Esc to cancel</div>
          </div>
        </div>
      )}
    </div>
  );
}

function pathOf(fs: Record<string, FsNode>, id: string): string[] {
  const out: string[] = [];
  let cur: FsNode | undefined = fs[id];
  while (cur) {
    out.unshift(cur.name);
    cur = cur.parentId ? fs[cur.parentId] : undefined;
  }
  return out;
}
