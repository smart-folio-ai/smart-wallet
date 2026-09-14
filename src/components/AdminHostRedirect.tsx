import {useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {useAuth} from '@/hooks/useAuth';

export const ADMIN_HOSTNAME = 'admin.trackerr.com.br';

/**
 * admin.trackerr.com.br serve o MESMO build do app, sem rota nem deploy
 * separados: só a home vira /admin em vez da landing, e só quando já dá
 * pra saber que faz sentido — usuário autenticado. Autorização de verdade
 * continua nos dois lugares que já existiam antes deste componente —
 * `RolesGuard` no server (admin.controller.ts) e `ProtectedRoute` aqui —
 * então acessar esse host sem permissão cai no mesmo bloqueio de sempre.
 *
 * A checagem de `isAuthenticated` não é cosmética: sem ela, um visitante
 * deslogado em admin.trackerr.com.br entra em loop — `ProtectedRoute`
 * manda quem não está logado de `/admin` de volta pra `/`, e este
 * componente mandaria de `/` pra `/admin` de novo, indefinidamente. Só
 * redireciona quem já provou quem é; quem não provou vê a landing normal
 * e faz login por ela, como em qualquer outro host.
 */
export const AdminHostRedirect = () => {
  const {pathname} = useLocation();
  const navigate = useNavigate();
  const {isAuthenticated, isLoading} = useAuth();

  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated &&
      window.location.hostname === ADMIN_HOSTNAME &&
      (pathname === '/' || pathname === '')
    ) {
      navigate('/admin', {replace: true});
    }
  }, [pathname, navigate, isAuthenticated, isLoading]);

  return null;
};
