import {Navigate, useLocation} from 'react-router-dom';
import {ReactNode} from 'react';
import {AuthRole, useAuth} from '@/hooks/useAuth';
import WalletLoadingScreen from '@/components/WalletLoadingScreen';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AuthRole[];
}

const ProtectedRoute = ({children, allowedRoles}: ProtectedRouteProps) => {
  const location = useLocation();
  const {isAuthenticated, isLoading, role} = useAuth();

  // Mostra loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <WalletLoadingScreen
          isLoading={isLoading}
          loadingText="Verificando autenticação..."
        />
      </div>
    );
  }

  // Se não está autenticado, redireciona para login
  if (!isAuthenticated) {
    // Salva a URL atual para redirecionar após o login
    return <Navigate to="/" state={{from: location}} replace />;
  }

  if (allowedRoles?.length && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/dashboard" state={{from: location}} replace />;
  }

  // Se está autenticado, renderiza o componente filho
  return <>{children}</>;
};

export default ProtectedRoute;
