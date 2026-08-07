import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {render, screen, act} from '@testing-library/react';
import {ConsentProvider, useConsent} from './ConsentContext';
import {
  STORAGE_KEY,
  ALL_ACCEPTED_CONSENT,
  ALL_REJECTED_CONSENT,
  DEFAULT_CONSENT,
  type ConsentPreferences,
} from '@/types/consent';

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

const TestComponent = () => {
  const {consent, hasConsented, acceptAll, rejectAll, updateConsent, resetConsent} = useConsent();
  return (
    <div>
      <span data-testid="has-consented">{String(hasConsented)}</span>
      <span data-testid="functional">{String(consent?.functional)}</span>
      <span data-testid="analytics">{String(consent?.analytics)}</span>
      <span data-testid="marketing">{String(consent?.marketing)}</span>
      <button onClick={acceptAll}>Accept All</button>
      <button onClick={rejectAll}>Reject All</button>
      <button onClick={resetConsent}>Reset</button>
      <button onClick={() => updateConsent({functional: false, marketing: true})}>
        Update Consent
      </button>
      {/* O duplo cast é proposital: ConsentPreferences fixa essential em true,
          então este valor é inalcançável pelo tipo. O teste existe justamente
          para provar que uma chamada vinda de runtime não tipado (storage
          adulterado, console) não consegue desligar o cookie essencial. */}
      <button
        onClick={() =>
          updateConsent({essential: false} as unknown as Partial<ConsentPreferences>)
        }>
        Try Disable Essential
      </button>
    </div>
  );
};

describe('ConsentContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.removeEventListener('consent:updated', vi.fn());
  });

  it('should not have consent initially', () => {
    render(
      <ConsentProvider>
        <TestComponent />
      </ConsentProvider>
    );
    expect(screen.getByTestId('has-consented')).toHaveTextContent('false');
  });

  it('should accept all cookies', async () => {
    render(
      <ConsentProvider>
        <TestComponent />
      </ConsentProvider>
    );

    await act(async () => {
      screen.getByText('Accept All').click();
    });

    expect(screen.getByTestId('has-consented')).toHaveTextContent('true');
    expect(screen.getByTestId('functional')).toHaveTextContent('true');
    expect(screen.getByTestId('analytics')).toHaveTextContent('true');

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toMatchObject({
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    });
    expect(stored.timestamp).toBeTruthy();
  });

  it('should reject all non-essential cookies', async () => {
    render(
      <ConsentProvider>
        <TestComponent />
      </ConsentProvider>
    );

    await act(async () => {
      screen.getByText('Reject All').click();
    });

    expect(screen.getByTestId('has-consented')).toHaveTextContent('true');
    expect(screen.getByTestId('functional')).toHaveTextContent('false');
    expect(screen.getByTestId('analytics')).toHaveTextContent('false');
  });

  it('should reset consent', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ALL_ACCEPTED_CONSENT));

    render(
      <ConsentProvider>
        <TestComponent />
      </ConsentProvider>
    );

    expect(screen.getByTestId('has-consented')).toHaveTextContent('true');

    await act(async () => {
      screen.getByText('Reset').click();
    });

    expect(screen.getByTestId('has-consented')).toHaveTextContent('false');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('should dispatch consent:updated event', async () => {
    const eventSpy = vi.fn();
    window.addEventListener('consent:updated', eventSpy);

    render(
      <ConsentProvider>
        <TestComponent />
      </ConsentProvider>
    );

    await act(async () => {
      screen.getByText('Accept All').click();
    });

    expect(eventSpy).toHaveBeenCalled();
    window.removeEventListener('consent:updated', eventSpy);
  });

  it('should merge partial updates with existing consent', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ALL_ACCEPTED_CONSENT));

    render(
      <ConsentProvider>
        <TestComponent />
      </ConsentProvider>
    );

    expect(screen.getByTestId('functional')).toHaveTextContent('true');
    expect(screen.getByTestId('analytics')).toHaveTextContent('true');
    expect(screen.getByTestId('marketing')).toHaveTextContent('true');

    await act(async () => {
      screen.getByText('Update Consent').click();
    });

    expect(screen.getByTestId('functional')).toHaveTextContent('false');
    expect(screen.getByTestId('analytics')).toHaveTextContent('true');
    expect(screen.getByTestId('marketing')).toHaveTextContent('true');

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toMatchObject({
      essential: true,
      functional: false,
      analytics: true,
      marketing: true,
    });
    expect(stored.timestamp).toBeTruthy();
  });

  it('should always enforce essential: true even when explicitly set to false', async () => {
    render(
      <ConsentProvider>
        <TestComponent />
      </ConsentProvider>
    );

    await act(async () => {
      screen.getByText('Accept All').click();
    });

    await act(async () => {
      screen.getByText('Try Disable Essential').click();
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.essential).toBe(true);
  });

  it('should handle invalid JSON in localStorage gracefully', async () => {
    localStorage.setItem(STORAGE_KEY, '{invalid json');

    render(
      <ConsentProvider>
        <TestComponent />
      </ConsentProvider>
    );

    expect(screen.getByTestId('has-consented')).toHaveTextContent('false');
  });
});
