import { useState, useEffect } from 'react';
import Boot from './components/Boot/Boot';
import Login from './components/Login/Login';
import Desktop from './components/Desktop/Desktop';
import MobileDesktop from './components/MobileDesktop/MobileDesktop';
import './App.css';

type Phase = 'boot' | 'login' | 'desktop';

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('boot');
  const isMobile = useIsMobile();

  if (phase === 'boot')  return <Boot  onComplete={() => setPhase('login')} />;
  if (phase === 'login') return <Login onLogin={() => setPhase('desktop')} />;
  return isMobile ? <MobileDesktop /> : <Desktop />;
}
