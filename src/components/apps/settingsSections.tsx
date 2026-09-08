/**
 * The functional panes of System Settings. Every control here changes something real:
 * the settings store (persisted), the session (lock / restart / shut down) or the
 * virtual file system (storage, emptying the bin).
 */
import { useMemo, useState, type ReactNode } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useSession } from '../../context/SessionContext';
import { useDesktop } from '../../context/DesktopContext';
import { WALLPAPERS, WALLPAPERS_FOR_OS, WALLPAPER_LABELS } from '../../data/wallpapers';
import { ACCENTS, ACCENT_KEYS, NETWORKS, initialsOf, type Platform } from '../../lib/settingsStore';
import { DEVICE_INFO, OS_LABELS, appTitleFor } from '../../theme/platform';
import { WindowsLogo } from '../icons/WindowsIcons';
import { BugdroidIcon } from '../icons/AndroidIcons';
import {
  Button,
  Check,
  Group,
  Row,
  Segmented,
  Slider,
  TextField,
  ToggleRow,
} from './settingsControls';
import styles from './SettingsApp.module.css';

export type SectionId =
  | 'platform'
  | 'accent'
  | 'wallpaper'
  | 'dock'
  | 'taskbar'
  | 'homescreen'
  | 'display'
  | 'sound'
  | 'wifi'
  | 'bluetooth'
  | 'notifications'
  | 'datetime'
  | 'keyboard'
  | 'accessibility'
  | 'users'
  | 'about'
  | 'storage'
  | 'reset';

const JH_PATH =
  'm 64.986601,198.54254 c 17.955449,0 30.263619,-9.55694 30.263619,-30.55323 V 98.773958 H 74.97794 v 68.925752 c 0,10.13614 -4.199258,12.74258 -10.860151,12.74258 -6.950496,0 -9.846536,-4.77847 -13.03218,-10.42575 l -16.507428,9.99134 c 4.778466,10.13614 14.190596,18.53466 30.40842,18.53466 z m 49.811939,-1.30322 h 20.27228 V 167.2653 h 42.13738 v 29.97402 h 20.27228 V 98.773958 H 177.2082 V 149.16505 H 135.07082 V 98.773958 h -20.27228 z';

/* ── Platform (the headline feature) ──────────────────────────────────── */
function PlatformPreview({ platform }: { platform: Platform }) {
  const apple = platform === 'apple';
  return (
    <svg viewBox="0 0 160 100" className={styles.platformArt} aria-hidden="true">
      <defs>
        <linearGradient id={`pp-${platform}`} x1="0" y1="0" x2="1" y2="1">
          {apple ? (
            <>
              <stop stopColor="#ffd98a" />
              <stop offset="1" stopColor="#e28a2c" />
            </>
          ) : (
            <>
              <stop stopColor="#5fb8ff" />
              <stop offset="1" stopColor="#0b3f8f" />
            </>
          )}
        </linearGradient>
      </defs>
      {/* Laptop screen */}
      <rect x="6" y="8" width="104" height="66" rx="5" fill={`url(#pp-${platform})`} />
      {apple ? (
        <>
          <rect x="6" y="8" width="104" height="8" rx="5" fill="rgba(255,255,255,0.35)" />
          <rect x="24" y="64" width="68" height="8" rx="4" fill="rgba(255,255,255,0.55)" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect
              key={i}
              x={28 + i * 10.5}
              y="65.5"
              width="6"
              height="5"
              rx="1.5"
              fill="#fff"
              opacity="0.9"
            />
          ))}
          <rect x="30" y="24" width="52" height="30" rx="4" fill="rgba(255,255,255,0.6)" />
          <circle cx="36" cy="29" r="1.6" fill="#ff5f57" />
          <circle cx="41" cy="29" r="1.6" fill="#febc2e" />
          <circle cx="46" cy="29" r="1.6" fill="#28c840" />
        </>
      ) : (
        <>
          <rect x="6" y="64" width="104" height="10" fill="rgba(238,240,245,0.9)" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect
              key={i}
              x={33 + i * 9}
              y="66.5"
              width="5"
              height="5"
              rx="1"
              fill={i === 0 ? '#1e8bff' : '#3a3f4a'}
              opacity="0.85"
            />
          ))}
          <rect x="28" y="22" width="56" height="34" rx="3" fill="rgba(243,243,243,0.95)" />
          <rect x="28" y="22" width="56" height="7" rx="3" fill="rgba(0,0,0,0.05)" />
          <path d="M75 25.5h2M78.5 25.5h2M82 25.5h2" stroke="#333" strokeWidth="1" />
        </>
      )}
      {/* Phone */}
      <rect x="118" y="6" width="36" height="88" rx="8" fill="#1c1c22" />
      <rect x="121" y="9" width="30" height="82" rx="6" fill={`url(#pp-${platform})`} />
      {apple ? (
        <>
          {[0, 1, 2, 3].map((r) =>
            [0, 1, 2].map((c) => (
              <rect
                key={`${r}${c}`}
                x={125 + c * 8}
                y={20 + r * 9}
                width="6"
                height="6"
                rx="1.6"
                fill="#fff"
                opacity="0.9"
              />
            ))
          )}
          <rect x="124" y="74" width="24" height="12" rx="5" fill="rgba(255,255,255,0.5)" />
          <rect x="130" y="88" width="12" height="1.6" rx="0.8" fill="#fff" />
        </>
      ) : (
        <>
          {[0, 1, 2, 3].map((r) =>
            [0, 1, 2].map((c) => (
              <circle
                key={`${r}${c}`}
                cx={128 + c * 8}
                cy={23 + r * 9}
                r="3"
                fill="#fff"
                opacity="0.92"
              />
            ))
          )}
          <rect x="124" y="76" width="24" height="7" rx="3.5" fill="#fff" opacity="0.9" />
          <rect x="132" y="88" width="8" height="1.4" rx="0.7" fill="#fff" />
        </>
      )}
    </svg>
  );
}

