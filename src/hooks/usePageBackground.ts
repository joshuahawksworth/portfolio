import { useEffect } from 'react';

/**
 * Paint the page itself (`<html>` and `<body>`) in `color` while the component is mounted.
 * Full-screen phases use it so nothing else ever shows through: the boot, shutdown and
 * lock screens sit on black, and a screen fading in or out fades over black rather than
 * over the desktop's amber page colour.
 */
export function usePageBackground(color: string) {
  useEffect(() => {
    const html = document.documentElement;
    const prevHtml = html.style.backgroundColor;
    const prevBody = document.body.style.backgroundColor;
    html.style.backgroundColor = color;
    document.body.style.backgroundColor = color;
    return () => {
      html.style.backgroundColor = prevHtml;
      document.body.style.backgroundColor = prevBody;
    };
  }, [color]);
}
