import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BatteryIcon from '../../src/components/SystemUI/BatteryIcon';
import { BATTERY_LEVEL, batteryFillWidth, clampBatteryLevel } from '../../src/lib/battery';

describe('clampBatteryLevel', () => {
  it('keeps whole percentages inside 0 to 100', () => {
    expect(clampBatteryLevel(100)).toBe(100);
    expect(clampBatteryLevel(42.6)).toBe(43);
    expect(clampBatteryLevel(-5)).toBe(0);
    expect(clampBatteryLevel(180)).toBe(100);
    expect(clampBatteryLevel(Number.NaN)).toBe(0);
  });
});

describe('batteryFillWidth', () => {
  it('scales the filled body with the level', () => {
    expect(batteryFillWidth(0)).toBe(0);
    expect(batteryFillWidth(50)).toBeCloseTo(batteryFillWidth(100) / 2);
    expect(batteryFillWidth(100)).toBeGreaterThan(0);
  });
});

describe('BatteryIcon', () => {
  it('writes the percentage on the battery in a contrasting colour and names it for assistive tech', () => {
    render(<BatteryIcon digitColor="#123456" />);
    const icon = screen.getByRole('img', { name: `Battery ${BATTERY_LEVEL}%` });
    expect(icon).toHaveAttribute('data-battery-level', String(BATTERY_LEVEL));
    const digits = icon.querySelectorAll('text');
    expect(digits).toHaveLength(1);
    expect(digits[0].textContent).toBe(String(BATTERY_LEVEL));
    expect(digits[0].getAttribute('fill')).toBe('#123456');
    // Plain shapes only: no mask or clip path that a browser could fail to resolve.
    expect(icon.querySelector('mask, clipPath, [mask], [clip-path]')).toBeNull();
  });

  it('shortens the filled body for a partial charge and drops it when empty', () => {
    const { rerender } = render(<BatteryIcon level={25} />);
    const fill = () => screen.getByRole('img').querySelector('rect:nth-of-type(2)');
    expect(fill()).not.toBeNull();
    expect(Number(fill()?.getAttribute('width'))).toBeCloseTo(batteryFillWidth(25));
    expect(screen.getByRole('img', { name: 'Battery 25%' })).toBeInTheDocument();

    rerender(<BatteryIcon level={0} />);
    expect(fill()).toBeNull();
    expect(screen.getByRole('img', { name: 'Battery 0%' })).toBeInTheDocument();
  });
});
