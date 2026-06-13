import { useState, useEffect, useRef } from 'react';
import { useTime } from '../../hooks/useTime';
import ChromeFlagLink from '../ChromeFlagLink';
import styles from './Login.module.css';

interface Props {
  onLogin: () => void;
  showLiquidOption?: boolean;
  onLiquidLogin?: () => void;
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

export default function Login({ onLogin, showLiquidOption = false, onLiquidLogin }: Props) {
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

  function enterLiquid(e: React.MouseEvent) {
    e.stopPropagation();
    if (!onLiquidLogin || leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    setTimeout(onLiquidLogin, 500);
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
        <div className={styles.enterBtn}>
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </div>
        <p className={styles.hint}>Click or press any key</p>
      </div>

      {showLiquidOption && onLiquidLogin && (
        <div className={styles.liquidBanner}>
          <p className={styles.liquidBannerTitle}>
            <svg
              className={styles.liquidBannerIcon}
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 1.2a.8.8 0 01.7.4l6.5 11.2a.8.8 0 01-.7 1.2H1.5a.8.8 0 01-.7-1.2L7.3 1.6a.8.8 0 01.7-.4zm0 4.3a.6.6 0 00-.6.6v3.4a.6.6 0 001.2 0V6.1a.6.6 0 00-.6-.6zm0 6.8a.75.75 0 100-1.5.75.75 0 000 1.5z" />
            </svg>
            Work in progress — expect bugs
          </p>
          <button className={styles.liquidBtn} onClick={enterLiquid} type="button">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 2c0 0-5 3.5-5 7a5 5 0 0010 0c0-3.5-5-7-5-7z" />
            </svg>
            DOM Version
          </button>
          <p className={styles.liquidHint}>
            Requires <ChromeFlagLink className={styles.liquidFlagLink} />
          </p>
        </div>
      )}
    </div>
  );
}
