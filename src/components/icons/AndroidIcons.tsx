/**
 * Android (Pixel launcher / Material) counterparts of the app icons. The Google apps (Files,
 * Gmail, Maps, Calculator, Docs, Keep, Photos, Gboard), Termux and Settings are the real
 * launcher artwork in public/icons/android; only the portfolio's own apps (About, Experience,
 * Skills, the bin) are drawn. Every icon is a 44×44 disc.
 */
import { useId, type ReactNode } from 'react';
import { SnakeLcdIcon } from './SnakeLcdIcon';

const JH_PATH =
  'm 64.986601,198.54254 c 17.955449,0 30.263619,-9.55694 30.263619,-30.55323 V 98.773958 H 74.97794 v 68.925752 c 0,10.13614 -4.199258,12.74258 -10.860151,12.74258 -6.950496,0 -9.846536,-4.77847 -13.03218,-10.42575 l -16.507428,9.99134 c 4.778466,10.13614 14.190596,18.53466 30.40842,18.53466 z m 49.811939,-1.30322 h 20.27228 V 167.2653 h 42.13738 v 29.97402 h 20.27228 V 98.773958 H 177.2082 V 149.16505 H 135.07082 V 98.773958 h -20.27228 z';

export function AndroidDisc({
  bg = '#fff',
  children,
  title,
}: {
  bg?: string;
  children?: ReactNode;
  title?: string;
}) {
  return (
    <svg viewBox="0 0 44 44" width="44" height="44" fill="none" aria-label={title} role="img">
      <circle cx="22" cy="22" r="22" fill={bg} />
      {children}
    </svg>
  );
}

/**
 * A raster app icon on a disc: a full-bleed launcher icon (scale 1) is clipped to the disc
 * the way Android masks adaptive icons; a logo mark (Brave, GitHub) sits smaller on `bg`.
 */
