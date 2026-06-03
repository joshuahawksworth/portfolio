import { useCallback, useRef, useState } from 'react';
import SnakeApp, { type SnakePhase } from './SnakeApp';
import styles from './MobileSnakeApp.module.css';

export default function MobileSnakeApp() {
  const pushDirRef = useRef<((d: 'U' | 'D' | 'L' | 'R') => void) | null>(null);
  const startRef = useRef<(() => void) | null>(null);
  const openBoardRef = useRef<(() => void) | null>(null);
  const confirmRef = useRef<(() => void) | null>(null);
  const skipRef = useRef<(() => void) | null>(null);
  const [phase, setPhase] = useState<SnakePhase>('idle');

  const handlePushDir = useCallback((cb: (d: 'U' | 'D' | 'L' | 'R') => void) => {
    pushDirRef.current = cb;
  }, []);
  const handleStartGame = useCallback((cb: () => void) => {
    startRef.current = cb;
  }, []);
  const handleOpenBoard = useCallback((cb: () => void) => {
    openBoardRef.current = cb;
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
    else if (phase === 'board') startRef.current?.();
    else startRef.current?.();
  }

  function pressLeftSoft() {
    if (phase === 'entry') skipRef.current?.();
    else if (phase === 'board') openBoardRef.current?.();
    else openBoardRef.current?.();
  }

  function pressRightSoft() {
    pressOk();
  }

  const leftSoftLabel =
    phase === 'entry' ? 'Skip' : phase === 'board' ? 'Refresh' : 'Scores';
  const rightSoftLabel =
    phase === 'entry' ? 'Submit' : phase === 'board' ? 'Play' : phase === 'dead' ? 'Retry' : 'Play';

  return (
    <div className={styles.phone}>
      <div className={styles.phoneTop}>
        <div className={styles.cameraDot} />
        <div className={styles.speaker} />
        <span className={styles.modelBadge}>3310</span>
      </div>

      <div className={styles.screenBezel}>
        <div className={styles.screenGlass}>
          <SnakeApp
            hideDpad
            mobileMode
            className={styles.screenGame}
            onPushDir={handlePushDir}
            onStartGame={handleStartGame}
            onOpenBoard={handleOpenBoard}
            onConfirm={handleConfirm}
            onSkipEntry={handleSkipEntry}
            onPhaseChange={setPhase}
          />
          <div className={styles.screenScanlines} aria-hidden />
        </div>
      </div>

      <p className={styles.brand}>NOKIA</p>

      <div className={styles.softRow}>
        <button
          type="button"
          className={styles.softKey}
          onPointerDown={(e) => {
            e.preventDefault();
            pressLeftSoft();
          }}
        >
          {leftSoftLabel}
        </button>
        <span className={styles.softDivider} />
        <button
          type="button"
          className={styles.softKey}
          onPointerDown={(e) => {
            e.preventDefault();
            pressRightSoft();
          }}
        >
          {rightSoftLabel}
        </button>
      </div>

      <div className={styles.bigDpad}>
        <button
          type="button"
          className={styles.dpadBtn}
          aria-label="Up"
          onPointerDown={(e) => {
            e.preventDefault();
            pushDir('U');
          }}
        >
          ▲
        </button>
        <div className={styles.dpadRow}>
          <button
            type="button"
            className={styles.dpadBtn}
            aria-label="Left"
            onPointerDown={(e) => {
              e.preventDefault();
              pushDir('L');
            }}
          >
            ◄
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
            className={styles.dpadBtn}
            aria-label="Right"
            onPointerDown={(e) => {
              e.preventDefault();
              pushDir('R');
            }}
          >
            ►
          </button>
        </div>
        <button
          type="button"
          className={styles.dpadBtn}
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
  );
}
