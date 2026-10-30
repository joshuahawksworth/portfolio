import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AskJoshApp from '../../src/components/apps/AskJoshApp';

const PLACEHOLDER = 'Ask anything about Josh…';

afterEach(() => vi.unstubAllGlobals());

describe('AskJoshApp', () => {
  it('opens straight onto the empty-state hero with no sign-in step', () => {
    render(<AskJoshApp />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Where should we begin?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Summarise Josh's experience" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(PLACEHOLDER)).toBeInTheDocument();
  });

  it('answers from the portfolio data without any network call', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const user = userEvent.setup();
    render(<AskJoshApp />);

    await user.click(screen.getByRole('button', { name: 'How do I contact Josh?' }));

    expect(
      await screen.findByText(/joshuahawksworth@me\.com/, {}, { timeout: 4000 })
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  }, 8000);

  it('renders the reply as markdown and lists the chat in the sidebar', async () => {
    const user = userEvent.setup();
    render(<AskJoshApp />);

    await user.type(screen.getByPlaceholderText(PLACEHOLDER), "Summarise Josh's experience{Enter}");

    const bold = await screen.findByText('Senior Full Stack Developer', {}, { timeout: 4000 });
    expect(bold.tagName).toBe('STRONG');
    expect(await screen.findAllByRole('listitem', {}, { timeout: 4000 })).not.toHaveLength(0);
    expect(screen.getByText('Your chats')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Summarise Josh's experience/ })).toBeInTheDocument();
  }, 8000);
});
