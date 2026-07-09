import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {render, screen, act, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {CookieConsentBanner} from './CookieConsentBanner';
import {ConsentProvider} from '@/contexts/ConsentContext';
import {STORAGE_KEY} from '@/types/consent';

vi.mock('react-router-dom', () => ({
  Link: ({children, to, ...props}: any) => <a href={to} {...props}>{children}</a>,
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

const renderBanner = () => {
  return render(
    <ConsentProvider>
      <CookieConsentBanner />
    </ConsentProvider>
  );
};

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show banner when no consent exists', async () => {
    renderBanner();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole('heading', {name: /utilizamos cookies/i})).toBeInTheDocument();
  });

  it('should not show banner when consent exists', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({essential: true, functional: true, analytics: false, marketing: false, timestamp: new Date().toISOString(), version: '1.0'}));
    renderBanner();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByRole('heading', {name: /utilizamos cookies/i})).not.toBeInTheDocument();
  });

  it('should accept all cookies', async () => {
    const user = userEvent.setup();
    renderBanner();
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await user.click(screen.getByRole('button', {name: /aceitar todos/i}));

    expect(screen.queryByRole('heading', {name: /utilizamos cookies/i})).not.toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.functional).toBe(true);
    expect(stored.analytics).toBe(true);
    expect(stored.marketing).toBe(true);
  });

  it('should reject all non-essential cookies', async () => {
    const user = userEvent.setup();
    renderBanner();
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await user.click(screen.getByRole('button', {name: /rejeitar todos/i}));

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.functional).toBe(false);
    expect(stored.analytics).toBe(false);
    expect(stored.marketing).toBe(false);
  });

  it('should toggle functional cookies', async () => {
    const user = userEvent.setup();
    renderBanner();
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const switches = screen.getAllByRole('switch');
    const functionalSwitch = switches[1];
    expect(functionalSwitch).toHaveAttribute('aria-checked', 'true');

    await user.click(functionalSwitch);
    expect(functionalSwitch).toHaveAttribute('aria-checked', 'false');
  });
});
