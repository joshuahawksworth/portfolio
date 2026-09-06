import { useState } from 'react';
import Boot from './components/Boot/Boot';
import Login from './components/Login/Login';
import Desktop from './components/Desktop/Desktop';
import MobileDesktop from './components/MobileDesktop/MobileDesktop';
import { useIsMobile } from './hooks/useIsMobile';
import { useAppHeight } from './hooks/useAppHeight';
import './App.css';

type Phase = 'boot' | 'login' | 'desktop';

export default function App() {
  const [phase, setPhase] = useState<Phase>('boot');
  const isMobile = useIsMobile();
  useAppHeight();

  if (phase === 'boot') return <Boot onComplete={() => setPhase('login')} />;

  if (phase === 'login') return <Login onLogin={() => setPhase('desktop')} />;

  return isMobile ? <MobileDesktop /> : <Desktop />;
}
