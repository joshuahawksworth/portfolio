import { useDesktop } from '../../context/DesktopContext';
import styles from './TrashApp.module.css';

const JOKE_ITEMS = [
  { name: 'jQuery.js', size: '87 KB', date: '2019' },
  { name: 'var let const confusion.txt', size: '12 KB', date: '2020' },
  { name: 'index2_FINAL_v3.html', size: '34 KB', date: '2021' },
  { name: 'console.log("here").js', size: '1 KB', date: '2022' },
  { name: 'spaghetti-code.ts', size: '204 KB', date: '2023' },
  { name: 'TODO_do_this_later.md', size: '3 KB', date: '2024' },
];

export default function TrashApp({ props: _ }: { props?: Record<string, unknown> }) {
  const { trashedItems, trashEmptied, emptyTrash } = useDesktop();

  const jokeItems = trashEmptied ? [] : JOKE_ITEMS.map(i => ({ ...i, isJoke: true }));
  const realItems = trashedItems.map(i => ({ name: i.name, size: '—', date: i.date, isJoke: false }));
  const allItems  = [...jokeItems, ...realItems];

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
            <path d="M19 20V38M24 20V38M29 20V38" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p className={styles.emptyLabel}>Trash is empty</p>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {allItems.map((item, i) => (
              <div key={i} className={styles.item}>
                <span className={styles.fileIcon}>{item.isJoke ? '📄' : '🗂️'}</span>
                <div className={styles.info}>
                  <span className={styles.name}>{item.name}</span>
                  <span className={styles.meta}>{item.size} — {item.isJoke ? `deleted ${item.date}` : `moved to trash ${item.date}`}</span>
                </div>
              </div>
            ))}
          </div>
          <p className={styles.note}>
            {trashedItems.length > 0
              ? `${trashedItems.length} item${trashedItems.length > 1 ? 's' : ''} can be permanently removed.`
              : 'These jokes will be deleted after 30 days. Or when Josh ships perfect code (est: never).'}
          </p>
        </>
      )}
    </div>
  );
}
