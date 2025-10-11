import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import styles from './Location.module.css';

const MANCHESTER_CENTER: [number, number] = [-2.234, 53.477];

function Location() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/joshhawksworth/cmgmueoep00sc01s613vdfr75',
      center: MANCHESTER_CENTER,
      zoom: 14, // start zoomed out
      pitch: 30, // tilt
      bearing: -30.6, // rotate
      attributionControl: false, // optional
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Zoom animation
    let ticking = false;

    const animateMapZoom = () => {
      if (!mapRef.current || !mapContainerRef.current) return;

      const rect = mapContainerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // The animation starts when section is a third in view
      const start = windowHeight * 0.7;
      const end = windowHeight * 0.3;

      // Progress (0–1)
      let progress = (start - rect.top) / (start - end);
      progress = Math.min(Math.max(progress, 0), 1);

      // Smooth easing (easeInOutQuad)
      const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

      const zoom = 14.3 + ease * 1.3;
      const pitch = 40 + ease * 15; // subtle tilt for cinematic feel

      mapRef.current.flyTo({
        center: MANCHESTER_CENTER,
        zoom,
        pitch,
        speed: 0.5,
        curve: 1.2,
        easing: (t) => t,
        essential: true,
      });

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(animateMapZoom);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll);
    animateMapZoom();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <section id="location" className={styles.locationSection}>
      <div className={styles.container}>
        <h2 className={styles.title}>Based in Manchester</h2>
        <div className={styles.mapWrapper}>
          <div ref={mapContainerRef} className={styles.mapContainer} />
        </div>
      </div>
    </section>
  );
}

export default Location;
