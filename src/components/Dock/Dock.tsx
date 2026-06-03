import { useState, useRef, useEffect } from 'react';
import { useDesktop, WindowInstance } from '../../context/DesktopContext';
import {
  DOCK_DEFAULT_ORDER,
  DOCK_DESKTOP_ONLY,
  DOCK_ITEMS,
  DOCK_LABELS,
  dockAppId,
  getDockAction,
} from './dockConfig';
import { DOCK_ICONS } from './dockIcons';
import styles from './Dock.module.css';

/* ─── Types ───────────────────────────────────────────────────────────── */
interface DockProps {
  bouncingKeys?: Set<string>;
  onItemActivate?: (key: string, action: () => void) => void;
  trashHighlighted?: boolean;
}

/* ─── Gradient backgrounds for minimised thumbnails ─────────────────── */
const THUMB_GRAD: Record<string, [string, string]> = {
  about: ['#2a1e00', '#3d2e00'],
  experience: ['#1a0e00', '#2d1a00'],
  skills: ['#1a0a2e', '#2d1050'],
  contact: ['#0a1428', '#0f2045'],
  location: ['#001a10', '#002a1a'],
  terminal: ['#090909', '#141414'],
  calculator: ['#2a1800', '#3d2400'],
  finder: ['#001030', '#001a50'],
  trash: ['#1a1a1e', '#2a2a2e'],
};

function MinimizedThumb({ appId, icon }: { appId: string; icon: React.ReactNode }) {
  const [c1, c2] = THUMB_GRAD[appId] ?? ['#0d1020', '#151a30'];
  return (
    <div className={styles.thumb}>
      <div className={styles.thumbBar}>
        <div className={styles.thumbDot} style={{ background: '#FF5F57' }} />
        <div className={styles.thumbDot} style={{ background: '#FEBC2E' }} />
        <div className={styles.thumbDot} style={{ background: '#28C840' }} />
      </div>
      <div
        className={styles.thumbContent}
        style={{ background: `linear-gradient(135deg,${c1},${c2})` }}
      />
      <div className={styles.thumbIconBadge}>{icon}</div>
    </div>
  );
}

function MinimizedSlot({ win }: { win: WindowInstance }) {
  const { focusWindow } = useDesktop();
  const iconMap: Record<string, React.ReactNode> = {
    about: DOCK_ICONS.about,
    experience: DOCK_ICONS.experience,
    skills: DOCK_ICONS.skills,
    contact: DOCK_ICONS.contact,
    location: DOCK_ICONS.location,
    terminal: DOCK_ICONS.terminal,
    calculator: DOCK_ICONS.calculator,
    finder: DOCK_ICONS.finder,
    trash: DOCK_ICONS.trashEmpty,
    cv: DOCK_ICONS.cv,
    github: DOCK_ICONS.github,
    githubapp: DOCK_ICONS.github,
    safari: DOCK_ICONS.safari,
    imageviewer: DOCK_ICONS.imageviewer,
  };
  return (
    <div className={styles.item}>
      <button
        className={styles.minimizedBtn}
        onClick={() => focusWindow(win.id)}
        aria-label={`Restore ${win.title}`}
        title={`Restore "${win.title}"`}
      >
        <MinimizedThumb appId={win.appId} icon={iconMap[win.appId] ?? DOCK_ICONS.about} />
      </button>
      <span className={styles.label}>{win.title}</span>
    </div>
  );
}

