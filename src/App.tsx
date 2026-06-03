import { lazy, Suspense, useState } from 'react';
import Boot from './components/Boot/Boot';
import Login from './components/Login/Login';
import Desktop from './components/Desktop/Desktop';
import MobileDesktop from './components/MobileDesktop/MobileDesktop';
import { useIsMobile } from './hooks/useIsMobile';
import './App.css';

const LiquidDesktop = lazy(() => import('./components/LiquidDesktop/LiquidDesktop'));

type Phase = 'boot' | 'login' | 'desktop';

export default function App() {
  const [phase, setPhase] = useState<Phase>('boot');
  const [liquidMode, setLiquidMode] = useState(false);
  const isMobile = useIsMobile();

  if (phase === 'boot') return <Boot onComplete={() => setPhase('login')} />;

  if (phase === 'login') {
    return (
      <Login
        onLogin={() => setPhase('desktop')}
        showLiquidOption={!isMobile}
        onLiquidLogin={() => {
          setLiquidMode(true);
          setPhase('desktop');
        }}
      />
    );
  }

  if (liquidMode && !isMobile) {
    return (
      <Suspense fallback={null}>
        <LiquidDesktop onUseStandard={() => setLiquidMode(false)} />
      </Suspense>
    );
  }

  return isMobile ? <MobileDesktop /> : <Desktop />;
}
