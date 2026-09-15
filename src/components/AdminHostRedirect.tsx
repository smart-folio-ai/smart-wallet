import {useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {useAuth} from '@/hooks/useAuth';

export const ADMIN_HOSTNAME = 'admin.trackerr.com.br';
export const APP_HOSTNAMES = ['trackerr.com.br', 'www.trackerr.com.br'];
const APP_ORIGIN = 'https://trackerr.com.br';

/** Páginas que o host admin serve para quem ainda não entrou ou está saindo. */
const ADMIN_HOST_PUBLIC_PATHS = [
  '/signin',
  '/2fa-verify',
  '/forgot-password',
  '/reset-password',
  '/signout',
  '/termos',
  '/privacidade',
  '/cookies',
];

const isAdminPath = (pathname: string) => pathname === '/admin' || pathname.startsWith('/admin/');

/** Para onde o host deve mandar a pessoa, ou `null` se a rota atual é válida ali. */
export function resolveHostRedirect(params: {
  hostname: string;
  pathname: string;
  search: string;
  isAuthenticated: boolean;
  role: string | null;
}): {type: 'internal' | 'external'; to: string} | null {
  const {hostname, pathname, search, isAuthenticated, role} = params;

  // Host do app: o painel mora só no subdomínio.
  if (APP_HOSTNAMES.includes(hostname)) {
    return isAdminPath(pathname) ? {type: 'external', to: `https://${ADMIN_HOSTNAME}${pathname}${search}`} : null;
  }

  if (hostname !== ADMIN_HOSTNAME) return null;
  if (ADMIN_HOST_PUBLIC_PATHS.includes(pathname)) return null;

  if (!isAuthenticated) return {type: 'internal', to: '/signin'};

  if (role === 'admin') return isAdminPath(pathname) ? null : {type: 'internal', to: '/admin'};
  // Editor só tem acesso a concessões.
  if (role === 'editor') {
    return pathname.startsWith('/admin/grants') ? null : {type: 'internal', to: '/admin/grants'};
  }
  // Conta sem papel administrativo não tem o que fazer aqui: volta para o app.
  return {type: 'external', to: `${APP_ORIGIN}/dashboard`};
}

/**
 * admin.trackerr.com.br e trackerr.com.br servem o MESMO build. Este
 * componente separa os dois: `/admin*` só abre no subdomínio, e o subdomínio
 * só mostra o admin (e as telas de login). É roteamento de UX — a
 * autorização continua no `RolesGuard` do server e no `ProtectedRoute`.
 *
 * Espera `isLoading` terminar para não mandar para /signin quem ainda está
 * sendo reconhecido. localhost e previews não são afetados.
 */
export const AdminHostRedirect = () => {
  const {pathname, search} = useLocation();
  const navigate = useNavigate();
  const {isAuthenticated, isLoading, role} = useAuth();

  useEffect(() => {
    if (isLoading) return;
    const redirect = resolveHostRedirect({
      hostname: window.location.hostname,
      pathname,
      search,
      isAuthenticated,
      role,
    });
    if (!redirect) return;
    if (redirect.type === 'external') window.location.replace(redirect.to);
    else navigate(redirect.to, {replace: true});
  }, [pathname, search, navigate, isAuthenticated, isLoading, role]);

  return null;
};
