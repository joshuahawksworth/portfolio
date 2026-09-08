import { useEffect, useState } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { useTime } from '../../hooks/useTime';
import styles from './DesktopWidgets.module.css';

// Manchester, UK — matches the Location app
const LAT = 53.48;
const LON = -2.24;

export interface Weather {
  temp: number;
  code: number;
}

// WMO weather interpretation codes → label + glyph
export function describeWeather(code: number): { label: string; glyph: string } {
  if (code === 0) return { label: 'Sunny', glyph: '☀' };
  if (code <= 2) return { label: 'Partly cloudy', glyph: '⛅' };
  if (code === 3) return { label: 'Cloudy', glyph: '☁' };
  if (code <= 49) return { label: 'Foggy', glyph: '🌫' };
  if (code <= 59) return { label: 'Drizzle', glyph: '🌦' };
  if (code <= 69) return { label: 'Rain', glyph: '🌧' };
  if (code <= 79) return { label: 'Snow', glyph: '🌨' };
  if (code <= 84) return { label: 'Showers', glyph: '🌦' };
  return { label: 'Thunder', glyph: '⛈' };
}

export function useWeather(): Weather | null {
  const [weather, setWeather] = useState<Weather | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&timezone=auto`,
      { signal: ctrl.signal }
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { current?: { temperature_2m?: number; weather_code?: number } }) => {
        const c = j.current;
        if (c && typeof c.temperature_2m === 'number' && typeof c.weather_code === 'number') {
          setWeather({ temp: Math.round(c.temperature_2m), code: c.weather_code });
        }
      })
      .catch(() => {
        /* offline or blocked: show the placeholder */
      });
    return () => ctrl.abort();
  }, []);
  return weather;
}

/** The two glass widgets pinned to the top-left of the desktop, like the reference. */
export default function DesktopWidgets() {
  const { openApp } = useDesktop();
  const now = useTime();
  const weather = useWeather();
  const { label, glyph } = describeWeather(weather?.code ?? 3);
  const weekday = now.toLocaleDateString('en-GB', { weekday: 'long' });

  return (
    <div className={styles.widgets} aria-label="Desktop widgets">
      <button
        type="button"
        className={`${styles.widget} ${styles.weather}`}
        onClick={() => openApp('location')}
        aria-label={`Weather in Manchester: ${label}`}
      >
        <small>MANCHESTER</small>
        <strong>{weather ? `${weather.temp}°` : '—'}</strong>
        <span>
          {glyph} {label}
        </span>
        <span className={styles.sub}>Current conditions</span>
      </button>
      <button
        type="button"
        className={`${styles.widget} ${styles.calendar}`}
        onClick={() => openApp('experience')}
        aria-label={`${weekday} ${now.getDate()}`}
      >
        <small className={styles.calDay}>{weekday.toUpperCase()}</small>
        <strong className={styles.calNum}>{now.getDate()}</strong>
        <span>Open to new roles</span>
      </button>
    </div>
  );
}
