import { spinnerDot } from '../../lib/bootProgress';
import styles from './Boot.module.css';

/**
 * Windows 11's ring of chasing dots. Positioned from `elapsed` (ms since the screen
 * mounted) rather than a CSS animation, so it keeps turning when animations are flattened.
 */
export function WinSpinner({ elapsed }: { elapsed: number }) {
  return (
    <div className={styles.winSpinner} aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const dot = spinnerDot(elapsed, i);
        return (
          <span
            key={i}
            className={styles.winDot}
            style={{ transform: `rotate(${dot.angle}deg)`, opacity: dot.opacity }}
          />
        );
      })}
    </div>
  );
}
