/**
 * The phone's pull-down notification shade. iOS: the blurred wallpaper, the big clock and
 * Notification Center cards. Android: a row of quick-settings tiles above the notifications.
 * Opens from a tap on the status bar or a drag down from the top edge; a tap on the
 * backdrop or a swipe up closes it.
 */
import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTime } from '../../hooks/useTime';
import { formatTime } from '../../lib/clock';
import { NotificationList } from '../SystemUI/NotificationBanners';
import styles from './MobileDesktop.module.css';

export default function NotificationShade({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { settings, os, update } = useSettings();
  const { notifications } = useNotifications();
  const now = useTime();
  const android = os === 'android';
  const startY = useRef<number | null>(null);

  function onPointerDown(e: ReactPointerEvent) {
    startY.current = e.clientY;
  }
  function onPointerUp(e: ReactPointerEvent) {
    if (startY.current === null) return;
    const dy = e.clientY - startY.current;
    startY.current = null;
    if (dy < -50) onClose();
  }

  const date = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div
      className={`${styles.shade} ${open ? styles.shadeOpen : ''} ${android ? styles.shadeDroid : ''}`}
      aria-hidden={!open}
      role="dialog"
      aria-label={android ? 'Notification shade' : 'Notification Center'}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <div className={styles.shadeBackdrop} onClick={onClose} />
      <div className={styles.shadeSheet}>
        {android ? (
          <>
            <div className={styles.shadeDroidHead}>
              <span className={styles.shadeDroidTime}>
                {formatTime(now, { clock24h: settings.clock24h })}
              </span>
              <span className={styles.shadeDroidDate}>{date}</span>
            </div>
            <div className={styles.quickTiles}>
              <button
                type="button"
                className={`${styles.quickTile} ${settings.wifi ? styles.quickTileOn : ''}`}
                onClick={() => update({ wifi: !settings.wifi })}
              >
                <span className={styles.quickTileLabel}>Internet</span>
                <span className={styles.quickTileSub}>
                  {settings.wifi ? settings.network : 'Off'}
                </span>
              </button>
              <button
                type="button"
                className={`${styles.quickTile} ${settings.bluetooth ? styles.quickTileOn : ''}`}
                onClick={() => update({ bluetooth: !settings.bluetooth })}
              >
                <span className={styles.quickTileLabel}>Bluetooth</span>
                <span className={styles.quickTileSub}>{settings.bluetooth ? 'On' : 'Off'}</span>
              </button>
              <button
                type="button"
                className={`${styles.quickTile} ${settings.doNotDisturb ? styles.quickTileOn : ''}`}
                onClick={() => update({ doNotDisturb: !settings.doNotDisturb })}
              >
                <span className={styles.quickTileLabel}>Do Not Disturb</span>
                <span className={styles.quickTileSub}>{settings.doNotDisturb ? 'On' : 'Off'}</span>
              </button>
            </div>
          </>
        ) : (
          <div className={styles.shadeIosHead}>
            <span className={styles.shadeIosDate}>{date}</span>
            <span className={styles.shadeIosTime}>
              {formatTime(now, { clock24h: settings.clock24h })}
            </span>
          </div>
        )}
        <div className={styles.shadeList}>
          <NotificationList variant={android ? 'android' : 'ios'} />
        </div>
        {!android && notifications.length === 0 && null}
        <button type="button" className={styles.shadeHandle} onClick={onClose} aria-label="Close" />
      </div>
    </div>
  );
}
