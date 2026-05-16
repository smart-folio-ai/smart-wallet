import {useState, useEffect} from 'react';
import {jwtDecode} from 'jwt-decode';

export type AuthRole = 'user' | 'editor' | 'admin' | 'advisor';

type AccessTokenPayload = {
  userId: string;
  type: string;
  role?: AuthRole;
  exp?: number;
};

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  role: AuthRole | null;
  userId: string | null;
  isAdmin: boolean;
  isEditor: boolean;
  logout: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<AuthRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const readPayload = (): AccessTokenPayload | null => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return null;
    }

    try {
      return jwtDecode<AccessTokenPayload>(token);
    } catch {
      return null;
    }
  };

  const checkAuth = () => {
    const payload = readPayload();
    setIsAuthenticated(!!payload);
    setRole(payload?.role ?? null);
    setUserId(payload?.userId ?? null);
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
      setRole(null);
      setUserId(null);
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
    setRole(null);
    setUserId(null);

    // Emite evento de logout
    window.dispatchEvent(new CustomEvent('auth:logout'));
  };

  return {
    isAuthenticated,
    isLoading,
    role,
    userId,
    isAdmin: role === 'admin',
    isEditor: role === 'editor',
    logout,
  };
};
