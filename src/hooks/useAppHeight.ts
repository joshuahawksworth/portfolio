import { useEffect } from 'react';

/**
 * Keeps `--app-height` on <html> equal to the real visible viewport height.
 *
 * iOS Safari sizes `position: fixed; inset: 0` against a *layout* viewport that can be
 * stale after the tab is restored from the background (or reloaded there), which leaves
 * a band of body background under the app until the next resize. `window.innerHeight`
 * tracks the visual viewport and Safari fires `resize` when it settles, so the
 * full-screen surfaces size themselves from this variable instead.
 */
export function useAppHeight() {
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;

    const measure = () => {
      const h = Math.round(window.visualViewport?.height ?? window.innerHeight);
      if (h > 0) root.style.setProperty('--app-height', `${h}px`);
    };
    // Measure now, and again after layout settles (Safari often reports the stale
    // value on the first frame after a restore).
    const settle = () => {
      measure();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => requestAnimationFrame(measure));
      window.setTimeout(measure, 300);
    };

    settle();
    window.addEventListener('resize', settle);
    window.addEventListener('orientationchange', settle);
    window.addEventListener('pageshow', settle);
    window.addEventListener('focus', settle);
    document.addEventListener('visibilitychange', settle);
    window.visualViewport?.addEventListener('resize', settle);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', settle);
      window.removeEventListener('orientationchange', settle);
      window.removeEventListener('pageshow', settle);
      window.removeEventListener('focus', settle);
      document.removeEventListener('visibilitychange', settle);
      window.visualViewport?.removeEventListener('resize', settle);
      root.style.removeProperty('--app-height');
    };
  }, []);
}
