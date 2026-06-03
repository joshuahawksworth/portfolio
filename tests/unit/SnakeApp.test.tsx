import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SnakeApp from '../../src/components/apps/SnakeApp';

describe('SnakeApp leaderboard', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json([
          { name: 'JSH', score: 42 },
          { name: 'AAA', score: 12 },
        ])
      )
    );
  });

  it('opens scores and returns to the start screen with a single Back button', async () => {
    const user = userEvent.setup();
    render(<SnakeApp />);

    await user.click(screen.getByRole('button', { name: /scores/i }));

    await waitFor(() => {
      expect(screen.getByText('JSH')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /play again/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /refresh scores/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'BACK' }));

    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /scores/i })).toBeInTheDocument();
  });
});
