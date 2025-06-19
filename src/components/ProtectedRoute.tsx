import {Navigate, useLocation} from 'react-router-dom';
import {ReactNode} from 'react';
import {useAuth} from '@/hooks/useAuth';
import Loader from '@/components/loader';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({children}: ProtectedRouteProps) => {
  const location = useLocation();
  const {isAuthenticated, isLoading} = useAuth();

  // Mostra loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader text="Verificando autenticação..." />
      </div>
    );
  }

  // Se não está autenticado, redireciona para login
  if (!isAuthenticated) {
    // Salva a URL atual para redirecionar após o login
    return <Navigate to="/" state={{from: location}} replace />;
  }

  // Se está autenticado, renderiza o componente filho
  return <>{children}</>;
};

export default ProtectedRoute;