/* ─── Default reorderable key order (Finder & Trash excluded) ────────── */
/* ─── Dock ────────────────────────────────────────────────────────────── */
export default function Dock({ bouncingKeys, onItemActivate, trashHighlighted }: DockProps = {}) {
  const { openApp, windows, trashedItems, trashEmptied } = useDesktop();
  const trashHasItems = !trashEmptied && trashedItems.length > 0;

  const [order, setOrder] = useState<string[]>(() => [...DOCK_DEFAULT_ORDER]);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [insertBefore, setInsertBefore] = useState(true);

  const minimizedWindows = windows.filter((w) => w.minimized);

  // Running desktop-only apps (doom/snake) — shown in dock only while open
  const runningDesktopKeys = [
    ...new Set(
      windows.filter((w) => !w.minimized && DOCK_DESKTOP_ONLY.has(w.appId)).map((w) => w.appId)
    ),
  ];

  // Track which keys are newly appeared so we can play the spring animation
  const prevRunningRef = useRef<Set<string>>(new Set());
  const [newKeys, setNewKeys] = useState<Set<string>>(new Set());
  // Use a stable string so the effect only re-runs when the set actually changes
  const runningKey = runningDesktopKeys.join(',');
  useEffect(() => {
    const current = new Set(runningDesktopKeys);
    const prev = prevRunningRef.current;
    const added = new Set([...current].filter((k) => !prev.has(k)));
    prevRunningRef.current = current; // always update — prevents the infinite-loop bug
    if (added.size > 0) {
      setNewKeys(added);
      const t = setTimeout(() => setNewKeys(new Set()), 500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runningKey]);

  function hasOpen(key: string) {
    const appId = dockAppId(key);
    return windows.some((w) => w.appId === appId && !w.minimized);
  }

  function handleClick(key: string) {
    const action = getDockAction(key, openApp);
    if (onItemActivate) onItemActivate(key, action);
    else action();
  }

  /* ── Drag-to-reorder handlers ─────────────────────────────────────── */
  function onDragStart(e: React.DragEvent, key: string) {
    e.dataTransfer.effectAllowed = 'move';
    setDragKey(key);
  }

  function onDragOver(e: React.DragEvent, key: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHoverKey(key);
    setInsertBefore(e.clientX < rect.left + rect.width / 2);
  }

  function onDragLeave(e: React.DragEvent) {
    // Only clear if leaving the entire dock
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setHoverKey(null);
    }
  }

  function onDrop(e: React.DragEvent, targetKey: string) {
    e.preventDefault();
    if (!dragKey || dragKey === targetKey) {
      resetDrag();
      return;
    }
    setOrder((prev) => {
      const from = prev.indexOf(dragKey);
      const to = prev.indexOf(targetKey);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      next.splice(from, 1);
      // Recalculate target index after removal
      const newTo = next.indexOf(targetKey);
      next.splice(insertBefore ? newTo : newTo + 1, 0, dragKey);
      return next;
    });
    resetDrag();
  }

  function resetDrag() {
    setDragKey(null);
    setHoverKey(null);
  }

  /* ── Render a single dock item ────────────────────────────────────── */
  function renderItem(
    key: string,
    label: string,
    icon: React.ReactNode,
    draggable = false,
    highlighted = false,
    springing = false
  ) {
    const isBouncing = bouncingKeys?.has(key) ?? false;
    const isDragging = dragKey === key;
    const isHovered = hoverKey === key && dragKey !== null && dragKey !== key;
    const dropClass = isHovered ? (insertBefore ? styles.dropBefore : styles.dropAfter) : '';

    return (
      <div
        key={key}
        className={[
          styles.item,
          isDragging ? styles.itemDragging : '',
          springing ? styles.itemSpring : '',
          dropClass,
        ].join(' ')}
        draggable={draggable}
        onDragStart={draggable ? (e) => onDragStart(e, key) : undefined}
        onDragOver={draggable ? (e) => onDragOver(e, key) : undefined}
        onDragLeave={draggable ? onDragLeave : undefined}
        onDrop={draggable ? (e) => onDrop(e, key) : undefined}
        onDragEnd={draggable ? resetDrag : undefined}
      >
        <button
          className={`${styles.iconBtn} ${isBouncing ? styles.bouncing : ''} ${highlighted ? styles.trashHighlight : ''}`}
          onClick={() => handleClick(key)}
          aria-label={label}
          style={draggable ? { cursor: isDragging ? 'grabbing' : 'grab' } : undefined}
        >
          {icon}
        </button>
        <span className={styles.label}>{label}</span>
        {hasOpen(key) && <span className={styles.dot} />}
      </div>
    );
  }

  function dockMeta(key: string) {
    return (
      DOCK_ITEMS.find((i) => i.key === key) ?? {
        key,
        label: DOCK_LABELS[key] ?? key,
        icon: DOCK_ICONS[key as keyof typeof DOCK_ICONS],
      }
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.panel}>
        {/* Fixed — Finder */}
        {renderItem('finder', 'Finder', DOCK_ICONS.finder, false)}

        <div className={styles.sep} />

        {/* Reorderable middle items */}
        {order.map((key) => {
          const meta = dockMeta(key);
          return renderItem(key, meta.label, meta.icon, true);
        })}

        {/* Running desktop-only apps (doom/snake) — spring in when launched */}
        {runningDesktopKeys.length > 0 && <div className={styles.sep} />}
        {runningDesktopKeys.map((key) => {
          const meta = dockMeta(key);
          return renderItem(key, meta.label, meta.icon, false, false, newKeys.has(key));
        })}

        <div className={styles.sep} />

        {/* Fixed — Trash (icon changes when items present) */}
        {renderItem(
          'trash',
          'Trash',
          trashHasItems ? DOCK_ICONS.trashFull : DOCK_ICONS.trashEmpty,
          false,
          !!trashHighlighted
        )}

        {minimizedWindows.length > 0 && (
          <>
            <div className={styles.sep} />
            {minimizedWindows.map((win) => (
              <MinimizedSlot key={win.id} win={win} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
