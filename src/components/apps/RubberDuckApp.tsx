import styles from './RubberDuckApp.module.css';

interface Props {
  onClose?: () => void;
  frameless?: boolean;
  props?: Record<string, unknown>;
}

export default function RubberDuckApp({ onClose, frameless = false }: Props) {
  return (
    <div className={`${styles.root} ${frameless ? styles.frameless : ''}`}>
      <div className={styles.stage}>
        <div className={styles.duck}>
          {onClose && (
            <button
              className={styles.closeButton}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="Close Rubber Duck"
              type="button"
            >
              ×
            </button>
          )}
          <svg className={styles.duckArt} viewBox="0 0 300 170" role="img">
            <title>Rubber duck</title>
            <path className={styles.duckShadow} d="M36 136h132v12H36zm-24 12h192v10H12z" />
            <path
              className={styles.duckBody}
              d="M36 88h24V76h96v12h24v12h12v36h-12v12H48v-12H24v-12H12v-24h24z"
            />
            <path className={styles.duckTail} d="M24 88H0V76h12V64h12v12h24v12z" />
            <path
              className={styles.duckShade}
              d="M48 136h120v12H48zm120-36h24v36h-12v12h-24v-12h12z"
            />
            <path className={styles.duckWing} d="M72 104h48v12h24v12h-12v12H72z" />
            <path className={styles.duckNeck} d="M144 52h36v48h-24V76h-12z" />
            <path className={styles.duckHead} d="M156 28h72v12h12v36h-12v12h-72V76h-12V40h12z" />
            <path className={styles.duckBeakTop} d="M228 52h12V40h24v12h24v24h-60z" />
            <path className={styles.duckBeakBottom} d="M228 76h48v12h-48z" />
            <rect className={styles.duckEye} x="204" y="48" width="10" height="10" />
            <rect className={styles.duckHighlight} x="174" y="40" width="18" height="10" />
          </svg>
        </div>
      </div>
    </div>
  );
}
