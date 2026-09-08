import { useEffect } from 'react';
import styles from './Boot.module.css';

/** The "machine" is off: a black screen with a power button that boots it again. */
export default function PowerOff({ onPowerOn }: { onPowerOn: () => void }) {
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.backgroundColor;
    html.style.backgroundColor = '#000';
    document.body.style.backgroundColor = '#000';
    return () => {
      html.style.backgroundColor = prev;
      document.body.style.backgroundColor = '';
    };
  }, []);

  return (
    <div className={`${styles.screen} ${styles.off}`}>
      <button type="button" className={styles.powerBtn} onClick={onPowerOn} aria-label="Power on">
        <svg
          viewBox="0 0 24 24"
          width="28"
          height="28"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M12 3v9" />
          <path d="M6.3 6.8a8 8 0 1 0 11.4 0" />
        </svg>
      </button>
      <p className={styles.powerHint}>Press the power button</p>
    </div>
  );
}
