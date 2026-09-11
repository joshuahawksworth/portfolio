/**
 * Android (Pixel launcher / Material) counterparts of the app icons: Files, Tasks,
 * Gmail, Google Maps, Termux, Calculator, Keep, Photos, Docs, Settings, Gboard…
 * Every icon is a full-bleed 44×44 disc so the launcher can clip it to the chosen
 * icon shape (circle, squircle or rounded square).
 */
import type { ReactNode } from 'react';
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

/** A raster app icon (Chrome, Claude, GitHub) laid on a disc. */
function DiscImage({
  src,
  bg = '#fff',
  scale = 0.62,
}: {
  src: string;
  bg?: string;
  scale?: number;
}) {
  const s = 44 * scale;
  const o = (44 - s) / 2;
  return (
    <svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">
      <circle cx="22" cy="22" r="22" fill={bg} />
      <image href={src} x={o} y={o} width={s} height={s} preserveAspectRatio="xMidYMid meet" />
    </svg>
  );
}

export function FilesIcon() {
  return (
    <AndroidDisc title="Files">
      <path d="M10 15q0-2 2-2h7l2.5 2.5H32q2 0 2 2V30q0 2-2 2H12q-2 0-2-2z" fill="#1a73e8" />
      <path d="M10 20h24v10q0 2-2 2H12q-2 0-2-2z" fill="#4d95f2" />
      <path d="M18 24l4 4 4-4M22 28v-6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </AndroidDisc>
  );
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

export function GmailIcon() {
  // Google's current Gmail "M": blue and green uprights, red middle, yellow and dark
  // red flaps, drawn from the official artwork so nothing looks pieced together.
  return (
    <AndroidDisc title="Gmail">
      <svg x="9" y="12.25" width="26" height="19.5" viewBox="52 42 88 66">
        <path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6" />
        <path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15" />
        <path fill="#fbbc04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2" />
        <path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92" />
        <path fill="#c5221f" d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2" />
      </svg>
    </AndroidDisc>
  );
}

export function GoogleMapsIcon() {
  // Google's current Maps pin: five interlocking colour panels around an open centre,
  // drawn from the official artwork.
  return (
    <AndroidDisc title="Maps">
      <svg x="12.23" y="8" width="19.54" height="28" viewBox="0 0 92.3 132.3">
        <path
          fill="#1a73e8"
          d="M60.2 2.2C55.8.8 51 0 46.1 0 32 0 19.3 6.4 10.8 16.5l21.8 18.3L60.2 2.2z"
        />
        <path
          fill="#ea4335"
          d="M10.8 16.5C4.1 24.5 0 34.9 0 46.1c0 8.7 1.7 15.7 4.6 22l28-33.3-21.8-18.3z"
        />
        <path
          fill="#4285f4"
          d="M46.2 28.5c9.8 0 17.7 7.9 17.7 17.7 0 4.3-1.6 8.3-4.2 11.4 0 0 13.9-16.6 27.5-32.7-5.6-10.8-15.3-19-27-22.7L32.6 34.8c3.3-3.8 8.1-6.3 13.6-6.3"
        />
        <path
          fill="#fbbc04"
          d="M46.2 63.8c-9.8 0-17.7-7.9-17.7-17.7 0-4.3 1.5-8.3 4.1-11.3l-28 33.3c4.8 10.6 12.8 19.2 21 29.9l34.1-40.5c-3.3 3.9-8.1 6.3-13.5 6.3"
        />
        <path
          fill="#34a853"
          d="M59.1 109.2c15.4-24.1 33.3-35 33.3-63 0-7.7-1.9-14.9-5.2-21.3L25.6 98c2.6 3.4 5.3 7.3 7.9 11.3 9.4 14.5 6.8 23.1 12.8 23.1s3.4-8.7 12.8-23.2"
        />
      </svg>
    </AndroidDisc>
  );
}

export function TermuxIcon() {
  return (
    <AndroidDisc bg="#000" title="Termux">
      <path
        d="M12 16l6 6-6 6"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M21 29h11" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </AndroidDisc>
  );
}

export function GoogleCalculatorIcon() {
  return (
    <AndroidDisc bg="#e8f0fe" title="Calculator">
      <rect x="12" y="9" width="20" height="26" rx="3" fill="#1a73e8" />
      <rect x="15" y="12" width="14" height="6" rx="1.5" fill="#fff" />
      {[0, 1].map((r) =>
        [0, 1, 2].map((c) => (
          <circle key={`${r}${c}`} cx={17.5 + c * 4.5} cy={23 + r * 5} r="1.6" fill="#fff" />
        ))
      )}
    </AndroidDisc>
  );
}

export function DocsIcon() {
  return (
    <AndroidDisc title="Docs">
      <path d="M14 8h11l7 7v19q0 2-2 2H14q-2 0-2-2V10q0-2 2-2z" fill="#4285f4" />
      <path d="M25 8v7h7z" fill="#a1c2fa" />
      <path d="M17 21h10M17 25h10M17 29h6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </AndroidDisc>
  );
}

export function KeepIcon() {
  return (
    <AndroidDisc title="Keep">
      <rect x="11" y="9" width="22" height="26" rx="2.5" fill="#fbbc04" />
      <path d="M22 15a5.5 5.5 0 0 0-3 10.1V27h6v-1.9A5.5 5.5 0 0 0 22 15z" fill="#fff" />
      <rect x="19.5" y="28" width="5" height="1.8" rx="0.9" fill="#fff" />
    </AndroidDisc>
  );
}

export function GooglePhotosIcon() {
  // Four petals offset from the centre, like the Google Photos pinwheel.
  return (
    <AndroidDisc title="Photos">
      <path d="M22 22h-11a11 11 0 0 1 11-11z" fill="#ea4335" transform="translate(-1 -1)" />
      <path d="M22 22v-11a11 11 0 0 1 11 11z" fill="#fbbc04" transform="translate(1 -1)" />
      <path d="M22 22h11a11 11 0 0 1-11 11z" fill="#4285f4" transform="translate(1 1)" />
      <path d="M22 22v11a11 11 0 0 1-11-11z" fill="#34a853" transform="translate(-1 1)" />
    </AndroidDisc>
  );
}

export function AndroidSettingsIcon() {
  const teeth = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <AndroidDisc bg="#e7edf5" title="Settings">
      <g fill="#5f6f8a">
        {teeth.map((a) => (
          <rect
            key={a}
            x="20"
            y="9"
            width="4"
            height="6"
            rx="1.2"
            transform={`rotate(${a} 22 22)`}
          />
        ))}
      </g>
      <circle cx="22" cy="22" r="9.5" fill="#5f6f8a" />
      <circle cx="22" cy="22" r="4" fill="#e7edf5" />
    </AndroidDisc>
  );
}

