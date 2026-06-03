/** Centered calculator glyph for dock / mobile icons (28×28 viewBox). */
const BTN_W = 4;
const BTN_H = 3.25;
const COLS = [7, 12, 17] as const;
const ROWS = [11, 14.75, 18.5] as const;

export function CalculatorLogoIcon({ size = 28 }: { size?: number }) {
  const keys = [
    ['#636366', '#636366', '#ff9f0a'],
    ['#636366', '#636366', '#ff9f0a'],
    ['#636366', '#636366', '#ff9f0a'],
  ] as const;

  return (
    <svg viewBox="0 0 28 28" fill="none" width={size} height={size}>
      <rect x="5" y="3" width="18" height="22" rx="3.5" fill="rgba(255,255,255,0.92)" />
      <rect x="7" y="5" width="14" height="3.5" rx="1.5" fill="#3a3a3c" />
      {ROWS.map((rowY, ri) =>
        COLS.map((colX, ci) => (
          <rect
            key={`${ri}-${ci}`}
            x={colX}
            y={rowY}
            width={BTN_W}
            height={BTN_H}
            rx="1"
            fill={keys[ri][ci]}
          />
        ))
      )}
    </svg>
  );
}
