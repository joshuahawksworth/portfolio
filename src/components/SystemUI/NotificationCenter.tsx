import { useDesktop } from '../../context/DesktopContext';
import { useSystemUI } from '../../context/SystemUIContext';
import styles from './SystemUI.module.css';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function NotificationCenter() {
  const { openApp } = useDesktop();
  const { close } = useSystemUI();
  const now = new Date();
  const weekday = WEEKDAYS[now.getDay()];
  const dateLabel = `${MONTHS[now.getMonth()]} ${now.getDate()}`;

  return (
    <div className={styles.popoverLayer}>
      <div
        className={`${styles.backdrop} ${styles.backdropBelowBar}`}
        onMouseDown={close}
        aria-hidden="true"
      />
      <div
        className={`${styles.glass} ${styles.popover} ${styles.notificationCenter}`}
        role="dialog"
        aria-label="Notification Center"
      >
        <div className={styles.ncHeader}>
          <div className={styles.ncWeekday}>{weekday}</div>
          <div className={styles.ncDate}>{dateLabel}</div>
        </div>

        <section className={`${styles.card} ${styles.ncCard}`} aria-label="Today">
          <div className={styles.ncCardHead}>
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <rect x="2" y="3" width="12" height="11" rx="2" />
              <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
            </svg>
            Today
          </div>
          <div className={styles.ncEvent}>
            <span className={styles.ncTime}>09:00</span>
            <div>
              <div>Portfolio review</div>
              <div className={styles.ncHint}>Open the Experience app for the full timeline</div>
            </div>
          </div>
        </section>

        <section className={`${styles.card} ${styles.ncCard}`} aria-label="Reminders">
          <div className={styles.ncCardHead}>
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="4" cy="5" r="1.5" />
              <circle cx="4" cy="11" r="1.5" />
              <path d="M7.5 5h6M7.5 11h6" />
            </svg>
            Reminders
          </div>
          <ul className={styles.ncList}>
            <li>
              <span className={styles.ncBullet} aria-hidden="true" />
              <span>Check out the Experience app</span>
            </li>
            <li>
              <span className={styles.ncBullet} aria-hidden="true" />
              <span>
                Try the Terminal — type <code>help</code>
              </span>
            </li>
            <li>
              <span className={styles.ncBullet} aria-hidden="true" />
              <span>Beat the Snake high score</span>
            </li>
          </ul>
          <button
            type="button"
            className={styles.ncLink}
            onClick={() => {
              openApp('skills');
              close();
            }}
          >
            Open Skills
          </button>
        </section>

        <section className={`${styles.card} ${styles.ncCard}`} aria-label="Workspace">
          <div className={styles.ncCardHead}>
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="1.5" y="3" width="13" height="8.5" rx="1.5" />
              <path d="M5.5 14h5" />
            </svg>
            Workspace
          </div>
          <div className={styles.ncMuted}>Saved on this device</div>
        </section>
      </div>
    </div>
  );
}
