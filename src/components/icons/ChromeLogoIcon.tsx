export interface ChromeLogoIconProps {
  size?: number;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

/** Google Chrome mark — arc sectors (matches desktop dock icon, scales cleanly on mobile). */
export function ChromeLogoIcon({
  size = 62,
  alt = 'Chrome',
  className,
  style,
}: ChromeLogoIconProps) {
  const radius = Math.round(size * 0.23);

  return (
    <svg
      viewBox="0 0 44 44"
      width={size}
      height={size}
      role="img"
      aria-label={alt}
      className={className}
      style={{
        display: 'block',
        borderRadius: radius,
        flexShrink: 0,
        boxShadow: '0 4px 12px rgba(0,0,0,0.45)',
        ...style,
      }}
    >
      <rect width="44" height="44" rx="11" fill="white" />
      <path d="M22 22 L5.55 12.5 A19 19 0 0 1 38.45 12.5 Z" fill="#EA4335" />
      <path d="M22 22 L38.45 12.5 A19 19 0 0 1 22 41 Z" fill="#FBBC05" />
      <path d="M22 22 L22 41 A19 19 0 0 1 5.55 12.5 Z" fill="#34A853" />
      <circle cx="22" cy="22" r="13" fill="white" />
      <line x1="10.74" y1="15.5" x2="5.55" y2="12.5" stroke="white" strokeWidth="2" />
      <line x1="33.26" y1="15.5" x2="38.45" y2="12.5" stroke="white" strokeWidth="2" />
      <line x1="22" y1="35" x2="22" y2="41" stroke="white" strokeWidth="2" />
      <circle cx="22" cy="22" r="10.5" fill="#4285F4" />
      <circle cx="22" cy="22" r="13" fill="none" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}
