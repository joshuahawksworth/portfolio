/**
 * Snake app icon: the Nokia 3310 LCD (olive screen, dark pixels) on a deep-green tile.
 * `round` clips it to a disc for the Android launcher.
 */
export function SnakeLcdIcon({ round = false }: { round?: boolean }) {
  // 3px pixel grid on a 30px screen: the body runs in an S with the head top-right.
  const body: [number, number][] = [
    [10, 26],
    [13, 26],
    [16, 26],
    [16, 23],
    [16, 20],
    [19, 20],
    [22, 20],
    [22, 17],
    [22, 14],
    [25, 14],
    [28, 14],
  ];
  return (
    <svg viewBox="0 0 44 44" width="44" height="44" fill="none" aria-label="Snake" role="img">
      <defs>
        <linearGradient id="snakeLcdSheen" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#fff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {round ? (
        <circle cx="22" cy="22" r="22" fill="#1e3a17" />
      ) : (
        <rect width="44" height="44" rx="10" fill="#1e3a17" />
      )}
      <rect x="7" y="7" width="30" height="30" rx="4" fill="#9db861" />
      <rect x="7" y="7" width="30" height="30" rx="4" fill="url(#snakeLcdSheen)" />
      {body.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="3" height="3" fill="#16260d" />
      ))}
      <rect x="31" y="14" width="3" height="3" fill="#16260d" />
      <rect x="32" y="15" width="1" height="1" fill="#9db861" />
      <rect x="10" y="14" width="3" height="3" fill="#16260d" opacity="0.85" />
      <rect x="11" y="15" width="1" height="1" fill="#9db861" />
    </svg>
  );
}
