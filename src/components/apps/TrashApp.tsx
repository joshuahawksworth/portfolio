import styles from './TrashApp.module.css';

export default function TrashApp({ props: _ }: { props?: Record<string, unknown> }) {
  const DELETED = [
    { name: 'jQuery.js', size: '87 KB',   date: '2019' },
    { name: 'var let const confusion.txt', size: '12 KB', date: '2020' },
    { name: 'index2_FINAL_v3.html', size: '34 KB', date: '2021' },
    { name: 'console.log("here").js', size: '1 KB', date: '2022' },
    { name: 'spaghetti-code.ts', size: '204 KB', date: '2023' },
    { name: 'TODO_do_this_later.md', size: '3 KB', date: '2024' },
  ];

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.count}>{DELETED.length} items</span>
        <button className={styles.emptyBtn} onClick={() => alert('Trash emptied! (not really) 🗑️')}>
          Empty Trash
        </button>
      </div>
      <div className={styles.list}>
        {DELETED.map((item, i) => (
          <div key={i} className={styles.item}>
            <span className={styles.fileIcon}>📄</span>
            <div className={styles.info}>
              <span className={styles.name}>{item.name}</span>
              <span className={styles.meta}>{item.size} — deleted {item.date}</span>
            </div>
          </div>
        ))}
      </div>
      <p className={styles.note}>These items will be permanently deleted after 30 days. Or immediately when Josh ships perfect code (estimated: never).</p>
    </div>
  );
}
