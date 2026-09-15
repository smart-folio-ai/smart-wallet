import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import {MemoryRouter, Routes, Route} from 'react-router-dom';
import {AdminHostRedirect, resolveHostRedirect} from './AdminHostRedirect';

const mockUseAuth = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const base = {search: '', isAuthenticated: true, role: 'admin'};

describe('resolveHostRedirect', () => {
  it('sends /admin on the app domain to the admin subdomain, keeping the path', () => {
    expect(resolveHostRedirect({...base, hostname: 'trackerr.com.br', pathname: '/admin/plans', search: '?x=1'})).toEqual({
      type: 'external',
      to: 'https://admin.trackerr.com.br/admin/plans?x=1',
    });
    expect(resolveHostRedirect({...base, hostname: 'www.trackerr.com.br', pathname: '/admin'})?.type).toBe('external');
    expect(resolveHostRedirect({...base, hostname: 'trackerr.com.br', pathname: '/dashboard'})).toBeNull();
  });

  it('keeps the admin subdomain on the admin only', () => {
    const admin = {...base, hostname: 'admin.trackerr.com.br'};
    expect(resolveHostRedirect({...admin, pathname: '/dashboard'})).toEqual({type: 'internal', to: '/admin'});
    expect(resolveHostRedirect({...admin, pathname: '/'})).toEqual({type: 'internal', to: '/admin'});
    expect(resolveHostRedirect({...admin, pathname: '/admin/grants'})).toBeNull();
  });

  it('asks visitors to sign in on the admin subdomain, but lets auth pages through', () => {
    const visitor = {...base, hostname: 'admin.trackerr.com.br', isAuthenticated: false, role: null};
    expect(resolveHostRedirect({...visitor, pathname: '/'})).toEqual({type: 'internal', to: '/signin'});
    expect(resolveHostRedirect({...visitor, pathname: '/admin'})).toEqual({type: 'internal', to: '/signin'});
    expect(resolveHostRedirect({...visitor, pathname: '/signin'})).toBeNull();
    expect(resolveHostRedirect({...visitor, pathname: '/2fa-verify'})).toBeNull();
  });

  it('routes editors to grants and regular users back to the app (no redirect loop)', () => {
    const host = {...base, hostname: 'admin.trackerr.com.br'};
    expect(resolveHostRedirect({...host, role: 'editor', pathname: '/admin'})).toEqual({type: 'internal', to: '/admin/grants'});
    expect(resolveHostRedirect({...host, role: 'user', pathname: '/dashboard'})).toEqual({
      type: 'external',
      to: 'https://trackerr.com.br/dashboard',
    });
  });

  it('does nothing on localhost or previews', () => {
    expect(resolveHostRedirect({...base, hostname: 'localhost', pathname: '/admin'})).toBeNull();
    expect(resolveHostRedirect({...base, hostname: 'abc.trackerr.pages.dev', pathname: '/dashboard'})).toBeNull();
  });
});

describe('AdminHostRedirect', () => {
  const originalLocation = window.location;

  function setHostname(hostname: string) {
    Object.defineProperty(window, 'location', {
      value: {...originalLocation, hostname, replace: vi.fn()},
      writable: true,
    });
  }

  const renderAt = (path: string) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <AdminHostRedirect />
        <Routes>
          <Route path="/" element={<div>Landing</div>} />
          <Route path="/signin" element={<div>Entrar</div>} />
          <Route path="/admin" element={<div>Painel Admin</div>} />
        </Routes>
      </MemoryRouter>,
    );

  beforeEach(() => vi.clearAllMocks());
  afterEach(() => {
    Object.defineProperty(window, 'location', {value: originalLocation, writable: true});
  });

  it('waits for auth before redirecting', () => {
    setHostname('admin.trackerr.com.br');
    mockUseAuth.mockReturnValue({isAuthenticated: false, isLoading: true, role: null});
    renderAt('/');

    expect(screen.getByText('Landing')).toBeInTheDocument();
  });

  it('opens the panel for an admin on the admin subdomain', async () => {
    setHostname('admin.trackerr.com.br');
    mockUseAuth.mockReturnValue({isAuthenticated: true, isLoading: false, role: 'admin'});
    renderAt('/');

    await waitFor(() => expect(screen.getByText('Painel Admin')).toBeInTheDocument());
  });

  it('leaves the app domain for the admin subdomain on /admin', async () => {
    setHostname('trackerr.com.br');
    mockUseAuth.mockReturnValue({isAuthenticated: true, isLoading: false, role: 'admin'});
    renderAt('/admin');

    await waitFor(() => expect(window.location.replace).toHaveBeenCalledWith('https://admin.trackerr.com.br/admin'));
  });
});
