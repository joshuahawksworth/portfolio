import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import styles from './LocationApp.module.css';

const CENTER: [number, number] = [-2.234, 53.477];

export default function LocationApp() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token) {
      setStatus('error');
      return;
    }
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/joshhawksworth/cmgmueoep00sc01s613vdfr75',
      center: CENTER,
      zoom: 14.5,
      pitch: 45,
      bearing: -30.6,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.once('load', () => setStatus('ready'));
    map.on('error', (e) => {
      // Tile errors after load are harmless; only a failure to start matters
      if (mapRef.current && !mapRef.current.loaded()) {
        console.warn('Map failed to load', e.error);
        setStatus('error');
      }
    });
    mapRef.current = map;

    // Mapbox only watches the window; the window here is a resizable pane, so follow the
    // container itself.
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(mapContainerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.pinIcon}
        >
          <path d="M8 1 Q13 4 13 7.5 Q13 12 8 15 Q3 12 3 7.5 Q3 4 8 1Z" />
          <circle cx="8" cy="7.5" r="2.5" />
        </svg>
        <span className={styles.label}>Manchester, UK</span>
        <span className={styles.sub}>53.4808° N, 2.2426° W</span>
      </div>
      <div className={styles.mapWrap}>
        <div ref={mapContainerRef} className={styles.map} />
        {status !== 'ready' && (
          <div className={styles.overlay} role="status" aria-live="polite">
            {status === 'loading' ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                <span className={styles.overlayText}>Loading map…</span>
              </>
            ) : (
              <>
                <span className={styles.overlayText}>The map couldn’t be loaded.</span>
                <span className={styles.overlaySub}>Check your connection and try again.</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
