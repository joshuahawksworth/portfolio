import { useEffect, useState } from 'react';

/**
 * Milliseconds since the component mounted, refreshed every animation frame. Drives the
 * boot and shutdown screens' progress from the clock, so they play the same whatever
 * happens to CSS animations. Pauses with the tab (frames stop while it is hidden) and
 * catches up when it is shown again.
 */
export function useElapsed(): number {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const tick = () => {
      setElapsed(performance.now() - start);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return elapsed;
}
