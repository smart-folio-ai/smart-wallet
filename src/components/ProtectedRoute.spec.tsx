import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter, Routes, Route} from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

const mockUseAuth = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/components/WalletLoadingScreen', () => ({
  default: ({loadingText}: {loadingText: string}) => <div>{loadingText}</div>,
}));

function renderProtectedRoute(allowedRoles?: Array<'admin' | 'editor' | 'user' | 'advisor'>) {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <div>Painel Admin</div>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<div>Landing</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state while auth is being checked', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      role: null,
    });

    renderProtectedRoute(['admin']);

    expect(screen.getByText(/Verificando autenticação/i)).toBeInTheDocument();
  });

  it('redirects unauthenticated users to landing page', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      role: null,
    });

    renderProtectedRoute(['admin']);

    expect(screen.getByText('Landing')).toBeInTheDocument();
  });

  it('redirects authenticated users without role permission to dashboard', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      role: 'user',
    });

    renderProtectedRoute(['admin']);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders children when role is allowed', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      role: 'admin',
    });

    renderProtectedRoute(['admin']);

    expect(screen.getByText('Painel Admin')).toBeInTheDocument();
  });
});
