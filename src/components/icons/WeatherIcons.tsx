import type { CSSProperties } from 'react';

/** The weather conditions the widgets distinguish, from the WMO interpretation codes. */
export type WeatherKind =
  'sun' | 'partly' | 'cloud' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'showers' | 'thunder';

/**
 * Google's weather icons (the set Search and the Pixel's At a Glance show), from
 * public/icons/weather, one per condition.
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
    <img
      src={`/icons/weather/${kind}.png`}
      alt=""
      width={size}
      height={size}
      draggable={false}
      style={{ display: 'inline-block', verticalAlign: '-0.2em', flexShrink: 0, ...style }}
    />
  );
}