export function PlatformSection() {
  const { settings, update, os, isMobile } = useSettings();
  const options: { value: Platform; name: string; desc: string; renders: string }[] = [
    {
      value: 'apple',
      name: 'macOS & iOS',
      desc: 'Liquid Glass windows, the Dock, Launchpad and an iPhone home screen on phones.',
      renders: isMobile ? 'iOS' : 'macOS',
    },
    {
      value: 'windows',
      name: 'Windows & Android',
      desc: 'Windows 11 taskbar, Start menu and Fluent icons, with a Pixel-style Android launcher on phones.',
      renders: isMobile ? 'Android' : 'Windows 11',
    },
  ];
  return (
    <Group
      title="Platform"
      footer={`Every screen re-themes instantly: boot, lock screen, icons, windows and system panels. Your choice is saved on this device, so it comes back after a reload. Right now you're on ${OS_LABELS[os]}.`}
    >
      <div className={styles.platformGrid} role="radiogroup" aria-label="Platform">
        {options.map((o) => {
          const on = settings.platform === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              className={`${styles.platformCard} ${on ? styles.platformCardOn : ''}`}
              onClick={() => update({ platform: o.value })}
            >
              <PlatformPreview platform={o.value} />
              <span className={styles.platformName}>
                {o.value === 'apple' ? (
                  <svg viewBox="0 0 212 212" width="16" height="16" aria-hidden="true">
                    <rect width="212" height="212" rx="40" fill="#1c1a18" />
                    <path d={JH_PATH} fill="#fff" />
                  </svg>
                ) : (
                  <WindowsLogo size={14} />
                )}
                {o.name}
                <Check on={on} />
              </span>
              <span className={styles.platformDesc}>{o.desc}</span>
              <span className={styles.platformRenders}>On this device: {o.renders}</span>
            </button>
          );
        })}
      </div>
    </Group>
  );
}

/* ── Appearance ───────────────────────────────────────────────────────── */
export function AccentSection() {
  const { settings, update } = useSettings();
  return (
    <Group
      title="Accent colour"
      footer="Used for selection, links, switches and the running-app indicator."
    >
      <Row
        label="Accent colour"
        sub={ACCENTS[settings.accent].label}
        stacked
        control={
          <div className={styles.swatches} role="radiogroup" aria-label="Accent colour">
            {ACCENT_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={settings.accent === key}
                aria-label={ACCENTS[key].label}
                title={ACCENTS[key].label}
                className={`${styles.swatch} ${settings.accent === key ? styles.swatchOn : ''}`}
                style={{ background: ACCENTS[key].color }}
                onClick={() => update({ accent: key })}
              />
            ))}
          </div>
        }
      />
    </Group>
  );
}

