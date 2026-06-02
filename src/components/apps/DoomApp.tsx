import { useState } from 'react';
import styles from './DoomApp.module.css';

const DOOM_URL = 'https://archive.org/embed/doom_shareware_episode1_v1.9';

export default function DoomApp() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={styles.root}>
      <div className={styles.bar}>
        <span className={styles.skull}>💀</span>
        <span className={styles.tip}>Click inside the game to capture keyboard · WASD / Arrow keys</span>
        <span className={styles.skull}>💀</span>
      </div>

      {!loaded && (
        <div className={styles.splash}>
          <div className={styles.doomTitle}>DOOM</div>
          <div className={styles.loading}>
            <div className={styles.loadingBar}><div className={styles.loadingFill} /></div>
            <span>Loading shareware episode…</span>
          </div>
        </div>
      )}

      <iframe
        src={DOOM_URL}
        className={`${styles.iframe} ${loaded ? styles.iframeVisible : ''}`}
        title="DOOM"
        allowFullScreen
        allow="fullscreen"
        onLoad={() => setLoaded(true)}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}
