/**
 * File-system artwork shared by the desktop, Finder, Get Info and the Trash.
 *
 * These are drawn to sit next to the real macOS app icons in /public/icons, so they
 * use the same language: soft vertical gradients, a thin light rim on top, a subtle
 * inner shadow, and no hard outlines. Every gradient id is scoped with useId so many
 * copies can share one page.
 */
import { useId, type CSSProperties } from 'react';

type IconProps = { size?: number; style?: CSSProperties; className?: string };

/** macOS system folder: dark back panel with a tab, lighter front panel. */
export function FolderIcon({
  size = 48,
  tone = 'blue',
  style,
  className,
  children,
}: IconProps & { tone?: 'blue' | 'amber'; children?: React.ReactNode }) {
  const uid = useId().replace(/:/g, '');
  const back = `${uid}b`;
  const front = `${uid}f`;
  const sheen = `${uid}s`;
  const [b1, b2, f1, f2] =
    tone === 'amber'
      ? ['#e9a83d', '#cf8a1f', '#ffd27a', '#f0ad3f']
      : ['#43a3f2', '#2b83da', '#8fd0ff', '#4aa3f4'];

  return (
    <svg
      viewBox="0 0 64 52"
      width={size}
      height={size * (52 / 64)}
      fill="none"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={back} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={b1} />
          <stop offset="1" stopColor={b2} />
        </linearGradient>
        <linearGradient id={front} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={f1} />
          <stop offset="1" stopColor={f2} />
        </linearGradient>
        <linearGradient id={sheen} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Back panel + tab */}
      <path
        d="M4 9.5Q4 5 8.5 5H23.5Q25.5 5 26.8 6.4L29.5 9.5H55.5Q60 9.5 60 14V44Q60 48.5 55.5 48.5H8.5Q4 48.5 4 44Z"
        fill={`url(#${back})`}
      />
      {/* Shadow the front panel casts on the back */}
      <rect x="4" y="14" width="56" height="4" fill="#000" opacity="0.12" />
      {/* Front panel */}
      <rect x="4" y="16" width="56" height="32.5" rx="4.5" fill={`url(#${front})`} />
      <rect x="4" y="16" width="56" height="32.5" rx="4.5" fill={`url(#${sheen})`} />
      {/* Top edge highlight */}
      <rect x="6" y="16.6" width="52" height="1" rx="0.5" fill="#fff" opacity="0.5" />
      {/* Bottom inner shadow */}
      <rect x="4" y="44" width="56" height="4.5" rx="4" fill="#000" opacity="0.07" />
      {children}
    </svg>
  );
}

const EXT_TINT: Record<string, string> = {
  pdf: '#e0433a',
  md: '#2e9c6b',
  txt: '#7c7c85',
  js: '#d9a400',
  jsx: '#d9a400',
  ts: '#2f6fd6',
  tsx: '#2f6fd6',
  json: '#8a5cd6',
  html: '#e0552b',
  css: '#2e6fe8',
  csv: '#2e9c6b',
  yml: '#b0648d',
  yaml: '#b0648d',
  sh: '#3a3a44',
  py: '#3776ab',
  png: '#0aa2c4',
  jpg: '#0aa2c4',
  jpeg: '#0aa2c4',
  gif: '#0aa2c4',
  webp: '#0aa2c4',
};

