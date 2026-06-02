import { useDesktop, TrashedItem } from '../../context/DesktopContext';
import styles from './TrashApp.module.css';

function fileIcon(item: TrashedItem) {
  if (!item.isJoke) return '🗂️';
  const n = item.name.toLowerCase();
  if (n.endsWith('.html')) return '🌐';
  if (n.endsWith('.md') || n.endsWith('.txt')) return '📝';
  return '📜';
}

export default function TrashApp({ props: _ }: { props?: Record<string, unknown> }) {
  const { trashedItems, trashEmptied, emptyTrash, restoreItem } = useDesktop();

  const allItems = trashEmptied ? [] : trashedItems;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.count}>{allItems.length} item{allItems.length !== 1 ? 's' : ''}</span>
        <button className={styles.emptyBtn} onClick={emptyTrash} disabled={allItems.length === 0}>
          Empty Trash
        </button>
      </div>

      {allItems.length === 0 ? (
        <div className={styles.empty}>
          <svg viewBox="0 0 48 54" fill="none" width="48" height="54" style={{ opacity: 0.25 }}>
            <path d="M6 12H42M22 6H26M8 12L11 46H37L40 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className={styles.emptyLabel}>Trash is empty</p>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {allItems.map(item => (
              <div key={item.id} className={styles.item}>
                <span className={styles.fileIcon}>{fileIcon(item)}</span>
                <div className={styles.info}>
                  <span className={styles.name}>{item.name}</span>
                  <span className={styles.meta}>
                    {item.isJoke ? `deleted ${item.date}` : `moved to trash ${item.date}`}
                  </span>
                </div>
                <button
                  className={styles.restoreBtn}
                  onClick={() => restoreItem(item.id)}
                  title="Restore to Desktop"
                >
                  ↩ Restore
                </button>
              </div>
            ))}
          </div>
          <p className={styles.note}>
            Items can be restored to the desktop. Click ↩ Restore, or Empty Trash to permanently delete.
          </p>
        </>
      )}
    </div>
  );
}
