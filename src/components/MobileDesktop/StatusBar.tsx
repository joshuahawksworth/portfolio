import { useTime } from '../../hooks/useTime';
import { useSettings } from '../../context/SettingsContext';
import { formatTime } from '../../lib/clock';
import styles from './MobileDesktop.module.css';

/**
 * Phone status bar. iOS: time left, cellular / Wi-Fi / battery glyphs right.
 * Android: time left, Wi-Fi / signal / battery (with percentage) right, Material glyphs.
 */
export default function StatusBar() {
  const now = useTime();
  const { settings, os } = useSettings();
  const time = formatTime(now, { clock24h: settings.clock24h });
  const android = os === 'android';

  return (
    <div
      className={`${styles.statusBar} ${android ? styles.statusBarDroid : ''}`}
      role="presentation"
    >
      <span className={styles.statusTime}>{time}</span>
      <div className={styles.statusIcons} aria-hidden="true">
        {settings.doNotDisturb && (
          <svg viewBox="0 0 16 16" width="13" height="13" className={styles.statusGlyph}>
            <path d="M9.5 1.5a6.5 6.5 0 1 0 5 9.9A5.5 5.5 0 0 1 9.5 1.5z" fill="currentColor" />
          </svg>
        )}
        {android ? (
          <>
            {/* Wi-Fi (Material) */}
            <svg viewBox="0 0 16 12" width="16" height="12" className={styles.statusGlyph}>
              <path
                d="M8 11.4L15.3 4.1C11.3 0.3 4.7 0.3 0.7 4.1L8 11.4Z"
                fill="currentColor"
                opacity={settings.wifi ? 1 : 0.3}
              />
            </svg>
            {/* Signal triangle */}
            <svg viewBox="0 0 14 12" width="14" height="12" className={styles.statusGlyph}>
              <path d="M14 0v12H2z" fill="currentColor" />
            </svg>
            {/* Battery, Android style: horizontal with percentage */}
            <svg viewBox="0 0 22 12" width="22" height="12" className={styles.statusGlyph}>
              <rect x="0.5" y="1.5" width="18" height="9" rx="2" fill="currentColor" />
              <rect x="19.5" y="4.5" width="2" height="3" rx="0.6" fill="currentColor" />
            </svg>
            <span className={styles.statusPct}>100%</span>
          </>
        ) : (
          <>
            {/* Cellular */}
            <svg viewBox="0 0 18 12" width="18" height="12" className={styles.statusGlyph}>
              <rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor" />
              <rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor" />
              <rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor" />
              <rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor" />
            </svg>
            {/* Wi-Fi */}
            <svg viewBox="0 0 16 12" width="16" height="12" className={styles.statusGlyph}>
              <path
                d="M8 11.4L15.3 4.1C11.3 0.3 4.7 0.3 0.7 4.1L8 11.4Z"
                fill="currentColor"
                opacity="0.2"
              />
              <path
                d="M1.4 4.6C5.1 1.2 10.9 1.2 14.6 4.6L13.1 6.1C10.2 3.5 5.8 3.5 2.9 6.1L1.4 4.6ZM3.9 7.1C6.2 5.1 9.8 5.1 12.1 7.1L10.6 8.6C9.1 7.4 6.9 7.4 5.4 8.6L3.9 7.1ZM6.4 9.6C7.3 8.9 8.7 8.9 9.6 9.6L8 11.2L6.4 9.6Z"
                fill="currentColor"
                opacity={settings.wifi ? 1 : 0.35}
              />
            </svg>
            {/* Battery */}
            <svg viewBox="0 0 27 12" width="27" height="12" className={styles.statusGlyph}>
              <rect
                x="0.5"
                y="0.5"
                width="22"
                height="11"
                rx="3"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.4"
              />
              <rect x="2" y="2" width="17" height="8" rx="1.8" fill="currentColor" />
              <path d="M24.2 4.2v3.6a2 2 0 0 0 0-3.6Z" fill="currentColor" fillOpacity="0.4" />
            </svg>
          </>
        )}
      </div>
    </div>
  );
}
