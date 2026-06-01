import { useEffect } from 'react';
import styles from './Boot.module.css';

interface Props { onComplete: () => void }

export default function Boot({ onComplete }: Props) {
  useEffect(() => {
    const t = setTimeout(onComplete, 4200);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div className={styles.screen}>
      <div className={styles.logo}>&#63743;</div>
      <div className={styles.barTrack}>
        <div className={styles.barFill} />
      </div>
    </div>
  );
}
