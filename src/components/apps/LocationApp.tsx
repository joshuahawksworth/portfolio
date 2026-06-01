import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import styles from './LocationApp.module.css';

const CENTER: [number, number] = [-2.234, 53.477];

export default function LocationApp() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

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
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={styles.pinIcon}>
          <path d="M8 1 Q13 4 13 7.5 Q13 12 8 15 Q3 12 3 7.5 Q3 4 8 1Z"/>
          <circle cx="8" cy="7.5" r="2.5"/>
        </svg>
        <span className={styles.label}>Manchester, UK</span>
        <span className={styles.sub}>53.4808° N, 2.2426° W</span>
      </div>
      <div ref={mapContainerRef} className={styles.map} />
    </div>
  );
}
