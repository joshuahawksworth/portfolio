import type { CSSProperties } from 'react';

/** The weather conditions the widgets distinguish, from the WMO interpretation codes. */
export type WeatherKind =
  'sun' | 'partly' | 'cloud' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'showers' | 'thunder';

const SUN = '#fbbc04';
const CLOUD = '#e9edf3';
const CLOUD_SHADE = '#c9d2de';
const GREY = '#aeb7c4';
const RAIN = '#4a90e2';

function Cloud({ x = 0, y = 0, fill = CLOUD, scale = 1 }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${scale})`}
      d="M17 42h26a9 9 0 0 0 1.2-17.92A12 12 0 0 0 21.6 20.6 8 8 0 0 0 9 27a7.5 7.5 0 0 0 8 15z"
      fill={fill}
    />
  );
}

function Sun({ cx = 24, cy = 24, r = 10 }) {
  const rays = Array.from({ length: 8 }, (_, i) => (i * 360) / 8);
  return (
    <g>
      {rays.map((a) => (
        <line
          key={a}
          x1={cx}
          y1={cy - r - 3}
          x2={cx}
          y2={cy - r - 8}
          stroke={SUN}
          strokeWidth="3.4"
          strokeLinecap="round"
          transform={`rotate(${a} ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r={r} fill={SUN} />
    </g>
  );
}

function Drops({ n = 3, y = 46 }) {
  return (
    <g stroke={RAIN} strokeWidth="3.2" strokeLinecap="round">
      {Array.from({ length: n }, (_, i) => {
        const x = 24 + (i - (n - 1) / 2) * 10;
        return <line key={i} x1={x + 2} y1={y} x2={x - 1} y2={y + 8} />;
      })}
    </g>
  );
}

function Flakes() {
  return (
    <g fill={RAIN}>
      {[16, 26, 36].map((x) => (
        <circle key={x} cx={x} cy={50} r="2.6" />
      ))}
    </g>
  );
}

/**
 * Flat, rounded weather glyphs in the style of the Google weather icons the Pixel launcher
 * shows in At a Glance. Coloured, so they sit on any background without a text colour.
 */
export function WeatherIcon({
  kind,
  size = 20,
  style,
}: {
  kind: WeatherKind;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 56 60"
      width={size}
      height={size}
      style={{ display: 'inline-block', verticalAlign: '-0.2em', flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {kind === 'sun' && <Sun cx={28} cy={30} r={13} />}
      {kind === 'partly' && (
        <>
          <Sun cx={21} cy={22} r={9} />
          <Cloud x={6} y={4} />
        </>
      )}
      {kind === 'cloud' && (
        <>
          <Cloud x={12} y={-2} fill={CLOUD_SHADE} scale={0.8} />
          <Cloud x={2} y={6} />
        </>
      )}
      {kind === 'fog' && (
        <>
          <Cloud x={4} y={-4} fill={GREY} />
          <g stroke={GREY} strokeWidth="3.4" strokeLinecap="round">
            <line x1="12" y1="46" x2="44" y2="46" />
            <line x1="18" y1="53" x2="40" y2="53" />
          </g>
        </>
      )}
      {(kind === 'drizzle' || kind === 'rain') && (
        <>
          <Cloud x={4} y={-6} fill={kind === 'rain' ? GREY : CLOUD} />
          <Drops n={kind === 'rain' ? 3 : 2} y={44} />
        </>
      )}
      {kind === 'showers' && (
        <>
          <Sun cx={19} cy={16} r={8} />
          <Cloud x={6} y={-4} />
          <Drops n={3} y={44} />
        </>
      )}
      {kind === 'snow' && (
        <>
          <Cloud x={4} y={-6} fill={CLOUD} />
          <Flakes />
        </>
      )}
      {kind === 'thunder' && (
        <>
          <Cloud x={4} y={-8} fill={GREY} />
          <path d="M30 34 L22 48 h7 l-3 10 9 -14 h-7 l3 -10z" fill={SUN} />
        </>
      )}
    </svg>
  );
}
