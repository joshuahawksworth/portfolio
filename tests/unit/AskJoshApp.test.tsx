import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AskJoshApp from '../../src/components/apps/AskJoshApp';

const PLACEHOLDER = 'Ask anything about Josh…';

describe('AskJoshApp', () => {
  it('renders the empty-state hero with suggestion chips', () => {
    render(<AskJoshApp />);

    expect(screen.getByText('Where should we begin?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Summarise Josh's experience" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'How do I contact Josh?' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByText('Claude')).toBeInTheDocument();
  });

  it('shows a friendly note when the assistant is not configured', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ error: 'assistant_unconfigured' }, { status: 503 }))
    );
    const user = userEvent.setup();
    render(<AskJoshApp />);

    await user.type(screen.getByPlaceholderText(PLACEHOLDER), 'What does Josh do?{Enter}');

    expect(
      await screen.findByText(
        "The assistant isn't configured on this deployment yet (missing ANTHROPIC_API_KEY)."
      )
    ).toBeInTheDocument();
    // The sent message shows as the user bubble and as the sidebar chat title.
    expect(screen.getAllByText('What does Josh do?')).toHaveLength(2);
    expect(fetch).toHaveBeenCalledWith(
      '/api/ask',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ messages: [{ role: 'user', content: 'What does Josh do?' }] }),
      })
    );
  });

  it('renders a streamed reply with basic markdown', async () => {
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
