import styles from './RubberDuckApp.module.css';

interface Props {
  onClose?: () => void;
  frameless?: boolean;
  props?: Record<string, unknown>;
}

export default function RubberDuckApp({ onClose, frameless = false }: Props) {
  return (
    <div className={`${styles.root} ${frameless ? styles.frameless : ''}`}>
      <div className={styles.stage} aria-hidden="true">
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
          <div className={styles.body} />
          <div className={styles.wing} />
          <div className={styles.neck} />
          <div className={styles.head} />
          <div className={styles.eye} />
          <div className={styles.beak} />
        </div>
        <div className={styles.ripple} />
      </div>

      <div className={styles.speech}>
        <p>Have you tried explaining it out loud?</p>
      </div>
    </div>
  );
}
