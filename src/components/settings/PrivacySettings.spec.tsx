import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {PrivacySettings} from './PrivacySettings';
import {ConsentProvider} from '@/contexts/ConsentContext';
import {STORAGE_KEY} from '@/types/consent';
import {privacyService} from '@/server/api/api';

const navigateMock = vi.fn();

vi.mock('react-router-dom', () => ({
  Link: ({children, to, ...props}: any) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => navigateMock,
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

const logoutMock = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({logout: logoutMock}),
}));

vi.mock('@/server/api/api', () => ({
  privacyService: {
    exportMyData: vi.fn(),
    deleteMyAccount: vi.fn(),
  },
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
  const queryClient = new QueryClient({
    defaultOptions: {queries: {retry: false}, mutations: {retry: false}},
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ConsentProvider>
        <PrivacySettings />
      </ConsentProvider>
    </QueryClientProvider>
  );
};

describe('PrivacySettings', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
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

  describe('Exportar meus dados', () => {
    it('calls the export endpoint and triggers a JSON download on click', async () => {
      (privacyService.exportMyData as any).mockResolvedValue({
        data: {account: {email: 'a@b.com'}},
      });
      const createObjectURL = vi.fn().mockReturnValue('blob:fake-url');
      const revokeObjectURL = vi.fn();
      (URL as any).createObjectURL = createObjectURL;
      (URL as any).revokeObjectURL = revokeObjectURL;

      const user = userEvent.setup();
      renderSettings();

      await user.click(screen.getByText(/baixar meus dados/i));

      await waitFor(() => {
        expect(privacyService.exportMyData).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(createObjectURL).toHaveBeenCalled();
      });
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url');
    });
  });

  describe('Apagar minha conta', () => {
    it('keeps the confirm button disabled until the confirmation word is typed', async () => {
      const user = userEvent.setup();
      renderSettings();

      await user.click(screen.getByText(/deletar minha conta/i));

      const confirmButton = await screen.findByRole('button', {name: /apagar conta/i});
      expect(confirmButton).toBeDisabled();

      const input = screen.getByLabelText(/digite/i);
      await user.type(input, 'APAGAR');

      expect(confirmButton).toBeEnabled();
    });

    it('deletes the account, logs out and redirects home on confirm', async () => {
      (privacyService.deleteMyAccount as any).mockResolvedValue({});

      const user = userEvent.setup();
      renderSettings();

      await user.click(screen.getByText(/deletar minha conta/i));
      const input = screen.getByLabelText(/digite/i);
      await user.type(input, 'APAGAR');

      const confirmButton = screen.getByRole('button', {name: /apagar conta/i});
      await user.click(confirmButton);

      await waitFor(() => {
        expect(privacyService.deleteMyAccount).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(logoutMock).toHaveBeenCalled();
      });
      expect(navigateMock).toHaveBeenCalledWith('/', {replace: true});
    });

    it('does not call delete when the typed word does not match', async () => {
      const user = userEvent.setup();
      renderSettings();

      await user.click(screen.getByText(/deletar minha conta/i));
      const input = screen.getByLabelText(/digite/i);
      await user.type(input, 'apagar');

      const confirmButton = screen.getByRole('button', {name: /apagar conta/i});
      expect(confirmButton).toBeDisabled();
      expect(privacyService.deleteMyAccount).not.toHaveBeenCalled();
    });
  });
});
