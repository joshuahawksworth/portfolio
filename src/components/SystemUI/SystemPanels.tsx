// System overlays (Spotlight, Control Center / Quick Settings, Notification Center,
// Launchpad, Start menu). Rendered above windows; driven by SystemUIContext.
import { useEffect } from 'react';
import { useSystemUI } from '../../context/SystemUIContext';
import { useSettings } from '../../context/SettingsContext';
import ControlCenter from './ControlCenter';
import Launchpad from './Launchpad';
import NotificationCenter from './NotificationCenter';
import Spotlight from './Spotlight';
import StartMenu from './StartMenu';
import styles from './SystemUI.module.css';

/** Darkest the fake display dimmer is allowed to go. */
const MAX_DIM = 0.4;

/** Screen-wide overlays driven by settings: display dimming and the Night Shift tint. */
export function DisplayOverlays() {
  const { settings } = useSettings();
  const dim = Math.min(MAX_DIM, Math.max(0, 1 - settings.brightness));
  const warmth = settings.nightLight ? 0.12 + settings.nightLightWarmth * 0.3 : 0;
  return (
    <>
      {dim > 0 && <div className={styles.brightness} style={{ opacity: dim }} aria-hidden="true" />}
      {warmth > 0 && (
        <div className={styles.nightLight} style={{ opacity: warmth }} aria-hidden="true" />
      )}
    </>
  );
}

export default function SystemPanels() {
  const { panel, toggle, close } = useSystemUI();
  const { os } = useSettings();

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

  return (
    <>
      <DisplayOverlays />
      {panel === 'spotlight' && <Spotlight />}
      {panel === 'controlCenter' && <ControlCenter />}
      {panel === 'notificationCenter' && <NotificationCenter />}
      {panel === 'launchpad' && <Launchpad />}
      {panel === 'startMenu' && os === 'windows' && <StartMenu />}
    </>
  );
}
