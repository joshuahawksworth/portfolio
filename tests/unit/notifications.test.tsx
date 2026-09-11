import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SettingsProvider } from '../../src/context/SettingsContext';
import {
  BANNER_MS,
  NotificationProvider,
  notificationAge,
  useNotifications,
} from '../../src/context/NotificationContext';
import { SETTINGS_STORAGE_KEY } from '../../src/lib/settingsStore';

function wrapper({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </SettingsProvider>
  );
}

describe('NotificationProvider', () => {
  it('shows a banner and keeps the notification in the centre until acted on', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useNotifications(), { wrapper });
    const onActivate = vi.fn();

    act(() => {
      result.current.notify({ appId: 'cv', title: 'CV ready', body: 'Tap to download', onActivate });
    });
    expect(result.current.banners).toHaveLength(1);
    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(BANNER_MS + 10);
    });
    expect(result.current.banners).toHaveLength(0);
    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      result.current.activate(result.current.notifications[0].id);
    });
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(result.current.notifications).toHaveLength(0);
  });

  it('fires a keyed notification only once', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    act(() => {
      result.current.notifyOnce('cv', { appId: 'cv', title: 'a', body: 'b' });
      result.current.notifyOnce('cv', { appId: 'cv', title: 'a', body: 'b' });
    });
    expect(result.current.notifications).toHaveLength(1);
  });

  it('skips the banner while Do Not Disturb is on but still files the notification', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ doNotDisturb: true }));
    const { result } = renderHook(() => useNotifications(), { wrapper });
    act(() => {
      result.current.notify({ appId: 'cv', title: 'quiet', body: 'no banner' });
    });
    expect(result.current.banners).toHaveLength(0);
    expect(result.current.notifications).toHaveLength(1);
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  });

  it('clears everything at once', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    act(() => {
      result.current.notify({ appId: 'cv', title: 'one', body: '' });
      result.current.notify({ appId: 'outlook', title: 'two', body: '' });
      result.current.clearAll();
    });
    expect(result.current.notifications).toHaveLength(0);
    expect(result.current.banners).toHaveLength(0);
  });
});

describe('notificationAge', () => {
  it('labels ages the way notification centres do', () => {
    const now = 1_000_000_000;
    expect(notificationAge(now - 5_000, now)).toBe('now');
    expect(notificationAge(now - 3 * 60_000, now)).toBe('3m ago');
    expect(notificationAge(now - 2 * 3_600_000, now)).toBe('2h ago');
    expect(notificationAge(now - 3 * 86_400_000, now)).toBe('3d ago');
  });
});

describe('notificationIcon', () => {
  it('shows the PDF document for the CV reminder on Windows only', async () => {
    const { notificationIcon } = await import('../../src/components/SystemUI/NotificationBanners');
    const { render } = await import('@testing-library/react');
    const win = render(<>{notificationIcon('cv', 'windows')}</>);
    expect(win.container.querySelector('svg')).not.toBeNull();
    expect(win.container.textContent).toContain('PDF');
    win.unmount();

    const mac = render(<>{notificationIcon('cv', 'macos')}</>);
    expect(mac.container.querySelector('img')?.getAttribute('src')).toBe('/icons/pages.png');
    expect(mac.container.textContent).not.toContain('PDF');
  });
});
