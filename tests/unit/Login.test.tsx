import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login, { LOGIN_LEAVE_MS } from '../../src/components/Login/Login';
import { SettingsProvider } from '../../src/context/SettingsContext';
import { SETTINGS_STORAGE_KEY } from '../../src/lib/settingsStore';

function renderLogin(onUnlock: () => void, onLogin: () => void) {
  return render(
    <SettingsProvider>
      <Login onUnlock={onUnlock} onLogin={onLogin} />
    </SettingsProvider>
  );
}

describe('Login', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ platform: 'apple' }));
    document.documentElement.style.backgroundColor = '';
    document.body.style.backgroundColor = '';
  });

  it('hands over to the desktop the moment a key is pressed and lets go once faded', () => {
    vi.useFakeTimers();
    const onUnlock = vi.fn();
    const onLogin = vi.fn();
    renderLogin(onUnlock, onLogin);

    expect(screen.getByText('Click or press any key to log in')).toBeInTheDocument();
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });
    // The desktop can mount straight away, under the screen that is still fading out.
    expect(onUnlock).toHaveBeenCalledTimes(1);
    expect(onLogin).not.toHaveBeenCalled();
    expect(screen.getByText('Click or press any key to log in')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(LOGIN_LEAVE_MS);
    });
    expect(onLogin).toHaveBeenCalledTimes(1);

    // A second key press during the fade does not unlock twice.
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it('paints the page black behind it so fades never show the desktop colour', () => {
    const { unmount } = renderLogin(vi.fn(), vi.fn());
    expect(document.documentElement.style.backgroundColor).toBe('rgb(0, 0, 0)');
    expect(document.body.style.backgroundColor).toBe('rgb(0, 0, 0)');
    unmount();
    expect(document.documentElement.style.backgroundColor).toBe('');
  });

  it('keeps its animations when Reduce Motion is on', () => {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ platform: 'apple', reduceMotion: true })
    );
    renderLogin(vi.fn(), vi.fn());
    expect(document.documentElement.dataset.reduceMotion).toBe('on');
    // The screen opts out of the global reduce-motion rule (see src/index.css).
    const screenEl = screen
      .getByText('Click or press any key to log in')
      .closest('[data-essential-motion]');
    expect(screenEl).not.toBeNull();
  });

  it('shows the night frame of The Beach on a late-evening lock screen', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 14, 23, 30));
    renderLogin(vi.fn(), vi.fn());
    const screenEl = screen
      .getByText('Click or press any key to log in')
      .closest('[data-essential-motion]') as HTMLElement;
    expect(screenEl.style.backgroundImage).toContain('/wallpapers/the-beach-night.jpg');
  });
});
