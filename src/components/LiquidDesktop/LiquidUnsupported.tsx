import ChromeFlagLink from '../ChromeFlagLink';
import styles from './LiquidDesktop.module.css';

interface Props {
  onUseStandard: () => void;
}

export default function LiquidUnsupported({ onUseStandard }: Props) {
  return (
    <div className={styles.unsupported}>
      <div className={styles.unsupportedCard}>
        <h1>Liquid DOM needs a Chrome flag</h1>
        <p>
          This version uses <strong>@liquid-dom/react</strong>, which needs the experimental
          HTML-in-Canvas API. Enable it in Chrome, restart the browser, then try again.
        </p>
        <ol>
          <li>Open <ChromeFlagLink /></li>
          <li>Set <strong>Canvas Draw Element</strong> to <strong>Enabled</strong></li>
          <li>Restart Chrome completely (quit and reopen)</li>
          <li>Reload this page and try Liquid DOM again</li>
        </ol>
        <p className={styles.unsupportedNote}>
          If the flag is already enabled, a full browser restart is usually still required.
        </p>
        <div className={styles.unsupportedActions}>
          <button type="button" className={styles.unsupportedPrimary} onClick={onUseStandard}>
            Use standard desktop
          </button>
        </div>
      </div>
    </div>
  );
}
