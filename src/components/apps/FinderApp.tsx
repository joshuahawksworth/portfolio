import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  useDesktop,
  canMoveNode,
  canRenameNode,
  canTrashNode,
  isInTrash,
  isWritableFolder,
  type FsNode,
} from '../../context/DesktopContext';
import { FINDER_ROOTS, ROOT_IDS, type RootId } from '../../data/fileSystemSeed';
import { openTargetFor } from '../../lib/openNode';
import { NodeIcon, nodeKind } from '../icons/NodeIcon';
import { FolderIcon } from '../icons/FileSystemIcons';
import styles from './FinderApp.module.css';

/** Drag payload shared with the desktop (a JSON list of node ids). */
export const FINDER_DRAG_TYPE = 'application/finder-items';

type ViewMode = 'icon' | 'list';
type SortKey = 'name' | 'modifiedAt' | 'kind';

interface CtxMenu {
  x: number;
  y: number;
  itemId?: string;
}

const TEXT_EXT =
  /\.(txt|md|js|ts|tsx|jsx|json|html|css|csv|xml|yaml|yml|sh|py|rb|go|rs|php|java|c|cpp|h|swift)$/i;

const ROOT_LABELS: Record<RootId, string> = {
  desktop: 'Desktop',
  documents: 'Documents',
  downloads: 'Downloads',
  applications: 'Applications',
  trash: 'Trash',
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function FinderApp({ props }: { props?: Record<string, unknown> }) {
  const {
    fs,
    childrenOf,
    openApp,
    createFolder,
    createFile,
    addFile,
    renameNode,
    moveNodes,
    trashNodes,
    trashCount,
  } = useDesktop();

  // ── Navigation ───────────────────────────────────────────────────────
  const [currentId, setCurrentId] = useState<string>(() => {
    const wanted = props?.folderId as string | undefined;
    return wanted && fs[wanted]?.type === 'folder' ? wanted : ROOT_IDS.desktop;
  });
  const [history, setHistory] = useState<{ back: string[]; forward: string[] }>({
    back: [],
    forward: [],
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<ViewMode>('icon');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [draggingIds, setDraggingIds] = useState<Set<string>>(new Set());

  const uploadRef = useRef<HTMLInputElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<string | null>(null);
  const renameTimer = useRef<number | undefined>(undefined);

  // Touch devices open with a single tap (no double-click, no modifier keys).
  const coarsePointer = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
    []
  );

  const current = fs[currentId];
  const writable = isWritableFolder(current);

  // If the folder we're looking at disappears (trashed from the desktop), climb out.
  useEffect(() => {
    if (current && !isInTrash(fs, currentId)) return;
    let cur = current;
    while (cur?.parentId && (!fs[cur.parentId] || isInTrash(fs, cur.parentId)))
      cur = fs[cur.parentId];
    setCurrentId(cur?.parentId && fs[cur.parentId] ? cur.parentId : ROOT_IDS.desktop);
    setSelected(new Set());
  }, [fs, current, currentId]);

  const navigate = useCallback(
    (id: string) => {
      if (id === currentId || !fs[id]) return;
      setHistory((h) => ({ back: [...h.back, currentId], forward: [] }));
      setCurrentId(id);
      setSelected(new Set());
      setCtxMenu(null);
      setSearchQuery('');
      setRenamingId(null);
    },
    [currentId, fs]
  );

  function goBack() {
    setHistory((h) => {
      if (h.back.length === 0) return h;
      const target = h.back[h.back.length - 1];
      setCurrentId(target);
      setSelected(new Set());
      return { back: h.back.slice(0, -1), forward: [currentId, ...h.forward] };
    });
  }

  function goForward() {
    setHistory((h) => {
      if (h.forward.length === 0) return h;
      const target = h.forward[0];
      setCurrentId(target);
      setSelected(new Set());
      return { back: [...h.back, currentId], forward: h.forward.slice(1) };
    });
  }

  function goUp() {
    if (current?.parentId) navigate(current.parentId);
  }

  // ── Items in view ────────────────────────────────────────────────────
  const q = searchQuery.trim().toLowerCase();
  const items = useMemo(() => {
    let list: FsNode[];
    if (q) {
      // Search the whole subtree, like Finder's "Search: This folder".
      list = [];
      const walk = (id: string) => {
        for (const n of childrenOf(id)) {
          if (n.name.toLowerCase().includes(q)) list.push(n);
          if (n.type === 'folder') walk(n.id);
        }
      };
      walk(currentId);
    } else {
      list = childrenOf(currentId);
    }
    if (view === 'list' || q) {
      const dir = sortAsc ? 1 : -1;
      list = [...list].sort((a, b) => {
        if (sortKey === 'modifiedAt') return (a.modifiedAt - b.modifiedAt) * dir;
        if (sortKey === 'kind') {
          const k = nodeKind(a).localeCompare(nodeKind(b));
          return (k || a.name.localeCompare(b.name)) * dir;
        }
        return a.name.localeCompare(b.name, undefined, { numeric: true }) * dir;
      });
    }
    return list;
  }, [childrenOf, currentId, q, view, sortKey, sortAsc]);

  const selectedNodes = items.filter((n) => selected.has(n.id));
  const trashableSelection = selectedNodes.filter(canTrashNode);
  const movableSelection = selectedNodes.filter(canMoveNode);

  // ── Opening ──────────────────────────────────────────────────────────
  function openNode(node: FsNode) {
    const target = openTargetFor(node);
    if (target.kind === 'folder') navigate(target.id);
    else if (target.kind === 'url') window.open(target.url, '_blank');
    else if (target.appId === 'finder') openApp('finder', { menuOpenedAt: Date.now() });
    else openApp(target.appId, target.props);
  }

  function openSelection() {
    selectedNodes.forEach(openNode);
  }

  // ── Selection ────────────────────────────────────────────────────────
  function selectWithModifiers(e: React.MouseEvent, id: string) {
    if (e.shiftKey && anchorRef.current) {
      const ids = items.map((n) => n.id);
      const a = ids.indexOf(anchorRef.current);
      const b = ids.indexOf(id);
      if (a !== -1 && b !== -1) {
        const [lo, hi] = a < b ? [a, b] : [b, a];
        setSelected(new Set(ids.slice(lo, hi + 1)));
        return;
      }
    }
    if (e.metaKey || e.ctrlKey) {
      setSelected((prev) => {
        const n = new Set(prev);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      });
    } else {
      setSelected(new Set([id]));
    }
    anchorRef.current = id;
  }

  function selectAll() {
    setSelected(new Set(items.map((n) => n.id)));
    setCtxMenu(null);
  }

  // ── Create / rename / trash ──────────────────────────────────────────
  useEffect(() => {
    if (renamingId) {
      renameRef.current?.focus();
      const dot = renameVal.lastIndexOf('.');
      // Select the stem only, like Finder does for "name.ext"
      renameRef.current?.setSelectionRange(0, dot > 0 ? dot : renameVal.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renamingId]);

  function startRename(id: string) {
    const node = fs[id];
    if (!node || !canRenameNode(node)) return;
    setRenameVal(node.name);
    setRenamingId(id);
    setCtxMenu(null);
  }

  function commitRename() {
    if (renamingId) renameNode(renamingId, renameVal);
    setRenamingId(null);
  }

  function newFolder() {
    if (!writable) return;
    const id = createFolder(currentId);
    setSelected(new Set([id]));
    setCtxMenu(null);
    setSearchQuery('');
    setRenameVal('untitled folder');
    setRenamingId(id);
  }

  function newTextFile() {
    if (!writable) return;
    const id = createFile(currentId);
    setSelected(new Set([id]));
    setCtxMenu(null);
    setSearchQuery('');
    setRenameVal('untitled.txt');
    setRenamingId(id);
  }

  function trashSelection() {
    const ids = trashableSelection.map((n) => n.id);
    if (ids.length === 0) return;
    trashNodes(ids);
    setSelected(new Set());
    setCtxMenu(null);
  }

  function moveSelectionTo(folderId: string) {
    const ids = movableSelection.map((n) => n.id);
    if (ids.length === 0) return;
    moveNodes(ids, folderId);
    setSelected(new Set());
    setCtxMenu(null);
  }

  // ── Uploads (button, context menu, or files dropped from the OS) ─────
  function ingestFiles(files: File[]) {
    if (!writable) return;
    for (const file of files) {
      const isText = TEXT_EXT.test(file.name);
      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();
      if (isText) {
        reader.onload = (ev) =>
          addFile(currentId, { name: file.name, content: (ev.target?.result as string) ?? '' });
        reader.readAsText(file);
      } else if (isImage) {
        reader.onload = (ev) =>
          addFile(currentId, {
            name: file.name,
            type: 'image',
            content: '',
            dataUrl: (ev.target?.result as string) ?? '',
          });
        reader.readAsDataURL(file);
      } else {
        addFile(currentId, {
          name: file.name,
          content: `[Binary file: ${file.name}]\nSize: ${(file.size / 1024).toFixed(1)} KB\nType: ${file.type || 'unknown'}`,
        });
      }
    }
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    ingestFiles(Array.from(e.target.files ?? []));
    if (uploadRef.current) uploadRef.current.value = '';
  }

  // ── Drag and drop ────────────────────────────────────────────────────
  function onItemDragStart(e: React.DragEvent, node: FsNode) {
    if (!canMoveNode(node)) {
      e.preventDefault();
      return;
    }
    const ids = selected.has(node.id)
      ? Array.from(selected).filter((id) => canMoveNode(fs[id]))
      : [node.id];
    if (!selected.has(node.id)) setSelected(new Set([node.id]));
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(FINDER_DRAG_TYPE, JSON.stringify({ ids }));
    setDraggingIds(new Set(ids));
  }

  function acceptsDrop(e: React.DragEvent, folderId: string): boolean {
    const types = Array.from(e.dataTransfer.types);
    if (types.includes('Files')) return isWritableFolder(fs[folderId]);
    if (!types.includes(FINDER_DRAG_TYPE)) return false;
    if (draggingIds.has(folderId)) return false;
    const folder = fs[folderId];
    return !!folder && folder.type === 'folder' && folderId !== ROOT_IDS.applications;
  }

  function onFolderDragOver(e: React.DragEvent, folderId: string) {
    if (!acceptsDrop(e, folderId)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dropTarget !== folderId) setDropTarget(folderId);
  }

  function onFolderDrop(e: React.DragEvent, folderId: string) {
    if (!acceptsDrop(e, folderId)) return;
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);
    setDraggingIds(new Set());
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length > 0) {
      if (folderId === currentId) ingestFiles(files);
      return;
    }
    try {
      const { ids } = JSON.parse(e.dataTransfer.getData(FINDER_DRAG_TYPE)) as { ids: string[] };
      moveNodes(ids, folderId);
      setSelected(new Set());
    } catch {
      /* not ours */
    }
  }

  // ── Keyboard (only while the Finder window has focus) ────────────────
  function onKeyDown(e: React.KeyboardEvent) {
    if (renamingId) return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const cmd = e.metaKey || e.ctrlKey;

    if (cmd && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      selectAll();
    } else if ((cmd && e.key === 'Backspace') || e.key === 'Delete' || e.key === 'Backspace') {
      if (trashableSelection.length > 0) {
        e.preventDefault();
        trashSelection();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedNodes.length === 1 && canRenameNode(selectedNodes[0]))
        startRename(selectedNodes[0].id);
      else openSelection();
    } else if (cmd && (e.key.toLowerCase() === 'o' || e.key === 'ArrowDown')) {
      e.preventDefault();
      openSelection();
    } else if (cmd && e.key === 'ArrowUp') {
      e.preventDefault();
      goUp();
    } else if (cmd && e.key === '[') {
      e.preventDefault();
      goBack();
    } else if (cmd && e.key === ']') {
      e.preventDefault();
      goForward();
    } else if (cmd && e.shiftKey && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      newFolder();
    } else if (e.key === 'Escape') {
      setSelected(new Set());
      setCtxMenu(null);
    }
  }

  // ── Derived UI bits ──────────────────────────────────────────────────
  const breadcrumb = useMemo(() => {
    const chain: FsNode[] = [];
    let cur: FsNode | undefined = current;
    while (cur) {
      chain.unshift(cur);
      cur = cur.parentId ? fs[cur.parentId] : undefined;
    }
    return chain;
  }, [fs, current]);

  const rootId = breadcrumb[0]?.id as RootId | undefined;
  const title = current?.name ?? 'Finder';
  const ctxTarget = ctxMenu?.itemId ? fs[ctxMenu.itemId] : null;
  const trashLabel =
    trashableSelection.length > 1
      ? `Move ${trashableSelection.length} Items to Trash`
      : 'Move to Trash';
  const kindHeader = (key: SortKey, label: string) => (
    <button
      type="button"
      className={`${styles.listHeadBtn} ${sortKey === key ? styles.listHeadActive : ''}`}
      onClick={() => {
        if (sortKey === key) setSortAsc((v) => !v);
        else {
          setSortKey(key);
          setSortAsc(true);
        }
      }}
    >
      {label}
      {sortKey === key && <span className={styles.sortArrow}>{sortAsc ? '▲' : '▼'}</span>}
    </button>
  );

  function itemHandlers(node: FsNode) {
    const isFolder = node.type === 'folder';
    return {
      draggable: canMoveNode(node),
      onDragStart: (e: React.DragEvent) => onItemDragStart(e, node),
      onDragEnd: () => {
        setDraggingIds(new Set());
        setDropTarget(null);
      },
      onDragOver: isFolder ? (e: React.DragEvent) => onFolderDragOver(e, node.id) : undefined,
      onDragLeave: isFolder ? () => setDropTarget((t) => (t === node.id ? null : t)) : undefined,
      onDrop: isFolder ? (e: React.DragEvent) => onFolderDrop(e, node.id) : undefined,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        setCtxMenu(null);
        if (renamingId && renamingId !== node.id) commitRename();
        if (coarsePointer) {
          openNode(node);
          return;
        }
        selectWithModifiers(e, node.id);
      },
      onDoubleClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        if (renamingId === node.id) return;
        openNode(node);
      },
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selected.has(node.id)) {
          setSelected(new Set([node.id]));
          anchorRef.current = node.id;
        }
        setCtxMenu({ x: e.clientX, y: e.clientY, itemId: node.id });
      },
    };
  }

  function renderName(node: FsNode) {
    if (renamingId === node.id) {
      return (
        <input
          ref={renameRef}
          className={styles.renameInput}
          value={renameVal}
          onChange={(e) => setRenameVal(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') setRenamingId(null);
          }}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Rename"
        />
      );
    }
    return (
      <span
        className={styles.itemName}
        onClick={() => {
          // Clicking the name of an already-selected item starts a rename, like Finder.
          // It waits long enough to tell a slow second click from a double-click.
          if (
            !coarsePointer &&
            selected.size === 1 &&
            selected.has(node.id) &&
            canRenameNode(node)
          ) {
            window.clearTimeout(renameTimer.current);
            renameTimer.current = window.setTimeout(() => startRename(node.id), 420);
          }
        }}
        onDoubleClick={() => window.clearTimeout(renameTimer.current)}
      >
        {node.name}
      </span>
    );
  }

  const emptyState =
    items.length === 0 ? (
      <div className={styles.emptyFolder}>
        {!q && <FolderIcon size={64} style={{ opacity: 0.35 }} />}
        <span className={styles.emptyFolderLabel}>
          {q ? `No results for “${searchQuery}”` : `${title} is empty`}
        </span>
      </div>
    ) : null;

  const surfaceProps = {
    onClick: () => {
      if (renamingId) commitRename();
      setSelected(new Set());
      setCtxMenu(null);
    },
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCtxMenu({ x: e.clientX, y: e.clientY });
    },
    onDragOver: (e: React.DragEvent) => onFolderDragOver(e, currentId),
    onDragLeave: () => setDropTarget((t) => (t === currentId ? null : t)),
    onDrop: (e: React.DragEvent) => onFolderDrop(e, currentId),
  };

  return (
    <div
      ref={rootRef}
      className={styles.root}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onMouseDown={(e) => {
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') rootRef.current?.focus({ preventScroll: true });
      }}
    >
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <p className={styles.sidebarSection}>Favourites</p>
        {FINDER_ROOTS.map((id) => (
          <button
            key={id}
            className={[
              styles.sidebarBtn,
              rootId === id ? styles.active : '',
              dropTarget === id ? styles.sidebarDrop : '',
            ].join(' ')}
            onClick={() => navigate(id)}
            onDragOver={(e) => onFolderDragOver(e, id)}
            onDragLeave={() => setDropTarget((t) => (t === id ? null : t))}
            onDrop={(e) => onFolderDrop(e, id)}
          >
            <span className={styles.sidebarIcon}>{SIDEBAR_ICONS[id]}</span>
            {ROOT_LABELS[id]}
          </button>
        ))}
      </aside>

      {/* Main */}
      <main className={styles.main}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <button
            className={styles.toolBtn}
            disabled={history.back.length === 0}
            onClick={goBack}
            title="Back"
            aria-label="Back"
          >
            <svg
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M8 2L4 6l4 4" />
            </svg>
          </button>
          <button
            className={styles.toolBtn}
            disabled={history.forward.length === 0}
            onClick={goForward}
            title="Forward"
            aria-label="Forward"
          >
            <svg
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M4 2l4 4-4 4" />
            </svg>
          </button>
          <span className={styles.toolbarPath} title={title}>
            {title}
          </span>

          {/* Search */}
          <div className={styles.searchWrap}>
            <svg
              className={styles.searchIcon}
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <circle cx="5" cy="5" r="3.5" />
              <path d="M7.5 7.5L10 10" />
            </svg>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className={styles.searchClear}
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* New folder */}
          <button
            className={styles.toolBtn}
            title="New Folder (⇧⌘N)"
            aria-label="New Folder"
            disabled={!writable}
            onClick={newFolder}
          >
            <svg
              viewBox="0 0 14 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 3.2Q1 2 2.2 2H5l1.2 1.3H11.8Q13 3.3 13 4.5V9.8Q13 11 11.8 11H2.2Q1 11 1 9.8Z" />
              <path d="M7 5.6v3.2M5.4 7.2h3.2" />
            </svg>
          </button>

          {/* Upload */}
          <button
            className={`${styles.toolBtn} ${styles.uploadBtn}`}
            title="Upload file"
            aria-label="Upload file"
            disabled={!writable}
            onClick={() => uploadRef.current?.click()}
          >
            <svg
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2v6M3.5 4.5L6 2l2.5 2.5" />
              <path d="M2 9h8" />
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

          <div className={styles.viewToggle} role="group" aria-label="View">
            <button
              className={`${styles.viewBtn} ${view === 'icon' ? styles.viewActive : ''}`}
              onClick={() => setView('icon')}
              title="Icon view"
              aria-label="Icon view"
              aria-pressed={view === 'icon'}
            >
              <svg viewBox="0 0 12 12" fill="currentColor">
                <rect x="0" y="0" width="5" height="5" rx="1" />
                <rect x="7" y="0" width="5" height="5" rx="1" />
                <rect x="0" y="7" width="5" height="5" rx="1" />
                <rect x="7" y="7" width="5" height="5" rx="1" />
              </svg>
            </button>
            <button
              className={`${styles.viewBtn} ${view === 'list' ? styles.viewActive : ''}`}
              onClick={() => setView('list')}
              title="List view"
              aria-label="List view"
              aria-pressed={view === 'list'}
            >
              <svg
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M0 3h12M0 6h12M0 9h12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contents */}
        {view === 'icon' ? (
          <div
            className={`${styles.grid} ${dropTarget === currentId ? styles.surfaceDrop : ''}`}
            {...surfaceProps}
          >
            {emptyState}
            {items.map((node) => {
              const isSelected = selected.has(node.id);
              return (
                <div
                  key={node.id}
                  className={[
                    styles.item,
                    isSelected ? styles.itemSelected : '',
                    dropTarget === node.id ? styles.itemDrop : '',
                    draggingIds.has(node.id) ? styles.itemDragging : '',
                  ].join(' ')}
                  title={node.name}
                  {...itemHandlers(node)}
                >
                  <div className={styles.itemIcon}>
                    <NodeIcon node={node} size={58} trashFull={trashCount > 0} />
                  </div>
                  {renderName(node)}
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className={`${styles.list} ${dropTarget === currentId ? styles.surfaceDrop : ''}`}
            {...surfaceProps}
          >
            <div className={styles.listHead} onClick={(e) => e.stopPropagation()}>
              <span className={styles.colName}>{kindHeader('name', 'Name')}</span>
              <span className={styles.colDate}>{kindHeader('modifiedAt', 'Date Modified')}</span>
              <span className={styles.colKind}>{kindHeader('kind', 'Kind')}</span>
            </div>
            {emptyState}
            {items.map((node, i) => {
              const isSelected = selected.has(node.id);
              return (
                <div
                  key={node.id}
                  className={[
                    styles.row,
                    i % 2 === 1 ? styles.rowAlt : '',
                    isSelected ? styles.rowSelected : '',
                    dropTarget === node.id ? styles.itemDrop : '',
                    draggingIds.has(node.id) ? styles.itemDragging : '',
                  ].join(' ')}
                  title={node.name}
                  {...itemHandlers(node)}
                >
                  <span className={`${styles.colName} ${styles.rowName}`}>
                    <span className={styles.rowIcon}>
                      <NodeIcon node={node} size={18} trashFull={trashCount > 0} />
                    </span>
                    {renderName(node)}
                  </span>
                  <span className={styles.colDate}>{formatDate(node.modifiedAt)}</span>
                  <span className={styles.colKind}>{nodeKind(node)}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Status / path bar */}
        <div className={styles.statusBar}>
          <span className={styles.itemCount}>
            {selected.size > 0
              ? `${selected.size} of ${items.length} selected`
              : `${items.length} item${items.length === 1 ? '' : 's'}`}
          </span>
          <nav className={styles.pathBar} aria-label="Path">
            <span className={styles.pathSeg}>josh</span>
            {breadcrumb.map((n, i) => (
              <span key={n.id} className={styles.pathSegWrap}>
                <span className={styles.pathSep}>›</span>
                <button
                  type="button"
                  className={`${styles.pathSeg} ${styles.pathBtn} ${i === breadcrumb.length - 1 ? styles.pathCurrent : ''}`}
                  onClick={() => navigate(n.id)}
                  onDragOver={(e) => onFolderDragOver(e, n.id)}
                  onDragLeave={() => setDropTarget((t) => (t === n.id ? null : t))}
                  onDrop={(e) => onFolderDrop(e, n.id)}
                >
                  {n.name}
                </button>
              </span>
            ))}
          </nav>
        </div>

        {/* Context menu */}
        {ctxMenu && (
          <div
            className={styles.ctxMenu}
            style={{
              left: Math.min(ctxMenu.x, window.innerWidth - 230),
              top: Math.min(ctxMenu.y, window.innerHeight - 260),
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            {ctxTarget ? (
              <>
                <button
                  className={styles.ctxItem}
                  onClick={() => {
                    openSelection();
                    setCtxMenu(null);
                  }}
                >
                  {selectedNodes.length > 1 ? `Open ${selectedNodes.length} Items` : 'Open'}
                </button>
                <div className={styles.ctxSep} />
                {selectedNodes.length === 1 && canRenameNode(ctxTarget) && (
                  <button className={styles.ctxItem} onClick={() => startRename(ctxTarget.id)}>
                    Rename
                  </button>
                )}
                {trashableSelection.length > 0 && (
                  <button className={styles.ctxItem} onClick={trashSelection}>
                    {trashLabel}
                  </button>
                )}
                {currentId !== ROOT_IDS.desktop && movableSelection.length > 0 && (
                  <button
                    className={styles.ctxItem}
                    onClick={() => moveSelectionTo(ROOT_IDS.desktop)}
                  >
                    Move to Desktop
                  </button>
                )}
                {(selectedNodes.length === 1 && canRenameNode(ctxTarget)) ||
                trashableSelection.length > 0 ||
                (currentId !== ROOT_IDS.desktop && movableSelection.length > 0) ? (
                  <div className={styles.ctxSep} />
                ) : null}
                <button className={styles.ctxItem} onClick={selectAll}>
                  Select All
                </button>
              </>
            ) : (
              <>
                {writable && (
                  <>
                    <button className={styles.ctxItem} onClick={newFolder}>
                      New Folder
                    </button>
                    <button className={styles.ctxItem} onClick={newTextFile}>
                      New Text File
                    </button>
                    <button
                      className={styles.ctxItem}
                      onClick={() => {
                        setCtxMenu(null);
                        uploadRef.current?.click();
                      }}
                    >
                      Upload File…
                    </button>
                    <div className={styles.ctxSep} />
                  </>
                )}
                <button
                  className={styles.ctxItem}
                  onClick={selectAll}
                  disabled={items.length === 0}
                >
                  Select All
                </button>
                <div className={styles.ctxSep} />
                <button
                  className={styles.ctxItem}
                  onClick={() => {
                    setView('icon');
                    setCtxMenu(null);
                  }}
                >
                  {view === 'icon' ? '✓ ' : ''}View as Icons
                </button>
                <button
                  className={styles.ctxItem}
                  onClick={() => {
                    setView('list');
                    setCtxMenu(null);
                  }}
                >
                  {view === 'list' ? '✓ ' : ''}View as List
                </button>
                {current?.parentId && (
                  <>
                    <div className={styles.ctxSep} />
                    <button
                      className={styles.ctxItem}
                      onClick={() => {
                        goUp();
                        setCtxMenu(null);
                      }}
                    >
                      Enclosing Folder
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* ── Sidebar icons ─────────────────────────────────────────────────── */
const SIDEBAR_ICONS: Record<RootId, React.ReactNode> = {
  desktop: (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="2" width="12" height="9" rx="1.5" />
      <path d="M5 13h4M7 11v2" />
    </svg>
  ),
  documents: (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="2" y="1" width="10" height="12" rx="1.5" />
      <path d="M5 5h4M5 8h4M5 11h2" />
    </svg>
  ),
  downloads: (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 2v7M4 6l3 3 3-3" />
      <path d="M2 11h10" />
    </svg>
  ),
  applications: (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="1" y="1" width="5" height="5" rx="1" />
      <rect x="8" y="1" width="5" height="5" rx="1" />
      <rect x="1" y="8" width="5" height="5" rx="1" />
      <rect x="8" y="8" width="5" height="5" rx="1" />
    </svg>
  ),
  trash: null,
};
