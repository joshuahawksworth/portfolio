import { useId } from 'react';
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
   * Outline and nub opacity. The system bars fade them so the filled body reads as the
   * icon, the way macOS and iOS draw it.
   */
  frameOpacity?: number;
};

/**
 * Battery glyph with the percentage written on the battery itself, as macOS (Show
 * Percentage) and iOS 16+ do. The digits are cut out of the filled body so they show the bar
 * behind, and drawn in the text colour over any unfilled part, so the number stays legible at
 * every charge level.
 */
export default function BatteryIcon({
  level = BATTERY_LEVEL,
  width = 27,
  className,
  frameOpacity = 0.4,
}: Props) {
  const id = useId();
  const maskId = `${id}-cutout`;
  const emptyClipId = `${id}-empty`;
  const pct = clampBatteryLevel(level);
  const fillW = batteryFillWidth(pct);
  const height = (width * VIEW_H) / VIEW_W;
  const digits = (
    <text
      x={FILL.x + FILL.w / 2}
      y={VIEW_H / 2}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="8.4"
      fontWeight="700"
      letterSpacing="-0.2"
      style={{ fontFamily: 'var(--font-ui, system-ui, sans-serif)' }}
    >
      {pct}
    </text>
  );

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
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={VIEW_W} height={VIEW_H}>
          <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="#fff" />
          <g fill="#000">{digits}</g>
        </mask>
        <clipPath id={emptyClipId}>
          <rect
            x={FILL.x + fillW}
            y="0"
            width={Math.max(0, VIEW_W - FILL.x - fillW)}
            height={VIEW_H}
          />
        </clipPath>
      </defs>
      <rect
        x={BODY.x}
        y={BODY.y}
        width={BODY.w}
        height={BODY.h}
        rx={BODY.r}
        fill="none"
        stroke="currentColor"
        strokeOpacity={frameOpacity}
      />
      <path d="M24.2 4.2v3.6a2 2 0 0 0 0-3.6Z" fill="currentColor" fillOpacity={frameOpacity} />
      {/* Digits in the text colour over the empty part of the body only. */}
      <g fill="currentColor" clipPath={`url(#${emptyClipId})`}>
        {digits}
      </g>
      {fillW > 0 && (
        <rect
          x={FILL.x}
          y={FILL.y}
          width={fillW}
          height={FILL.h}
          rx={FILL.r}
          fill="currentColor"
          mask={`url(#${maskId})`}
        />
      )}
    </svg>
  );
}
