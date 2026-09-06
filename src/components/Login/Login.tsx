import { useState, useEffect, useRef } from 'react';
import { useTime } from '../../hooks/useTime';
import styles from './Login.module.css';

interface Props {
  onLogin: () => void;
}

function Clock() {
  const now = useTime();
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
  const leavingRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    function onKey() {
      if (leavingRef.current) return;
      leavingRef.current = true;
      setLeaving(true);
      setTimeout(onLogin, 500);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onLogin]);

  function enter() {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    setTimeout(onLogin, 500);
  }

  return (
    <div
      className={`${styles.screen} ${visible ? styles.show : ''} ${leaving ? styles.leave : ''}`}
    >
      <Clock />

      <div
        className={styles.card}
        onClick={enter}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && enter()}
      >
        <div className={styles.avatar}>JH</div>
        <p className={styles.name}>Joshua</p>
        <p className={styles.hint}>Click or press any key to log in</p>
      </div>
    </div>
  );
}
