import { useEffect, useRef } from 'react';
import styles from './DoomApp.module.css';

declare global {
  interface Window {
    Dos: (element: HTMLDivElement, options: Record<string, unknown>) => { stop: () => void };
  }
}

export default function DoomApp() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !window.Dos) return;
    const ci = window.Dos(el, { url: '/doom.jsdos' });
    return () => { try { ci.stop(); } catch { /* ignore */ } };
  }, []);

  return <div ref={rootRef} className={styles.root} />;
}