export function WallpaperSection() {
  const { os, wallpaper, setWallpaper } = useSettings();
  const keys = WALLPAPERS_FOR_OS[os];
  return (
    <Group
      title={os === 'windows' ? 'Background' : 'Wallpaper'}
      footer={`Shown on the ${os === 'windows' ? 'desktop and lock screen' : os === 'macos' ? 'desktop and login screen' : 'home and lock screens'}.`}
    >
      <Row
        label={WALLPAPER_LABELS[wallpaper]}
        stacked
        control={
          <div className={styles.wallpaperGrid} role="radiogroup" aria-label="Wallpaper">
            {keys.map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={wallpaper === key}
                className={`${styles.wallpaperThumb} ${wallpaper === key ? styles.wallpaperThumbOn : ''}`}
                style={{ backgroundImage: `url(${WALLPAPERS[key]})` }}
                onClick={() => setWallpaper(key)}
              >
                <span>{WALLPAPER_LABELS[key]}</span>
              </button>
            ))}
          </div>
        }
      />
    </Group>
  );
}

export function DockSection() {
  const { settings, update } = useSettings();
  return (
    <Group title="Dock">
      <Row
        label="Size"
        control={
          <Segmented
            label="Dock size"
            value={settings.dockSize}
            onChange={(v) => update({ dockSize: v })}
            options={[
              { value: 'small', label: 'Small' },
              { value: 'medium', label: 'Medium' },
              { value: 'large', label: 'Large' },
            ]}
          />
        }
      />
      <ToggleRow
        label="Magnification"
        sub="Icons grow as the pointer passes over them"
        checked={settings.dockMagnification}
        onChange={(v) => update({ dockMagnification: v })}
      />
    </Group>
  );
}

export function TaskbarSection() {
  const { settings, update } = useSettings();
  return (
    <Group title="Taskbar">
      <Row
        label="Taskbar alignment"
        control={
          <Segmented
            label="Taskbar alignment"
            value={settings.taskbarAlignment}
            onChange={(v) => update({ taskbarAlignment: v })}
            options={[
              { value: 'center', label: 'Center' },
              { value: 'left', label: 'Left' },
            ]}
          />
        }
      />
      <ToggleRow
        label="Widgets"
        sub="Show the weather in the taskbar corner"
        checked={settings.taskbarWeather}
        onChange={(v) => update({ taskbarWeather: v })}
      />
    </Group>
  );
}

export function HomeScreenSection() {
  const { settings, update, os } = useSettings();
  if (os === 'android') {
    return (
      <Group title="Home screen">
        <Row
          label="Icon shape"
          control={
            <Segmented
              label="Icon shape"
              value={settings.iconShape}
              onChange={(v) => update({ iconShape: v })}
              options={[
                { value: 'circle', label: 'Circle' },
                { value: 'squircle', label: 'Squircle' },
                { value: 'square', label: 'Square' },
              ]}
            />
          }
        />
        <ToggleRow
          label="At a Glance"
          sub="Date and weather at the top of the home screen"
          checked={settings.showAtAGlance}
          onChange={(v) => update({ showAtAGlance: v })}
        />
      </Group>
    );
  }
  return (
    <Group title="Home Screen">
      <ToggleRow
        label="Show Search on Home Screen"
        checked={settings.showHomeSearch}
        onChange={(v) => update({ showHomeSearch: v })}
      />
    </Group>
  );
}

/* ── Display & sound ───────────────────────────────────────────────────── */
export function DisplaySection() {
  const { settings, update, os } = useSettings();
  const night = os === 'macos' || os === 'ios' ? 'Night Shift' : 'Night light';
  return (
    <Group title={os === 'macos' ? 'Displays' : 'Display'}>
      <Row
        label="Brightness"
        stacked
        control={
          <Slider
            label="Brightness"
            min={0.6}
            max={1}
            value={settings.brightness}
            onChange={(v) => update({ brightness: v })}
            leading="☼"
            trailing="☀"
          />
        }
      />
      <ToggleRow
        label={night}
        sub="Warms the display colours"
        checked={settings.nightLight}
        onChange={(v) => update({ nightLight: v })}
      />
      {settings.nightLight && (
        <Row
          label="Colour temperature"
          stacked
          control={
            <Slider
              label="Colour temperature"
              min={0}
              max={1}
              value={settings.nightLightWarmth}
              onChange={(v) => update({ nightLightWarmth: v })}
              leading="Less warm"
              trailing="More warm"
            />
          }
        />
      )}
    </Group>
  );
}

