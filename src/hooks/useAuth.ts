import {useState, useEffect} from 'react';

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = () => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
    setIsLoading(false);
  };

  useEffect(() => {
    // Verifica autenticação inicial
    checkAuth();

    // Escuta eventos de login/logout
    const handleLogin = () => {
      setIsAuthenticated(true);
      setIsLoading(false);
    };

    const handleLogout = () => {
      setIsAuthenticated(false);
      setIsLoading(false);
    };

    window.addEventListener('auth:login', handleLogin);
    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:login', handleLogin);
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('keepConnected');
    setIsAuthenticated(false);

    // Emite evento de logout
    window.dispatchEvent(new CustomEvent('auth:logout'));
  };

  return {
    isAuthenticated,
    isLoading,
    logout,
  };
};
