/**
 * Form controls for the System Settings app. One set of components, styled per OS
 * through the app's root `data-os` attribute (macOS / iOS switches, Windows toggle
 * with On/Off text, Material switch on Android).
 */
import { useId, type ReactNode } from 'react';
import styles from './SettingsApp.module.css';

export function Group({
  title,
  footer,
  children,
}: {
  title?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.group}>
      {title && <h3 className={styles.groupTitle}>{title}</h3>}
      <div className={styles.groupBody}>{children}</div>
      {footer && <p className={styles.groupFooter}>{footer}</p>}
    </section>
  );
}

export function Row({
  icon,
  label,
  sub,
  control,
  onClick,
  stacked = false,
}: {
  icon?: ReactNode;
  label: ReactNode;
  sub?: ReactNode;
  control?: ReactNode;
  onClick?: () => void;
  /** Control sits under the label (sliders, grids) instead of at the end. */
  stacked?: boolean;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`${styles.row} ${onClick ? styles.rowButton : ''} ${stacked ? styles.rowStacked : ''}`}
      onClick={onClick}
    >
      {icon && <span className={styles.rowIcon}>{icon}</span>}
      <span className={styles.rowText}>
        <span className={styles.rowLabel}>{label}</span>
        {sub && <span className={styles.rowSub}>{sub}</span>}
      </span>
      {control && <span className={styles.rowControl}>{control}</span>}
      {onClick && !control && <span className={styles.chevron} aria-hidden="true" />}
    </Tag>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.toggleKnob} />
      <span className={styles.toggleText}>{checked ? 'On' : 'Off'}</span>
    </button>
  );
}

export function ToggleRow({
  label,
  sub,
  icon,
  checked,
  onChange,
}: {
  label: string;
  sub?: ReactNode;
  icon?: ReactNode;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <Row
      icon={icon}
      label={label}
      sub={sub}
      control={<Toggle checked={checked} onChange={onChange} label={label} />}
    />
  );
}

export function Slider({
  label,
  min,
  max,
  step = 0.01,
  value,
  onChange,
  leading,
  trailing,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  leading?: ReactNode;
  trailing?: ReactNode;
}) {
  const fill = `${Math.round(((value - min) / (max - min)) * 100)}%`;
  return (
    <div className={styles.sliderRow}>
      {leading && <span className={styles.sliderCap}>{leading}</span>}
      <input
        type="range"
        className={styles.slider}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--fill': fill } as React.CSSProperties}
        aria-label={label}
      />
      {trailing && <span className={styles.sliderCap}>{trailing}</span>}
    </div>
  );
}

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className={styles.segmented} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={`${styles.segment} ${o.value === value ? styles.segmentOn : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'default',
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`${styles.button} ${variant === 'primary' ? styles.buttonPrimary : ''} ${variant === 'danger' ? styles.buttonDanger : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function TextField({
  label,
  value,
  onChange,
  maxLength = 32,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <input
      id={id}
      className={styles.textField}
      type="text"
      value={value}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      autoComplete="off"
      spellCheck={false}
    />
  );
}

/** A tick used by radio-style rows (networks, wallpapers). */
export function Check({ on }: { on: boolean }) {
  return (
    <span className={`${styles.check} ${on ? styles.checkOn : ''}`} aria-hidden="true">
      <svg
        viewBox="0 0 12 12"
        width="12"
        height="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 6.5l2.6 2.5L10 3.5" />
      </svg>
    </span>
  );
}
