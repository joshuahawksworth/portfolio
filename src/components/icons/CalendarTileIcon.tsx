/**
 * The macOS Calendar icon is live: a white tile with the weekday in red over today's date in
 * bold. Drawn here because no static file can carry the right date.
 */
export function CalendarTileIcon({ size = 50 }: { size?: number }) {
  const now = new Date();
  const weekday = now.toLocaleDateString('en-GB', { weekday: 'short' });
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <rect x="2" y="2" width="60" height="60" rx="14" fill="#fff" />
      <text
        x="32"
        y="20"
        textAnchor="middle"
        fontFamily="-apple-system, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif"
        fontSize="12"
        fontWeight="600"
        fill="#ff3b30"
      >
        {weekday}
      </text>
      <text
        x="32"
        y="51"
        textAnchor="middle"
        fontFamily="-apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
        fontSize="33"
        fontWeight="700"
        letterSpacing="-1"
        fill="#1c1c1e"
      >
        {now.getDate()}
      </text>
      <rect
        x="2.5"
        y="2.5"
        width="59"
        height="59"
        rx="13.5"
        fill="none"
        stroke="rgba(0,0,0,0.12)"
      />
    </svg>
  );
}
