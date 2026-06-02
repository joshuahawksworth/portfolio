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
      <div className={styles.logoWrap}>
        {/* JH logo — yellow square with white JH text, filled white from bottom to top */}
        <svg viewBox="0 0 212 212" width="90" height="90" className={styles.logo}>
          <defs>
            {/* Clip mask for the fill animation — reveals from bottom upward */}
            <clipPath id="bootFillClip">
              <rect x="0" y="212" width="212" height="212" className={styles.fillRect} />
            </clipPath>
          </defs>

          {/* Base — starts fully white */}
          <rect width="212" height="212" fill="white" rx="18"/>
          <path
            d="m 64.986601,198.54254 c 17.955449,0 30.263619,-9.55694 30.263619,-30.55323 V 98.773958 H 74.97794 v 68.925752 c 0,10.13614 -4.199258,12.74258 -10.860151,12.74258 -6.950496,0 -9.846536,-4.77847 -13.03218,-10.42575 l -16.507428,9.99134 c 4.778466,10.13614 14.190596,18.53466 30.40842,18.53466 z m 49.811939,-1.30322 h 20.27228 V 167.2653 h 42.13738 v 29.97402 h 20.27228 V 98.773958 H 177.2082 V 149.16505 H 135.07082 V 98.773958 h -20.27228 z"
            fill="#333"
          />

          {/* Yellow fill — rises from bottom to top over the white base */}
          <g clipPath="url(#bootFillClip)">
            <rect width="212" height="212" fill="#f7df1e" rx="18"/>
            <path
              d="m 64.986601,198.54254 c 17.955449,0 30.263619,-9.55694 30.263619,-30.55323 V 98.773958 H 74.97794 v 68.925752 c 0,10.13614 -4.199258,12.74258 -10.860151,12.74258 -6.950496,0 -9.846536,-4.77847 -13.03218,-10.42575 l -16.507428,9.99134 c 4.778466,10.13614 14.190596,18.53466 30.40842,18.53466 z m 49.811939,-1.30322 h 20.27228 V 167.2653 h 42.13738 v 29.97402 h 20.27228 V 98.773958 H 177.2082 V 149.16505 H 135.07082 V 98.773958 h -20.27228 z"
              fill="#333"
            />
          </g>
        </svg>
      </div>

      <div className={styles.barTrack}>
        <div className={styles.barFill} />
      </div>
    </div>
  );
}
