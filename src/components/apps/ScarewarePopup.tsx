/**
 * The dialogs the bait throws up, drawn as the platform's own. Message boxes carry the
 * scareware copy from malwarePopups; the three special kinds (credentials, error, gate)
 * have their own copy per platform here. Every button only ever opens more of them.
 */
import { KINDS, POPUPS, type Popup, type PopupKind, type PopupTone } from '../../lib/malwarePopups';
import styles from './MalwareApp.module.css';

export type Layout = 'mac' | 'win' | 'ios' | 'android';

/** Windows' stock message-box glyphs: error, warning and information. */
function WinIcon({ tone }: { tone: PopupTone }) {
  if (tone === 'danger') {
    return (
      <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
        <circle cx="16" cy="16" r="15" fill="#e81123" />
        <path
          d="M10.5 10.5l11 11M21.5 10.5l-11 11"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (tone === 'prize') {
    return (
      <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
        <circle cx="16" cy="16" r="15" fill="#0067c0" />
        <circle cx="16" cy="9.5" r="2" fill="#fff" />
        <rect x="14.2" y="13.5" width="3.6" height="11" rx="1.2" fill="#fff" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
      <path
        d="M16 2.5L31 29H1z"
        fill="#fcd116"
        stroke="#b58900"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <rect x="14.4" y="11" width="3.2" height="9.5" rx="1.4" fill="#1b1b1b" />
      <circle cx="16" cy="24.5" r="1.9" fill="#1b1b1b" />
    </svg>
  );
}

/** The UAC shield: blue and yellow quarters. */
function Shield() {
  return (
    <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
      <path d="M16 2l12 4v9c0 7.5-5 13-12 15C9 28 4 22.5 4 15V6z" fill="#1e5fb3" />
      <path d="M16 2l12 4v9H16z" fill="#f6c21c" />
      <path d="M16 15v15C9 28 4 22.5 4 15z" fill="#f6c21c" />
    </svg>
  );
}

/** The macOS caution badge, at alert size. */
function MacIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
      <path
        d="M32 6L60 56H4z"
        fill="url(#mwCaution)"
        stroke="#c98a00"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="mwCaution" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd43b" />
          <stop offset="1" stopColor="#f5a500" />
        </linearGradient>
      </defs>
      <rect x="29.3" y="22" width="5.4" height="18" rx="2.4" fill="#4a3600" />
      <circle cx="32" cy="47.5" r="3.1" fill="#4a3600" />
    </svg>
  );
}

/** The padlock on a macOS authentication sheet. */
function Lock() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
      <path
        d="M20 28v-8a12 12 0 0 1 24 0v8"
        fill="none"
        stroke="#8e8e93"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <rect x="12" y="27" width="40" height="30" rx="5" fill="#f2b705" stroke="#b58600" />
      <circle cx="32" cy="41" r="3.5" fill="#6b4f00" />
      <rect x="30.5" y="43" width="3" height="7" rx="1.5" fill="#6b4f00" />
    </svg>
  );
}

type Button = { label: string; primary?: boolean; spawns?: number };