function playTestTone(volume: number) {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 660;
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.4), now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc.start(now);
    osc.stop(now + 0.4);
    osc.onended = () => ctx.close();
  } catch {
    /* no audio device */
  }
}

export function SoundSection() {
  const { settings, update, os } = useSettings();
  const volume = settings.muted ? 0 : settings.volume;
  return (
    <Group title={os === 'ios' ? 'Sounds & Haptics' : 'Sound'}>
      <Row
        label={os === 'macos' ? 'Output volume' : 'Volume'}
        stacked
        control={
          <Slider
            label="Volume"
            min={0}
            max={1}
            value={volume}
            onChange={(v) => update({ volume: v, muted: false })}
            leading="🔈"
            trailing="🔊"
          />
        }
      />
      <ToggleRow label="Mute" checked={settings.muted} onChange={(v) => update({ muted: v })} />
      <Row
        label="Alert sound"
        sub="Plays a short tone at the current volume"
        control={<Button onClick={() => playTestTone(volume)}>Play</Button>}
      />
    </Group>
  );
}

/* ── Network ───────────────────────────────────────────────────────────── */
export function WifiSection() {
  const { settings, update } = useSettings();
  return (
    <>
      <Group title="Wi‑Fi">
        <ToggleRow
          label="Wi‑Fi"
          sub={settings.wifi ? `Connected to ${settings.network}` : 'Off'}
          checked={settings.wifi}
          onChange={(v) => update({ wifi: v })}
        />
      </Group>
      {settings.wifi && (
        <Group
          title="Known networks"
          footer="Choosing a network updates the status icons and Control Center."
        >
          {NETWORKS.map((name) => (
            <Row
              key={name}
              label={name}
              sub={name === settings.network ? 'Connected' : 'Secured'}
              onClick={() => update({ network: name })}
              control={<Check on={name === settings.network} />}
            />
          ))}
        </Group>
      )}
    </>
  );
}

export function BluetoothSection() {
  const { settings, update, os } = useSettings();
  const share = os === 'android' ? 'Nearby Share' : os === 'windows' ? 'Nearby sharing' : 'AirDrop';
  return (
    <>
      <Group title="Bluetooth">
        <ToggleRow
          label="Bluetooth"
          sub={settings.bluetooth ? 'On' : 'Off'}
          checked={settings.bluetooth}
          onChange={(v) => update({ bluetooth: v })}
        />
        {settings.bluetooth && (
          <>
            <Row label="Josh’s AirPods Pro" sub="Connected" control={<Check on />} />
            <Row label="MX Master 3S" sub="Connected" control={<Check on />} />
          </>
        )}
      </Group>
      <Group title={share}>
        <ToggleRow
          label={share}
          sub={settings.airdrop ? 'Everyone' : 'Receiving off'}
          checked={settings.airdrop}
          onChange={(v) => update({ airdrop: v })}
        />
      </Group>
    </>
  );
}

/* ── Notifications, time, keyboard, accessibility ──────────────────────── */
export function NotificationsSection() {
  const { settings, update, os } = useSettings();
  const focus = os === 'macos' || os === 'ios' ? 'Do Not Disturb' : 'Do not disturb';
  return (
    <Group
      title={os === 'macos' || os === 'ios' ? 'Focus' : 'Notifications'}
      footer="Silences notification banners and shows the moon in the status bar."
    >
      <ToggleRow
        label={focus}
        checked={settings.doNotDisturb}
        onChange={(v) => update({ doNotDisturb: v })}
      />
    </Group>
  );
}

export function DateTimeSection() {
  const { settings, update, isMobile } = useSettings();
  const zone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Local time', []);
  return (
    <Group title="Date & Time" footer={`Time zone: ${zone}. Set automatically from this device.`}>
      <ToggleRow
        label="24-hour time"
        checked={settings.clock24h}
        onChange={(v) => update({ clock24h: v })}
      />
      {!isMobile && (
        <ToggleRow
          label="Show seconds"
          sub="In the menu bar / taskbar clock"
          checked={settings.showSeconds}
          onChange={(v) => update({ showSeconds: v })}
        />
      )}
    </Group>
  );
}

export function KeyboardSection() {
  const { openApp } = useDesktop();
  return (
    <Group title="Keyboard">
      <Row
        label="Keyboard shortcuts"
        sub="Every shortcut the portfolio understands"
        onClick={() => openApp('shortcuts')}
      />
    </Group>
  );
}

