import styles from './KeyboardShortcutsApp.module.css';

const groups = [
  {
    title: 'Desktop',
    shortcuts: [
      ['Double-click icon', 'Open app or file'],
      ['Drag icon', 'Move desktop item'],
      ['Shift + click icon', 'Add or remove from selection'],
      ['Delete / Backspace', 'Move selected items to Trash'],
    ],
  },
  {
    title: 'Windows',
    shortcuts: [
      ['Drag title bar', 'Move window'],
      ['Green button', 'Zoom window'],
      ['Yellow button', 'Minimize window'],
      ['Red button', 'Close window'],
    ],
  },
  {
    title: 'Snake',
    shortcuts: [
      ['Arrow keys / WASD', 'Move snake'],
      ['Enter / Space', 'Start or retry'],
      ['Enter on initials', 'Submit score'],
    ],
  },
  {
    title: 'Chrome',
    shortcuts: [
      ['Enter in address bar', 'Search or open URL'],
      ['Back / Forward buttons', 'Navigate history'],
      ['Open icon', 'Open current page in a new tab'],
    ],
  },
];

export default function KeyboardShortcutsApp() {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <p className={styles.kicker}>Help</p>
        <h1>Keyboard Shortcuts</h1>
        <p>Quick controls for the portfolio desktop.</p>
      </div>

      <div className={styles.grid}>
        {groups.map((group) => (
          <section key={group.title} className={styles.group}>
            <h2>{group.title}</h2>
            <dl>
              {group.shortcuts.map(([keys, description]) => (
                <div key={keys} className={styles.row}>
                  <dt>{keys}</dt>
                  <dd>{description}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}
