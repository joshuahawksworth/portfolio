import { useCallback, useRef, useState } from 'react';
import SnakeApp, { type SnakePhase } from './SnakeApp';
import styles from './MobileSnakeApp.module.css';

export default function MobileSnakeApp() {
  const pushDirRef = useRef<((d: 'U' | 'D' | 'L' | 'R') => void) | null>(null);
  const startRef = useRef<(() => void) | null>(null);
  const confirmRef = useRef<(() => void) | null>(null);
  const skipRef = useRef<(() => void) | null>(null);
  const [phase, setPhase] = useState<SnakePhase>('idle');

  const handlePushDir = useCallback((cb: (d: 'U' | 'D' | 'L' | 'R') => void) => {
    pushDirRef.current = cb;
  }, []);
  const handleStartGame = useCallback((cb: () => void) => {
    startRef.current = cb;
  }, []);
  const handleConfirm = useCallback((cb: () => void) => {
    confirmRef.current = cb;
  }, []);
  const handleSkipEntry = useCallback((cb: () => void) => {
    skipRef.current = cb;
  }, []);

  function pushDir(d: 'U' | 'D' | 'L' | 'R') {
    pushDirRef.current?.(d);
  }

  function pressOk() {
    if (phase === 'entry') confirmRef.current?.();
    else startRef.current?.();
  }

  return (
    <div className={styles.phone}>
      <div className={styles.phoneTop}>
        <div className={styles.cameraDot} />
        <div className={styles.speaker} />
      </div>

      <div className={styles.screenSection}>
        <div className={styles.screenBezel}>
          <div className={styles.screenGlass}>
            <SnakeApp
              hideDpad
              mobileMode
              className={styles.screenGame}
              onPushDir={handlePushDir}
              onStartGame={handleStartGame}
              onConfirm={handleConfirm}
              onSkipEntry={handleSkipEntry}
              onPhaseChange={setPhase}
            />
            <div className={styles.screenScanlines} aria-hidden />
          </div>
        </div>
      </div>

      <div className={styles.phoneBottom}>
        <p className={styles.brand}>NOKIA</p>

        <div className={phase === 'entry' ? styles.softRow : styles.callRow}>
          {phase === 'entry' && (
            <button
              type="button"
              className={styles.softKey}
              onPointerDown={(e) => {
                e.preventDefault();
                skipRef.current?.();
              }}
            >
              Skip
            </button>
          )}
          <div className={styles.callBtns}>
            <button type="button" className={styles.callGreen} aria-label="Call" />
            <button type="button" className={styles.callRed} aria-label="End" />
          </div>
          {phase === 'entry' && (
            <button
              type="button"
              className={styles.softKey}
              onPointerDown={(e) => {
                e.preventDefault();
                pressOk();
              }}
            >
              Submit
            </button>
          )}
        </div>

        <div className={styles.bigDpad}>
          <button
            type="button"
            className={`${styles.dpadBtn} ${styles.dpadUp}`}
            aria-label="Up"
            onPointerDown={(e) => {
              e.preventDefault();
              pushDir('U');
            }}
          >
            ▲
          </button>
          <button
            type="button"
            className={`${styles.dpadBtn} ${styles.dpadLeft}`}
            aria-label="Left"
            onPointerDown={(e) => {
              e.preventDefault();
              pushDir('L');
            }}
          >
            ◀
          </button>
          <button
            type="button"
            className={styles.dpadCenter}
            aria-label="OK"
            onPointerDown={(e) => {
              e.preventDefault();
              pressOk();
            }}
          />
          <button
            type="button"
            className={`${styles.dpadBtn} ${styles.dpadRight}`}
            aria-label="Right"
            onPointerDown={(e) => {
              e.preventDefault();
              pushDir('R');
            }}
          >
            ▶
          </button>
          <button
            type="button"
            className={`${styles.dpadBtn} ${styles.dpadDown}`}
            aria-label="Down"
            onPointerDown={(e) => {
              e.preventDefault();
              pushDir('D');
            }}
          >
            ▼
          </button>
        </div>

        <div className={styles.chin} />
      </div>
    </div>
  );
}
