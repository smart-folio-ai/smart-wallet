import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {PrivacySettings} from './PrivacySettings';
import {ConsentProvider} from '@/contexts/ConsentContext';
import {STORAGE_KEY} from '@/types/consent';

vi.mock('react-router-dom', () => ({
  Link: ({children, to, ...props}: any) => <a href={to} {...props}>{children}</a>,
}));

// Espelha o formato real de useAppToast: {success, error, warning, info}.
// O mock anterior devolvia {toast}, que não existe no hook — por isso o
// componente quebrava em runtime sem o teste acusar.
vi.mock('@/hooks/use-app-toast', () => ({
  useAppToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {value: localStorageMock});

const renderSettings = () => {
  return render(
    <ConsentProvider>
      <PrivacySettings />
    </ConsentProvider>
  );
};

describe('PrivacySettings', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should render privacy settings', () => {
    renderSettings();
    expect(screen.getByRole('heading', {name: /privacidade/i})).toBeInTheDocument();
    expect(screen.getByText(/gerenciar consentimento/i)).toBeInTheDocument();
  });

  it('should show all cookie categories', () => {
    renderSettings();
    expect(screen.getByText(/essenciais/i)).toBeInTheDocument();
    expect(screen.getByText(/funcionais/i)).toBeInTheDocument();
    expect(screen.getByText(/analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/marketing/i)).toBeInTheDocument();
  });

  it('should save preferences', async () => {
    const user = userEvent.setup();
    renderSettings();

    const switches = screen.getAllByRole('switch');
    const analyticsSwitch = switches[2];
    await user.click(analyticsSwitch);

    await user.click(screen.getByText(/salvar preferências/i));

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.analytics).toBe(true);
  });
});
