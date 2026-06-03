import { useState } from 'react';
import Boot from './components/Boot/Boot';
import Login from './components/Login/Login';
import Desktop from './components/Desktop/Desktop';
import MobileDesktop from './components/MobileDesktop/MobileDesktop';
import LiquidDesktop from './components/LiquidDesktop/LiquidDesktop';
import { useIsMobile } from './hooks/useIsMobile';
import './App.css';

type Phase = 'boot' | 'login' | 'desktop';

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
