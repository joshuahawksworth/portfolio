import type { ReactNode } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { useSystemUI } from '../../context/SystemUIContext';
import { useSettings } from '../../context/SettingsContext';
import styles from './SystemUI.module.css';

export const BRIGHTNESS_MIN = 0.6;
export const BRIGHTNESS_MAX = 1;

function sliderStyle(fraction: number): React.CSSProperties {
  return { '--fill': `${Math.round(fraction * 100)}%` } as React.CSSProperties;
}

const WIFI_ICON = (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
  >
    <path d="M2 6.5a9 9 0 0 1 12 0" />
    <path d="M4.3 9.2a5.6 5.6 0 0 1 7.4 0" />
    <path d="M6.6 11.8a2.3 2.3 0 0 1 2.8 0" />
    <circle cx="8" cy="13.6" r="0.6" fill="currentColor" />
  </svg>
);
const BT_ICON = (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinejoin="round"
    strokeLinecap="round"
  >
    <path d="M4.5 5l7 6-3.5 3V2l3.5 3-7 6" />
  </svg>
);
const SHARE_ICON = (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <circle cx="8" cy="7" r="1.6" />
    <path d="M5.2 9.8a4 4 0 0 1 0-5.6M10.8 4.2a4 4 0 0 1 0 5.6" />
    <path d="M3.3 11.7a6.6 6.6 0 0 1 0-9.4M12.7 2.3a6.6 6.6 0 0 1 0 9.4" />
    <path d="M6.6 14l1.4-2.4 1.4 2.4z" fill="currentColor" stroke="none" />
  </svg>
);
const MOON_ICON = (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <path d="M9.5 1.5a6.5 6.5 0 1 0 5 9.9A5.5 5.5 0 0 1 9.5 1.5z" />
  </svg>
);
const NIGHT_ICON = (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <circle cx="8" cy="8" r="3" />
    <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" />
  </svg>
);
const SUN_ICON = NIGHT_ICON;
const SOUND_ICON = (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2.5 6h2.5l3.5-3v10l-3.5-3H2.5z" fill="currentColor" />
    <path d="M11 5.5a3.5 3.5 0 0 1 0 5M13 3.5a6 6 0 0 1 0 9" />
  </svg>
);
const A11Y_ICON = (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <circle cx="8" cy="3" r="1.4" fill="currentColor" stroke="none" />
    <path d="M3 6.2l5 .9 5-.9M8 7.1v3.4M8 10.5l-2.2 3.6M8 10.5l2.2 3.6" />
  </svg>
);

function NetworkRow({
  label,
  on,
  onLabel,
  offLabel,
  icon,
  onToggle,
}: {
  label: string;
  on: boolean;
  onLabel: string;
  offLabel: string;
  icon: ReactNode;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.ccRow}
      onClick={onToggle}
      aria-pressed={on}
      aria-label={`${label}: ${on ? onLabel : offLabel}`}
    >
      <span className={`${styles.ccDot} ${on ? '' : styles.ccDotOff}`} aria-hidden="true">
        {icon}
      </span>
      <span>
        <span className={styles.tileTitle}>{label}</span>
        <span className={styles.tileSub}>{on ? onLabel : offLabel}</span>
      </span>
    </button>
  );
}

