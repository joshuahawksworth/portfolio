import { useDesktop } from '../../context/DesktopContext';
import { useTime } from '../../hooks/useTime';
import styles from './MenuBar.module.css';

function Clock() {
  const time = useTime();
  return (
    <span className={styles.clock}>
      {time.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}{' '}
      {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

export default function MenuBar() {
  const { windows, focusedId } = useDesktop();
  const focusedWindow = windows.find(w => w.id === focusedId);
  const appName = focusedWindow?.title ?? 'Finder';

  return (
    <div className={styles.bar}>
      <title>{appName} — Josh Hawksworth</title>
      <div className={styles.left}>
        <svg className={styles.apple} viewBox="0 0 24 24" fill="currentColor" aria-label="Apple">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.37 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
        <span className={styles.appName}>{appName}</span>
        {['File', 'View', 'Window', 'Help'].map(m => (
          <span key={m} className={styles.menu}>{m}</span>
        ))}
      </div>
      <div className={styles.right}>
        <svg className={styles.statusIcon} viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 12a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/>
          <path d="M4.5 9.5a4.9 4.9 0 017 0l-1.1 1.1a3.4 3.4 0 00-4.8 0L4.5 9.5z"/>
          <path d="M1.5 6.5a8.5 8.5 0 0113 0L13.4 7.6a7 7 0 00-10.8 0L1.5 6.5z"/>
        </svg>
        <svg className={styles.statusIcon} viewBox="0 0 22 12" fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="0.5" y="0.5" width="18" height="11" rx="2.5"/>
          <rect x="2" y="2" width="14" height="8" rx="1.5" fill="currentColor" stroke="none"/>
          <path d="M19.5 4v4" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <Clock />
      </div>
    </div>
  );
}
