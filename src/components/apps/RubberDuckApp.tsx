import styles from './RubberDuckApp.module.css';

export default function RubberDuckApp() {
  return (
    <div className={styles.root}>
      <div className={styles.stage} aria-hidden="true">
        <div className={styles.duck}>
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
        <p className={styles.kicker}>Rubber Duck Debugger</p>
        <h2>Have you tried explaining it out loud?</h2>
        <p>
          I am listening patiently. Start from what you expected, then tell me what actually
          happened.
        </p>
      </div>
    </div>
  );
}
