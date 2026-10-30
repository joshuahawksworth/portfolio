/**
 * The macOS Calendar icon is live: a white tile with the month in a red band and today's
 * date beneath. Drawn here because no static file can carry the right date.
 */
export function CalendarTileIcon({ size = 50 }: { size?: number }) {
  const now = new Date();
  const month = now.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <rect x="2" y="2" width="60" height="60" rx="14" fill="#fff" />
      <path d="M2 16a14 14 0 0 1 14-14h32a14 14 0 0 1 14 14v6H2z" fill="#ff3b30" />
      <text
        x="32"
        y="16.5"
        textAnchor="middle"
        fontFamily="-apple-system, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif"
        fontSize="11"
        fontWeight="600"
        fill="#fff"
      >
        {month}
      </text>
      <text
        x="32"
        y="52"
        textAnchor="middle"
        fontFamily="-apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
        fontSize="32"
        fontWeight="300"
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
