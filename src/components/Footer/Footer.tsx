import styles from './Footer.module.css';
import githubIcon from '../../assets/github.svg';
import linkedinIcon from '../../assets/linkedin.png';
import SocialButton from '../SocialButton/SocialButton';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.socialLinks}>
          <SocialButton
            href="https://github.com/joshuahawksworth"
            icon={githubIcon}
            alt="GitHub"
            position="footer"
            ariaLabel="My GitHub profile"
          />
          <SocialButton
            href="https://linkedin.com/in/joshua-hawksworth-9741aa209"
            icon={linkedinIcon}
            alt="LinkedIn"
            position="footer"
            ariaLabel="My LinkedIn profile"
          />
          <a
            href="mailto:joshuahawksworth@me.com"
            className={styles.emailButton}
            aria-label="Send me an email"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </a>
        </div>
        <p className={styles.copyright}>© Joshua Hawksworth {currentYear}</p>
      </div>
    </footer>
  );
}

export default Footer;
