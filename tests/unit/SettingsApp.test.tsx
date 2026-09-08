import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import SettingsApp, {
  panesFor,
  resolvePane,
  searchPanes,
} from '../../src/components/apps/SettingsApp';
import { SettingsProvider } from '../../src/context/SettingsContext';
import { DesktopProvider } from '../../src/context/DesktopContext';
import { SETTINGS_STORAGE_KEY } from '../../src/lib/settingsStore';

function renderSettings(props?: Record<string, unknown>) {
  return render(
    <SettingsProvider>
      <DesktopProvider startWithAbout={false}>
        <SettingsApp props={props} />
      </DesktopProvider>
    </SettingsProvider>
  );
}

function stored() {
  return JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}');
}

describe('SettingsApp', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-os');
  });

  it('switches the platform and persists it for the next reload', async () => {
    const user = userEvent.setup();
    renderSettings();

    expect(document.documentElement.dataset.os).toBe('macos');
    const cards = screen.getByRole('radiogroup', { name: 'Platform' });
    await user.click(within(cards).getByRole('radio', { name: /Windows & Android/ }));

    expect(document.documentElement.dataset.os).toBe('windows');
    expect(stored().platform).toBe('windows');
    // The pane list re-themes to the Windows Settings layout.
    expect(screen.getByRole('button', { name: /Personalisation/ })).toBeInTheDocument();

    await user.click(
      within(screen.getByRole('radiogroup', { name: 'Platform' })).getByRole('radio', {
        name: /macOS & iOS/,
      })
    );
    expect(document.documentElement.dataset.os).toBe('macos');
    expect(stored().platform).toBe('apple');
  });

  it('opens the pane a caller asks for and toggles a real setting', async () => {
    const user = userEvent.setup();
    renderSettings({ pane: 'wifi' });

    const wifi = screen.getByRole('switch', { name: 'Wi‑Fi' });
    expect(wifi).toHaveAttribute('aria-checked', 'true');
    await user.click(wifi);
    expect(wifi).toHaveAttribute('aria-checked', 'false');
    expect(stored().wifi).toBe(false);
  });

  it('applies accessibility toggles to the document', async () => {
    const user = userEvent.setup();
    renderSettings({ pane: 'accessibility' });

    await user.click(screen.getByRole('switch', { name: 'Reduce motion' }));
    expect(document.documentElement.dataset.reduceMotion).toBe('on');
    await user.click(screen.getByRole('switch', { name: 'Reduce transparency' }));
    expect(document.documentElement.dataset.reduceTransparency).toBe('on');
  });

  it('filters panes by search terms, including section keywords', () => {
    const panes = panesFor('windows');
    expect(searchPanes(panes, 'wifi').map((p) => p.id)).toEqual(['network']);
    expect(searchPanes(panes, 'brightness').map((p) => p.id)).toContain('system');
    expect(searchPanes(panesFor('macos'), 'trash').map((p) => p.id)).toEqual(['general']);
  });

  it('resolves deep links to the pane holding a section on every OS', () => {
    expect(resolvePane(panesFor('windows'), 'wifi')?.id).toBe('network');
    expect(resolvePane(panesFor('android'), 'about')?.id).toBe('about');
    expect(resolvePane(panesFor('ios'), 'storage')?.id).toBe('general');
    expect(resolvePane(panesFor('macos'), 'nonsense')).toBeNull();
  });
});
