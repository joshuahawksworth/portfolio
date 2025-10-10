import { useState, useEffect } from 'react';
import styles from './ViewCV.module.css';

function ViewCV() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        const contactTop = contactSection.offsetTop;
        const scrollPosition = window.scrollY + window.innerHeight;

        setIsVisible(scrollPosition < contactTop + 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleViewCV = () => {
    window.open('/JoshuaHawksworthCV.pdf', '_blank');
  };

  return (
    <button
      onClick={handleViewCV}
      className={`${styles.viewButton} ${!isVisible ? styles.hidden : ''}`}
      aria-label="View CV"
    >
      <svg
        className={styles.icon}
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
      <span className={styles.text}>View CV</span>
    </button>
  );
}

export default ViewCV;