function Tile({
  title,
  sub,
  on,
  icon,
  onToggle,
}: {
  title: string;
  sub: string;
  on: boolean;
  icon: ReactNode;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.card} ${styles.tile} ${styles.tileButton}`}
      onClick={onToggle}
      aria-pressed={on}
      aria-label={`${title}: ${sub}`}
    >
      <span className={`${styles.ccDot} ${on ? '' : styles.ccDotMono}`} aria-hidden="true">
        {icon}
      </span>
      <span>
        <span className={styles.tileTitle}>{title}</span>
        <span className={styles.tileSub}>{sub}</span>
      </span>
    </button>
  );
}

/** Windows 11 quick-settings tile: icon on a pill, label underneath. */
function QuickTile({
  label,
  sub,
  on,
  icon,
  onClick,
}: {
  label: string;
  sub?: string;
  on: boolean;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.qsTile}
      onClick={onClick}
      aria-pressed={on}
      aria-label={sub ? `${label}: ${sub}` : label}
    >
      <span className={`${styles.qsPill} ${on ? styles.qsPillOn : ''}`} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.qsLabel}>{label}</span>
      {sub && <span className={styles.qsSub}>{sub}</span>}
    </button>
  );
}

function SliderRow({
  label,
  icon,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  icon: ReactNode;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className={styles.ccSliderRow}>
      {icon}
      <input
        type="range"
        className={styles.slider}
        min={min}
        max={max}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={sliderStyle((value - min) / (max - min))}
        aria-label={label}
      />
    </div>
  );
}

export default function ControlCenter() {
  const { close } = useSystemUI();
  const { openApp } = useDesktop();
  const { settings, update, os } = useSettings();
  const isWindows = os === 'windows';

  const volume = settings.muted ? 0 : settings.volume;
  const setVolume = (v: number) => update({ volume: v, muted: v === 0 ? settings.muted : false });

  const brightnessSlider = (
    <SliderRow
      label="Display brightness"
      icon={SUN_ICON}
      min={BRIGHTNESS_MIN}
      max={BRIGHTNESS_MAX}
      value={settings.brightness}
      onChange={(v) => update({ brightness: v })}
    />
  );
  const soundSlider = (
    <SliderRow
      label="Sound volume"
      icon={SOUND_ICON}
      min={0}
      max={1}
      value={volume}
      onChange={setVolume}
    />
  );

  if (isWindows) {
    return (
      <div className={styles.popoverLayer}>
        <div
          className={`${styles.backdrop} ${styles.backdropAboveTaskbar}`}
          onMouseDown={close}
          aria-hidden="true"
        />
        <div
          className={`${styles.glass} ${styles.quickSettings}`}
          role="dialog"
          aria-label="Quick settings"
        >
          <div className={styles.qsGrid}>
            <QuickTile
              label="Wi-Fi"
              sub={settings.wifi ? settings.network : 'Off'}
              on={settings.wifi}
              icon={WIFI_ICON}
              onClick={() => update({ wifi: !settings.wifi })}
            />
            <QuickTile
              label="Bluetooth"
              sub={settings.bluetooth ? 'On' : 'Off'}
              on={settings.bluetooth}
              icon={BT_ICON}
              onClick={() => update({ bluetooth: !settings.bluetooth })}
            />
            <QuickTile
              label="Nearby sharing"
              on={settings.airdrop}
              icon={SHARE_ICON}
              onClick={() => update({ airdrop: !settings.airdrop })}
            />
            <QuickTile
              label="Night light"
              on={settings.nightLight}
              icon={NIGHT_ICON}
              onClick={() => update({ nightLight: !settings.nightLight })}
            />
            <QuickTile
              label="Do not disturb"
              on={settings.doNotDisturb}
              icon={MOON_ICON}
              onClick={() => update({ doNotDisturb: !settings.doNotDisturb })}
            />
            <QuickTile
              label="Accessibility"
              on={false}
              icon={A11Y_ICON}
              onClick={() => {
                openApp('settings', { pane: 'accessibility' });
                close();
              }}
            />
          </div>
          <div className={styles.qsSliders}>
            {brightnessSlider}
            {soundSlider}
          </div>
          <div className={styles.qsFooter}>
            <span className={styles.qsBattery}>
              <svg
                viewBox="0 0 24 12"
                width="22"
                height="11"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.1"
                aria-hidden="true"
              >
                <rect x="0.6" y="0.6" width="19" height="10.8" rx="2" opacity="0.6" />
                <rect
                  x="2.2"
                  y="2.2"
                  width="15.8"
                  height="7.6"
                  rx="1"
                  fill="currentColor"
                  stroke="none"
                />
                <path d="M21.4 4.2v3.6" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
              </svg>
              100%
            </span>
            <button
              type="button"
              className={styles.qsSettingsBtn}
              onClick={() => {
                openApp('settings');
                close();
              }}
              aria-label="All settings"
              title="All settings"
            >
              <svg
                viewBox="0 0 16 16"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              >
                <circle cx="8" cy="8" r="2.4" />
                <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.popoverLayer}>
      <div
        className={`${styles.backdrop} ${styles.backdropBelowBar}`}
        onMouseDown={close}
        aria-hidden="true"
      />
      <div
        className={`${styles.glass} ${styles.popover} ${styles.controlCenter}`}
        role="dialog"
        aria-label="Control Center"
      >
        <div className={styles.ccGrid}>
          <div className={`${styles.card} ${styles.tile} ${styles.tileTall}`}>
            <NetworkRow
              label="Wi-Fi"
              on={settings.wifi}
              onLabel={settings.network}
              offLabel="Off"
              onToggle={() => update({ wifi: !settings.wifi })}
              icon={WIFI_ICON}
            />
            <NetworkRow
              label="Bluetooth"
              on={settings.bluetooth}
              onLabel="On"
              offLabel="Off"
              onToggle={() => update({ bluetooth: !settings.bluetooth })}
              icon={BT_ICON}
            />
            <NetworkRow
              label="AirDrop"
              on={settings.airdrop}
              onLabel="Everyone"
              offLabel="Receiving Off"
              onToggle={() => update({ airdrop: !settings.airdrop })}
              icon={SHARE_ICON}
            />
          </div>

          <Tile
            title="Focus"
            sub={settings.doNotDisturb ? 'Do Not Disturb' : 'Off'}
            on={settings.doNotDisturb}
            onToggle={() => update({ doNotDisturb: !settings.doNotDisturb })}
            icon={MOON_ICON}
          />
          <Tile
            title="Night Shift"
            sub={settings.nightLight ? 'On' : 'Off'}
            on={settings.nightLight}
            onToggle={() => update({ nightLight: !settings.nightLight })}
            icon={NIGHT_ICON}
          />
          <Tile
            title="Reduce Motion"
            sub={settings.reduceMotion ? 'On' : 'Off'}
            on={settings.reduceMotion}
            onToggle={() => update({ reduceMotion: !settings.reduceMotion })}
            icon={A11Y_ICON}
          />
        </div>

        <div className={`${styles.card} ${styles.ccSliderGroup}`}>
          <div className={styles.ccSliderLabel}>Display</div>
          {brightnessSlider}
        </div>

        <div className={`${styles.card} ${styles.ccSliderGroup}`}>
          <div className={styles.ccSliderLabel}>Sound</div>
          {soundSlider}
        </div>
      </div>
    </div>
  );
}
