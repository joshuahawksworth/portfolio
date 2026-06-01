import { useState, useEffect } from 'react';
import styles from './Login.module.css';

interface Props { onLogin: () => void }

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className={styles.clock}>
      <div className={styles.time}>
        {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className={styles.date}>
        {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
    </div>
  );
}

export default function Login({ onLogin }: Props) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    function onKey() { enter(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function enter() {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onLogin, 500);
  }

  return (
    <div className={`${styles.screen} ${visible ? styles.show : ''} ${leaving ? styles.leave : ''}`}>
      <Clock />

      <div className={styles.card} onClick={enter} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && enter()}>
        <div className={styles.avatar}>JH</div>
        <p className={styles.name}>Joshua</p>
        <div className={styles.enterBtn}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h10M9 4l4 4-4 4"/>
          </svg>
        </div>
        <p className={styles.hint}>Click or press any key</p>
      </div>
    </div>
  );
}
