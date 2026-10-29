import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useBackButtonClosesApp } from '../../src/hooks/useBackButtonClosesApp';

function pressBack() {
  act(() => {
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
}

describe('useBackButtonClosesApp', () => {
  it('pushes one history entry while an app is open and closes the app on back', () => {
    const push = vi.spyOn(window.history, 'pushState');
    const closeTop = vi.fn();
    const { rerender } = renderHook(({ n }) => useBackButtonClosesApp(n, closeTop), {
      initialProps: { n: 0 },
    });
    expect(push).not.toHaveBeenCalled();

    rerender({ n: 1 });
    expect(push).toHaveBeenCalledTimes(1);

    pressBack();
    expect(closeTop).toHaveBeenCalledTimes(1);

    // The app is gone: nothing is pushed back, so the next back press leaves the site.
    rerender({ n: 0 });
    expect(push).toHaveBeenCalledTimes(1);
    pressBack();
    expect(closeTop).toHaveBeenCalledTimes(1);
  });

  it('re-arms after each back press while apps remain stacked', () => {
    const push = vi.spyOn(window.history, 'pushState');
    const closeTop = vi.fn();
    const { rerender } = renderHook(({ n }) => useBackButtonClosesApp(n, closeTop), {
      initialProps: { n: 2 },
    });
    expect(push).toHaveBeenCalledTimes(1);

    pressBack();
    expect(closeTop).toHaveBeenCalledTimes(1);
    rerender({ n: 1 });
    expect(push).toHaveBeenCalledTimes(2);

    pressBack();
    expect(closeTop).toHaveBeenCalledTimes(2);
    rerender({ n: 0 });
    expect(push).toHaveBeenCalledTimes(2);
  });

  it('drops its entry when the last app is closed from the UI, without closing anything', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const closeTop = vi.fn();
    const { rerender } = renderHook(({ n }) => useBackButtonClosesApp(n, closeTop), {
      initialProps: { n: 2 },
    });

    rerender({ n: 1 });
    expect(back).not.toHaveBeenCalled();

    rerender({ n: 0 });
    expect(back).toHaveBeenCalledTimes(1);
    // The popstate that back() produces must not be mistaken for the user's press.
    pressBack();
    expect(closeTop).not.toHaveBeenCalled();
  });

  it('drops its entry on unmount so the lock screen is not one press behind', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const { unmount } = renderHook(() => useBackButtonClosesApp(1, () => {}));
    unmount();
    expect(back).toHaveBeenCalledTimes(1);
  });
});
