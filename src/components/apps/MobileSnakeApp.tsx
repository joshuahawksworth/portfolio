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

  const dirKey = (d: 'U' | 'D' | 'L' | 'R', digit: string, label: string, arrow: string) => (
    <button
      type="button"
      className={`${styles.key} ${styles.keyDir}`}
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        pushDir(d);
      }}
    >
      <span className={styles.keyArrow} aria-hidden="true">
        {arrow}
      </span>
      <span className={styles.keyDigit} aria-hidden="true">
        {digit}
      </span>
    </button>
  );
  const plainKey = (digit: string, letters?: string) => (
    <span className={styles.key} aria-hidden="true">
      <span className={styles.keyDigit}>{digit}</span>
      {letters && <span className={styles.keyLetters}>{letters}</span>}
    </span>
  );

  return (
    <div className={styles.phone}>
      <div className={styles.earpiece} aria-hidden="true" />
      <p className={styles.brand}>NOKIA</p>

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

      {/* The 3310's Navi key with the C key beside it */}
      <div className={styles.naviRow}>
        <button
          type="button"
          className={styles.cKey}
          aria-label={phase === 'entry' ? 'Skip' : 'Clear'}
          onPointerDown={(e) => {
            e.preventDefault();
            if (phase === 'entry') skipRef.current?.();
          }}
        >
          C
        </button>
        <button
          type="button"
          className={styles.naviKey}
          aria-label={phase === 'entry' ? 'Submit' : 'OK'}
          onPointerDown={(e) => {
            e.preventDefault();
            pressOk();
          }}
        >
          {phase === 'entry' ? 'Submit' : phase === 'idle' || phase === 'dead' ? 'Start' : 'OK'}
        </button>
      </div>

      {/* Numeric keypad: 2 4 6 8 steer the snake, as on the real thing */}
      <div className={styles.keypad}>
        {plainKey('1')}
        {dirKey('U', '2', 'Up', '▲')}
        {plainKey('3', 'def')}
        {dirKey('L', '4', 'Left', '◀')}
        <button
          type="button"
          className={`${styles.key} ${styles.keyDir}`}
          aria-label={phase === 'entry' ? 'Submit' : 'OK'}
          onPointerDown={(e) => {
            e.preventDefault();
            pressOk();
          }}
        >
          <span className={styles.keyDigit} aria-hidden="true">
            5
          </span>
          <span className={styles.keyLetters} aria-hidden="true">
            jkl
          </span>
        </button>
        {dirKey('R', '6', 'Right', '▶')}
        {plainKey('7', 'pqrs')}
        {dirKey('D', '8', 'Down', '▼')}
        {plainKey('9', 'wxyz')}
        {plainKey('*', '+')}
        {plainKey('0', '␣')}
        {plainKey('#', '⇧')}
      </div>
    </div>
  );
}