export function GboardIcon() {
  return (
    <AndroidDisc title="Gboard">
      <rect x="9" y="14" width="26" height="16" rx="3" fill="#f1f3f4" stroke="#dadce0" />
      {[
        ['#4285f4', 12.5, 17.5],
        ['#ea4335', 17.5, 17.5],
        ['#fbbc04', 22.5, 17.5],
        ['#34a853', 27.5, 17.5],
      ].map(([c, x, y]) => (
        <rect
          key={String(x)}
          x={x as number}
          y={y as number}
          width="3.6"
          height="3.4"
          rx="0.8"
          fill={c as string}
        />
      ))}
      <rect x="12.5" y="22" width="19" height="3.4" rx="0.8" fill="#5f6368" opacity="0.5" />
      <rect x="14" y="26.4" width="16" height="1.8" rx="0.8" fill="#5f6368" opacity="0.5" />
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
  finder: <FilesIcon />,
  about: (
    <svg viewBox="0 0 44 44" width="44" height="44" aria-label="About" role="img">
      <circle cx="22" cy="22" r="22" fill="#f7df1e" />
      <path d={JH_PATH} fill="#333" transform="translate(9.5 4) scale(0.118)" />
    </svg>
  ),
  experience: <BriefcaseDiscIcon />,
  skills: <SkillsDiscIcon />,
  contact: <GmailIcon />,
  location: <GoogleMapsIcon />,
  terminal: <TermuxIcon />,
  calculator: <GoogleCalculatorIcon />,
  cv: <DocsIcon />,
  texteditor: <KeepIcon />,
  imageviewer: <GooglePhotosIcon />,
  settings: <AndroidSettingsIcon />,
  shortcuts: <GboardIcon />,
  trashEmpty: <AndroidBinIcon />,
  trashFull: <AndroidBinIcon full />,
  safari: <DiscImage src="/icons/chrome.png" scale={0.66} />,
  github: <DiscImage src="/icons/github-mark.png" scale={0.62} />,
  askjosh: <DiscImage src="/icons/claude.png" bg="#d97757" scale={1.02} />,
  snake: <SnakeLcdIcon round />,
} as const;