/** Generic document: white page, folded corner, faint text, extension badge. */
export function DocumentIcon({ name, size = 48, style, className }: IconProps & { name: string }) {
  const uid = useId().replace(/:/g, '');
  const page = `${uid}p`;
  const fold = `${uid}f`;
  const dot = name.lastIndexOf('.');
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
  const tint = EXT_TINT[ext] ?? '#8a8a94';
  const label = ext.slice(0, 4).toUpperCase();

  return (
    <svg
      viewBox="0 0 44 56"
      width={size * (44 / 56)}
      height={size}
      fill="none"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={page} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eeeef1" />
        </linearGradient>
        <linearGradient id={fold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6f6f8" />
          <stop offset="1" stopColor="#d5d5db" />
        </linearGradient>
      </defs>
      <path
        d="M7 1.5H27.5L41 15V50.5Q41 54.5 37 54.5H7Q3 54.5 3 50.5V5.5Q3 1.5 7 1.5Z"
        fill={`url(#${page})`}
        stroke="rgba(0,0,0,0.16)"
        strokeWidth="0.8"
      />
      <path
        d="M27.5 1.5V11Q27.5 15 31.5 15H41Z"
        fill={`url(#${fold})`}
        stroke="rgba(0,0,0,0.16)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Text lines */}
      <g stroke="rgba(60,60,70,0.28)" strokeWidth="1.6" strokeLinecap="round">
        <path d="M10 23H29" />
        <path d="M10 28.5H32" />
        <path d="M10 34H26" />
      </g>
      {label && (
        <>
          <rect x="9" y="40" width={label.length * 5.2 + 6} height="9" rx="2.2" fill={tint} />
          <text
            x={12 + (label.length * 5.2) / 2}
            y="46.7"
            textAnchor="middle"
            fill="#fff"
            fontSize="6.6"
            fontWeight="700"
            fontFamily="-apple-system, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif"
            letterSpacing="0.03em"
          >
            {label}
          </text>
        </>
      )}
    </svg>
  );
}

/** Image file with no thumbnail available. */
export function PictureIcon({ size = 48, style, className }: IconProps) {
  const uid = useId().replace(/:/g, '');
  const sky = `${uid}s`;
  return (
    <svg
      viewBox="0 0 52 44"
      width={size}
      height={size * (44 / 52)}
      fill="none"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fd3ff" />
          <stop offset="1" stopColor="#3f9ef0" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="48" height="40" rx="5" fill="#fff" stroke="rgba(0,0,0,0.16)" />
      <rect x="5" y="5" width="42" height="34" rx="3" fill={`url(#${sky})`} />
      <circle cx="37" cy="14" r="4" fill="#ffe27a" />
      <path d="M5 39L18 22L27 32L34 25L47 39Z" fill="#3f8f4b" />
      <path d="M5 39L18 22L27 32L34 25L47 39" stroke="#2f7a3c" strokeWidth="1" fill="none" />
    </svg>
  );
}

/** "Macintosh HD": a flat silver drive seen from slightly above, with a status LED. */
export function MacintoshHDIcon({ size = 50, style, className }: IconProps) {
  const uid = useId().replace(/:/g, '');
  const top = `${uid}t`;
  const front = `${uid}f`;
  return (
    <svg
      viewBox="0 0 52 52"
      width={size}
      height={size}
      fill="none"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={top} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbfaf8" />
          <stop offset="1" stopColor="#dedbd5" />
        </linearGradient>
        <linearGradient id={front} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9c5be" />
          <stop offset="1" stopColor="#a39f98" />
        </linearGradient>
      </defs>
      {/* Front edge */}
      <path
        d="M4 30Q4 26 8 26H44Q48 26 48 30V38Q48 43 43 43H9Q4 43 4 38Z"
        fill={`url(#${front})`}
      />
      {/* Top surface */}
      <rect x="4" y="9" width="44" height="26" rx="7" fill={`url(#${top})`} />
      <rect x="4.5" y="9.5" width="43" height="25" rx="6.5" stroke="rgba(255,255,255,0.8)" />
      <rect x="4.5" y="9.5" width="43" height="25" rx="6.5" stroke="rgba(0,0,0,0.08)" />
      {/* Inset label plate */}
      <rect x="10" y="14" width="32" height="15" rx="4" fill="rgba(0,0,0,0.05)" />
      <rect x="10.5" y="14.5" width="31" height="14" rx="3.5" stroke="rgba(0,0,0,0.07)" />
      <path
        d="M14.5 19.5H33M14.5 23.5H26"
        stroke="rgba(0,0,0,0.13)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Vents + LED on the front edge */}
      <path
        d="M13 37H31"
        stroke="rgba(0,0,0,0.14)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="1.6 2.2"
      />
      <circle cx="40" cy="37" r="2" fill="#30d158" />
      <circle cx="40" cy="37" r="2.8" fill="#30d158" opacity="0.28" />
    </svg>
  );
}

/** Frosted wire-mesh bin, wider at the top; shows crumpled paper when full. */
export function TrashBinIcon({
  size = 50,
  full = false,
  glow = false,
  style,
  className,
}: IconProps & { full?: boolean; glow?: boolean }) {
  const uid = useId().replace(/:/g, '');
  const body = `${uid}b`;
  const rim = `${uid}r`;
  const mesh = `${uid}m`;
  const clip = `${uid}c`;
  const paper = `${uid}p`;
  const glowStyle: CSSProperties | undefined = glow
    ? {
        filter:
          'drop-shadow(0 0 8px rgba(0,122,255,0.7)) drop-shadow(0 0 16px rgba(0,122,255,0.4))',
      }
    : undefined;

  return (
    <svg
      viewBox="0 0 52 56"
      width={size * (52 / 56)}
      height={size}
      fill="none"
      style={{ ...glowStyle, ...style }}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={body} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f7f6f3" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#dedbd5" stopOpacity="0.9" />
          <stop offset="1" stopColor="#c6c2bb" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={rim} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#cfcbc4" />
        </linearGradient>
        <linearGradient id={paper} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e2dfd8" />
        </linearGradient>
        <pattern id={mesh} width="3.2" height="3.2" patternUnits="userSpaceOnUse">
          <circle cx="1.6" cy="1.6" r="0.75" fill="rgba(0,0,0,0.13)" />
        </pattern>
        <clipPath id={clip}>
          <path d="M9.5 19H42.5L39.2 49.5Q38.8 52.5 35.8 52.5H16.2Q13.2 52.5 12.8 49.5Z" />
        </clipPath>
      </defs>

      {full && (
        <g>
          <path
            d="M15 19L17 8L24 7.5L22 19Z"
            fill={`url(#${paper})`}
            stroke="rgba(0,0,0,0.14)"
            strokeLinejoin="round"
          />
          <path
            d="M23 19L26.5 6L33.5 9L31 19Z"
            fill="#fff5c9"
            stroke="rgba(0,0,0,0.14)"
            strokeLinejoin="round"
          />
          <path
            d="M31 19L34 10L40 13.5L37.5 19Z"
            fill="#d8ecff"
            stroke="rgba(0,0,0,0.14)"
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* Body */}
      <path
        d="M9.5 19H42.5L39.2 49.5Q38.8 52.5 35.8 52.5H16.2Q13.2 52.5 12.8 49.5Z"
        fill={`url(#${body})`}
      />
      <rect x="0" y="0" width="52" height="56" fill={`url(#${mesh})`} clipPath={`url(#${clip})`} />
      <path
        d="M9.5 19H42.5L39.2 49.5Q38.8 52.5 35.8 52.5H16.2Q13.2 52.5 12.8 49.5Z"
        stroke="rgba(0,0,0,0.16)"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      {/* Vertical ribs */}
      <path
        d="M17.5 23L18.8 48M26 23V48M34.5 23L33.2 48"
        stroke="rgba(0,0,0,0.12)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* Rim */}
      <rect x="7" y="15.5" width="38" height="5" rx="2.5" fill={`url(#${rim})`} />
      <rect
        x="7"
        y="15.5"
        width="38"
        height="5"
        rx="2.5"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="0.9"
      />
      {/* Lid handle */}
      {!full && (
        <rect
          x="21"
          y="12"
          width="10"
          height="4"
          rx="2"
          fill="#ebe8e2"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="0.9"
        />
      )}
    </svg>
  );
}