function Actions({
  buttons,
  more,
  help,
}: {
  buttons: Button[];
  more: (n: number) => void;
  /** macOS alerts carry the round "?" at the far left of the button row. */
  help?: boolean;
}) {
  return (
    <div className={styles.actions}>
      {help && (
        <button type="button" className={styles.help} aria-label="Help" onClick={() => more(1)}>
          ?
        </button>
      )}
      {buttons.map((b) => (
        <button
          key={b.label}
          type="button"
          className={`${styles.btn} ${b.primary ? styles.primary : ''}`}
          onClick={() => more(b.spawns ?? (b.primary ? 2 : 1))}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}

const APP = 'TotalSecure 2010';
const WIN_PATH = 'C:\\Users\\Josh\\AppData\\Local\\Temp\\TotalSecure\\';

function Auth({ layout, more }: { layout: Layout; more: (n: number) => void }) {
  if (layout === 'win') {
    return (
      <div className={styles.popup}>
        <div className={styles.uacBand}>
          <Shield />
          <h2 className={styles.heading}>
            Do you want to allow this app to make changes to your device?
          </h2>
        </div>
        <div className={styles.uacBody}>
          <strong>{APP} Update Service</strong>
          <p>
            Verified publisher: <b>Unknown</b>
            <br />
            File origin: Downloaded from the Internet
          </p>
          <span className={styles.link}>Show more details</span>
        </div>
        <Actions buttons={[{ label: 'Yes', primary: true }, { label: 'No' }]} more={more} />
      </div>
    );
  }
  if (layout === 'mac') {
    return (
      <div className={styles.popup}>
        <div className={styles.content}>
          <Lock />
          <div className={styles.text}>
            <h2 className={styles.heading}>{APP} wants to make changes.</h2>
            <p className={styles.body}>Enter your password to allow this.</p>
            <label className={styles.field}>
              <span>User Name:</span>
              <input type="text" defaultValue="Joshua Hawksworth" />
            </label>
            <label className={styles.field}>
              <span>Password:</span>
              <input type="password" aria-label="Password" />
            </label>
          </div>
        </div>
        <Actions buttons={[{ label: 'Cancel' }, { label: 'OK', primary: true }]} more={more} />
      </div>
    );
  }
  const ios = layout === 'ios';
  return (
    <div className={styles.popup}>
      <div className={styles.content}>
        <div className={styles.text}>
          <h2 className={styles.heading}>{ios ? 'Sign in to iTunes Store' : "Verify it's you"}</h2>
          <p className={styles.body}>
            {ios
              ? 'Enter the Apple ID password for joshua@hawksworth.dev.'
              : 'To continue, enter your Google Account password.'}
          </p>
          <input
            type="password"
            className={styles.input}
            placeholder={ios ? 'Password' : 'Enter your password'}
            aria-label="Password"
          />
        </div>
      </div>
      <Actions
        buttons={[{ label: 'Cancel' }, { label: ios ? 'OK' : 'Verify', primary: true }]}
        more={more}
      />
    </div>
  );
}

function Crash({ layout, more }: { layout: Layout; more: (n: number) => void }) {
  if (layout === 'win') {
    return (
      <div className={styles.popup}>
        <div className={styles.content}>
          <WinIcon tone="danger" />
          <div className={styles.text}>
            <p className={styles.body}>
              There was a problem starting
              <br />
              {WIN_PATH}tshook.dll
            </p>
            <p className={styles.body}>The specified module could not be found.</p>
          </div>
        </div>
        <Actions buttons={[{ label: 'OK', primary: true }]} more={more} />
      </div>
    );
  }
  if (layout === 'mac') {
    return (
      <div className={styles.popup}>
        <div className={styles.content}>
          <MacIcon />
          <div className={styles.text}>
            <h2 className={styles.heading}>“{APP}” quit unexpectedly.</h2>
            <p className={styles.body}>
              Click Reopen to open the application again. This report will be sent to Apple
              automatically.
            </p>
          </div>
        </div>
        <Actions
          buttons={[{ label: 'Ignore' }, { label: 'Report…' }, { label: 'Reopen', primary: true }]}
          more={more}
          help
        />
      </div>
    );
  }
  const ios = layout === 'ios';
  return (
    <div className={styles.popup}>
      <div className={styles.content}>
        <div className={styles.text}>
          <h2 className={styles.heading}>
            {ios ? `“${APP}” Needs to Be Updated` : `${APP} keeps stopping`}
          </h2>
          <p className={styles.body}>
            {ios
              ? 'The developer of this app needs to update it to work with this version of iOS.'
              : 'Close the app and try again, or check the app for updates.'}
          </p>
        </div>
      </div>
      <Actions
        buttons={
          ios
            ? [{ label: 'OK', primary: true }]
            : [{ label: 'App info' }, { label: 'Close app', primary: true }]
        }
        more={more}
      />
    </div>
  );
}

function Gate({ layout, more }: { layout: Layout; more: (n: number) => void }) {
  if (layout === 'win') {
    return (
      <div className={styles.popup}>
        <div className={styles.content}>
          <Shield />
          <div className={styles.text}>
            <h2 className={`${styles.heading} ${styles.gateHeading}`}>
              Windows Defender Firewall has blocked some features of this app
            </h2>
            <p className={styles.body}>
              Windows Defender Firewall has blocked some features of {APP} on all public and private
              networks.
            </p>
            <dl className={styles.kv}>
              <dt>Name:</dt>
              <dd>{APP}</dd>
              <dt>Publisher:</dt>
              <dd>Unknown</dd>
              <dt>Path:</dt>
              <dd>{WIN_PATH}ts2010.exe</dd>
            </dl>
            <p className={styles.body}>Allow {APP} to communicate on these networks:</p>
            <label className={styles.check}>
              <input type="checkbox" defaultChecked /> Private networks, such as my home or work
              network
            </label>
            <label className={styles.check}>
              <input type="checkbox" defaultChecked /> Public networks, such as those in airports
              and coffee shops
            </label>
          </div>
        </div>
        <Actions
          buttons={[{ label: 'Allow access', primary: true }, { label: 'Cancel' }]}
          more={more}
        />
      </div>
    );
  }
  if (layout === 'mac') {
    return (
      <div className={styles.popup}>
        <div className={styles.content}>
          <MacIcon />
          <div className={styles.text}>
            <h2 className={styles.heading}>
              “{APP}” will damage your computer. You should move it to the Bin.
            </h2>
            <p className={styles.body}>This file was downloaded on an unknown date.</p>
            <label className={styles.checkRow}>
              <input type="checkbox" defaultChecked /> Report malware to Apple to protect other
              users
            </label>
          </div>
        </div>
        <Actions
          buttons={[{ label: 'Move to Bin' }, { label: 'Cancel', primary: true }]}
          more={more}
          help
        />
      </div>
    );
  }
  const ios = layout === 'ios';
  return (
    <div className={styles.popup}>
      <div className={styles.content}>
        <div className={styles.text}>
          <h2 className={styles.heading}>
            {ios ? 'Untrusted Enterprise Developer' : 'Install blocked'}
          </h2>
          <p className={styles.body}>
            {ios
              ? '“iPhone Distribution: Bonzi Software Ltd” has not been trusted on this iPhone. Until this developer has been trusted, their enterprise apps will not be available for use.'
              : 'For your security, your phone is not allowed to install unknown apps from this source.'}
          </p>
        </div>
      </div>
      <Actions
        buttons={
          ios
            ? [{ label: 'Cancel', primary: true }]
            : [{ label: 'Cancel' }, { label: 'Settings', primary: true }]
        }
        more={more}
      />
    </div>
  );
}

function Alert({
  popup,
  layout,
  more,
}: {
  popup: Popup;
  layout: Layout;
  more: (n: number) => void;
}) {
  const mac = layout === 'mac';
  return (
    <div className={styles.popup}>
      <div className={styles.content}>
        {mac && <MacIcon />}
        {layout === 'win' && <WinIcon tone={popup.tone} />}
        <div className={styles.text}>
          <h2 className={styles.heading}>{popup.heading}</h2>
          <p className={styles.body}>{popup.body}</p>
          {mac && (
            <label className={styles.checkRow}>
              <input type="checkbox" defaultChecked /> Don’t warn me again
            </label>
          )}
        </div>
      </div>
      <Actions
        buttons={[{ label: 'No thanks' }, { label: popup.cta, primary: true }]}
        more={more}
        help={mac}
      />
    </div>
  );
}

export default function ScarewarePopup({
  variant,
  layout,
  more,
}: {
  variant: string;
  layout: Layout;
  more: (n: number) => void;
}) {
  if ((KINDS as string[]).includes(variant)) {
    const Kind = { auth: Auth, error: Crash, gate: Gate }[variant as PopupKind];
    return <Kind layout={layout} more={more} />;
  }
  const popup = POPUPS.find((p) => p.title === variant) ?? POPUPS[0];
  return <Alert popup={popup} layout={layout} more={more} />;
}
