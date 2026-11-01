/**
 * The dialogs the bait throws up, drawn as the platform's own. Message boxes carry the
 * scareware copy from malwarePopups; the three special kinds (credentials, error, gate)
 * have their own copy per platform here. Every button closes the dialog and reports its
 * label to MalwareApp, which may open the window it promised (see MalwareFollowup).
 */
import {
  KINDS,
  POPUPS,
  WINDOW_KINDS,
  type Popup,
  type PopupKind,
  type PopupTone,
  type WindowKind,
} from '../../lib/malwarePopups';
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

/** The macOS caution badge, at alert size: a rounded triangle, amber below, a dark tapered "!". */
function MacIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
      <defs>
        <linearGradient id="mwCaution" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe36a" />
          <stop offset="0.55" stopColor="#ffc60a" />
          <stop offset="1" stopColor="#f0a000" />
        </linearGradient>
      </defs>
      <path
        d="M28.3 8.6a4.3 4.3 0 0 1 7.4 0l23.6 40.6a4.3 4.3 0 0 1-3.7 6.4H8.4a4.3 4.3 0 0 1-3.7-6.4z"
        fill="url(#mwCaution)"
        stroke="#c98500"
        strokeWidth="0.8"
      />
      <path
        d="M32 20.5c2 0 3.3 1.2 3.1 3.1L34 39.2a2 2 0 0 1-4 0l-1.1-15.6c-.2-1.9 1.1-3.1 3.1-3.1z"
        fill="#2b2b2b"
      />
      <circle cx="32" cy="46.6" r="3" fill="#2b2b2b" />
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

type Button = { label: string; primary?: boolean };

function Actions({
  buttons,
  onAction,
  help,
}: {
  buttons: Button[];
  /** Called with the button's label; the dialog closes and the label may lead somewhere. */
  onAction: (label: string) => void;
  /** macOS alerts carry the round "?" at the far left of the button row. */
  help?: boolean;
}) {
  return (
    <div className={styles.actions}>
      {help && (
        <button
          type="button"
          className={styles.help}
          aria-label="Help"
          onClick={() => onAction('Help')}
        >
          ?
        </button>
      )}
      {buttons.map((b) => (
        <button
          key={b.label}
          type="button"
          className={`${styles.btn} ${b.primary ? styles.primary : ''}`}
          onClick={() => onAction(b.label)}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}

const APP = 'TotalSecure 2010';
const WIN_PATH = 'C:\\Users\\Josh\\AppData\\Local\\Temp\\TotalSecure\\';

function Auth({ layout, onAction }: { layout: Layout; onAction: (label: string) => void }) {
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
        <Actions buttons={[{ label: 'Yes', primary: true }, { label: 'No' }]} onAction={onAction} />
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
        <Actions
          buttons={[{ label: 'Cancel' }, { label: 'OK', primary: true }]}
          onAction={onAction}
        />
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
        onAction={onAction}
      />
    </div>
  );
}

function Crash({ layout, onAction }: { layout: Layout; onAction: (label: string) => void }) {
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
        <Actions buttons={[{ label: 'OK', primary: true }]} onAction={onAction} />
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
          onAction={onAction}
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
        onAction={onAction}
      />
    </div>
  );
}

function Gate({ layout, onAction }: { layout: Layout; onAction: (label: string) => void }) {
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
          onAction={onAction}
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
          onAction={onAction}
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
        onAction={onAction}
      />
    </div>
  );
}

/** macOS Installer.app, as the fake Flash Player updates of the time opened it. */
function FlashInstaller({ onAction }: { onAction: (label: string) => void }) {
  const steps = [
    'Introduction',
    'Licence',
    'Destination Select',
    'Installation Type',
    'Installation',
    'Summary',
  ];
  return (
    <div className={`${styles.popup} ${styles.installerApp}`}>
      <div className={styles.installerBody}>
        <ul className={styles.steps}>
          {steps.map((step, i) => (
            <li key={step} className={i === 0 ? styles.stepCurrent : undefined}>
              {step}
            </li>
          ))}
        </ul>
        <div className={styles.pane}>
          <h2 className={styles.heading}>Welcome to the Adobe Flash Player Installer</h2>
          <p className={styles.body}>
            You will be guided through the steps necessary to install this software.
          </p>
          <p className={styles.body}>
            Adobe Flash Player 10.1 is required to view this content. Click Continue to update your
            Flash Player now. This update is mandatory.
          </p>
        </div>
      </div>
      <Actions
        buttons={[{ label: 'Go Back' }, { label: 'Continue', primary: true }]}
        onAction={onAction}
      />
    </div>
  );
}

/** The Software Update window: a list of ticked updates and Install. */
function SoftwareUpdate({ onAction }: { onAction: (label: string) => void }) {
  const updates = [
    ['Mac OS X Security Update 2010-005', '112.3 MB'],
    ['Adobe Flash Player Plug-in', '9.8 MB'],
    ['TotalSecure 2010 Definitions', '1,337 KB'],
  ];
  return (
    <div className={styles.popup}>
      <div className={styles.content}>
        <div className={styles.text}>
          <h2 className={styles.heading}>New software is available for your computer.</h2>
          <p className={styles.body}>
            If you don’t want to install now, choose Apple menu &gt; Software Update when you’re
            ready to install.
          </p>
          <table className={styles.updates}>
            <tbody>
              {updates.map(([name, size]) => (
                <tr key={name}>
                  <td>
                    <input type="checkbox" defaultChecked aria-label={`Install ${name}`} />
                  </td>
                  <td>{name}</td>
                  <td>{size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Actions
        buttons={[{ label: 'Not Now' }, { label: 'Install 3 Items', primary: true }]}
        onAction={onAction}
      />
    </div>
  );
}

function Alert({
  popup,
  layout,
  onAction,
}: {
  popup: Popup;
  layout: Layout;
  onAction: (label: string) => void;
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
        onAction={onAction}
        help={mac}
      />
    </div>
  );
}

export default function ScarewarePopup({
  variant,
  layout,
  onAction,
}: {
  variant: string;
  layout: Layout;
  onAction: (label: string) => void;
}) {
  if ((WINDOW_KINDS as string[]).includes(variant)) {
    const Kind = { flash: FlashInstaller, update: SoftwareUpdate }[variant as WindowKind];
    return <Kind onAction={onAction} />;
  }
  if ((KINDS as string[]).includes(variant)) {
    const Kind = { auth: Auth, error: Crash, gate: Gate }[variant as PopupKind];
    return <Kind layout={layout} onAction={onAction} />;
  }
  const popup = POPUPS.find((p) => p.title === variant) ?? POPUPS[0];
  return <Alert popup={popup} layout={layout} onAction={onAction} />;
}
