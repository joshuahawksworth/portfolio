import { useCallback, useMemo, useState } from 'react';
import Boot from './components/Boot/Boot';
import PowerOff from './components/Boot/PowerOff';
import Shutdown, { type ShutdownMode } from './components/Boot/Shutdown';
import Login from './components/Login/Login';
import Desktop from './components/Desktop/Desktop';
import MobileDesktop from './components/MobileDesktop/MobileDesktop';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { SessionProvider, type SessionValue } from './context/SessionContext';
import { NotificationProvider } from './context/NotificationContext';
import { useAppHeight } from './hooks/useAppHeight';
import type { OsName, Platform } from './lib/settingsStore';
import './App.css';

type Phase = 'boot' | 'login' | 'desktop' | 'shutdown' | 'off';

interface Transition {
  /** The OS whose shutdown screen plays (captured before any platform change). */
  os: OsName;
  mode: ShutdownMode;
  /** Platform to switch to once the old OS has shut down. */
  nextPlatform?: Platform;
}

/** Everything under the settings provider: phase flow plus the power / session actions. */
function AppInner() {
  const { settings, os, isMobile, update } = useSettings();
  const [phase, setPhase] = useState<Phase>('boot');
  // Bumped on every boot so the boot screen (and its animation) mounts fresh.
  const [bootCount, setBootCount] = useState(0);
  const [transition, setTransition] = useState<Transition | null>(null);

  const boot = useCallback(() => {
    setBootCount((n) => n + 1);
    setPhase('boot');
  }, []);
  const toLogin = useCallback(() => setPhase('login'), []);
  const toDesktop = useCallback(() => setPhase('desktop'), []);

  const session = useMemo<SessionValue>(
    () => ({
      lock: () => setPhase('login'),
      logOut: () => setPhase('login'),
      restart: () => {
        setTransition({ os, mode: 'restart' });
        setPhase('shutdown');
      },
      shutDown: () => {
        setTransition({ os, mode: 'shutdown' });
        setPhase('shutdown');
      },
      switchPlatform: (platform) => {
        if (platform === settings.platform) return;
        setTransition({ os, mode: 'restart', nextPlatform: platform });
        setPhase('shutdown');
      },
    }),
    [os, settings.platform]
  );

  // The old OS has finished shutting down: apply any platform change, then boot or power off.
  const finishShutdown = useCallback(() => {
    if (!transition) return;
    if (transition.nextPlatform) update({ platform: transition.nextPlatform });
    if (transition.mode === 'restart') boot();
    else setPhase('off');
    setTransition(null);
  }, [transition, update, boot]);

  let screen;
  if (phase === 'shutdown' && transition) {
    screen = (
      <Shutdown
        key={`shutdown-${transition.os}-${transition.mode}`}
        os={transition.os}
        mode={transition.mode}
        onDone={finishShutdown}
      />
    );
  } else if (phase === 'off') {
    screen = <PowerOff onPowerOn={boot} />;
  } else if (phase === 'boot') {
    screen = <Boot key={`boot-${bootCount}`} onComplete={toLogin} />;
  } else if (phase === 'login') {
    screen = <Login key="login" onLogin={toDesktop} />;
  } else {
    screen = isMobile ? <MobileDesktop key="mobile" /> : <Desktop key="desktop" />;
  }

  return (
    <SessionProvider value={session}>
      <NotificationProvider>{screen}</NotificationProvider>
    </SessionProvider>
  );
}

export default function App() {
  useAppHeight();
  return (
    <SettingsProvider>
      <AppInner />
    </SettingsProvider>
  );
}
