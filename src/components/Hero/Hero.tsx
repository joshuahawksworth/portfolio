import { useState, useEffect, useRef } from 'react';
import styles from './Hero.module.css';
import { 
  PARTICLE_POSITIONS, 
  calculateParallax, 
  isDesktop, 
  smoothScrollToElement 
} from '../../utils/heroHelpers';

function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cursorRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();

  useEffect(() => {
    // Only enable mouse effects on desktop devices
    if (!isDesktop()) return;

    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    // Throttle updates using requestAnimationFrame for smooth 60fps performance
    const updatePosition = () => {
      setMousePosition({ x: mouseX, y: mouseY });
      requestRef.current = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('mousemove', handleMouseMove);
    requestRef.current = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Calculate parallax offsets for title and subtitle
  const titleParallax = calculateParallax(mousePosition.x, mousePosition.y, 0.015);
  const subtitleParallax = calculateParallax(mousePosition.x, mousePosition.y, 0.008);

  const handleScrollToExperience = () => {
    smoothScrollToElement('experience');
  };

  return (
    <section className={styles.heroSection}>
      {/* Animated background grid */}
      <div className={styles.gridBackground}>
        <div className={styles.gridPattern}></div>
      </div>

      {/* Floating particles with pure CSS animation */}
      <div className={styles.particlesContainer}>
        {PARTICLE_POSITIONS.map((pos, index) => (
          <div
            key={index}
            className={styles.particle}
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              animationDelay: `${index * 0.7}s`,
              animationDuration: `${6 + (index % 4) * 2}s`
            }}
          />
        ))}
      </div>

      {/* Comet effect */}
      <div className={styles.cometContainer}>
        <div className={styles.comet}></div>
      </div>

      {/* Custom cursor follower (desktop only) */}
      <div 
        ref={cursorRef}
        className={styles.cursorFollower}
        style={{
          left: mousePosition.x - 16,
          top: mousePosition.y - 16
        }}
      />

      {/* Main content with parallax effect */}
      <div className={styles.content}>
        <h1 
          className={styles.title}
          style={{
            transform: `translate3d(${titleParallax.x}px, ${titleParallax.y}px, 0)`
          }}
        >
          Hello, I'm Josh.
        </h1>
        <p 
          className={styles.subtitle}
          style={{
            transform: `translate3d(${subtitleParallax.x}px, ${subtitleParallax.y}px, 0)`
          }}
        >
          I'm a Web & Software developer.
        </p>
        <div className={styles.buttonContainer}>
          <button
            onClick={handleScrollToExperience}
            className={styles.ctaButton}
          >
            <span className={styles.ctaButtonText}>View My Work</span>
            <div className={styles.ctaButtonGradient}></div>
          </button>
        </div>
      </div>
    </section>
  );
}

export default Hero;