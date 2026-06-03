import styles from './LiquidWallpaper.module.css';

/** Canvas-friendly wallpaper — solid layers only (no CSS gradients / pseudo-elements). */
export default function LiquidWallpaper({ wallpaper }: { wallpaper: string }) {
  return (
    <div className={styles.root} data-wallpaper={wallpaper}>
      <div className={styles.base} />
      <div className={styles.blobA} />
      <div className={styles.blobB} />
      <div className={styles.blobC} />
      <div className={styles.stars} aria-hidden="true">
        {STAR_POSITIONS.map(([left, top], i) => (
          <span key={i} className={styles.star} style={{ left: `${left}%`, top: `${top}%` }} />
        ))}
      </div>
      <svg className={styles.mountains} viewBox="0 0 1000 380" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M0,380 L0,220 L80,170 L160,210 L260,140 L360,200 L460,120 L560,190 L660,110 L760,180 L860,130 L1000,200 L1000,380 Z"
          fill="rgba(6,10,22,0.82)"
        />
      </svg>
    </div>
  );
}

const STAR_POSITIONS: [number, number][] = [
  [8, 12], [22, 8], [38, 5], [55, 10], [70, 7], [85, 15], [92, 9],
  [14, 30], [46, 25], [72, 22], [95, 38], [30, 18], [60, 14], [18, 45],
];
