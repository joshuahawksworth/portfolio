import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AskJoshApp from '../../src/components/apps/AskJoshApp';

const PLACEHOLDER = 'Ask anything about Josh…';
const ACCOUNT_KEY = 'portfolio.askclaude.account';

function signedInAs(provider: 'apple' | 'google' | 'guest') {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ name: provider, provider }));
}

describe('AskJoshApp', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('asks the visitor to sign in first, then shows the empty-state hero', async () => {
    const user = userEvent.setup();
    render(<AskJoshApp />);

    expect(screen.getByRole('dialog', { name: 'Chat with Claude' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue as guest' }));

    // The mock hand-off takes a beat before the sheet goes away
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), {
      timeout: 3000,
    });
    expect(screen.getByText('Where should we begin?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Summarise Josh's experience" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(PLACEHOLDER)).toBeInTheDocument();
  });

  it('answers guests from the portfolio data without calling the API', async () => {
    signedInAs('guest');
    vi.stubGlobal('fetch', vi.fn());
    const user = userEvent.setup();
    render(<AskJoshApp />);

    await user.click(screen.getByRole('button', { name: 'How do I contact Josh?' }));

    expect(
      await screen.findByText(/joshuahawksworth@me\.com/, {}, { timeout: 4000 })
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  }, 8000);

  it('falls back to offline answers when the assistant is not configured', async () => {
    signedInAs('apple');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ error: 'assistant_unconfigured' }, { status: 503 }))
    );
    const user = userEvent.setup();
    render(<AskJoshApp />);

    await user.type(screen.getByPlaceholderText(PLACEHOLDER), "Summarise Josh's experience{Enter}");

    expect(
      await screen.findByText(/Senior Full Stack Developer/, {}, { timeout: 4000 })
    ).toBeInTheDocument();
    expect(screen.queryByText(/isn't configured/)).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      '/api/ask',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: "Summarise Josh's experience" }],
        }),
      })
    );
  }, 8000);

  it('renders a streamed reply with basic markdown', async () => {
    signedInAs('apple');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('Josh has held **six roles**.\n\n- CMap Software\n- 17 Oranges', {
            status: 200,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
      )
    );
    const user = userEvent.setup();
    render(<AskJoshApp />);

    await user.click(screen.getByRole('button', { name: "Summarise Josh's experience" }));

    const bold = await screen.findByText('six roles');
    expect(bold.tagName).toBe('STRONG');
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'CMap Software',
      '17 Oranges',
    ]);
    // The conversation now appears in the sidebar under "Your chats".
    expect(screen.getByText('Your chats')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Summarise Josh's experience/ })).toBeInTheDocument();
  });
});
