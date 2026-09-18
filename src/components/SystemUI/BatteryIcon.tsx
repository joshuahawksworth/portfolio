import {
  BATTERY_GLYPH,
  BATTERY_LEVEL,
  batteryFillWidth,
  clampBatteryLevel,
} from '../../lib/battery';

const { viewW: VIEW_W, viewH: VIEW_H, body: BODY, fill: FILL } = BATTERY_GLYPH;

type Props = {
  /** Charge from 0 to 100. */
  level?: number;
  /** Rendered width in CSS pixels; the height follows the glyph's aspect ratio. */
  width?: number;
  className?: string;
  /**
   * Colour of the digits. iOS draws them in the colour that contrasts with the fill: black
   * digits on a white battery in a light-on-dark status bar.
   */
  digitColor?: string;
};

/**
 * Battery glyph in the iOS 16.1 style: a light grey body, a fill in the text colour that
 * shrinks with the charge, and the percentage written across the battery in a contrasting
 * colour. Plain shapes only, no masks or clip paths, so it renders the same in every browser.
 */
export default function BatteryIcon({
  level = BATTERY_LEVEL,
  width = 27,
  className,
  digitColor = '#000',
}: Props) {
  const pct = clampBatteryLevel(level);
  const fillW = batteryFillWidth(pct);
  const height = (width * VIEW_H) / VIEW_W;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width={width}
      height={height}
      // Inline so a caller's icon class (fixed square boxes in the system bars) cannot squash it.
      style={{ width, height }}
      role="img"
      aria-label={`Battery ${pct}%`}
      data-battery-level={pct}
    >
      {/* Body: the text colour at low opacity reads as iOS's light grey battery. */}
      <rect
        x={BODY.x}
        y={BODY.y}
        width={BODY.w}
        height={BODY.h}
        rx={BODY.r}
        fill="currentColor"
        fillOpacity="0.35"
      />
      <path d="M24.2 4.2v3.6a2 2 0 0 0 0-3.6Z" fill="currentColor" fillOpacity="0.35" />
      {fillW > 0 && (
        <rect x={FILL.x} y={FILL.y} width={fillW} height={FILL.h} rx={FILL.r} fill="currentColor" />
      )}
      <text
        x={FILL.x + FILL.w / 2}
        y={VIEW_H / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="8.6"
        fontWeight="700"
        letterSpacing="-0.2"
        fill={digitColor}
        style={{ fontFamily: 'var(--font-ui, system-ui, sans-serif)' }}
      >
        {pct}
      </text>
    </svg>
  );
}
