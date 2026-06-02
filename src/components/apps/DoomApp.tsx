import { useEffect, useRef } from 'react';
import 'js-dos/dist/js-dos.css';
import styles from './DoomApp.module.css';

// Extend window so TS is happy with the Dos global set by js-dos
declare global {
  interface Window {
    Dos: (element: HTMLDivElement, options: Record<string, unknown>) => { stop: () => void };
  }
}

const DOOM_BUNDLE = 'https://cdn.dos.zone/custom/dos/doom.jsdos';

export default function DoomApp() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    // Dynamically import the js-dos bundle (sets window.Dos as a side-effect)
    import('js-dos/dist/js-dos.js').then(() => {
      if (!window.Dos || !rootRef.current) return;
      const ci = window.Dos(rootRef.current, { url: DOOM_BUNDLE });
      return () => { try { ci.stop(); } catch { /* ignore */ } };
    });
  }, []);

  return <div ref={rootRef} className={styles.root} />;
}
