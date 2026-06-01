import { useState, useEffect } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import styles from './MenuBar.module.css';

function Clock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
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
      <div className={styles.left}>
        <span className={styles.apple}>&#63743;</span>
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
