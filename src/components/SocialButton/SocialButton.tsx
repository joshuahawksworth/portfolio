import { SocialButtonPosition } from '../../types/socialButton';
import styles from './SocialButton.module.css';

interface SocialButtonProps {
  href: string;
  icon: string;
  alt: string;
  position: SocialButtonPosition;
  ariaLabel: string;
}

function SocialButton({ href, icon, alt, position, ariaLabel }: SocialButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.socialButton} ${styles[position]}`}
      aria-label={ariaLabel}
    >
      <img src={icon} alt={alt} className={styles.icon} />
    </a>
  );
}

export default SocialButton;
