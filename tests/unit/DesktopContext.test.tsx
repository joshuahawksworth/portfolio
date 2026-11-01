import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DesktopProvider, useDesktop } from '../../src/context/DesktopContext';

function DesktopHarness() {
  const { windows, focusedId, openApp, minimizeWindow, closeWindow } = useDesktop();
  const firstWindow = windows[0];

  return (
    <div>
      <button onClick={() => openApp('skills')}>Open Skills</button>
      <button disabled={!firstWindow} onClick={() => firstWindow && minimizeWindow(firstWindow.id)}>
        Minimize First
      </button>
      <button disabled={!firstWindow} onClick={() => firstWindow && closeWindow(firstWindow.id)}>
        Close First
      </button>
      <output aria-label="window count">{windows.length}</output>
      <output aria-label="focused window">{focusedId ?? 'none'}</output>
      <ul>
        {windows.map((win) => (
          <li key={win.id}>
            {win.title}:{win.minimized ? 'minimized' : 'open'}
          </li>
        ))}
      </ul>
    </div>
  );
}

describe('DesktopContext window lifecycle', () => {
  it('opens, minimizes, and closes app windows predictably', async () => {
    const user = userEvent.setup();

    render(
      <DesktopProvider startWithLanding={false}>
        <DesktopHarness />
      </DesktopProvider>
    );

    expect(screen.getByLabelText('window count')).toHaveTextContent('0');
    expect(screen.getByLabelText('focused window')).toHaveTextContent('none');

    await user.click(screen.getByRole('button', { name: 'Open Skills' }));

    expect(screen.getByLabelText('window count')).toHaveTextContent('1');
    expect(screen.getByText('Skills & Tech:open')).toBeInTheDocument();
    expect(screen.getByLabelText('focused window')).toHaveTextContent(/^skills-/);

    await user.click(screen.getByRole('button', { name: 'Minimize First' }));

    expect(screen.getByText('Skills & Tech:minimized')).toBeInTheDocument();
    expect(screen.getByLabelText('focused window')).toHaveTextContent('none');

    await user.click(screen.getByRole('button', { name: 'Close First' }));

    expect(screen.getByLabelText('window count')).toHaveTextContent('0');
  });
});

function SourceHarness() {
  const { windows, openApp } = useDesktop();
  return (
    <div>
      <button onClick={() => openApp('malware', { variant: 'installer', source: 'malware-exe' })}>
        Run installer
      </button>
      <button onClick={() => openApp('malware', { variant: 'Security Warning' })}>Pop up</button>
      <output aria-label="window count">{windows.length}</output>
    </div>
  );
}

describe('DesktopContext windows opened from a file', () => {
  it('keeps one window per source file, so a double tap does not queue a second installer', async () => {
    const user = userEvent.setup();
    render(
      <DesktopProvider startWithLanding={false}>
        <SourceHarness />
      </DesktopProvider>
    );
    await user.click(screen.getByRole('button', { name: 'Run installer' }));
    await user.click(screen.getByRole('button', { name: 'Run installer' }));
    expect(screen.getByLabelText('window count')).toHaveTextContent('1');
    // Pop-ups have no source and still stack
    await user.click(screen.getByRole('button', { name: 'Pop up' }));
    await user.click(screen.getByRole('button', { name: 'Pop up' }));
    expect(screen.getByLabelText('window count')).toHaveTextContent('3');
  });
});
