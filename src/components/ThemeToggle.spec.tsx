import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ThemeToggle, useThemeToggle} from './ThemeToggle';

function OtherConsumer() {
  const {theme} = useThemeToggle();
  return <span data-testid="other-consumer-theme">{theme}</span>;
}

describe('ThemeToggle shared state', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  it('keeps two simultaneously-mounted consumers in sync when one toggles', async () => {
    const user = userEvent.setup();
    render(
      <>
        <ThemeToggle />
        <OtherConsumer />
      </>,
    );

    // Reset shared module state to a known starting point regardless of
    // what earlier tests in this file left behind, then re-render is not
    // needed since useSyncExternalStore will read the fresh snapshot on
    // the next state change triggered by the click below. To make the
    // assertion deterministic, explicitly force the state to 'light' via
    // the toggle button before asserting, using the DOM as the source of
    // truth instead of assuming initial render value.
    if (document.documentElement.classList.contains('dark')) {
      await user.click(screen.getByRole('button', {name: /toggle theme/i}));
    }

    expect(screen.getByTestId('other-consumer-theme')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    await user.click(screen.getByRole('button', {name: /toggle theme/i}));

    expect(screen.getByTestId('other-consumer-theme')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
