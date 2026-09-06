import { useState, type ReactNode } from 'react';
import { useSystemUI } from '../../context/SystemUIContext';
import styles from './SystemUI.module.css';

export const BRIGHTNESS_MIN = 0.6;
export const BRIGHTNESS_MAX = 1;

interface ControlCenterProps {
  brightness: number;
  onBrightnessChange: (value: number) => void;
}

// Module-level so toggles/sound survive the popover being closed and reopened.
const persisted = {
  wifi: true,
  bluetooth: true,
  airdrop: true,
  focus: false,
  mirroring: false,
  stageManager: false,
  sound: 0.7,
};

function sliderStyle(fraction: number): React.CSSProperties {
  return { '--fill': `${Math.round(fraction * 100)}%` } as React.CSSProperties;
}

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

export default function ControlCenter({ brightness, onBrightnessChange }: ControlCenterProps) {
  const { close } = useSystemUI();
  const [state, setState] = useState(persisted);

  function update(patch: Partial<typeof persisted>) {
    Object.assign(persisted, patch);
    setState({ ...persisted });
  }

  const brightnessFraction = (brightness - BRIGHTNESS_MIN) / (BRIGHTNESS_MAX - BRIGHTNESS_MIN);

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
              on={state.wifi}
              onLabel="Home"
              offLabel="Off"
              onToggle={() => update({ wifi: !state.wifi })}
              icon={
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
              }
            />
            <NetworkRow
              label="Bluetooth"
              on={state.bluetooth}
              onLabel="On"
              offLabel="Off"
              onToggle={() => update({ bluetooth: !state.bluetooth })}
              icon={
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
              }
            />
            <NetworkRow
              label="AirDrop"
              on={state.airdrop}
              onLabel="Everyone"
              offLabel="Receiving Off"
              onToggle={() => update({ airdrop: !state.airdrop })}
              icon={
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
              }
            />
          </div>

          <Tile
            title="Focus"
            sub={state.focus ? 'Do Not Disturb' : 'Off'}
            on={state.focus}
            onToggle={() => update({ focus: !state.focus })}
            icon={
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M9.5 1.5a6.5 6.5 0 1 0 5 9.9A5.5 5.5 0 0 1 9.5 1.5z" />
              </svg>
            }
          />
          <Tile
            title="Screen Mirroring"
            sub={state.mirroring ? 'Living Room' : 'Off'}
            on={state.mirroring}
            onToggle={() => update({ mirroring: !state.mirroring })}
            icon={
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="1.5" y="3" width="13" height="8.5" rx="1.5" />
                <path d="M5.5 14h5" />
              </svg>
            }
          />
          <Tile
            title="Stage Manager"
            sub={state.stageManager ? 'On' : 'Off'}
            on={state.stageManager}
            onToggle={() => update({ stageManager: !state.stageManager })}
            icon={
              <svg viewBox="0 0 16 16" fill="currentColor">
                <rect x="1.5" y="2.5" width="3.5" height="2.5" rx="0.8" />
                <rect x="1.5" y="6.75" width="3.5" height="2.5" rx="0.8" />
                <rect x="1.5" y="11" width="3.5" height="2.5" rx="0.8" />
                <rect x="6.5" y="3" width="8" height="10" rx="1.2" />
              </svg>
            }
          />
        </div>

        <div className={`${styles.card} ${styles.ccSliderGroup}`}>
          <div className={styles.ccSliderLabel}>Display</div>
          <div className={styles.ccSliderRow}>
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="8" cy="8" r="3" />
              <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" />
            </svg>
            <input
              type="range"
              className={styles.slider}
              min={BRIGHTNESS_MIN}
              max={BRIGHTNESS_MAX}
              step={0.01}
              value={brightness}
              onChange={(e) => onBrightnessChange(Number(e.target.value))}
              style={sliderStyle(brightnessFraction)}
              aria-label="Display brightness"
            />
          </div>
        </div>

        <div className={`${styles.card} ${styles.ccSliderGroup}`}>
          <div className={styles.ccSliderLabel}>Sound</div>
          <div className={styles.ccSliderRow}>
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2.5 6h2.5l3.5-3v10l-3.5-3H2.5z" fill="currentColor" />
              <path d="M11 5.5a3.5 3.5 0 0 1 0 5M13 3.5a6 6 0 0 1 0 9" />
            </svg>
            <input
              type="range"
              className={styles.slider}
              min={0}
              max={1}
              step={0.01}
              value={state.sound}
              onChange={(e) => update({ sound: Number(e.target.value) })}
              style={sliderStyle(state.sound)}
              aria-label="Sound volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
