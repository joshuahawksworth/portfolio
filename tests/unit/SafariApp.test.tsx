import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SafariApp from '../../src/components/apps/SafariApp';

describe('SafariApp search', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          query: 'portfolio testing',
          results: [
            {
              title: 'Portfolio Testing Guide',
              url: 'https://example.com/testing',
              displayUrl: 'example.com/testing',
              snippet: 'A practical guide for testing portfolio sites.',
            },
          ],
        })
      )
    );
  });

  it('renders a Brave Search home instead of embedding a search engine', () => {
    render(<SafariApp />);

    expect(screen.getByAltText('Brave Search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search the web privately…')).toBeInTheDocument();
    expect(screen.queryByTitle('Browser')).not.toBeInTheDocument();
  });

  it('turns search terms into in-app clickable results', async () => {
    const user = userEvent.setup();
    render(<SafariApp />);

    await user.type(screen.getByPlaceholderText('Search the web privately…'), 'portfolio testing');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('Portfolio Testing Guide')).toBeInTheDocument();
    expect(screen.getByText('A practical guide for testing portfolio sites.')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/search?q=portfolio%20testing');
  });
});
