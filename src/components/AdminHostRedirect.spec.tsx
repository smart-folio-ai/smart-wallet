import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import {MemoryRouter, Routes, Route} from 'react-router-dom';
import {AdminHostRedirect} from './AdminHostRedirect';

const mockUseAuth = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderAtRoot() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AdminHostRedirect />
      <Routes>
        <Route path="/" element={<div>Landing</div>} />
        <Route path="/admin" element={<div>Painel Admin</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AdminHostRedirect', () => {
  const originalHostname = window.location.hostname;

  function setHostname(hostname: string) {
    Object.defineProperty(window, 'location', {
      value: {...window.location, hostname},
      writable: true,
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setHostname(originalHostname);
  });

  it('does not redirect on the regular domain, even when authenticated', async () => {
    setHostname('trackerr.com.br');
    mockUseAuth.mockReturnValue({isAuthenticated: true, isLoading: false});

    renderAtRoot();

    await waitFor(() => {
      expect(screen.getByText('Landing')).toBeInTheDocument();
    });
  });

  /**
   * O caso que importa: sem a checagem de isAuthenticated, um visitante
   * deslogado em admin.trackerr.com.br entraria em loop — ProtectedRoute
   * manda quem não está logado de volta pra "/", e este componente
   * mandaria de "/" pra "/admin" de novo, indefinidamente.
   */
  it('does not redirect on the admin subdomain when NOT authenticated (prevents a redirect loop with ProtectedRoute)', async () => {
    setHostname('admin.trackerr.com.br');
    mockUseAuth.mockReturnValue({isAuthenticated: false, isLoading: false});

    renderAtRoot();

    await waitFor(() => {
      expect(screen.getByText('Landing')).toBeInTheDocument();
    });
  });

  it('does not redirect while auth is still loading', async () => {
    setHostname('admin.trackerr.com.br');
    mockUseAuth.mockReturnValue({isAuthenticated: true, isLoading: true});

    renderAtRoot();

    await waitFor(() => {
      expect(screen.getByText('Landing')).toBeInTheDocument();
    });
  });

  it('redirects "/" to "/admin" on the admin subdomain once authenticated', async () => {
    setHostname('admin.trackerr.com.br');
    mockUseAuth.mockReturnValue({isAuthenticated: true, isLoading: false});

    renderAtRoot();

    await waitFor(() => {
      expect(screen.getByText('Painel Admin')).toBeInTheDocument();
    });
  });
});
