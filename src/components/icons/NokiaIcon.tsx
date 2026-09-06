/** Nokia 3310 with Snake on screen — the desktop/Finder icon for the Snake game. */
export function NokiaIcon({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none" aria-hidden="true">
      {/* Phone body */}
      <rect x="9" y="1" width="30" height="46" rx="7" fill="#1c2233" />
      <rect x="10" y="2" width="28" height="44" rx="6" fill="#243044" />
      {/* Top speaker grill */}
      <rect x="18" y="5" width="12" height="2" rx="1" fill="#161f2e" />
      {/* Screen bezel */}
      <rect x="12" y="9" width="24" height="18" rx="2.5" fill="#0d0f0d" />
      {/* LCD screen */}
      <rect x="13" y="10" width="22" height="16" rx="1.5" fill="#1c2c10" />
      {/* Snake */}
      <rect x="22" y="12" width="3" height="3" fill="#4ddd4d" />
      <rect x="19" y="12" width="3" height="3" fill="#35bb35" />
      <rect x="16" y="12" width="3" height="3" fill="#2aaa2a" />
      <rect x="16" y="15" width="3" height="3" fill="#2aaa2a" />
      <rect x="16" y="18" width="3" height="3" fill="#2aaa2a" />
      <rect x="19" y="18" width="3" height="3" fill="#2aaa2a" />
      <rect x="22" y="18" width="3" height="3" fill="#2aaa2a" />
      {/* Food */}
      <rect x="30" y="13" width="2" height="2" fill="#88ff44" />
      {/* Nokia logo — pixel-art rects, no font dependency */}
      <g fill="#5a78a0" opacity="0.9">
        <rect x="11" y="29" width="1" height="4" />
        <rect x="12" y="30" width="1" height="1" />
        <rect x="13" y="31" width="1" height="1" />
        <rect x="14" y="29" width="1" height="4" />
        <rect x="16" y="29" width="3" height="1" />
        <rect x="16" y="32" width="3" height="1" />
        <rect x="16" y="30" width="1" height="2" />
        <rect x="18" y="30" width="1" height="2" />
        <rect x="20" y="29" width="1" height="4" />
        <rect x="21" y="30" width="1" height="1" />
        <rect x="22" y="29" width="1" height="1" />
        <rect x="22" y="31" width="1" height="1" />
        <rect x="23" y="32" width="1" height="1" />
        <rect x="25" y="29" width="3" height="1" />
        <rect x="26" y="30" width="1" height="2" />
        <rect x="25" y="32" width="3" height="1" />
        <rect x="29" y="30" width="3" height="1" />
        <rect x="29" y="29" width="1" height="4" />
        <rect x="31" y="29" width="1" height="4" />
        <rect x="30" y="31" width="1" height="1" />
      </g>
      {/* Navigation key */}
      <ellipse cx="24" cy="37.5" rx="5.5" ry="3.5" fill="#1a2535" />
      <circle cx="24" cy="37.5" r="2.5" fill="#141d28" />
      <circle cx="24" cy="37.5" r="1.2" fill="#1e2a3a" />
      {/* Soft keys */}
      <rect x="12" y="34" width="7" height="4" rx="2" fill="#1a2535" />
      <rect x="29" y="34" width="7" height="4" rx="2" fill="#1a2535" />
      {/* Number keys */}
      <rect x="12" y="40" width="6" height="3" rx="1.5" fill="#1a2535" />
      <rect x="21" y="40" width="6" height="3" rx="1.5" fill="#1a2535" />
      <rect x="30" y="40" width="6" height="3" rx="1.5" fill="#1a2535" />
      <rect x="12" y="44" width="6" height="2.5" rx="1.2" fill="#1a2535" />
      <rect x="21" y="44" width="6" height="2.5" rx="1.2" fill="#1a2535" />
      <rect x="30" y="44" width="6" height="2.5" rx="1.2" fill="#1a2535" />
    </svg>
  );
}