export function AccessibilitySection() {
  const { settings, update } = useSettings();
  return (
    <Group title="Accessibility">
      <ToggleRow
        label="Reduce motion"
        sub="Shortens animations and transitions"
        checked={settings.reduceMotion}
        onChange={(v) => update({ reduceMotion: v })}
      />
      <ToggleRow
        label="Reduce transparency"
        sub="Solid panels instead of blurred glass"
        checked={settings.reduceTransparency}
        onChange={(v) => update({ reduceTransparency: v })}
      />
      <ToggleRow
        label="Increase contrast"
        sub="Darker text and stronger borders"
        checked={settings.increaseContrast}
        onChange={(v) => update({ increaseContrast: v })}
      />
    </Group>
  );
}

/* ── Users, about, storage, reset ──────────────────────────────────────── */
export function UsersSection() {
  const { settings, update, os, isMobile } = useSettings();
  const session = useSession();
  return (
    <>
      <Group title={os === 'windows' ? 'Your info' : os === 'android' ? 'Users' : 'Users & Groups'}>
        <Row
          icon={<span className={styles.avatar}>{initialsOf(settings.userName)}</span>}
          label="Name"
          sub="Shown on the lock screen and in menus"
          control={
            <TextField
              label="Name"
              value={settings.userName}
              onChange={(v) => update({ userName: v || 'Joshua Hawksworth' })}
            />
          }
        />
      </Group>
      <Group title="Session">
        <Row
          label={os === 'windows' ? 'Lock' : 'Lock Screen'}
          sub="Back to the lock screen"
          control={<Button onClick={session.lock}>Lock</Button>}
        />
        {!isMobile && (
          <Row label="Log out" control={<Button onClick={session.logOut}>Log Out…</Button>} />
        )}
        <Row
          label="Restart"
          sub="Runs the boot screen again"
          control={<Button onClick={session.restart}>Restart…</Button>}
        />
        <Row
          label={isMobile ? 'Power off' : 'Shut down'}
          control={
            <Button variant="danger" onClick={session.shutDown}>
              {isMobile ? 'Power Off' : 'Shut Down…'}
            </Button>
          }
        />
      </Group>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return <Row label={label} control={<span className={styles.value}>{value}</span>} />;
}

export function AboutSection() {
  const { os, settings } = useSettings();
  const info = DEVICE_INFO[os];
  return (
    <Group title={os === 'macos' ? 'About This Mac' : os === 'windows' ? 'About' : 'About phone'}>
      <Row
        icon={
          <span className={styles.deviceArt} aria-hidden="true">
            {os === 'windows' ? (
              <WindowsLogo size={26} />
            ) : os === 'android' ? (
              <BugdroidIcon size={30} />
            ) : (
              <svg viewBox="0 0 212 212" width="26" height="26">
                <rect width="212" height="212" rx="40" fill="#f7df1e" />
                <path d={JH_PATH} fill="#333" />
              </svg>
            )}
          </span>
        }
        label={info.name.replace("Joshua's", `${settings.userName.split(' ')[0]}'s`)}
        sub={info.model}
      />
      <InfoRow label="Software" value={info.osVersion} />
      <InfoRow label="Chip" value={info.chip} />
      <InfoRow label="Memory" value={info.memory} />
      <InfoRow label="Storage" value={info.storage} />
      <InfoRow label="Serial number" value={info.serial} />
      <InfoRow label="Portfolio" value="Golden Gate build 2026.9" />
    </Group>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function StorageSection() {
  const { fs, trashCount, emptyTrash } = useDesktop();
  const { os } = useSettings();
  const stats = useMemo(() => {
    let files = 0;
    let folders = 0;
    let bytes = 0;
    for (const n of Object.values(fs)) {
      if (n.type === 'folder') folders += 1;
      else files += 1;
      bytes += (n.content?.length ?? 0) + (n.dataUrl?.length ?? 0);
    }
    return { files, folders, bytes };
  }, [fs]);
  const bin = appTitleFor('trash', 'Trash', os);
  // The bar is the fake device disk; the portfolio's virtual files are the "used" part.
  const used = Math.min(100, 38 + stats.bytes / 4000);
  return (
    <Group
      title="Storage"
      footer={`${stats.files} files and ${stats.folders} folders in the virtual file system.`}
    >
      <Row
        label="Portfolio HD"
        sub={`${formatBytes(stats.bytes)} of documents · ${Math.round(used)}% of the disk in use`}
        stacked
        control={
          <div className={styles.storageBar} role="img" aria-label={`${Math.round(used)}% used`}>
            <span style={{ width: `${used}%` }} />
          </div>
        }
      />
      <Row
        label={bin}
        sub={trashCount === 0 ? 'Empty' : `${trashCount} item${trashCount === 1 ? '' : 's'}`}
        control={
          <Button onClick={emptyTrash} disabled={trashCount === 0}>
            Empty {bin}
          </Button>
        }
      />
    </Group>
  );
}

export function ResetSection() {
  const { reset } = useSettings();
  const [confirming, setConfirming] = useState(false);
  return (
    <Group
      title="Reset"
      footer="Restores every setting on this page to its default, including the platform and wallpaper."
    >
      <Row
        label="Reset all settings"
        control={
          confirming ? (
            <span className={styles.buttonRow}>
              <Button onClick={() => setConfirming(false)}>Cancel</Button>
              <Button
                variant="danger"
                onClick={() => {
                  reset();
                  setConfirming(false);
                }}
              >
                Reset
              </Button>
            </span>
          ) : (
            <Button variant="danger" onClick={() => setConfirming(true)}>
              Reset…
            </Button>
          )
        }
      />
    </Group>
  );
}

export const SECTIONS: Record<
  SectionId,
  { title: string; keywords: string[]; component: () => ReactNode }
> = {
  platform: {
    title: 'Platform',
    keywords: ['windows', 'android', 'macos', 'ios', 'theme', 'switch'],
    component: PlatformSection,
  },
  accent: {
    title: 'Accent colour',
    keywords: ['color', 'colour', 'accent', 'blue', 'purple'],
    component: AccentSection,
  },
  wallpaper: {
    title: 'Wallpaper',
    keywords: ['background', 'wallpaper', 'desktop'],
    component: WallpaperSection,
  },
  dock: { title: 'Dock', keywords: ['dock', 'magnification', 'size'], component: DockSection },
  taskbar: {
    title: 'Taskbar',
    keywords: ['taskbar', 'alignment', 'widgets'],
    component: TaskbarSection,
  },
  homescreen: {
    title: 'Home screen',
    keywords: ['home', 'icons', 'shape', 'glance', 'search'],
    component: HomeScreenSection,
  },
  display: {
    title: 'Display',
    keywords: ['brightness', 'night', 'shift', 'light', 'screen'],
    component: DisplaySection,
  },
  sound: {
    title: 'Sound',
    keywords: ['volume', 'mute', 'audio', 'speaker', 'alert'],
    component: SoundSection,
  },
  wifi: {
    title: 'Wi‑Fi',
    keywords: ['wifi', 'network', 'internet', 'wireless'],
    component: WifiSection,
  },
  bluetooth: {
    title: 'Bluetooth',
    keywords: ['bluetooth', 'airdrop', 'nearby', 'devices', 'airpods'],
    component: BluetoothSection,
  },
  notifications: {
    title: 'Notifications',
    keywords: ['focus', 'disturb', 'notifications', 'dnd'],
    component: NotificationsSection,
  },
  datetime: {
    title: 'Date & Time',
    keywords: ['clock', 'time', '24', 'seconds', 'date'],
    component: DateTimeSection,
  },
  keyboard: {
    title: 'Keyboard',
    keywords: ['keyboard', 'shortcuts', 'keys'],
    component: KeyboardSection,
  },
  accessibility: {
    title: 'Accessibility',
    keywords: ['motion', 'transparency', 'contrast', 'accessibility'],
    component: AccessibilitySection,
  },
  users: {
    title: 'Users',
    keywords: ['user', 'name', 'account', 'lock', 'log out', 'restart', 'shut down', 'power'],
    component: UsersSection,
  },
  about: {
    title: 'About',
    keywords: ['about', 'version', 'chip', 'memory', 'serial', 'model'],
    component: AboutSection,
  },
  storage: {
    title: 'Storage',
    keywords: ['storage', 'disk', 'trash', 'bin', 'recycle', 'empty'],
    component: StorageSection,
  },
  reset: { title: 'Reset', keywords: ['reset', 'defaults', 'erase'], component: ResetSection },
};
