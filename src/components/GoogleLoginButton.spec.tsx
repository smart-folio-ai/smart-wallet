import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render, waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {GoogleLoginButton} from './GoogleLoginButton';
import AuthenticationService from '@/services/authentication';

vi.mock('@/services/authentication', () => ({
  default: {
    authenticateWithGoogle: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockError = vi.fn();
vi.mock('@/hooks/use-app-toast', () => ({
  useAppToast: () => ({
    success: vi.fn(),
    error: mockError,
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

let mockInitialize: any;
let mockRenderButton: any;

function renderButton() {
  return render(
    <MemoryRouter>
      <GoogleLoginButton />
    </MemoryRouter>
  );
}

describe('GoogleLoginButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    mockError.mockClear();

    mockInitialize = vi.fn();
    mockRenderButton = vi.fn();

    window.google = {
      accounts: {
        id: {
          initialize: mockInitialize,
          renderButton: mockRenderButton,
        },
      },
    };

    // Mock document.body.appendChild to trigger script onload
    const originalAppendChild = document.body.appendChild;
    vi.spyOn(document.body, 'appendChild').mockImplementation(function(element: any) {
      const result = originalAppendChild.call(this, element);
      if (element.tagName === 'SCRIPT' && element.src?.includes('accounts.google.com')) {
        setTimeout(() => {
          element.onload?.();
        }, 0);
      }
      return result;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not clobber the token the service already stored, and navigates to /dashboard on successful login', async () => {
    // Real AuthenticationService.authenticateWithGoogle contract: on success
    // it writes access_token/refresh_token to localStorage ITSELF and
    // returns only {success: true} (no accessToken/refreshToken in the
    // returned object). Simulate that prior write here, then assert the
    // component does not overwrite it with "undefined".
    localStorage.setItem('access_token', 'pre-existing-real-token');
    localStorage.setItem('refresh_token', 'pre-existing-real-refresh');

    (AuthenticationService.authenticateWithGoogle as any).mockResolvedValue({
      success: true,
    });

    renderButton();

    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
    });

    const initializeCall = mockInitialize.mock.calls[0][0];
    await initializeCall.callback({credential: 'fake-id-token'});

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
    expect(localStorage.getItem('access_token')).toBe('pre-existing-real-token');
    expect(localStorage.getItem('refresh_token')).toBe('pre-existing-real-refresh');
  });

  it('does not store tokens or navigate when authentication fails, and shows an error', async () => {
    (AuthenticationService.authenticateWithGoogle as any).mockResolvedValue({
      success: false,
    });

    renderButton();

    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
    });

    const initializeCall = mockInitialize.mock.calls[0][0];
    await initializeCall.callback({credential: 'fake-id-token'});

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('routes to 2FA verification without touching tokens when requires2FA is true', async () => {
    // Real contract: on the 2FA branch the service already wrote
    // 2fa_temp_token to sessionStorage internally and returns
    // {success: true, requires2FA: true} — no tempToken field on the
    // returned object.
    (AuthenticationService.authenticateWithGoogle as any).mockResolvedValue({
      success: true,
      requires2FA: true,
    });

    renderButton();

    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
    });

    const initializeCall = mockInitialize.mock.calls[0][0];
    await initializeCall.callback({credential: 'fake-id-token'});

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/2fa-verify');
    });
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  /**
   * Bug real de produção: o botão do Google renderiza como <iframe>
   * cross-origin, não como `<div role="button">`. Um clique sintético
   * nunca alcança conteúdo dentro de um iframe de outra origem — é a
   * mesma barreira que a Same-Origin Policy impõe a DOM/postMessage.
   * A versão anterior tentava `querySelector('div[role="button"]').click()`
   * e nunca encontrava nada: TODO clique caía no fallback de erro, e login
   * com Google nunca completava em produção.
   *
   * A correção é a técnica de overlay: o botão real do Google é desenhado
   * com o MESMO tamanho do botão visual e sobreposto com opacidade zero,
   * então o clique do usuário sempre acerta o iframe diretamente — sem
   * nenhum forwarding via JS. Este teste trava que `renderButton` recebe
   * uma largura numérica (não um contêiner de 1x1 escondido no canto).
   */
  it('renders the real Google button overlaying the full width of the visual button, not hidden at 1x1', async () => {
    // jsdom não faz layout de verdade — offsetWidth é sempre 0 a menos que
    // seja explicitamente definido. Simula o container medindo 320px, como
    // o botão faria numa tela real.
    const offsetWidthSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockReturnValue(320);

    renderButton();

    await waitFor(() => {
      expect(mockRenderButton).toHaveBeenCalled();
    });

    const [, options] = mockRenderButton.mock.calls[0];
    expect(options.width).toBe(320);

    offsetWidthSpy.mockRestore();
  });
});
