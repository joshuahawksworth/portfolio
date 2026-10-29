import { useEffect, useRef } from 'react';

/**
 * On a phone the browser's back button (and the iOS back swipe) is how people expect to leave
 * an open app, but the portfolio is a single page, so "back" leaves the site instead. Keep one
 * history entry on the stack while at least one app is open: going back pops it and closes the
 * topmost app, and it is pushed again while apps remain. Closing the last app from the UI
 * removes the entry, so back then leaves the site as usual.
 */
export function useBackButtonClosesApp(openCount: number, closeTop: () => void) {
  const pushed = useRef(false);
  const closeTopRef = useRef(closeTop);
  closeTopRef.current = closeTop;

  useEffect(() => {
    if (openCount > 0 && !pushed.current) {
      pushed.current = true;
      window.history.pushState({ portfolioApp: true }, '');
    } else if (openCount === 0 && pushed.current) {
      pushed.current = false;
      window.history.back();
    }
  }, [openCount]);

  useEffect(() => {
    const onPop = () => {
      // A back() we issued ourselves arrives here too; the flag is already down then.
      if (!pushed.current) return;
      pushed.current = false;
      closeTopRef.current();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (pushed.current) {
        pushed.current = false;
        window.history.back();
      }
    };
  }, []);
}
