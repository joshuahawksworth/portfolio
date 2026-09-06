// System overlays (Spotlight, Control Center, Notification Center, Launchpad).
// Rendered above windows; driven by SystemUIContext.
import { useEffect, useState } from 'react';
import { useSystemUI } from '../../context/SystemUIContext';
import ControlCenter, { BRIGHTNESS_MAX } from './ControlCenter';
import Launchpad from './Launchpad';
import NotificationCenter from './NotificationCenter';
import Spotlight from './Spotlight';
import styles from './SystemUI.module.css';

/** Darkest the fake display dimmer is allowed to go. */
const MAX_DIM = 0.4;

export default function SystemPanels() {
  const { panel, toggle, close } = useSystemUI();
  // Brightness lives here so the dimming overlay persists after Control Center closes.
  const [brightness, setBrightness] = useState(BRIGHTNESS_MAX);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === ' ' || e.code === 'Space')) {
        e.preventDefault();
        toggle('spotlight');
        return;
      }
      if (e.key === 'Escape' && panel) {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [panel, toggle, close]);

  const dim = Math.min(MAX_DIM, Math.max(0, 1 - brightness));

  return (
    <>
      {dim > 0 && <div className={styles.brightness} style={{ opacity: dim }} aria-hidden="true" />}
      {panel === 'spotlight' && <Spotlight />}
      {panel === 'controlCenter' && (
        <ControlCenter brightness={brightness} onBrightnessChange={setBrightness} />
      )}
      {panel === 'notificationCenter' && <NotificationCenter />}
      {panel === 'launchpad' && <Launchpad />}
    </>
  );
}