function DiscImage({
  src,
  bg = '#fff',
  scale = 1,
  title,
}: {
  src: string;
  bg?: string;
  scale?: number;
  title?: string;
}) {
  const clip = useId();
  const s = 44 * scale;
  const o = (44 - s) / 2;
  return (
    <svg viewBox="0 0 44 44" width="44" height="44" aria-label={title} role="img">
      <clipPath id={clip}>
        <circle cx="22" cy="22" r="22" />
      </clipPath>
      <circle cx="22" cy="22" r="22" fill={bg} />
      <image
        href={src}
        x={o}
        y={o}
        width={s}
        height={s}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clip})`}
      />
    </svg>
  );
}

/**
 * One of the real launcher icons in public/icons/android. The Play Store renders carry
 * different margins, so `scale` evens the glyphs out to the size the Pixel launcher shows.
 */
function Launcher({
  name,
  title,
  scale,
  bg,
}: {
  name: string;
  title: string;
  scale?: number;
  bg?: string;
}) {
  return <DiscImage src={`/icons/android/${name}.png`} title={title} scale={scale} bg={bg} />;
}

export function BriefcaseDiscIcon() {
  return (
    <AndroidDisc title="Experience">
      <path
        d="M17.5 16v-2q0-2.5 2.5-2.5h4q2.5 0 2.5 2.5v2"
        fill="none"
        stroke="#1a73e8"
        strokeWidth="2"
      />
      <rect x="10" y="16" width="24" height="16" rx="3" fill="#1a73e8" />
      <path d="M10 22h24" stroke="#fff" strokeWidth="1.4" opacity="0.7" />
      <rect x="20" y="20.5" width="4" height="3.5" rx="0.8" fill="#fff" />
    </AndroidDisc>
  );
}

export function SkillsDiscIcon() {
  return (
    <AndroidDisc bg="#7c4dff" title="Skills">
      <path
        d="M15 16l-6 6 6 6M29 16l6 6-6 6"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M25 14l-6 16" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
    </AndroidDisc>
  );
}

export function AndroidBinIcon({ full = false }: { full?: boolean }) {
  return (
    <AndroidDisc bg="#e7edf5" title="Bin">
      {full && <path d="M15 14l3-4 4 3 4-4 3 5z" fill="#fff" stroke="#c3ccd9" />}
      <rect x="13" y="13" width="18" height="3" rx="1.5" fill="#5f6f8a" />
      <rect x="19" y="10" width="6" height="3" rx="1.2" fill="#5f6f8a" />
      <path d="M15 17h14l-1.2 15q-.2 2-2.2 2h-7.2q-2 0-2.2-2z" fill="#7d8ba5" />
      <path
        d="M19 20v10M22 20v10M25 20v10"
        stroke="#e7edf5"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </AndroidDisc>
  );
}

export function AndroidFolderIcon({
  size = 48,
  children,
}: {
  size?: number;
  children?: ReactNode;
}) {
  return (
    <svg viewBox="0 0 64 52" width={size} height={size * (52 / 64)} fill="none" aria-hidden="true">
      <path d="M4 12q0-4 4-4h17l4 4h27q4 0 4 4v26q0 4-4 4H8q-4 0-4-4z" fill="#8ab4f8" />
      <path d="M4 20h56v22q0 4-4 4H8q-4 0-4-4z" fill="#aecbfa" />
      {children}
    </svg>
  );
}

export function AndroidStorageIcon({ size = 50 }: { size?: number }) {
  return (
    <svg viewBox="0 0 52 52" width={size} height={size} fill="none" aria-hidden="true">
      <rect x="14" y="4" width="24" height="44" rx="5" fill="#3c4043" />
      <rect x="16.5" y="8" width="19" height="34" rx="2" fill="#8ab4f8" />
      <circle cx="26" cy="45.5" r="1.6" fill="#9aa0a6" />
    </svg>
  );
}

/** Bugdroid head, for the boot screen and About pane. */
export function BugdroidIcon({ size = 64, color = '#3ddc84' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 64 40" width={size} height={size * (40 / 64)} fill={color} aria-hidden="true">
      <path d="M6 38a26 26 0 0 1 52 0z" />
      <path d="M13 17l-5-8M51 17l5-8" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <circle cx="22" cy="26" r="2.6" fill="#0b1a12" />
      <circle cx="42" cy="26" r="2.6" fill="#0b1a12" />
    </svg>
  );
}

export const ANDROID_ICONS = {
  finder: <Launcher name="files" title="Files" />,
  about: (
    <svg viewBox="0 0 44 44" width="44" height="44" aria-label="About" role="img">
      <circle cx="22" cy="22" r="22" fill="#f7df1e" />
      <path
        d={JH_PATH}
        fill="#333"
        transform="translate(22 22) scale(0.148) translate(-116.03 -148.66)"
      />
    </svg>
  ),
  experience: <BriefcaseDiscIcon />,
  skills: <SkillsDiscIcon />,
  contact: <Launcher name="gmail" title="Gmail" scale={0.86} />,
  location: <Launcher name="maps" title="Maps" scale={0.86} />,
  terminal: <Launcher name="termux" title="Termux" scale={0.78} bg="#000" />,
  calculator: <Launcher name="calculator" title="Calculator" />,
  cv: <Launcher name="docs" title="Docs" scale={0.86} />,
  texteditor: <Launcher name="keep" title="Keep" />,
  imageviewer: <Launcher name="photos" title="Photos" />,
  settings: <Launcher name="settings" title="Settings" />,
  shortcuts: <Launcher name="gboard" title="Gboard" />,
  trashEmpty: <AndroidBinIcon />,
  trashFull: <AndroidBinIcon full />,
  safari: <DiscImage src="/icons/brave-lion.png" scale={0.74} />,
  github: <DiscImage src="/icons/github-mark.png" scale={0.62} />,
  askjosh: <DiscImage src="/icons/claude.png" bg="#d97757" scale={0.88} />,
  malwarebytes: <DiscImage src="/icons/malwarebytes.png" bg="#fff" scale={0.62} />,
  snake: <SnakeLcdIcon round />,
  doom: <DiscImage src="/doom-icon.png" bg="#000" title="DOOM" />,
} as const;
