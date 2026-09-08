import { useMemo, useState } from 'react';
import Boot from './components/Boot/Boot';
import PowerOff from './components/Boot/PowerOff';
import Login from './components/Login/Login';
import Desktop from './components/Desktop/Desktop';
import MobileDesktop from './components/MobileDesktop/MobileDesktop';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { SessionProvider, type SessionValue } from './context/SessionContext';
import { useAppHeight } from './hooks/useAppHeight';
import './App.css';

type Phase = 'boot' | 'login' | 'desktop' | 'off';

function Shell({
  phase,
  onBooted,
  onLogin,
  onPowerOn,
}: {
  phase: Phase;
  onBooted: () => void;
  onLogin: () => void;
  onPowerOn: () => void;
}) {
  const { isMobile } = useSettings();
  if (phase === 'off') return <PowerOff onPowerOn={onPowerOn} />;
  if (phase === 'boot') return <Boot onComplete={onBooted} />;
  if (phase === 'login') return <Login onLogin={onLogin} />;
  return isMobile ? <MobileDesktop /> : <Desktop />;
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('boot');
  // Bumped on restart so the boot screen (and its animation) mounts fresh.
  const [bootCount, setBootCount] = useState(0);
  useAppHeight();

  const session = useMemo<SessionValue>(
    () => ({
      lock: () => setPhase('login'),
      logOut: () => setPhase('login'),
      restart: () => {
        setBootCount((n) => n + 1);
        setPhase('boot');
      },
      shutDown: () => setPhase('off'),
    }),
    []
  );

  return (
    <SettingsProvider>
      <SessionProvider value={session}>
        <Shell
          key={phase === 'boot' ? `boot-${bootCount}` : phase}
          phase={phase}
          onBooted={() => setPhase('login')}
          onLogin={() => setPhase('desktop')}
          onPowerOn={session.restart}
        />
      </SessionProvider>
    </SettingsProvider>
  );
}
