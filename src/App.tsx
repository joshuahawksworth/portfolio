import { useState, useEffect } from 'react';
import Boot from './components/Boot/Boot';
import Login from './components/Login/Login';
import Desktop from './components/Desktop/Desktop';
import MobileDesktop from './components/MobileDesktop/MobileDesktop';
import LiquidDesktop from './components/LiquidDesktop/LiquidDesktop';
import './App.css';

type Phase = 'boot' | 'login' | 'desktop';

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const fn = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return mobile;
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('boot');
  const [liquidMode, setLiquidMode] = useState(false);
  const isMobile = useIsMobile();

  if (phase === 'boot') return <Boot onComplete={() => setPhase('login')} />;
  if (phase === 'login') return (
    <Login
      onLogin={() => setPhase('desktop')}
      onLiquidLogin={() => { setLiquidMode(true); setPhase('desktop'); }}
    />
  );
  if (liquidMode) return <LiquidDesktop />;
  return isMobile ? <MobileDesktop /> : <Desktop />;
}
