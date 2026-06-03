import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SnakeApp from '../../src/components/apps/SnakeApp';
import * as snakeLeaderboard from '../../src/lib/snakeLeaderboard';

vi.mock('../../src/lib/snakeLeaderboard', async (importOriginal) => {
  const actual = await importOriginal<typeof snakeLeaderboard>();
  return {
    ...actual,
    fetchLeaderboard: vi.fn(async () => []),
    submitLeaderboardScore: vi.fn(async () => true),
  };
});

describe('SnakeApp leaderboard', () => {
  beforeEach(() => {
    vi.mocked(snakeLeaderboard.fetchLeaderboard).mockClear();
    vi.mocked(snakeLeaderboard.submitLeaderboardScore).mockClear();
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

  it('shows at most five leaderboard rows', async () => {
    vi.mocked(snakeLeaderboard.fetchLeaderboard).mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => ({
        name: `P${String(i).padStart(2, '0').slice(-2)}`,
        score: 100 - i,
      }))
    );

    const user = userEvent.setup();
    render(<SnakeApp />);
    await user.click(screen.getByRole('button', { name: /scores/i }));

    await waitFor(() => {
      expect(screen.getByText('#5')).toBeInTheDocument();
    });
    expect(screen.queryByText('#6')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it('does not submit to the leaderboard when the player skips name entry', async () => {
    let skipEntry: (() => void) | undefined;
    render(
      <SnakeApp
        initialEntryScore={12}
        onSkipEntry={(cb) => {
          skipEntry = cb;
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/enter your name/i)).toBeInTheDocument();
    });

    skipEntry?.();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
    });

    expect(screen.queryByText(/top 5/i)).not.toBeInTheDocument();
    expect(snakeLeaderboard.submitLeaderboardScore).not.toHaveBeenCalled();
    expect(snakeLeaderboard.fetchLeaderboard).not.toHaveBeenCalled();
  });

  it('submits to the leaderboard when the player confirms name entry', async () => {
    const user = userEvent.setup();
    render(<SnakeApp initialEntryScore={12} />);

    await waitFor(() => {
      expect(screen.getByText(/enter your name/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(snakeLeaderboard.submitLeaderboardScore).toHaveBeenCalledWith('AAA', 12);
    });
  });

  it('opens scores and returns to the start screen with a single Back button', async () => {
    vi.mocked(snakeLeaderboard.fetchLeaderboard).mockResolvedValue([
      { name: 'JSH', score: 42 },
      { name: 'AAA', score: 12 },
    ]);

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
