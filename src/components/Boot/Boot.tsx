import { useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { WindowsLogo } from '../icons/WindowsIcons';
import { BugdroidIcon } from '../icons/AndroidIcons';
import styles from './Boot.module.css';

interface Props {
  onComplete: () => void;
}

const JH_PATH =
  'm 64.986601,198.54254 c 17.955449,0 30.263619,-9.55694 30.263619,-30.55323 V 98.773958 H 74.97794 v 68.925752 c 0,10.13614 -4.199258,12.74258 -10.860151,12.74258 -6.950496,0 -9.846536,-4.77847 -13.03218,-10.42575 l -16.507428,9.99134 c 4.778466,10.13614 14.190596,18.53466 30.40842,18.53466 z m 49.811939,-1.30322 h 20.27228 V 167.2653 h 42.13738 v 29.97402 h 20.27228 V 98.773958 H 177.2082 V 149.16505 H 135.07082 V 98.773958 h -20.27228 z';

interface FillLogoProps {
  /** Colour the tile fills up with as the boot progresses. */
  fill: string;
  /** Letter colour once the tile is filled. */
  letters?: string;
  clipId: string;
}

/** JH logo tile that fills from the bottom up: white to start, `fill` once booted. */
function JhFillLogo({ fill, letters = '#333', clipId }: FillLogoProps) {
  return (
    <div className={styles.logoWrap}>
      <svg viewBox="0 0 212 212" width="90" height="90" className={styles.logo}>
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="212" width="212" height="212" className={styles.fillRect} />
          </clipPath>
        </defs>
        <rect width="212" height="212" fill="white" rx="18" />
        <path d={JH_PATH} fill="#333" />
        <g clipPath={`url(#${clipId})`}>
          <rect width="212" height="212" fill={fill} rx="18" />
          <path d={JH_PATH} fill={letters} />
        </g>
      </svg>
    </div>
  );
}

/** JH logo, filled from the bottom up: the portfolio's stand-in for the Apple logo. */
function AppleBoot() {
  return (
    <>
      <JhFillLogo fill="#f7df1e" clipId="bootFillClip" />
      <div className={styles.barTrack}>
        <div className={styles.barFill} />
      </div>
    </>
  );
}

/** Windows 11: the four-tile logo with the spinning ring of dots. */
function WindowsBoot() {
  return (
    <>
      <div className={`${styles.logoWrap} ${styles.winLogo}`}>
        <WindowsLogo size={96} color="#3aa0ff" />
      </div>
      <div className={styles.winSpinner} aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={styles.winDot} style={{ animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>
    </>
  );
}

/**
 * Android: laid out like a Samsung boot screen. The JH logo takes the maker's spot
 * and fills up in Android green, with "Powered by android" pinned to the bottom.
 */
function AndroidBoot() {
  return (
    <>
      <JhFillLogo fill="#3ddc84" letters="#0b1a12" clipId="bootFillClipDroid" />
      <div className={styles.poweredBy} aria-hidden="true">
        <div className={styles.poweredByInner}>
          <span className={styles.poweredByLabel}>Powered by</span>
          <span className={styles.poweredByRow}>
            <span className={styles.droidWord}>android</span>
            <BugdroidIcon size={44} />
          </span>
        </div>
      </div>
    </>
  );
}

export default function Boot({ onComplete }: Props) {
  const { os } = useSettings();

  useEffect(() => {
    const t = setTimeout(onComplete, 4200);
    return () => clearTimeout(t);
  }, [onComplete]);

  // Match the page background to the boot screen so a stale viewport never shows
  // the desktop colour under it.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.backgroundColor;
    html.style.backgroundColor = '#000';
    document.body.style.backgroundColor = '#000';
    return () => {
      html.style.backgroundColor = prev;
      document.body.style.backgroundColor = '';
    };
  }, []);

  return (
    <div className={styles.screen} data-boot-os={os}>
      {os === 'windows' ? <WindowsBoot /> : os === 'android' ? <AndroidBoot /> : <AppleBoot />}
    </div>
  );
}
